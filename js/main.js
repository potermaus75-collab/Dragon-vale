// ==========================================
// js/main.js (완전판: 프리로드 & 메인 로직)
// ==========================================

let userNickname = "";

// [이미지 에셋 리스트 업데이트]
const UI_ASSETS = [
    "assets/images/ui/icon_question.png", "assets/images/ui_new/bg_cave.png",
    "assets/images/ui_new/frame_header.png", "assets/images/ui_new/frame_sidebar.png",
    "assets/images/ui_new/frame_title.png", "assets/images/ui_new/frame_upgrade.png",
    "assets/images/ui_new/frame_nav.png", "assets/images/ui_new/altar_pedestal.png",
    "assets/images/ui_new/slot_box_default.png", "assets/images/ui_new/slot_box_active.png",
    "assets/images/ui_new/bar_bg.png", "assets/images/ui_new/bar_fill.png", "assets/images/ui_new/btn_touch.png",
    "assets/images/ui_new/bg_book.png", "assets/images/ui_new/frame_book_title.png",
    "assets/images/ui_new/frame_tab_bar.png",
    // [신규 12종 추가]
    "assets/images/ui_new/ui_popup_common.png", "assets/images/ui_new/ui_btn_default.png",
    "assets/images/ui_new/ui_input_field.png", "assets/images/ui_new/ui_loading_frame.png",
    "assets/images/ui_new/ui_loading_bar.png", "assets/images/ui_new/ui_stat_panel.png",
    "assets/images/ui_new/ui_shop_slot_bg.png", "assets/images/ui_new/ui_hp_frame.png",
    "assets/images/ui_new/ui_hp_fill.png", "assets/images/ui_new/ui_battle_log_bg.png",
    "assets/images/ui_new/ui_popup_victory.png", "assets/images/ui_new/ui_popup_defeat.png"
];

// 초기화
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
        img.onload = () => {
            loaded++;
            updateLoadingBar(loaded, total);
            if (loaded >= total) callback();
        };
        img.onerror = () => {
            console.warn("이미지 로드 실패:", url);
            loaded++;
            updateLoadingBar(loaded, total);
            if (loaded >= total) callback();
        };
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
    
    player.nickname = name;
    userNickname = name;
    saveGame(true);
    
    document.getElementById('screen-setup').classList.add('hidden');
    // 프롤로그 시작
    showPrologue();
}

// 프롤로그
let prologueStep = 0;
function showPrologue() {
    document.getElementById('screen-prologue').classList.remove('hidden');
    prologueStep = 0;
    printPrologue();
}
function printPrologue() {
    if(prologueStep >= PROLOGUE_DATA.length) {
        document.getElementById('screen-prologue').classList.add('hidden');
        startGame();
        return;
    }
    document.getElementById('prologue-text').innerText = PROLOGUE_DATA[prologueStep].text;
}
window.nextPrologueCut = function() {
    prologueStep++;
    printPrologue();
};

function startGame() {
    document.getElementById('screen-start').classList.add('hidden');
    document.getElementById('screen-setup').classList.add('hidden');
    document.getElementById('screen-game').classList.remove('hidden');
    
    // UI 초기화
    document.getElementById('ui-nickname').innerText = player.nickname;
    updateCurrency(); 
    switchTab('dragon');
    window.renderCaveUI(); 
    
    // BGM 재생 등 (필요 시)
}

function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(t => t.classList.add('hidden'));
    
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    
    // 탭별 초기화 로직
    if(tabName === 'dragon') {
        window.renderCaveUI();
    } else if(tabName === 'info') {
        window.renderInventory(); 
    } else if(tabName === 'book') {
        initBookTab();
    } else if(tabName === 'shop') {
        renderShop();
    } else if(tabName === 'explore') {
        if(window.initExploreTab) window.initExploreTab();
    }
}

// 상점
function renderShop() {
    const list = document.getElementById('shop-list');
    list.innerHTML = "";
    
    SHOP_LIST.forEach(id => {
        const item = ITEM_DB[id];
        if(!item) return;
        
        const div = document.createElement('div');
        div.className = 'shop-item';
        
        const costIcon = (item.costType === 'gem') ? 'assets/images/ui/icon_gem.png' : 'assets/images/ui/icon_gold.png';
        const costColor = (item.costType === 'gem') ? '#3498db' : '#f1c40f';
        
        div.innerHTML = `
            <div style="display:flex; align-items:center;">
                <img src="${item.img}" class="item-img-lg" onerror="handleImgError(this)">
                <div>
                    <div style="font-weight:bold; font-size:0.9rem;">${item.name}</div>
                    <div style="font-size:0.7rem; color:#aaa;">${item.desc}</div>
                </div>
            </div>
            <button class="btn-stone" style="width:80px; height:36px; font-size:0.75rem;" onclick="buyItem('${id}')">
                <img src="${costIcon}" class="currency-icon"> ${item.price}
            </button>
        `;
        list.appendChild(div);
    });
}

