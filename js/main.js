// ==========================================
// js/main.js (완전판: 도감 및 시스템 창 개선)
// ==========================================

let userNickname = "";
const UI_ASSETS = [
    "assets/images/ui_new/ui_loading_frame.png", "assets/images/ui_new/ui_loading_bar.png",
    "assets/images/ui_new/ui_hp_frame.png", "assets/images/ui_new/ui_hp_fill.png"
];

window.onload = function() {
    loadGame(); 
    preloadImages(UI_ASSETS, () => {
        document.getElementById('loading-text').innerText = "로딩 완료!";
        document.getElementById('start-msg').classList.remove('hidden');
    });
};

function preloadImages(urls, callback) {
    let loaded = 0;
    const total = urls.length;
    if (total === 0) { callback(); return; }
    urls.forEach(url => {
        const img = new Image();
        img.src = url;
        img.onload = () => { loaded++; updateLoadingBar(loaded, total); if (loaded >= total) callback(); };
        img.onerror = () => { loaded++; updateLoadingBar(loaded, total); if (loaded >= total) callback(); };
    });
}

function updateLoadingBar(current, total) {
    const fill = document.getElementById('loading-bar-fill');
    if (fill) {
        const percent = (current / total) * 100;
        fill.style.width = `${percent}%`;
    }
}

function tryStartGame() {
    if(player.nickname && player.nickname !== "Guest") {
        startGame();
    } else {
        document.getElementById('screen-start').classList.add('hidden');
        document.getElementById('screen-setup').classList.remove('hidden');
    }
}

function submitName() {
    const input = document.getElementById('input-nickname');
    const name = input.value.trim();
    if (name.length < 1) { showAlert("이름을 입력해주세요."); return; }
    player.nickname = name; userNickname = name; saveGame(true);
    document.getElementById('screen-setup').classList.add('hidden');
    showPrologue();
}

let prologueStep = 0;
function showPrologue() {
    document.getElementById('screen-prologue').classList.remove('hidden');
    prologueStep = 0; printPrologue();
}
function printPrologue() {
    if(prologueStep >= PROLOGUE_DATA.length) {
        document.getElementById('screen-prologue').classList.add('hidden');
        startGame(); return;
    }
    document.getElementById('prologue-text').innerText = PROLOGUE_DATA[prologueStep].text;
}
window.nextPrologueCut = function() { prologueStep++; printPrologue(); };

function startGame() {
    document.getElementById('screen-start').classList.add('hidden');
    document.getElementById('screen-setup').classList.add('hidden');
    document.getElementById('screen-game').classList.remove('hidden');
    updateCurrency(); switchTab('dragon'); window.renderCaveUI(); 
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    
    if(tabName === 'dragon') window.renderCaveUI();
    else if(tabName === 'info') window.renderInventory(); 
    else if(tabName === 'book') initBookTab();
    else if(tabName === 'shop') renderShop();
    else if(tabName === 'explore' && window.initExploreTab) window.initExploreTab();
}

function renderShop() {
    const list = document.getElementById('shop-list'); list.innerHTML = "";
    SHOP_LIST.forEach(id => {
        const item = ITEM_DB[id]; if(!item) return;
        const div = document.createElement('div'); div.className = 'shop-item';
        div.innerHTML = `
            <div style="display:flex; align-items:center;">
                <img src="${item.img}" class="item-img-lg" onerror="handleImgError(this)">
                <div><div style="font-weight:bold; font-size:0.9rem;">${item.name}</div><div style="font-size:0.7rem; color:#aaa;">${item.desc}</div></div>
            </div>
            <button class="btn-stone" style="width:80px; height:36px; font-size:0.75rem;" onclick="buyItem('${id}')">${item.price}</button>
        `;
        list.appendChild(div);
    });
}
window.buyItem = function(id) {
    const item = ITEM_DB[id]; if(!item) return;
    if(item.costType === 'gem' && player.gem < item.price) { showAlert("보석 부족"); return; }
    if(item.costType !== 'gem' && player.gold < item.price) { showAlert("골드 부족"); return; }
    
    showConfirm(`${item.name} 구매?`, () => {
        if(item.costType === 'gem') player.gem -= item.price; else player.gold -= item.price;
        addItem(id, 1); showAlert("구매 완료"); updateCurrency();
    });
};

