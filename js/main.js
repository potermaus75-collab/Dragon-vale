// ==========================================
// js/main.js (UI 중앙 제어 및 최적화: 생략 없음)
// ==========================================

// [시스템] 이미지 로드 실패 시 무조건 물음표 아이콘으로 대체 (CSS 드래곤 삭제됨)
window.handleImgError = function(imgEl, dragonType, dragonStage) {
    imgEl.onerror = null; // 무한루프 방지
    imgEl.src = "assets/images/ui/icon_question.png"; 
    imgEl.style.objectFit = "contain";
};

let userNickname = "Guest";
let prologueIndex = 0;
let currentTab = 'dragon'; // 현재 활성 탭 추적

// 도감용 변수
let currentBookPage = 0;
const BOOK_CATEGORIES = ["fire", "water", "forest", "electric", "metal", "light", "dark"];
const CATEGORY_NAMES = {
    "fire": "불의 장", "water": "물의 장", "forest": "숲의 장",
    "electric": "번개의 장", "metal": "강철의 장", "light": "빛의 장", "dark": "어둠의 장"
};

const UI_ASSETS = [
    "assets/images/ui/panel_main.png",
    "assets/images/ui/panel_book.png", 
    "assets/images/ui/panel_banner.png",
    "assets/images/ui/panel_vertical.png",
    "assets/images/ui/frame_book_slot.png", 
    "assets/images/ui/nest_front.png",
    "assets/images/ui/btn_rect.png",
    "assets/images/ui/btn_square.png",
    "assets/images/ui/icon_question.png",
    "assets/images/ui/icon_arrow_left.png",
    "assets/images/ui/icon_arrow_right.png",
    "assets/images/ui/icon_bag.png",
    "assets/images/ui/icon_box.png",
    "assets/images/ui/icon_book.png",
    "assets/images/ui/icon_heart.png"
];

function preloadAssets() {
    let imagesToLoad = [...UI_ASSETS];
    if (typeof ITEM_DB !== 'undefined') {
        for (let key in ITEM_DB) { if (ITEM_DB[key].img) imagesToLoad.push(ITEM_DB[key].img); }
    }
    if (typeof REGION_DATA !== 'undefined') {
        REGION_DATA.forEach(region => { if (region.bg) imagesToLoad.push(region.bg); });
    }
    imagesToLoad = [...new Set(imagesToLoad)];

    let loadedCount = 0;
    const totalCount = imagesToLoad.length;
    
    const textEl = document.getElementById('loading-text');
    const barEl = document.getElementById('loading-bar-fill');
    const containerEl = document.getElementById('loading-container');
    const startMsgEl = document.getElementById('start-msg');

    if (totalCount === 0) { completeLoading(); return; }

    imagesToLoad.forEach(src => {
        const img = new Image();
        img.src = src;
        img.onload = () => { loadedCount++; updateProgress(); };
        img.onerror = () => { loadedCount++; updateProgress(); };
    });

    function updateProgress() {
        const percent = Math.floor((loadedCount / totalCount) * 100);
        if(textEl) textEl.innerText = `로딩 중... ${percent}%`;
        if(barEl) barEl.style.width = `${percent}%`;
        if (loadedCount >= totalCount) { setTimeout(completeLoading, 300); }
    }

    function completeLoading() {
        if(textEl) textEl.innerText = "로딩 완료!";
        setTimeout(() => {
            if(containerEl) containerEl.classList.add('hidden'); 
            if(startMsgEl) {
                startMsgEl.classList.remove('hidden'); 
                startMsgEl.classList.add('active'); 
            }
        }, 200);
    }
}

window.onload = function() { preloadAssets(); };

function showScreen(screenId) {
    document.querySelectorAll('.full-screen').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });
    const target = document.getElementById(screenId);
    if(target) {
        target.classList.remove('hidden');
        target.classList.add('active');
        target.style.display = "flex"; 
    }
}

