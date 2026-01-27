// ==========================================
// js/hatchery.js (알의 정체 숨김 및 나중에 도감 등록)
// ==========================================

const dragonDisplay = document.getElementById('dragon-display');
const progressBar = document.getElementById('progress-fill');
const dragonNameUI = document.getElementById('dragon-name-ui');
const eggListArea = document.getElementById('my-egg-list');

const EGG_TYPE_NAMES = {
    "fire": "불타는 알",
    "water": "촉촉한 알",
    "forest": "싱그러운 알",
    "electric": "찌릿한 알",
    "metal": "단단한 알",
    "light": "찬란한 알",
    "dark": "불길한 알",
    "random": "미지의 알"
};

function updateCaveUI() {
    renderEggList();     
    renderNest();        
    renderCaveInventory(); 
    renderUpgradeBtn(); 
}

function renderCaveInventory() {
    const grid = document.getElementById('cave-inventory-grid');
    if(!grid) return;
    grid.innerHTML = "";
    if(!player.inventory) player.inventory = {};
    const itemIds = Object.keys(player.inventory);
    let hasItem = false;
    itemIds.forEach(id => {
        if(player.inventory[id] > 0) {
            const item = ITEM_DB[id];
            if(item && item.type !== 'equip') {
                hasItem = true;
                const div = document.createElement('div');
                div.className = 'slot-item';
                div.onclick = () => useItem(id); 
                div.innerHTML = `<img src="${item.img}" class="item-img-lg" onerror="this.src='assets/images/ui/icon_question.png'"><span style="position:absolute; bottom:2px; right:2px; font-size:0.7rem;">x${player.inventory[id]}</span>`;
                grid.appendChild(div);
            }
        }
    });
    if(!hasItem) grid.innerHTML = "<p style='grid-column:span 4; text-align:center; color:#888; font-size:0.8rem;'>아이템 없음</p>";
}

function renderUpgradeBtn() {
    const nestPanel = document.querySelector('.nest-panel');
    let upgradeBtn = document.getElementById('btn-upgrade-nest');
    if (!upgradeBtn) {
        upgradeBtn = document.createElement('button');
        upgradeBtn.id = 'btn-upgrade-nest';
        upgradeBtn.className = 'btn-stone';
        upgradeBtn.style.marginTop = '10px';
        upgradeBtn.style.fontSize = '0.9rem';
        upgradeBtn.onclick = () => { if(window.upgradeNest) window.upgradeNest(); }; 
        nestPanel.appendChild(upgradeBtn);
    }
    const currentLv = player.nestLevel || 0;
    if (currentLv < NEST_UPGRADE_COST.length) {
        const cost = NEST_UPGRADE_COST[currentLv];
        upgradeBtn.innerHTML = `<img src="assets/images/item/material_wood.png" style="width:18px; vertical-align:middle"> 강화 (${cost})`;
    } else {
        upgradeBtn.innerHTML = "MAX LV";
        upgradeBtn.style.opacity = 0.6;
    }
}

function renderNest() {
    const dragonData = player.myDragons[player.currentDragonIndex];
    if (!dragonData) return;

    let displayStage = DRAGON_DATA.stages[dragonData.stage];
    let displayName = dragonData.name;

    // [수정] 알 단계에서는 정체를 숨김
    if (dragonData.stage === 0) {
        displayName = EGG_TYPE_NAMES[dragonData.type] || "미확인 알";
        displayStage = "알";
        dragonNameUI.innerText = `${displayName} (${displayStage})`;
    } else {
        // 부화 후 정상 표시
        dragonNameUI.innerText = `${displayName} (${displayStage})`;
    }

    const max = DRAGON_DATA.reqClicks[dragonData.stage] || 9999;
    let maxLevelLimit = 4; 
    const isHighTier = (dragonData.rarity === 'epic' || dragonData.rarity === 'legend');
    if (!isHighTier) maxLevelLimit = 3; 

    const isMaxLevel = dragonData.stage >= maxLevelLimit;
    
    let percent = 0;
    if (isMaxLevel) {
        percent = 100;
        if(!isHighTier && dragonData.stage === 3) {
             dragonNameUI.innerText += " (MAX)";
        }
    } else {
        percent = (dragonData.clicks / max) * 100;
    }
    if(progressBar) progressBar.style.width = `${percent}%`;

    let imgSrc = "assets/images/dragon/stage_egg.png"; 
    if (window.getDragonImage) {
        imgSrc = window.getDragonImage(dragonData.id, dragonData.stage);
    }

    dragonDisplay.innerHTML = `<img src="${imgSrc}" class="main-dragon-img" 
        onerror="handleImgError(this, '${dragonData.type}', ${dragonData.stage})">`;
    
    const imgEl = dragonDisplay.querySelector('img');
    if(dragonData.isShiny && imgEl) {
        imgEl.style.filter = "hue-rotate(150deg) brightness(1.2) drop-shadow(0 0 5px #f1c40f)";
    }

    if(imgEl && !isMaxLevel) {
        imgEl.style.cursor = "pointer";
        imgEl.onclick = () => handleDragonClick(dragonData, imgEl);
    } else if (imgEl && isMaxLevel) {
        imgEl.style.cursor = "default";
        imgEl.onclick = () => showAlert("이 용은 더 이상 성장할 수 없습니다.");
    }
}

