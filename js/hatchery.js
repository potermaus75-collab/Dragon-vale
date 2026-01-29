// ==========================================
// js/hatchery.js (최종 수정: 누락된 함수 복구 완료)
// ==========================================

const dragonDisplay = document.getElementById('dragon-display');
const progressBar = document.getElementById('progress-fill');
const dragonNameUI = document.getElementById('dragon-name-ui');
const eggListArea = document.getElementById('my-egg-list');

// 전역 UI 업데이트
window.renderCaveUI = function() {
    syncBookData(); // 도감 동기화
    renderEggList();     
    renderNest();        
    renderCaveInventory(); 
};

// [자가 복구] 도감 데이터 강제 동기화
function syncBookData() {
    if (!player.myDragons) return;
    if (!player.discovered) player.discovered = [];
    if (!player.maxStages) player.maxStages = {};

    let isUpdated = false;

    player.myDragons.forEach(dragon => {
        if (!player.discovered.includes(dragon.id)) {
            player.discovered.push(dragon.id);
            isUpdated = true;
        }
        const currentRec = player.maxStages[dragon.id] || 0;
        if (dragon.stage > currentRec) {
            player.maxStages[dragon.id] = dragon.stage;
            isUpdated = true;
        }
    });

    if (isUpdated && window.saveGame) {
        window.saveGame(true);
    }
}

// 알 목록 렌더링
function renderEggList() {
    if(!eggListArea) return;
    eggListArea.innerHTML = "";
    
    player.myDragons.forEach((dragon, index) => {
        const div = document.createElement('div');
        div.className = `new-slot-item ${index === player.currentDragonIndex ? 'active' : ''}`;
        
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

// 둥지 화면 렌더링
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

// 터치 버튼
window.handleTouchBtn = function() {
    const dragonData = player.myDragons[player.currentDragonIndex];
    const imgEl = dragonDisplay ? dragonDisplay.querySelector('img') : null;
    if (dragonData && imgEl) {
        handleDragonClick(dragonData, imgEl);
    }
};

// 클릭 로직
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
        
        // 도감 업데이트
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
        
        syncBookData();
        renderNest(); 
        renderEggList(); 
        if(window.saveGame) window.saveGame(true);
    }
}

// 인벤토리 렌더링
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

function generateUID() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }

// [복구된 핵심 함수] 알 생성 로직
function hatchEggInternal(isShinyEgg = false, targetType = null) {
    const lv = player.level || 1;
    const bonusProb = lv * 0.05; 

    let pLegend = RARITY_DATA.legend.prob + (bonusProb * 0.5); 
    let pEpic = RARITY_DATA.epic.prob + bonusProb;
    let pHeroic = RARITY_DATA.heroic.prob;
    let pRare = RARITY_DATA.rare.prob;
    
    if(isShinyEgg) { pLegend += 2; pEpic += 5; pHeroic += 20; }

    const rand = Math.random() * 100;
    let rarity = 'common';

    if (rand < pLegend) rarity = 'legend';
    else if (rand < pLegend + pEpic) rarity = 'epic';
    else if (rand < pLegend + pEpic + pHeroic) rarity = 'heroic';
    else if (rand < pLegend + pEpic + pHeroic + pRare) rarity = 'rare';
    else rarity = 'common';

    const candidates = [];
    if(typeof DRAGON_DEX !== 'undefined') {
        for (const key in DRAGON_DEX) {
            const dragon = DRAGON_DEX[key];
            if (dragon.rarity === rarity) {
                if (targetType) {
                    if (dragon.type === targetType) candidates.push({ ...dragon, id: key });
                } else {
                    candidates.push({ ...dragon, id: key });
                }
            }
        }
    }

    if (candidates.length === 0 && targetType) {
        for (const key in DRAGON_DEX) {
            if (DRAGON_DEX[key].type === targetType) {
                candidates.push({ ...DRAGON_DEX[key], id: key });
                rarity = DRAGON_DEX[key].rarity; 
                break; 
            }
        }
    }
    if (candidates.length === 0) candidates.push({ name: "불도마뱀", type: "fire", rarity: "common", desc: "기본 용", id: "fire_c1" });
    
    const resultDragon = candidates[Math.floor(Math.random() * candidates.length)];
    const isShiny = Math.random() < (isShinyEgg ? 0.2 : 0.05);

    player.myDragons.push({
        uId: generateUID(), 
        id: resultDragon.id,
        type: resultDragon.type,
        isShiny: isShiny,
        rarity: rarity,
        stage: 0, 
        clicks: 0, 
        name: resultDragon.name 
    });
    
    if(!player.maxStages) player.maxStages = {};
    if(typeof player.maxStages[resultDragon.id] === 'undefined') {
        player.maxStages[resultDragon.id] = 0;
    }

    // 새 드래곤 선택
    player.currentDragonIndex = player.myDragons.length - 1;

    syncBookData(); // 도감 동기화
    if(window.renderCaveUI) window.renderCaveUI();
    if(window.saveGame) window.saveGame();
}

// 전역 노출 필수
window.hatchEggInternal = hatchEggInternal;