document.getElementById('screen-start').addEventListener('click', () => {
    const loader = document.getElementById('loading-container');
    if(loader && !loader.classList.contains('hidden')) return;

    if (localStorage.getItem('dragonSaveData')) {
        loadGame();
        if (userNickname && userNickname !== "Guest") {
            document.getElementById('ui-nickname').innerText = userNickname;
            startGame();
            return;
        }
    }
    showScreen('screen-setup');
});

function submitName() {
    const input = document.getElementById('input-nickname');
    if (input.value.trim() === "") return showAlert("이름을 입력해주세요!");
    userNickname = input.value;
    document.getElementById('ui-nickname').innerText = userNickname;
    saveGame();
    showScreen('screen-prologue');
    renderPrologue();
}

function renderPrologue() {
    const textEl = document.getElementById('prologue-text');
    // data.js의 PROLOGUE_DATA 사용
    textEl.innerText = PROLOGUE_DATA[prologueIndex].text;
}

function nextPrologueCut() {
    prologueIndex++;
    if (prologueIndex >= PROLOGUE_DATA.length) {
        startGame();
    } else {
        renderPrologue();
    }
}

function startGame() {
    showScreen('screen-game');
    switchTab('dragon'); 
}

// [핵심] 탭 전환 함수
function switchTab(tabName) {
    if (window.isExploreActive && tabName !== 'explore') {
        showAlert("탐험 중에는 다른 메뉴로 이동할 수 없습니다!\n탐험을 먼저 완료하거나 포기해주세요.");
        return;
    }

    currentTab = tabName; // 현재 탭 기억

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    const selected = document.getElementById(`tab-${tabName}`);
    if(selected) selected.classList.remove('hidden');

    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    const tabMap = {'info':0, 'dragon':1, 'explore':2, 'book':3, 'shop':4};
    if(tabMap[tabName] !== undefined) navBtns[tabMap[tabName]].classList.add('active');

    // 탭 전환 시 즉시 UI 갱신 (전체 갱신이 아닌 필요한 부분만)
    updateUI();
}

// [핵심] 중앙 통제형 UI 업데이트 함수
window.updateUI = function() {
    // 1. 공통 재화(골드/보석/레벨) 업데이트
    if(window.updateCurrency) updateCurrency(); 

    // 2. 현재 탭에 맞는 화면만 렌더링 (성능 최적화)
    if (currentTab === 'dragon') {
        // hatchery.js에 있는 renderCaveUI 호출
        if(window.renderCaveUI) window.renderCaveUI(); 
    } 
    else if (currentTab === 'info') {
        if(typeof renderInventory === 'function') renderInventory();
    }
    else if (currentTab === 'shop') {
        if(typeof renderShop === 'function') renderShop();
    }
    else if (currentTab === 'book') {
        if(currentBookPage === 0) renderBook(); // 초기화 혹은 필요 시 렌더링
    }
    else if (currentTab === 'explore') {
        if(window.initExploreTab) window.initExploreTab();
    }
};

function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    if(!grid) return;
    grid.innerHTML = "";
    if(!player.inventory) player.inventory = {};

    const itemIds = Object.keys(player.inventory);
    let hasItem = false;

    itemIds.forEach(id => {
        if(player.inventory[id] > 0) {
            const item = ITEM_DB[id];
            if(item && item.type === 'equip') {
                hasItem = true;
                const div = document.createElement('div');
                div.className = 'slot-item';
                div.onclick = () => useItem(id); 
                div.innerHTML = `<img src="${item.img}" class="item-img-lg" onerror="this.src='assets/images/ui/icon_question.png'"><span style="position:absolute; bottom:2px; right:2px; font-size:0.7rem;">x${player.inventory[id]}</span>`;
                grid.appendChild(div);
            }
        }
    });

    if(!hasItem) grid.innerHTML = "<p style='grid-column:span 4; text-align:center; color:#888; font-size:0.8rem;'>장비 없음</p>";
}

