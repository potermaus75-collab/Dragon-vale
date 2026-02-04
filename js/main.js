// ==========================================
// js/main.js (완전판)
// ==========================================

let userNickname = "";

const UI_ASSETS = [
    "assets/images/ui/icon_question.png", "assets/images/ui_new/bg_cave.png",
    "assets/images/ui_new/frame_header.png", "assets/images/ui_new/frame_sidebar.png",
    "assets/images/ui_new/frame_title.png", "assets/images/ui_new/frame_upgrade.png",
    "assets/images/ui_new/frame_nav.png", "assets/images/ui_new/altar_pedestal.png",
    "assets/images/ui_new/slot_box_default.png", "assets/images/ui_new/slot_box_active.png",
    "assets/images/ui_new/bar_bg.png", "assets/images/ui_new/bar_fill.png", "assets/images/ui_new/btn_touch.png",
    "assets/images/ui_new/bg_book.png", "assets/images/ui_new/frame_book_title.png",
    "assets/images/ui_new/frame_tab_bar.png",
    "assets/images/ui_new/ui_popup_common.png", 
    "assets/images/ui_new/ui_btn-default.png", // [확인] 이미지명 확인
    "assets/images/ui_new/ui_input_field.png", "assets/images/ui_new/ui_loading_frame.png",
    "assets/images/ui_new/ui_loading_bar.png", "assets/images/ui_new/ui_stat_panel.png",
    "assets/images/ui_new/ui_shop_slot_bg.png", "assets/images/ui_new/ui_hp_frame.png",
    "assets/images/ui_new/ui_hp_fill.png", "assets/images/ui_new/ui_battle_log_bg.png",
    "assets/images/ui_new/ui_popup_victory.png", "assets/images/ui_new/ui_popup_defeat.png",
    "assets/images/ui/panel_vertical.png"
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
        img.onload = () => {
            loaded++;
            updateLoadingBar(loaded, total);
            if (loaded >= total) callback();
        };
        img.onerror = () => {
            // console.warn("이미지 로드 실패:", url); // 필요시 주석 해제
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
    showPrologue();
}

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
    
    document.getElementById('ui-nickname').innerText = player.nickname;
    updateCurrency(); 
    switchTab('dragon');
    window.renderCaveUI(); 
}

function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(t => t.classList.add('hidden'));
    
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    
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

function renderShop() {
    const list = document.getElementById('shop-list');
    list.innerHTML = "";
    
    SHOP_LIST.forEach(id => {
        const item = ITEM_DB[id];
        if(!item) return;
        
        const div = document.createElement('div');
        div.className = 'shop-item';
        
        const costIcon = (item.costType === 'gem') ? 'assets/images/ui/icon_gem.png' : 'assets/images/ui/icon_gold.png';
        
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
    
    const order = { "common":1, "rare":2, "heroic":3, "epic":4, "legend":5 };
    list.sort((a,b) => order[a.rarity] - order[b.rarity]);
    
    list.forEach(dragon => {
        const isDiscovered = player.discovered && player.discovered.includes(dragon.id);
        const div = document.createElement('div');
        div.className = `book-slot-item ${isDiscovered ? '' : 'unknown'}`;
        
        let imgSrc = "assets/images/ui/icon_question.png";
        if(isDiscovered && window.getDragonImage) {
            const maxStage = player.maxStages[dragon.id] || 0;
            imgSrc = window.getDragonImage(dragon.id, maxStage); 
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
    
    const modal = document.getElementById('common-modal');
    const panel = modal.querySelector('.abs-center-panel');
    const titleObj = document.getElementById('modal-title');
    const textObj = document.getElementById('modal-text');
    const btnAlert = document.getElementById('modal-btn-alert');
    const btnConfirm = document.getElementById('modal-btn-confirm');

    // 1. 도감 전용 패널 클래스 추가 (세로형 배경, 글씨 색상 등 적용)
    panel.classList.add('panel-vertical');

    // 2. 타이틀: 드래곤 이름 및 등급별 색상 (검은 테두리는 CSS에서 처리됨)
    const rarityInfo = RARITY_DATA[dragon.rarity];
    titleObj.innerText = dragon.name;
    titleObj.style.color = rarityInfo.color;

    // 3. 내용 구성
    const maxStage = (player.maxStages && player.maxStages[dragon.id]) ? player.maxStages[dragon.id] : 0;
    const isHighTier = (dragon.rarity === 'epic' || dragon.rarity === 'legend');
    const loopLimit = isHighTier ? 4 : 3;

    // [수정] 구조 단순화: inner-track 제거하고 container에 직접 items 추가
    const sliderHtml = `<div class="detail-slider-container" id="detail-slider-view"></div>`;

    const content = `
        <div style="display:flex; flex-direction:column; align-items:center; gap:15px; width:100%;">
            ${sliderHtml}
            <div style="text-align:center; width:100%;">
                <p style="font-size:0.9rem; margin:5px 0; word-break:keep-all;">${dragon.desc}</p>
                <div style="font-size:0.8rem; margin-top:10px;">최대 성장 기록: ${getStageName(maxStage)}</div>
                <div style="font-size:0.7rem; opacity:0.7; margin-top:5px;">(좌우로 스크롤하여 확인하세요)</div>
            </div>
        </div>
    `;

    textObj.innerHTML = content;

    btnAlert.classList.remove('hidden');
    btnConfirm.classList.add('hidden');
    modal.classList.remove('hidden');
    modal.classList.add('active');

    // 슬라이더 아이템 생성
    setTimeout(() => {
        const container = document.getElementById('detail-slider-view');
        if(container) {
            for(let i=0; i<=loopLimit; i++) {
                const dDiv = document.createElement('div');
                dDiv.className = 'detail-stage-view';
                
                let innerHTML = "";
                if(i <= maxStage) {
                    const src = window.getDragonImage(dragon.id, i);
                    innerHTML = `<img src="${src}" class="detail-img-large"><div class="stage-label">${getStageName(i)}</div>`;
                } else {
                    innerHTML = `<img src="assets/images/ui/icon_question.png" style="opacity:0.3; width:64px;"><div class="stage-label">???</div>`;
                }
                dDiv.innerHTML = innerHTML;
                container.appendChild(dDiv);
            }
        }
    }, 50);

    // 닫기 버튼: 원래 상태로 복구
    const btn = btnAlert.querySelector('button');
    btn.onclick = function() {
        closeModal('common-modal');
        panel.classList.remove('panel-vertical');
        titleObj.style.color = '#f1c40f'; // 기본색(노랑) 복구
        titleObj.style.textShadow = ''; // 테두리 제거
    };
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