window.buyItem = function(id) {
    const item = ITEM_DB[id];
    if(!item) return;
    
    if(item.costType === 'gem') {
        if(player.gem < item.price) { showAlert("보석이 부족합니다."); return; }
        showConfirm(`[${item.name}] 구매하시겠습니까?<br>💎 ${item.price}`, () => {
            player.gem -= item.price;
            addItem(id, 1);
            showAlert("구매 완료!");
            updateCurrency();
        });
    } else {
        if(player.gold < item.price) { showAlert("골드가 부족합니다."); return; }
        showConfirm(`[${item.name}] 구매하시겠습니까?<br>💰 ${item.price}`, () => {
            player.gold -= item.price;
            addItem(id, 1);
            showAlert("구매 완료!");
            updateCurrency();
        });
    }
};

// 도감
let currentBookTab = 'fire';
function initBookTab() {
    const tabBar = document.getElementById('book-tab-bar');
    tabBar.innerHTML = "";
    
    const types = ["fire", "water", "forest", "electric", "metal", "light", "dark"];
    const icons = {
        fire: "assets/images/ui_new/icon_type_fire.png",
        water: "assets/images/ui_new/icon_type_water.png",
        forest: "assets/images/ui_new/icon_type_forest.png",
        electric: "assets/images/ui_new/icon_type_electric.png",
        metal: "assets/images/ui_new/icon_type_metal.png",
        light: "assets/images/ui_new/icon_type_light.png",
        dark: "assets/images/ui_new/icon_type_dark.png"
    };
    
    types.forEach(type => {
        const div = document.createElement('div');
        div.className = `tab-type-icon ${currentBookTab === type ? 'active' : ''}`;
        div.innerHTML = `<img src="${icons[type]}">`;
        div.onclick = () => {
            currentBookTab = type;
            initBookTab(); 
        };
        tabBar.appendChild(div);
    });
    
    renderBookGrid();
}

function renderBookGrid() {
    const grid = document.getElementById('book-grid-area');
    grid.innerHTML = "";
    
    const list = [];
    for(const key in DRAGON_DEX) {
        if(DRAGON_DEX[key].type === currentBookTab) {
            list.push({ id: key, ...DRAGON_DEX[key] });
        }
    }
    
    // 희귀도 정렬 (Common -> Legend)
    const order = { "common":1, "rare":2, "heroic":3, "epic":4, "legend":5 };
    list.sort((a,b) => order[a.rarity] - order[b.rarity]);
    
    list.forEach(dragon => {
        const isDiscovered = player.discovered && player.discovered.includes(dragon.id);
        const div = document.createElement('div');
        div.className = `book-slot-item ${isDiscovered ? '' : 'unknown'}`;
        
        let imgSrc = "assets/images/ui/icon_question.png";
        if(isDiscovered && window.getDragonImage) {
            // 성체 이미지
            imgSrc = window.getDragonImage(dragon.id, 3);
        }
        
        div.innerHTML = `<img src="${imgSrc}" onerror="handleImgError(this)">`;
        div.onclick = () => showBookDetail(dragon, isDiscovered);
        grid.appendChild(div);
    });
}

function showBookDetail(dragon, isDiscovered) {
    if(!isDiscovered) {
        showAlert("아직 발견하지 못한 드래곤입니다.");
        return;
    }
    
    const maxStage = (player.maxStages && player.maxStages[dragon.id]) ? player.maxStages[dragon.id] : 0;
    const rarityInfo = RARITY_DATA[dragon.rarity];
    
    // 상세 정보 모달 (기존 common-modal 재활용하되 내용은 HTML로 구성)
    const content = `
        <div style="text-align:center">
            <h2 style="color:${rarityInfo.color}; margin:5px 0;">${dragon.name}</h2>
            <p style="color:#aaa; font-size:0.8rem;">[${rarityInfo.name}] ${dragon.desc}</p>
            
            <div class="detail-slider-container">
                <div class="detail-slider-track" id="detail-track">
                    </div>
            </div>
            <div style="font-size:0.8rem; color:#888;">최대 성장 기록: ${getStageName(maxStage)}</div>
        </div>
    `;
    
    showAlert(content);
    
    // 모달 뜬 직후 슬라이더 구성
    setTimeout(() => {
        const track = document.getElementById('detail-track');
        if(!track) return;
        
        // 0(알)~4(고룡)
        for(let i=0; i<=4; i++) {
            const dDiv = document.createElement('div');
            dDiv.className = 'detail-stage-view';
            if(i <= maxStage) {
                const src = window.getDragonImage(dragon.id, i);
                dDiv.innerHTML = `<img src="${src}" class="detail-img-large">`;
            } else {
                dDiv.innerHTML = `<img src="assets/images/ui/icon_question.png" style="opacity:0.3; width:64px;">`;
            }
            track.appendChild(dDiv);
        }
        
        // 간단 오토 슬라이드 or 스크롤
        track.style.overflowX = 'auto'; 
    }, 100);
}

function getStageName(idx) {
    const names = ["알", "유아기", "성장기", "성룡", "고룡"];
    return names[idx] || "??";
}

window.handleImgError = function(img) {
    img.onerror = null;
    img.src = "assets/images/ui/icon_question.png";
};

window.updateUI = function() {
    updateCurrency();
    window.renderCaveUI();
    window.renderInventory();
    if(window.isExploreActive) window.updateMoveUI();
};