// [리뉴얼] 도감 렌더링 (스와이프 페이지 방식 + 3열 그리드)
function renderBook() {
    const bookContent = document.querySelector('#tab-book .book-bg');
    
    if(bookContent) {
        bookContent.className = 'bg-vertical'; 
        bookContent.innerHTML = `
            <h3>용 도감</h3>
            <div class="book-slider-container">
                <div class="book-slider-track" id="book-track"></div>
            </div>
            <div style="display:flex; justify-content:center; align-items:center; gap:10px; margin-top:5px;">
                 <img src="assets/images/ui/icon_arrow_left.png" style="width:16px; height:16px;" onerror="this.style.display='none'">
                 <span style="font-size:0.8rem; color:#aaa;">좌우로 넘겨 속성을 확인하세요</span>
                 <img src="assets/images/ui/icon_arrow_right.png" style="width:16px; height:16px;" onerror="this.style.display='none'">
            </div>
        `;
    }

    const track = document.getElementById('book-track');
    if(!track) return;
    
    if(!player.discovered) player.discovered = [];

    // 속성별 페이지 생성
    BOOK_CATEGORIES.forEach(category => {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'book-page';
        
        const typeIcon = `assets/images/ui/icon_${category}.png`;
        
        pageDiv.innerHTML = `
            <div class="book-page-title-row">
                <img src="${typeIcon}" class="book-type-icon" onerror="this.style.display='none'">
                <h4 class="book-page-title">${CATEGORY_NAMES[category] || category}</h4>
            </div>
        `;
        
        // 3열 그리드 적용
        const gridDiv = document.createElement('div');
        gridDiv.className = 'grid-3';
        gridDiv.style.width = "100%";

        const dragonKeys = Object.keys(DRAGON_DEX).filter(key => DRAGON_DEX[key].type === category);
        
        dragonKeys.forEach(dragonId => {
            const dragonInfo = DRAGON_DEX[dragonId];
            const isFound = player.discovered.includes(dragonId);
            
            const slot = document.createElement('div');
            slot.className = `book-slot-custom ${isFound ? '' : 'unknown'}`;
            
            if (isFound) {
                const maxStage = (player.maxStages && player.maxStages[dragonId] !== undefined) ? player.maxStages[dragonId] : 0;
                let displayImg = "assets/images/dragon/stage_egg.png";
                if(window.getDragonImage) displayImg = window.getDragonImage(dragonId, maxStage); 
                
                slot.innerHTML = `<img src="${displayImg}" class="book-img" onerror="handleImgError(this, '${dragonInfo.type}', ${maxStage})">`;
                slot.onclick = () => showDragonDetailModal(dragonId, dragonInfo);
            } else {
                slot.innerHTML = `<img src="assets/images/ui/icon_question.png" style="width:20px; opacity:0.3;">`;
            }
            gridDiv.appendChild(slot);
        });

        if(dragonKeys.length === 0) {
            gridDiv.innerHTML = "<p style='grid-column:span 3; text-align:center; color:#555;'>데이터 없음</p>";
        }

        pageDiv.appendChild(gridDiv);
        track.appendChild(pageDiv);
    });

    // 스와이프 이벤트 등록
    addSwipeListener(document.querySelector('.book-slider-container'), 
        () => moveBookPage(1),  
        () => moveBookPage(-1)  
    );

    updateBookSlider();
}

function moveBookPage(dir) {
    const next = currentBookPage + dir;
    if (next >= 0 && next < BOOK_CATEGORIES.length) {
        currentBookPage = next;
        updateBookSlider();
    }
}

function updateBookSlider() {
    const track = document.getElementById('book-track');
    if(track) {
        track.style.transform = `translateX(-${currentBookPage * 100}%)`;
    }
}

