// ==========================================
// js/main.js (완전한 코드: 스마트 프리로딩 포함)
// ==========================================

// 전역 변수
let userNickname = "Guest";
let prologueIndex = 0;

const PROLOGUE_DATA = [
    { text: "옛날 옛적, 용들이 하늘을 지배하던 시대...\n(터치하여 계속)" },
    { text: "하지만 대전쟁 이후 용들은 모두 사라졌다." },
    { text: "당신은 우연히 숲속에서 낡은 알을 발견한다." },
    { text: "이제 당신의 이야기가 시작된다." }
];

// ----------------------------------------------------
// [신규] 스마트 이미지 프리로딩 시스템
// UI는 수동으로 등록하고, 데이터(아이템, 배경 등)는 자동 수집합니다.
// ----------------------------------------------------
const UI_ASSETS = [
    "assets/images/ui/panel_main.png",
    "assets/images/ui/panel_banner.png",
    "assets/images/ui/panel_vertical.png",
    "assets/images/ui/btn_rect.png",
    "assets/images/ui/btn_square.png",
    "assets/images/ui/frame_profile.png",
    "assets/images/ui/bar_rune.png",
    "assets/images/ui/tab_info.png",
    "assets/images/ui/tab_dragon.png",
    "assets/images/ui/tab_explore.png",
    "assets/images/ui/tab_book.png",
    "assets/images/ui/tab_shop.png",
    "assets/images/ui/icon_gold.png",
    "assets/images/ui/icon_gem.png",
    "assets/images/ui/icon_move.png",
    "assets/images/ui/icon_home.png",
    "assets/images/ui/icon_gift.png",
    "assets/images/ui/icon_question.png"
];

function preloadAssets() {
    let imagesToLoad = [...UI_ASSETS];

    // 1. [자동] 아이템 DB 스캔
    if (typeof ITEM_DB !== 'undefined') {
        for (let key in ITEM_DB) {
            if (ITEM_DB[key].img) imagesToLoad.push(ITEM_DB[key].img);
        }
    }

    // 2. [자동] 탐험 지역 배경 스캔
    if (typeof REGION_DATA !== 'undefined') {
        REGION_DATA.forEach(region => {
            if (region.bg) imagesToLoad.push(region.bg);
        });
    }

    // 3. [자동] 용 성장 단계 이미지 스캔
    if (typeof DRAGON_DATA !== 'undefined' && DRAGON_DATA.stageImages) {
        imagesToLoad = imagesToLoad.concat(DRAGON_DATA.stageImages);
    }

    // 4. [자동] 용 도감 스캔 (나중에 개별 용 이미지를 추가할 경우를 대비)
    if (typeof DRAGON_DEX !== 'undefined') {
        for (let key in DRAGON_DEX) {
            // 만약 dragon.js에 'img' 속성을 추가한다면 자동으로 읽어옵니다.
            if (DRAGON_DEX[key].img) imagesToLoad.push(DRAGON_DEX[key].img);
        }
    }

    // [중요] 중복 경로 제거 (Set 자료구조 활용)
    imagesToLoad = [...new Set(imagesToLoad)];

    let loadedCount = 0;
    const totalCount = imagesToLoad.length;
    
    // UI 엘리먼트 가져오기
    const textEl = document.getElementById('loading-text');
    const barEl = document.getElementById('loading-bar-fill');
    const containerEl = document.getElementById('loading-container');
    const startMsgEl = document.getElementById('start-msg');

    // 이미지가 하나도 없으면 즉시 로딩 완료 처리
    if (totalCount === 0) {
        completeLoading();
        return;
    }

    console.log(`[System] 총 ${totalCount}개의 이미지를 프리로딩합니다.`);

    // 실제 로딩 수행
    imagesToLoad.forEach(src => {
        const img = new Image();
        img.src = src;
        
        // 성공하든 실패하든 카운트는 올림 (게임이 멈추면 안 되니까)
        img.onload = () => {
            loadedCount++;
            updateProgress();
        };
        img.onerror = () => {
            console.warn("이미지 로드 실패 (무시):", src);
            loadedCount++;
            updateProgress();
        };
    });

    function updateProgress() {
        const percent = Math.floor((loadedCount / totalCount) * 100);
        if(textEl) textEl.innerText = `로딩 중... ${percent}%`;
        if(barEl) barEl.style.width = `${percent}%`;

        // 모두 로딩되면 완료 처리
        if (loadedCount >= totalCount) {
            // 너무 빨리 끝나면 사용자가 못 보니까 살짝 지연
            setTimeout(completeLoading, 300);
        }
    }

    function completeLoading() {
        if(textEl) textEl.innerText = "로딩 완료!";
        setTimeout(() => {
            if(containerEl) containerEl.classList.add('hidden'); // 로딩 바 숨김
            if(startMsgEl) {
                startMsgEl.classList.remove('hidden'); // '터치하여 시작' 표시
                startMsgEl.classList.add('active'); 
            }
        }, 200);
    }
}

// ----------------------------------------------------
// [핵심] 윈도우 로드 시 프리로딩 시작
// ----------------------------------------------------
window.onload = function() {
    preloadAssets();
};

// 화면 전환 함수
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

// 1. 시작화면 클릭
// (주의: 로딩이 끝나서 start-msg가 보일 때만 클릭 가능하도록 할 수도 있으나, 
// 현재는 화면 전체 클릭으로 둡니다.)
document.getElementById('screen-start').addEventListener('click', () => {
    // 로딩이 덜 끝났는데 클릭하는 것 방지 (loading-container가 안 보일 때만 진행)
    const loader = document.getElementById('loading-container');
    if(loader && !loader.classList.contains('hidden')) return;

    // 저장된 데이터가 있는지 확인
    if (localStorage.getItem('dragonSaveData')) {
        loadGame();
        // 닉네임이 있으면 바로 게임 시작
        if (userNickname && userNickname !== "Guest") {
            document.getElementById('ui-nickname').innerText = userNickname;
            startGame();
            return;
        }
    }
    showScreen('screen-setup');
});

