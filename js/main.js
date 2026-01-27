// ==========================================
// js/main.js (탭 잠금 & 프리로딩 포함)
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
// 스마트 이미지 프리로딩 시스템
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

    if (typeof ITEM_DB !== 'undefined') {
        for (let key in ITEM_DB) {
            if (ITEM_DB[key].img) imagesToLoad.push(ITEM_DB[key].img);
        }
    }

    if (typeof REGION_DATA !== 'undefined') {
        REGION_DATA.forEach(region => {
            if (region.bg) imagesToLoad.push(region.bg);
        });
    }

    if (typeof DRAGON_DATA !== 'undefined' && DRAGON_DATA.stageImages) {
        imagesToLoad = imagesToLoad.concat(DRAGON_DATA.stageImages);
    }
    
    // [추가] 용 개별 이미지 매핑이 있다면 로딩 (dragon.js 참조)
    if (typeof IMG_MAPPING !== 'undefined') {
        const stageSuffixes = ["_egg.png", "_baby.png", "_teen.png", "_adult.png", "_elder.png"];
        for(let key in IMG_MAPPING) {
            const baseName = IMG_MAPPING[key];
            stageSuffixes.forEach(suffix => {
                imagesToLoad.push(`assets/images/dragon/${baseName}${suffix}`);
            });
        }
    }

    imagesToLoad = [...new Set(imagesToLoad)];

    let loadedCount = 0;
    const totalCount = imagesToLoad.length;
    
    const textEl = document.getElementById('loading-text');
    const barEl = document.getElementById('loading-bar-fill');
    const containerEl = document.getElementById('loading-container');
    const startMsgEl = document.getElementById('start-msg');

    if (totalCount === 0) {
        completeLoading();
        return;
    }

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

        if (loadedCount >= totalCount) {
            setTimeout(completeLoading, 300);
        }
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
    updateCurrency();
    switchTab('dragon'); 
    if(window.updateUI) window.updateUI();
    saveGame(); 
}

// ----------------------------------------------------
// [핵심 수정] 탭 전환 시스템 (탐험 중 잠금)
// ----------------------------------------------------
function switchTab(tabName) {
    // explore.js의 window.isExploreActive 변수를 체크
    if (window.isExploreActive && tabName !== 'explore') {
        showAlert("탐험 중에는 다른 메뉴로 이동할 수 없습니다!\n탐험을 먼저 완료하거나 포기해주세요.");
        return;
    }

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    const selected = document.getElementById(`tab-${tabName}`);
    if(selected) selected.classList.remove('hidden');

    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    const tabMap = {'info':0, 'dragon':1, 'explore':2, 'book':3, 'shop':4};
    if(tabMap[tabName] !== undefined) navBtns[tabMap[tabName]].classList.add('active');

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

// 공통 UI 함수들
function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    if(!grid) return;
    grid.innerHTML = "";
    if(!player.inventory) player.inventory = {};

    const itemIds = Object.keys(player.inventory);
    if(itemIds.length === 0) grid.innerHTML = "<p style='grid-column:span 4; text-align:center; color:#888;'>비어있음</p>";

    itemIds.forEach(id => {
        if(player.inventory[id] > 0) {
            const item = ITEM_DB[id];
            if(!item) return;
            const div = document.createElement('div');
            div.className = 'slot-item';
            div.onclick = () => useItem(id); 
            div.innerHTML = `<img src="${item.img}" class="item-img-lg" onerror="this.src='assets/images/ui/icon_question.png'"><span style="position:absolute; bottom:2px; right:2px; font-size:0.7rem;">x${player.inventory[id]}</span>`;
            grid.appendChild(div);
        }
    });
}

function renderBook() {
    const grid = document.getElementById('book-grid');
    if(!grid) return;
    grid.innerHTML = "";
    if(!player.discovered) player.discovered = [];
    if(typeof DRAGON_DEX === 'undefined') return;

    Object.keys(DRAGON_DEX).forEach(dragonId => {
        const dragonInfo = DRAGON_DEX[dragonId];
        const isFound = player.discovered.includes(dragonId); 

        const div = document.createElement('div');
        div.className = `book-slot ${isFound ? 'found' : ''}`;
        
        const rarityColor = RARITY_DATA[dragonInfo.rarity].color;
        if(isFound) div.style.borderColor = rarityColor;

        if (isFound) {
            // [수정] 성체 이미지 사용 (dragon.js의 getDragonImage 활용 가능하면 사용)
            let displayImg = "assets/images/dragon/stage_adult.png";
            if(window.getDragonImage) {
                displayImg = window.getDragonImage(dragonId, 3); // 3=adult
            }
            div.innerHTML = `
                <img src="${displayImg}" class="book-img">
                <div style="font-weight:bold; color:${rarityColor}; font-size:0.7rem;">${dragonInfo.name}</div>
            `;
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