// [리뉴얼] 상세 정보 모달 (단계별 슬라이드 방식)
function showDragonDetailModal(dragonId, info) {
    const maxStage = (player.maxStages && player.maxStages[dragonId] !== undefined) ? player.maxStages[dragonId] : 0;
    const stageNames = ["알", "유아기", "성장기", "성룡", "고룡"];
    
    // 표시할 최대 단계 설정
    const isHighTier = (info.rarity === 'epic' || info.rarity === 'legend');
    const totalStages = isHighTier ? 5 : 4;
    
    // 슬라이더 HTML 생성
    let slidesHtml = "";
    for(let i=0; i < totalStages; i++) {
        const isUnknown = i > maxStage;
        const imgSrc = window.getDragonImage ? window.getDragonImage(dragonId, i) : "";
        
        let contentHtml = "";
        if (isUnknown) {
            contentHtml = `
                <img src="${imgSrc}" class="detail-img-large" style="filter:brightness(0); opacity:0.3;" onerror="handleImgError(this, '${info.type}', ${i})">
                <div class="detail-stage-name">??? (미발견)</div>
            `;
        } else {
            contentHtml = `
                <img src="${imgSrc}" class="detail-img-large" onerror="handleImgError(this, '${info.type}', ${i})">
                <div class="detail-stage-name">${stageNames[i]}</div>
            `;
        }

        slidesHtml += `<div class="detail-stage-view">${contentHtml}</div>`;
    }

    const rarityColor = RARITY_DATA[info.rarity].color;

    // 모달 내용 구성
    const modalContent = `
        <div style="text-align:center; width:100%;">
            <b style="font-size:1.4rem; color:${rarityColor};">${info.name}</b>
            <br><span style="font-size:0.8rem; color:#aaa;">[${RARITY_DATA[info.rarity].name}]</span>
            
            <div class="detail-slider-container">
                <div class="detail-slider-track" id="detail-track" style="width:${totalStages * 100}%">
                    ${slidesHtml}
                </div>
            </div>
            
            <div style="display:flex; justify-content:center; align-items:center; gap:5px; margin-top:5px;">
                <img src="assets/images/ui/icon_arrow_left.png" style="width:12px;" onerror="this.style.display='none'">
                <span style="font-size:0.7rem; color:#888;">좌우로 스와이프하여 성장 모습 확인</span>
                <img src="assets/images/ui/icon_arrow_right.png" style="width:12px;" onerror="this.style.display='none'">
            </div>

            <div style="text-align:left; background:rgba(0,0,0,0.3); padding:10px; border-radius:5px; font-size:0.9rem; margin-top:10px;">
                ${info.desc}
            </div>
        </div>
    `;

    showAlert(modalContent);

    // 모달 렌더링 후 슬라이드 로직 적용
    setTimeout(() => {
        const track = document.getElementById('detail-track');
        if (!track) return;
        
        let currentStage = Math.min(maxStage, totalStages - 1); // 현재 도달한 단계부터 보여줌
        
        const updateDetailSlider = () => {
            track.style.transform = `translateX(-${currentStage * (100 / totalStages)}%)`;
        };
        updateDetailSlider();

        const views = track.querySelectorAll('.detail-stage-view');
        views.forEach(v => { v.style.width = `${100 / totalStages}%`; });

        const container = document.querySelector('.detail-slider-container');
        addSwipeListener(container, 
            () => { // Left Swipe (Next)
                if(currentStage < totalStages - 1) {
                    currentStage++;
                    updateDetailSlider();
                }
            },
            () => { // Right Swipe (Prev)
                if(currentStage > 0) {
                    currentStage--;
                    updateDetailSlider();
                }
            }
        );
    }, 100);
}

// [유틸] 스와이프 감지 함수 (쿨다운 추가)
let isSwipeCooldown = false;

function addSwipeListener(el, onLeft, onRight) {
    if(!el) return;
    let startX = 0;
    let endX = 0;
    
    el.addEventListener('touchstart', e => {
        startX = e.changedTouches[0].screenX;
    }, {passive: true});
    
    el.addEventListener('touchend', e => {
        endX = e.changedTouches[0].screenX;
        if (isSwipeCooldown) return;
        handleGesture();
    }, {passive: true});

    function handleGesture() {
        const threshold = 60; // 감도 조절
        if (startX - endX > threshold) {
            if(onLeft) { onLeft(); triggerCooldown(); }
        } else if (endX - startX > threshold) {
            if(onRight) { onRight(); triggerCooldown(); }
        }
    }

    function triggerCooldown() {
        isSwipeCooldown = true;
        setTimeout(() => { isSwipeCooldown = false; }, 500); // 0.5초 쿨다운
    }
}

