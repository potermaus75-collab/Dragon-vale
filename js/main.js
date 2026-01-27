// ==========================================
// js/main.js (최신 수정판: 도감 오류 수정 포함)
// ==========================================

// [시스템] 이미지 로드 실패 시 CSS 용으로 대체하는 핸들러
window.handleImgError = function(imgEl, dragonType, dragonStage) {
    imgEl.onerror = null; // 무한루프 방지
    imgEl.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; // 투명 이미지
    
    if (typeof dragonStage === 'undefined') dragonStage = 0;
    
    imgEl.classList.add('css-dragon');
    imgEl.classList.add(`type-${dragonType}`);
    imgEl.classList.add(`stage-${dragonStage}`);
    
    imgEl.style.objectFit = "contain";
};

let userNickname = "Guest";
let prologueIndex = 0;

const PROLOGUE_DATA = [
    { text: "옛날 옛적, 용들이 하늘을 지배하던 시대...\n(터치하여 계속)" },
    { text: "하지만 대전쟁 이후 용들은 모두 사라졌다." },
    { text: "당신은 우연히 숲속에서 낡은 알을 발견한다." },
    { text: "이제 당신의 이야기가 시작된다." }
];

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

function switchTab(tabName) {
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
            const maxStage = (player.maxStages && player.maxStages[dragonId] !== undefined) ? player.maxStages[dragonId] : 0;
            let displayImg = "assets/images/dragon/stage_egg.png";
            if(window.getDragonImage) displayImg = window.getDragonImage(dragonId, maxStage); 

            div.innerHTML = `
                <img src="${displayImg}" class="book-img" onerror="handleImgError(this, '${dragonInfo.type}', ${maxStage})">
                <div style="font-weight:bold; color:${rarityColor}; font-size:0.7rem;">${dragonInfo.name}</div>
            `;
            div.onclick = () => { showDragonDetailModal(dragonId, dragonInfo, rarityColor); };
        } else {
            div.innerHTML = `
                <img src="assets/images/ui/icon_question.png" class="book-img" style="opacity:0.3; filter:grayscale(1);">
                <div style="font-size:0.7rem;">???</div>
            `;
        }
        grid.appendChild(div);
    });
}

// [수정] 도감 상세 보기: 고룡(Stage 4) 실루엣 제어
function showDragonDetailModal(dragonId, info, color) {
    const maxStage = (player.maxStages && player.maxStages[dragonId] !== undefined) ? player.maxStages[dragonId] : 0;
    const stageNames = ["알", "유아기", "성장기", "성룡", "고룡"];
    
    // [핵심 로직] 전설/에픽만 5단계(고룡)까지 표시, 나머지는 4단계(성룡)까지만 표시
    const isHighTier = (info.rarity === 'epic' || info.rarity === 'legend');
    const loopLimit = isHighTier ? 5 : 4;
    
    let stagesHtml = `<div style="display:flex; justify-content:center; align-items:flex-end; margin:15px 0; gap:10px;">`;
    
    for(let i=0; i < loopLimit; i++) {
        const imgSrc = window.getDragonImage ? window.getDragonImage(dragonId, i) : "";
        const isUnknown = i > maxStage;
        
        // 미발견 시 흐리게 처리
        const style = isUnknown ? 
            "filter: brightness(0); opacity: 0.3; width:40px; height:40px;" : 
            "width:50px; height:50px; object-fit:contain;";
        
        stagesHtml += `
            <div style="text-align:center;">
                <img src="${imgSrc}" style="${style}" onerror="handleImgError(this, '${info.type}', ${i})"><br>
                <span style="font-size:0.6rem; color:#888;">${stageNames[i]}</span>
            </div>
        `;
    }
    stagesHtml += `</div>`;

    showAlert(`
        <div style="text-align:center;">
            <b style="font-size:1.2rem; color:${color};">${info.name}</b>
            <br><span style="font-size:0.8rem; color:#aaa;">[${RARITY_DATA[info.rarity].name}]</span>
            <hr style="border:0.5px solid #444; margin:10px 0;">
            ${stagesHtml}
            <div style="text-align:left; background:rgba(0,0,0,0.3); padding:10px; border-radius:5px; font-size:0.9rem;">
                ${info.desc}
            </div>
        </div>
    `);
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
