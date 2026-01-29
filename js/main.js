// ==========================================
// js/main.js (최종: 상점 렌더링 최적화 및 정리)
// ==========================================

// 이미지 에러 처리 (전역 사용)
window.handleImgError = function(imgEl) {
    imgEl.onerror = null; 
    imgEl.src = "assets/images/ui/icon_question.png"; 
    imgEl.style.objectFit = "contain";
};

let userNickname = "Guest";
let prologueIndex = 0;
let currentTab = 'dragon'; 
let currentBookPage = 0; 

// 도감 카테고리
const BOOK_CATEGORIES = ["fire", "water", "forest", "electric", "metal", "light", "dark"];
const CATEGORY_ICONS = {
    "fire": "icon_type_fire.png", "water": "icon_type_water.png", "forest": "icon_type_forest.png",
    "electric": "icon_type_electric.png", "metal": "icon_type_metal.png", "light": "icon_type_light.png", "dark": "icon_type_dark.png"
};

const UI_ASSETS = [
    "assets/images/ui/icon_question.png", "assets/images/ui_new/bg_cave.png",
    "assets/images/ui_new/frame_header.png", "assets/images/ui_new/frame_sidebar.png",
    "assets/images/ui_new/frame_title.png", "assets/images/ui_new/frame_upgrade.png",
    "assets/images/ui_new/frame_nav.png", "assets/images/ui_new/altar_pedestal.png",
    "assets/images/ui_new/slot_box_default.png", "assets/images/ui_new/slot_box_active.png",
    "assets/images/ui_new/bar_bg.png", "assets/images/ui_new/bar_fill.png", "assets/images/ui_new/btn_touch.png",
    "assets/images/ui_new/bg_book.png", "assets/images/ui_new/frame_book_title.png",
    "assets/images/ui_new/frame_tab_bar.png"
];

// 에셋 프리로딩
function preloadAssets() {
    let loadedCount = 0;
    const totalCount = UI_ASSETS.length;
    const textEl = document.getElementById('loading-text');
    const barEl = document.getElementById('loading-bar-fill');
    const containerEl = document.getElementById('loading-container');
    const startMsgEl = document.getElementById('start-msg');

    if (totalCount === 0) { completeLoading(); return; }

    function checkDone() {
        loadedCount++;
        const percent = Math.floor((loadedCount / totalCount) * 100);
        if(textEl) textEl.innerText = `로딩 중... ${percent}%`;
        if(barEl) barEl.style.width = `${percent}%`;
        if (loadedCount >= totalCount) { setTimeout(completeLoading, 300); }
    }

    UI_ASSETS.forEach(src => {
        const img = new Image();
        img.onload = checkDone; img.onerror = checkDone; img.src = src;
    });

    function completeLoading() {
        if(textEl) textEl.innerText = "로딩 완료!";
        setTimeout(() => {
            if(containerEl) containerEl.classList.add('hidden'); 
            if(startMsgEl) { startMsgEl.classList.remove('hidden'); startMsgEl.classList.add('active'); }
        }, 200);
    }
}

window.onload = function() { preloadAssets(); };

// 게임 시작 시도
window.tryStartGame = function() {
    const startScreen = document.getElementById('screen-start');
    if(startScreen) startScreen.classList.add('hidden');
    
    // 저장 데이터 확인
    if (localStorage.getItem('dragonSaveData')) {
        if(window.loadGame) window.loadGame();
        startGame();
    } else {
        document.getElementById('screen-setup').classList.remove('hidden');
    }
};

function submitName() {
    const input = document.getElementById('input-nickname');
    if (input.value.trim() === "") return showAlert("이름을 입력해주세요!");
    userNickname = input.value;
    if(typeof player !== 'undefined') player.nickname = userNickname;
    if(window.saveGame) window.saveGame();
    
    document.querySelectorAll('.full-screen').forEach(el => el.classList.add('hidden'));
    const prologue = document.getElementById('screen-prologue');
    prologue.classList.remove('hidden'); prologue.classList.add('active');
    renderPrologue();
}

function renderPrologue() {
    const textEl = document.getElementById('prologue-text');
    if(window.PROLOGUE_DATA) textEl.innerText = PROLOGUE_DATA[prologueIndex].text;
}

function nextPrologueCut() {
    prologueIndex++;
    if (window.PROLOGUE_DATA && prologueIndex >= PROLOGUE_DATA.length) { 
        startGame(); 
    } else { 
        renderPrologue(); 
    }
}

function startGame() {
    document.querySelectorAll('.full-screen').forEach(el => el.classList.add('hidden'));
    const gameScreen = document.getElementById('screen-game');
    gameScreen.classList.remove('hidden'); gameScreen.classList.add('active');
    gameScreen.style.display = "flex";
    switchTab('dragon'); 
}

