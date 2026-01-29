// ==========================================
// js/hatchery.js (최종: 도감 데이터 동기화 강화)
// ==========================================

const dragonDisplay = document.getElementById('dragon-display');
const progressBar = document.getElementById('progress-fill');
const dragonNameUI = document.getElementById('dragon-name-ui');
const eggListArea = document.getElementById('my-egg-list');

// 전역 UI 업데이트
window.renderCaveUI = function() {
    // [중요] 렌더링 전 데이터 동기화 (도감 누락 방지)
    syncBookData();
    
    renderEggList();     
    renderNest();        
    renderCaveInventory(); 
};

// [자가 복구] 도감 데이터 강제 동기화 함수
function syncBookData() {
    if (!player.myDragons) return;
    if (!player.discovered) player.discovered = [];
    if (!player.maxStages) player.maxStages = {};

    let isUpdated = false;

    player.myDragons.forEach(dragon => {
        // 1. 도감 발견 누락 체크
        if (!player.discovered.includes(dragon.id)) {
            player.discovered.push(dragon.id);
            isUpdated = true;
        }

        // 2. 최대 성장 단계 누락 체크
        const currentRec = player.maxStages[dragon.id] || 0;
        if (dragon.stage > currentRec) {
            player.maxStages[dragon.id] = dragon.stage;
            isUpdated = true;
        }
    });

    if (isUpdated && window.saveGame) {
        window.saveGame(true); // 변경사항 있으면 즉시 저장
    }
}

// 알 목록 (사이드바)
function renderEggList() {
    if(!eggListArea) return;
    eggListArea.innerHTML = "";
    
    player.myDragons.forEach((dragon, index) => {
        const div = document.createElement('div');
        div.className = `new-slot-item ${index === player.currentDragonIndex ? 'active' : ''}`;
        
        // 0단계(알)는 공통 이미지
        let iconSrc = "assets/images/dragon/stage_egg.png";
        if(window.getDragonImage) iconSrc = window.getDragonImage(dragon.id, dragon.stage);

        div.innerHTML = `<img src="${iconSrc}" onerror="handleImgError(this)">`;
        div.onclick = () => {
            player.currentDragonIndex = index;
            window.renderCaveUI(); 
        };
        eggListArea.appendChild(div);
    });
}

// 둥지 화면
function renderNest() {
    const dragonData = player.myDragons[player.currentDragonIndex];
    if (!dragonData) return;

    let displayName = dragonData.name;
    if (dragonData.stage === 0) {
        displayName = (window.EGG_TYPE_NAMES && window.EGG_TYPE_NAMES[dragonData.type]) ? window.EGG_TYPE_NAMES[dragonData.type] : "미확인 알";
    }
    if(dragonNameUI) dragonNameUI.innerText = displayName;

    const max = DRAGON_DATA.reqClicks[dragonData.stage] || 9999;
    const isHighTier = (dragonData.rarity === 'epic' || dragonData.rarity === 'legend');
    const maxStageLimit = isHighTier ? 4 : 3; 
    const isMaxLevel = dragonData.stage >= maxStageLimit;
    
    let percent = 0;
    if (isMaxLevel) {
        percent = 100;
        if(dragonNameUI) dragonNameUI.innerText += " (MAX)";
    } else {
        percent = (dragonData.clicks / max) * 100;
    }
    
    if(progressBar) progressBar.style.width = `${percent}%`;

    const gaugeText = document.querySelector('.gauge-text');
    if(gaugeText) {
        gaugeText.innerText = isMaxLevel ? "MAX" : `${Math.floor(dragonData.clicks)} / ${max}`;
    }

    let imgSrc = "assets/images/dragon/stage_egg.png"; 
    if (window.getDragonImage) {
        imgSrc = window.getDragonImage(dragonData.id, dragonData.stage);
    }

    if(dragonDisplay) {
        dragonDisplay.innerHTML = `<img src="${imgSrc}" class="main-dragon-img" onerror="handleImgError(this)">`;
        const imgEl = dragonDisplay.querySelector('img');
        if(dragonData.isShiny && imgEl) {
            imgEl.style.filter = "hue-rotate(150deg) brightness(1.2) drop-shadow(0 0 5px #f1c40f)";
        }

        if(imgEl) {
            if (!isMaxLevel) {
                imgEl.style.cursor = "pointer";
                imgEl.onclick = () => handleDragonClick(dragonData, imgEl);
            } else {
                imgEl.style.cursor = "default";
                imgEl.onclick = () => showAlert("이 용은 성장을 마쳤습니다.");
            }
        }
    }
}

window.handleTouchBtn = function() {
    const dragonData = player.myDragons[player.currentDragonIndex];
    const imgEl = dragonDisplay ? dragonDisplay.querySelector('img') : null;
    if (dragonData && imgEl) {
        handleDragonClick(dragonData, imgEl);
    }
};

function handleDragonClick(dragon, imgEl) {
    imgEl.classList.remove('click-anim');
    void imgEl.offsetWidth; 
    imgEl.classList.add('click-anim');

    const isHighTier = (dragon.rarity === 'epic' || dragon.rarity === 'legend');
    const maxStageLimit = isHighTier ? 4 : 3;

    if (dragon.stage >= maxStageLimit) return; 

    const max = DRAGON_DATA.reqClicks[dragon.stage];
    const clickPower = 1 + (player.nestLevel || 0);
    dragon.clicks += clickPower;
    
    const percent = Math.min(100, (dragon.clicks / max) * 100);
    if(progressBar) progressBar.style.width = `${percent}%`;
    const gaugeText = document.querySelector('.gauge-text');
    if(gaugeText) gaugeText.innerText = `${Math.floor(dragon.clicks)} / ${max}`;

    if (dragon.clicks >= max) {
        const oldStage = dragon.stage;
        dragon.stage++;
        dragon.clicks = 0;
        
        // 도감 데이터 즉시 갱신
        if(!player.maxStages) player.maxStages = {};
        if(!player.maxStages[dragon.id] || player.maxStages[dragon.id] < dragon.stage) {
            player.maxStages[dragon.id] = dragon.stage;
        }

        if (oldStage === 0 && dragon.stage === 1) {
            if(!player.discovered.includes(dragon.id)) {
                player.discovered.push(dragon.id);
            }
            showAlert(`알을 깨고 <b style="color:${RARITY_DATA[dragon.rarity].color}">${dragon.name}</b>이(가) 태어났습니다!`);
        } else {
            showAlert(`축하합니다!<br>[${dragon.name}]이(가) 성장했습니다!`);
        }

        const xpReward = [0, 50, 100, 300, 1000];
        const gain = xpReward[dragon.stage] || 50;
        if(window.gainExp) window.gainExp(gain);
        
        // 동기화 및 UI 갱신
        syncBookData();
        renderNest(); 
        renderEggList(); 
        
        if(window.saveGame) window.saveGame(true);
    }
}

function renderCaveInventory() {
    const grid = document.getElementById('cave-inventory-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    if(!player.inventory) player.inventory = {};
    const itemIds = Object.keys(player.inventory);
    
    itemIds.forEach(id => {
        if(player.inventory[id] > 0) {
            const item = ITEM_DB[id];
            if(item && item.type !== 'equip') {
                const div = document.createElement('div');
                div.className = 'new-slot-item'; 
                div.innerHTML = `
                    <img src="${item.img}" onerror="this.src='assets/images/ui/icon_question.png'">
                    <span class="count-badge">${player.inventory[id]}</span>
                `;
                div.onclick = () => useItem(id); 
                grid.appendChild(div);
            }
        }
    });
}