function handleDragonClick(dragon, imgEl) {
    imgEl.classList.remove('click-anim');
    void imgEl.offsetWidth; 
    imgEl.classList.add('click-anim');

    let maxLevelLimit = 4; 
    const isHighTier = (dragon.rarity === 'epic' || dragon.rarity === 'legend');
    if (!isHighTier) maxLevelLimit = 3; 

    if (dragon.stage >= maxLevelLimit) return; 

    const max = DRAGON_DATA.reqClicks[dragon.stage];
    const clickPower = 1 + (player.nestLevel || 0);
    dragon.clicks += clickPower;
    
    const percent = Math.min(100, (dragon.clicks / max) * 100);
    if(progressBar) progressBar.style.width = `${percent}%`;

    if (dragon.clicks >= max) {
        const oldStage = dragon.stage;
        dragon.stage++;
        dragon.clicks = 0;
        
        // [핵심 수정] 알(0) -> 유아기(1)로 넘어갈 때 도감 등록!
        if (oldStage === 0 && dragon.stage === 1) {
            if(!player.discovered) player.discovered = [];
            if(!player.discovered.includes(dragon.id)) {
                player.discovered.push(dragon.id);
            }
            showAlert(`
                <div style="text-align:center;">
                    <h3>🐣 부화 성공!</h3>
                    <br>알을 깨고 <b style="color:${RARITY_DATA[dragon.rarity].color}">${dragon.name}</b>이(가) 태어났습니다!
                    <br><span style="font-size:0.8rem; color:#aaa;">(도감에 등록되었습니다)</span>
                </div>
            `);
        }

        if(!player.maxStages) player.maxStages = {};
        if(!player.maxStages[dragon.id] || player.maxStages[dragon.id] < dragon.stage) {
            player.maxStages[dragon.id] = dragon.stage;
        }

        const xpReward = [0, 50, 100, 300, 1000];
        const gain = xpReward[dragon.stage] || 50;
        
        if(window.gainExp) window.gainExp(gain);
        renderNest(); 
        
        // 부화가 아닐 때만 일반 성장 메시지
        if (oldStage !== 0) {
            let evolvedImg = "assets/images/dragon/stage_adult.png";
            if(window.getDragonImage) evolvedImg = window.getDragonImage(dragon.id, dragon.stage);

            showAlert(`
                <div style="text-align:center;">
                    <img src="${evolvedImg}" style="width:100px;" onerror="handleImgError(this, '${dragon.type}', ${dragon.stage})"><br>
                    ✨ 축하합니다!<br>[${dragon.name}]이(가) 성장했습니다!<br>
                    <b style="color:#2ecc71">(경험치 +${gain})</b>
                </div>
            `);
        }
        
        if(window.saveGame) window.saveGame();
    }
}

function renderEggList() {
    if(!eggListArea) return;
    eggListArea.innerHTML = "";
    
    player.myDragons.forEach((dragon, index) => {
        const div = document.createElement('div');
        div.style.marginBottom = "5px"; div.style.padding = "5px";
        div.style.background = index === player.currentDragonIndex ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
        div.style.borderRadius = "5px"; div.style.cursor = "pointer"; div.style.textAlign = "center";
        div.style.border = index === player.currentDragonIndex ? "2px solid #ffd700" : "1px solid #5d4a6d";
        
        let iconSrc = "assets/images/dragon/stage_egg.png";
        if(window.getDragonImage) iconSrc = window.getDragonImage(dragon.id, dragon.stage);

        let listName = dragon.name;
        // 목록에서도 알이면 숨김
        if(dragon.stage === 0) listName = EGG_TYPE_NAMES[dragon.type] || "미확인 알";

        div.innerHTML = `
            <img src="${iconSrc}" class="list-egg-img" onerror="handleImgError(this, '${dragon.type}', ${dragon.stage})"><br>
            <span style="font-size:0.7rem">${listName}</span>
        `;
        div.onclick = () => {
            player.currentDragonIndex = index;
            renderEggList(); renderNest();
        };
        eggListArea.appendChild(div);
    });
}

// [수정] 룰렛 없이 바로 용 데이터 생성 (UI 없음, 내부 로직만 존재)
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

    // [중요] 도감(player.discovered)에 등록하지 않음!
    // 0단계(알) 상태로 myDragons에만 추가
    player.myDragons.push({
        uId: Date.now(), 
        id: resultDragon.id,
        type: resultDragon.type,
        isShiny: isShiny,
        rarity: rarity,
        stage: 0, 
        clicks: 0, 
        name: resultDragon.name 
    });
    
    // 알 이미지 캐싱용 0단계 등록은 필요할 수 있음
    if(!player.maxStages) player.maxStages = {};
    if(typeof player.maxStages[resultDragon.id] === 'undefined') {
        player.maxStages[resultDragon.id] = 0;
    }

    updateCaveUI();
    if(window.saveGame) window.saveGame();
}

// 룰렛 관련 함수는 이제 사용 안하므로 window 객체 할당만 유지 (호환성)
window.updateUI = updateCaveUI; 
window.hatchEggInternal = hatchEggInternal;