// 탭 전환
function switchTab(tabName) {
    if (window.isExploreActive && tabName !== 'explore') { showAlert("탐험 중에는 이동할 수 없습니다."); return; }
    
    currentTab = tabName; 
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    const selected = document.getElementById(`tab-${tabName}`);
    if(selected) selected.classList.remove('hidden');
    
    // 내비게이션 투명도 조절
    document.querySelectorAll('.nav-item').forEach(btn => btn.style.opacity = "0.5");
    const navs = document.querySelectorAll('.nav-item');
    const tabMap = {'info':0, 'book':1, 'dragon':2, 'explore':3, 'shop':4};
    if(navs[tabMap[tabName]]) navs[tabMap[tabName]].style.opacity = "1";
    
    updateUI();
}

// UI 업데이트
window.updateUI = function() {
    if(window.updateCurrency) updateCurrency(); 
    
    if (currentTab === 'dragon' && window.renderCaveUI) window.renderCaveUI(); 
    else if (currentTab === 'info' && typeof renderInventory === 'function') renderInventory();
    else if (currentTab === 'shop' && typeof renderShop === 'function') renderShop();
    else if (currentTab === 'book' && typeof renderBook === 'function') renderBook(); 
    else if (currentTab === 'explore' && window.initExploreTab) window.initExploreTab();
};

function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    if(!grid) return;
    grid.innerHTML = "";
    if(!player.inventory) return;
    Object.keys(player.inventory).forEach(id => {
        if(player.inventory[id] > 0) {
            const item = ITEM_DB[id];
            if(item && item.type === 'equip') {
                const div = document.createElement('div');
                div.className = 'slot-item';
                div.onclick = () => useItem(id); 
                div.innerHTML = `<img src="${item.img}" class="item-img-lg" onerror="handleImgError(this)"><span style="position:absolute; bottom:0; right:2px;">x${player.inventory[id]}</span>`;
                grid.appendChild(div);
            }
        }
    });
}

// 상점 렌더링 (최적화됨)
function renderShop() {
    const list = document.getElementById('shop-list');
    if(!list) return;
    
    // 기존 내용을 지우고 목록만 다시 생성
    list.innerHTML = "";
    
    if (typeof SHOP_LIST === 'undefined') return;

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
            if ((player[costType] || 0) < item.price) { showAlert(`${currencyName}이 부족합니다.`); return; }
            player[costType] -= item.price;
            addItem(id, 1);
            updateCurrency();
            showAlert("구매 완료!", () => { saveGame(); });
        });
    } else { showAlert(`${currencyName}이 부족합니다.`); }
}

// 도감 렌더링
function renderBook() {
    const tabBar = document.getElementById('book-tab-bar');
    if (tabBar) {
        tabBar.innerHTML = "";
        BOOK_CATEGORIES.forEach((cat, idx) => {
            const div = document.createElement('div');
            div.className = `tab-type-icon ${idx === currentBookPage ? 'active' : ''}`;
            div.innerHTML = `<img src="assets/images/ui_new/${CATEGORY_ICONS[cat]}" onerror="this.src='assets/images/ui/icon_question.png'">`;
            div.onclick = () => { currentBookPage = idx; renderBook(); };
            tabBar.appendChild(div);
        });
    }

    const gridArea = document.getElementById('book-grid-area');
    if (gridArea) {
        gridArea.innerHTML = "";
        const currentCategory = BOOK_CATEGORIES[currentBookPage];
        const dragonKeys = Object.keys(DRAGON_DEX).filter(key => DRAGON_DEX[key].type === currentCategory);
        
        dragonKeys.forEach(dragonId => {
            const dragonInfo = DRAGON_DEX[dragonId];
            const isFound = player.discovered && player.discovered.includes(dragonId);
            const slot = document.createElement('div');
            slot.className = `book-slot-item ${isFound ? '' : 'unknown'}`;
            
            if (isFound) {
                const maxStage = (player.maxStages && player.maxStages[dragonId] !== undefined) ? player.maxStages[dragonId] : 0;
                let displayImg = "assets/images/dragon/stage_egg.png";
                if(window.getDragonImage) displayImg = window.getDragonImage(dragonId, maxStage); 
                slot.innerHTML = `<img src="${displayImg}" onerror="handleImgError(this)">`;
                slot.onclick = () => showDragonDetailModal(dragonId, dragonInfo);
            } else {
                slot.innerHTML = `<img src="assets/images/ui/icon_question.png">`;
            }
            gridArea.appendChild(slot);
        });

        if(dragonKeys.length === 0) {
            gridArea.innerHTML = "<p style='grid-column:span 5; text-align:center; color:#555;'>데이터 없음</p>";
        }
    }
}