// [리뉴얼] 상점 렌더링 (세로형 배경 적용)
function renderShop() {
    const shopContent = document.querySelector('#tab-shop .shop-bg');
    if(shopContent) {
        shopContent.className = 'bg-vertical'; 
        shopContent.innerHTML = `
            <h3>상점</h3>
            <div class="scroll-area" style="width:100%; margin-top:10px;">
                <div id="shop-list" class="list-row"></div>
            </div>
        `;
    }

    const list = document.getElementById('shop-list');
    if(!list) return;
    list.innerHTML = "";
    
    SHOP_LIST.forEach(id => {
        const item = ITEM_DB[id];
        if(!item) return;

        const costType = item.costType || 'gold';
        const currencyIcon = costType === 'gem' ? 'assets/images/ui/icon_gem.png' : 'assets/images/ui/icon_gold.png';
        const priceColor = costType === 'gem' ? '#3498db' : '#f1c40f'; 

        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <img src="${item.img}" class="item-img-lg" onerror="this.src='assets/images/ui/icon_question.png'">
                <div><b>${item.name}</b><br><small style="color:#aaa;">${item.desc}</small></div>
            </div>
            <button class="btn-stone" style="width:90px; height:45px; font-size:0.9rem;" onclick="buyItem('${id}')">
                <img src="${currencyIcon}" class="currency-icon"> <span style="color:${priceColor}">${item.price}</span>
            </button>
        `;
        list.appendChild(div);
    });
}

function buyItem(id) {
    const item = ITEM_DB[id];
    const costType = item.costType || 'gold'; 
    const currencyName = costType === 'gem' ? '보석' : '골드';
    const currentMoney = player[costType] || 0;

    if (currentMoney >= item.price) {
        showConfirm(`${item.name}을(를) 구매하시겠습니까?\n(가격: ${item.price} ${currencyName})`, () => {
            if ((player[costType] || 0) < item.price) {
                showAlert(`${currencyName}이 부족합니다.`);
                return;
            }
            player[costType] -= item.price;
            addItem(id, 1);
            updateCurrency();
            showAlert("구매 완료!", () => { saveGame(); });
        });
    } else {
        showAlert(`${currencyName}이 부족합니다.`);
    }
}

function changeProfileImage() {
    document.getElementById('file-input').click();
}
document.getElementById('file-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            document.getElementById('ui-profile-img').style.backgroundImage = `url('${evt.target.result}')`;
            document.getElementById('ui-profile-img').style.backgroundSize = "cover";
        }
        reader.readAsDataURL(file);
    }
});

window.showAlert = function(msg, callback) {
    const modal = document.getElementById('common-modal');
    document.getElementById('modal-title').innerText = "알림";
    document.getElementById('modal-text').innerHTML = msg; 
    
    document.getElementById('modal-btn-alert').classList.remove('hidden');
    document.getElementById('modal-btn-confirm').classList.add('hidden');
    
    modal.classList.remove('hidden');
    modal.classList.add('active');

    const okBtn = document.querySelector('#modal-btn-alert button');
    okBtn.onclick = function() {
        closeModal();
        if(callback) callback();
    };
};

window.showConfirm = function(msg, yesCallback, noCallback) {
    const modal = document.getElementById('common-modal');
    document.getElementById('modal-title').innerText = "확인";
    document.getElementById('modal-text').innerHTML = msg; 
    
    document.getElementById('modal-btn-alert').classList.add('hidden');
    const confirmGroup = document.getElementById('modal-btn-confirm');
    confirmGroup.classList.remove('hidden');
    
    modal.classList.remove('hidden');
    modal.classList.add('active');

    document.getElementById('btn-confirm-yes').onclick = function() {
        closeModal();
        if(yesCallback) yesCallback();
    };
    document.getElementById('btn-confirm-no').onclick = function() {
        closeModal();
        if(noCallback) noCallback();
    };
};

window.closeModal = function() {
    const modal = document.getElementById('common-modal');
    modal.classList.remove('active');
    modal.classList.add('hidden');
};