// [도감 시스템 개선]
let currentBookTab = 'fire';
function initBookTab() {
    const tabBar = document.getElementById('book-tab-bar'); tabBar.innerHTML = "";
    const types = ["fire", "water", "forest", "electric", "metal", "light", "dark"];
    const icons = {
        fire: "assets/images/ui_new/icon_type_fire.png", water: "assets/images/ui_new/icon_type_water.png",
        forest: "assets/images/ui_new/icon_type_forest.png", electric: "assets/images/ui_new/icon_type_electric.png",
        metal: "assets/images/ui_new/icon_type_metal.png", light: "assets/images/ui_new/icon_type_light.png",
        dark: "assets/images/ui_new/icon_type_dark.png"
    };
    
    types.forEach(type => {
        const div = document.createElement('div');
        div.className = `tab-type-icon ${currentBookTab === type ? 'active' : ''}`;
        div.innerHTML = `<img src="${icons[type]}">`;
        div.onclick = () => { currentBookTab = type; initBookTab(); };
        tabBar.appendChild(div);
    });
    renderBookGrid();
}

function renderBookGrid() {
    const grid = document.getElementById('book-grid-area'); grid.innerHTML = "";
    
    const list = [];
    for(const key in DRAGON_DEX) {
        if(DRAGON_DEX[key].type === currentBookTab) list.push({ id: key, ...DRAGON_DEX[key] });
    }
    const order = { "common":1, "rare":2, "heroic":3, "epic":4, "legend":5 };
    list.sort((a,b) => order[a.rarity] - order[b.rarity]);
    
    list.forEach(dragon => {
        const isDiscovered = player.discovered && player.discovered.includes(dragon.id);
        const div = document.createElement('div');
        div.className = `book-slot-item ${isDiscovered ? '' : 'unknown'}`;
        
        let imgSrc = "assets/images/ui/icon_question.png";
        if(isDiscovered && window.getDragonImage) {
            // [수정] 내가 달성한 최대 성장 단계 이미지 표시
            const maxStage = player.maxStages[dragon.id] || 0;
            imgSrc = window.getDragonImage(dragon.id, maxStage); 
        }
        
        div.innerHTML = `<img src="${imgSrc}" onerror="handleImgError(this)">`;
        div.onclick = () => showBookDetail(dragon, isDiscovered);
        grid.appendChild(div);
    });
}

function showBookDetail(dragon, isDiscovered) {
    if(!isDiscovered) { showAlert("아직 발견하지 못한 드래곤입니다."); return; }
    
    const maxStage = (player.maxStages && player.maxStages[dragon.id]) ? player.maxStages[dragon.id] : 0;
    const rarityInfo = RARITY_DATA[dragon.rarity];
    const limit = (dragon.rarity === 'epic' || dragon.rarity === 'legend') ? 4 : 3;

    // [수정] 스크롤 스냅을 위한 구조
    const content = `
        <div style="text-align:center">
            <h2 style="color:${rarityInfo.color}; margin:5px 0;">${dragon.name}</h2>
            <p style="color:#aaa; font-size:0.8rem;">[${rarityInfo.name}] ${dragon.desc}</p>
            
            <div class="detail-slider-container">
                <div id="detail-track" style="display:flex; height:100%;"></div>
            </div>
            
            <div style="font-size:0.8rem; color:#888; margin-top:5px;">좌우로 넘겨 성장 과정을 확인하세요.</div>
            <div style="font-size:0.8rem; color:#f1c40f;">현재 기록: ${getStageName(maxStage)}</div>
        </div>
    `;
    
    showAlert(content);
    
    setTimeout(() => {
        const track = document.getElementById('detail-track');
        if(!track) return;
        
        // [수정] 성장 단계별 슬라이드 생성 (스냅 적용됨)
        for(let i=0; i<=limit; i++) {
            const dDiv = document.createElement('div');
            dDiv.className = 'detail-stage-view'; // CSS scroll-snap-align: center
            
            let html = "";
            if(i <= maxStage) {
                // 달성한 단계는 이미지 표시
                const src = window.getDragonImage(dragon.id, i);
                html = `<img src="${src}" class="detail-img-large"><div class="stage-label">${getStageName(i)}</div>`;
            } else {
                // 미달성 단계는 물음표 표시
                html = `<img src="assets/images/ui/icon_question.png" style="opacity:0.3; width:64px;"><div class="stage-label" style="color:#555">???</div>`;
            }
            dDiv.innerHTML = html;
            track.appendChild(dDiv);
        }
    }, 50);
}

function getStageName(idx) {
    return ["알", "유아기", "성장기", "성룡", "고룡"][idx] || "??";
}

window.handleImgError = function(img) { img.onerror = null; img.src = "assets/images/ui/icon_question.png"; };
window.updateUI = function() {
    updateCurrency(); window.renderCaveUI(); window.renderInventory();
    if(window.isExploreActive) window.updateMoveUI();
};