function showDragonDetailModal(dragonId, info) {
    const maxStage = (player.maxStages && player.maxStages[dragonId] !== undefined) ? player.maxStages[dragonId] : 0;
    const stageNames = ["알", "유아기", "성장기", "성룡", "고룡"];
    const isHighTier = (info.rarity === 'epic' || info.rarity === 'legend');
    const totalStages = isHighTier ? 5 : 4;
    
    let slidesHtml = "";
    for(let i=0; i < totalStages; i++) {
        const isUnknown = i > maxStage;
        const imgSrc = window.getDragonImage ? window.getDragonImage(dragonId, i) : "";
        let contentHtml = "";
        if (isUnknown) {
            contentHtml = `<img src="${imgSrc}" class="detail-img-large" style="filter:brightness(0); opacity:0.3;" onerror="handleImgError(this)"><div class="detail-stage-name">??? (미발견)</div>`;
        } else {
            contentHtml = `<img src="${imgSrc}" class="detail-img-large" onerror="handleImgError(this)"><div class="detail-stage-name">${stageNames[i]}</div>`;
        }
        slidesHtml += `<div class="detail-stage-view">${contentHtml}</div>`;
    }

    const rarityColor = RARITY_DATA[info.rarity].color;
    const modalContent = `
        <div style="text-align:center; width:100%;">
            <b style="font-size:1.4rem; color:${rarityColor};">${info.name}</b>
            <br><span style="font-size:0.8rem; color:#aaa;">[${RARITY_DATA[info.rarity].name}]</span>
            <div class="detail-slider-container">
                <div class="detail-slider-track" id="detail-track" style="width:${totalStages * 100}%">
                    ${slidesHtml}
                </div>
            </div>
            <div style="text-align:left; background:rgba(0,0,0,0.3); padding:10px; border-radius:5px; font-size:0.9rem; margin-top:10px;">
                ${info.desc}
            </div>
        </div>
    `;
    showAlert(modalContent);
    setTimeout(() => {
        const track = document.getElementById('detail-track');
        if (!track) return;
        let currentStage = Math.min(maxStage, totalStages - 1); 
        const updateDetailSlider = () => { track.style.transform = `translateX(-${currentStage * (100 / totalStages)}%)`; };
        updateDetailSlider();
        
        // 슬라이더 뷰 사이즈 조정
        track.querySelectorAll('.detail-stage-view').forEach(v => { v.style.width = `${100 / totalStages}%`; });
        
        // 터치 슬라이드
        const container = document.querySelector('.detail-slider-container');
        addSwipeListener(container, 
            () => { if(currentStage < totalStages - 1) { currentStage++; updateDetailSlider(); } },
            () => { if(currentStage > 0) { currentStage--; updateDetailSlider(); } }
        );
    }, 100);
}

// 스와이프 리스너
let isSwipeCooldown = false;
function addSwipeListener(el, onLeft, onRight) {
    if(!el) return;
    let startX = 0; let endX = 0;
    el.addEventListener('touchstart', e => { startX = e.changedTouches[0].screenX; }, {passive: true});
    el.addEventListener('touchend', e => { endX = e.changedTouches[0].screenX; if (isSwipeCooldown) return; handleGesture(); }, {passive: true});
    function handleGesture() {
        const threshold = 60; 
        if (startX - endX > threshold) { if(onLeft) { onLeft(); triggerCooldown(); } }
        else if (endX - startX > threshold) { if(onRight) { onRight(); triggerCooldown(); } }
    }
    function triggerCooldown() { isSwipeCooldown = true; setTimeout(() => { isSwipeCooldown = false; }, 500); }
}

// 공통 알림/확인창 함수
window.showAlert = function(msg, callback) {
    const modal = document.getElementById('common-modal');
    document.getElementById('modal-title').innerText = "알림";
    document.getElementById('modal-text').innerHTML = msg; 
    document.getElementById('modal-btn-alert').classList.remove('hidden');
    document.getElementById('modal-btn-confirm').classList.add('hidden');
    modal.classList.remove('hidden');
    modal.classList.add('active');
    modal.querySelector('#modal-btn-alert button').onclick = function() {
        closeModal(); if(callback) callback();
    };
};

window.showConfirm = function(msg, yesCallback, noCallback) {
    const modal = document.getElementById('common-modal');
    document.getElementById('modal-title').innerText = "확인";
    document.getElementById('modal-text').innerHTML = msg; 
    document.getElementById('modal-btn-alert').classList.add('hidden');
    document.getElementById('modal-btn-confirm').classList.remove('hidden');
    modal.classList.remove('hidden');
    modal.classList.add('active');
    document.getElementById('btn-confirm-yes').onclick = function() { closeModal(); if(yesCallback) yesCallback(); };
    document.getElementById('btn-confirm-no').onclick = function() { closeModal(); if(noCallback) noCallback(); };
};

window.closeModal = function() {
    document.getElementById('common-modal').classList.remove('active');
    document.getElementById('common-modal').classList.add('hidden');
};