// 2. 닉네임 입력 -> 프롤로그
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

// 3. 게임 진입
function startGame() {
    showScreen('screen-game');
    updateCurrency();
    switchTab('dragon'); 
    if(window.updateUI) window.updateUI();
    saveGame(); // 시작 시 자동 저장 시작
}

// 탭 전환 시스템
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    const selected = document.getElementById(`tab-${tabName}`);
    if(selected) selected.classList.remove('hidden');

    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    const tabMap = {'info':0, 'dragon':1, 'explore':2, 'book':3, 'shop':4};
    if(tabMap[tabName] !== undefined) navBtns[tabMap[tabName]].classList.add('active');

    // 탭별 데이터 갱신
    if (tabName === 'info') { 
        updateCurrency();
        if(window.updateUI) window.updateUI(); 
        renderInventory();
    }
    if (tabName === 'shop') renderShop();
    if (tabName === 'book') renderBook(); 
    if (tabName === 'dragon') {
        updateCurrency();
        if(window.updateUI) window.updateUI(); 
    }
    if (tabName === 'explore') {
        if(window.initExploreTab) window.initExploreTab();
    }
}

// [공통] 가방 그리기
function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    // 안전장치: 인벤토리가 없으면 초기화
    if(!player.inventory) player.inventory = {};

    const itemIds = Object.keys(player.inventory);
    if(itemIds.length === 0) grid.innerHTML = "<p style='grid-column:span 4; text-align:center; color:#888;'>비어있음</p>";

    itemIds.forEach(id => {
        if(player.inventory[id] > 0) {
            const item = ITEM_DB[id];
            // DB에 없는 아이템이 인벤토리에 있을 경우 건너뜀
            if(!item) return;

            const div = document.createElement('div');
            div.className = 'slot-item';
            div.onclick = () => useItem(id); 
            div.innerHTML = `<img src="${item.img}" class="item-img-lg" onerror="this.src='assets/images/ui/icon_question.png'"><span style="position:absolute; bottom:2px; right:2px; font-size:0.7rem;">x${player.inventory[id]}</span>`;
            grid.appendChild(div);
        }
    });
}

// [공통] 도감 그리기
function renderBook() {
    const grid = document.getElementById('book-grid');
    if(!grid) return;
    grid.innerHTML = "";

    if(!player.discovered) player.discovered = [];

    // DRAGON_DEX가 없으면 실행 안함
    if(typeof DRAGON_DEX === 'undefined') return;

    Object.keys(DRAGON_DEX).forEach(dragonId => {
        const dragonInfo = DRAGON_DEX[dragonId];
        const isFound = player.discovered.includes(dragonId); 

        const div = document.createElement('div');
        div.className = `book-slot ${isFound ? 'found' : ''}`;
        
        const rarityColor = RARITY_DATA[dragonInfo.rarity].color;
        if(isFound) div.style.borderColor = rarityColor;

        if (isFound) {
            // 성체 이미지(임시) 사용. 나중에 dragonInfo.img가 생기면 그걸 우선 사용
            const displayImg = dragonInfo.img || "assets/images/dragon/stage_adult.png";
            div.innerHTML = `
                <img src="${displayImg}" class="book-img">
                <div style="font-weight:bold; color:${rarityColor}; font-size:0.7rem;">${dragonInfo.name}</div>
            `;
            // 클릭 시 설명
            div.onclick = () => showAlert(`
                <div style="text-align:center;">
                    <img src="${displayImg}" style="width:100px; height:100px;"><br>
                    <b style="font-size:1.2rem; color:${rarityColor};">${dragonInfo.name}</b>
                    <br><span style="font-size:0.8rem; color:#aaa;">[${RARITY_DATA[dragonInfo.rarity].name}]</span><br><br>
                    ${dragonInfo.desc}
                </div>
            `);
        } else {
            div.innerHTML = `
                <img src="assets/images/ui/icon_question.png" class="book-img" style="opacity:0.3; filter:grayscale(1);">
                <div style="font-size:0.7rem;">???</div>
            `;
        }
        grid.appendChild(div);
    });
}

// [공통] 상점 그리기
function renderShop() {
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
                <img src="${item.img}" class="item-img-lg">
                <div><b>${item.name}</b><br><small style="color:#aaa;">${item.desc}</small></div>
            </div>
            <button class="btn-stone" style="width:90px; height:45px; font-size:0.9rem;" onclick="buyItem('${id}')">
                <img src="${currencyIcon}" class="currency-icon"> <span style="color:${priceColor}">${item.price}</span>
            </button>
        `;
        list.appendChild(div);
    });
}

// 구매 로직
function buyItem(id) {
    const item = ITEM_DB[id];
    const costType = item.costType || 'gold'; 
    const currencyName = costType === 'gem' ? '보석' : '골드';
    
    // player 객체에 해당 재화가 없는 경우 0으로 취급
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

// 프로필 이미지 변경
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

// 모달 시스템
window.showAlert = function(msg, callback) {
    const modal = document.getElementById('common-modal');
    document.getElementById('modal-title').innerText = "알림";
    document.getElementById('modal-text').innerHTML = msg; 
    
    document.getElementById('modal-btn-alert').classList.remove('hidden');
    document.getElementById('modal-btn-confirm').classList.add('hidden');
    
    modal.classList.remove('hidden');
    modal.classList.add('active');

    const okBtn = document.querySelector('#modal-btn-alert button');
    // 이벤트 리스너 중복 방지를 위해 onclick 재할당
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
