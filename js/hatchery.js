// ==========================================
// js/hatchery.js (CSS 드래곤 폴백 적용)
// ==========================================

const dragonDisplay = document.getElementById('dragon-display');
const progressBar = document.getElementById('progress-fill');
const dragonNameUI = document.getElementById('dragon-name-ui');
const eggListArea = document.getElementById('my-egg-list');

// 알 이름 매핑
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

// 동굴 전용 인벤토리
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
    
    if(!hasItem) {
        grid.innerHTML = "<p style='grid-column:span 4; text-align:center; color:#888; font-size:0.8rem;'>아이템 없음</p>";
    }
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

    let displayName = dragonData.name;
    let displayStage = DRAGON_DATA.stages[dragonData.stage];
    
    if (dragonData.stage === 0) {
        displayName = EGG_TYPE_NAMES[dragonData.type] || "미지의 알";
    }

    dragonNameUI.innerText = `${displayName} (${displayStage})`;

    const max = DRAGON_DATA.reqClicks[dragonData.stage] || 9999;
    
    // 성장 한계 체크 
    let maxLevelLimit = 4; // 기본 고룡
    const isHighTier = (dragonData.rarity === 'epic' || dragonData.rarity === 'legend');
    if (!isHighTier) maxLevelLimit = 3; // 성룡

    const isMaxLevel = dragonData.stage >= maxLevelLimit;
    
    let percent = 0;
    if (isMaxLevel) {
        percent = 100;
        if(!isHighTier && dragonData.stage === 3) {
             displayStage += " (MAX)";
             dragonNameUI.innerText = `${displayName} (${displayStage})`;
        }
    } else {
        percent = (dragonData.clicks / max) * 100;
    }
    if(progressBar) progressBar.style.width = `${percent}%`;

    let imgSrc = "assets/images/dragon/stage_egg.png"; 
    if (window.getDragonImage) {
        imgSrc = window.getDragonImage(dragonData.id, dragonData.stage);
    }

    // [수정] onerror 적용
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
        imgEl.onclick = () => showAlert("이 용은 더 이상 성장할 수 없습니다.<br>(일반~서사 등급은 성룡까지만 성장)");
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
        dragon.stage++;
        dragon.clicks = 0;
        
        if(!player.maxStages) player.maxStages = {};
        if(!player.maxStages[dragon.id] || player.maxStages[dragon.id] < dragon.stage) {
            player.maxStages[dragon.id] = dragon.stage;
        }

        const xpReward = [0, 50, 100, 300, 1000];
        const gain = xpReward[dragon.stage] || 50;
        
        if(window.gainExp) window.gainExp(gain);

        renderNest(); 
        
        let evolvedImg = "assets/images/dragon/stage_adult.png";
        if(window.getDragonImage) evolvedImg = window.getDragonImage(dragon.id, dragon.stage);

        showAlert(`
            <div style="text-align:center;">
                <img src="${evolvedImg}" style="width:100px;" onerror="handleImgError(this, '${dragon.type}', ${dragon.stage})"><br>
                ✨ 축하합니다!<br>[${dragon.name}]이(가) 성장했습니다!<br>
                <b style="color:#2ecc71">(경험치 +${gain})</b>
            </div>
        `);
        
        if(window.saveGame) window.saveGame();
    }
}

function renderEggList() {
    if(!eggListArea) return;
    eggListArea.innerHTML = "";
    
    player.myDragons.forEach((dragon, index) => {
        const div = document.createElement('div');
        div.style.marginBottom = "5px";
        div.style.padding = "5px";
        div.style.background = index === player.currentDragonIndex ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
        div.style.borderRadius = "5px";
        div.style.cursor = "pointer";
        div.style.textAlign = "center";
        div.style.border = index === player.currentDragonIndex ? "2px solid #ffd700" : "1px solid #5d4a6d";
        
        let iconSrc = "assets/images/dragon/stage_egg.png";
        if(window.getDragonImage) {
             iconSrc = window.getDragonImage(dragon.id, dragon.stage);
        }

        let listName = dragon.name;
        if(dragon.stage === 0) {
            listName = EGG_TYPE_NAMES[dragon.type] || "알";
        }

        // [수정] onerror 적용
        div.innerHTML = `
            <img src="${iconSrc}" class="list-egg-img" onerror="handleImgError(this, '${dragon.type}', ${dragon.stage})"><br>
            <span style="font-size:0.7rem">${listName}</span>
        `;
        
        div.onclick = () => {
            player.currentDragonIndex = index;
            renderEggList();
            renderNest();
        };
        eggListArea.appendChild(div);
    });
}

// 룰렛 로직
let rouletteInterval;
let rouletteTimeout;
let currentTargetType = null; 

function startEggRoulette(isShinyEgg = false, targetType = null) { 
    currentTargetType = targetType; 
    document.getElementById('roulette-modal').classList.remove('hidden');
    document.getElementById('roulette-modal').classList.add('active');
    
    const display = document.getElementById('roulette-display');
    
    let candidates = [
        "assets/images/dragon/egg_fire.png", "assets/images/dragon/egg_water.png", 
        "assets/images/dragon/egg_forest.png", "assets/images/dragon/egg_electric.png",
        "assets/images/dragon/egg_metal.png", "assets/images/dragon/egg_light.png",
        "assets/images/dragon/egg_dark.png"
    ];

    if (targetType && EGG_TYPE_NAMES[targetType]) {
        candidates = [`assets/images/dragon/egg_${targetType}.png`];
    }
    
    if(rouletteInterval) clearInterval(rouletteInterval);
    if(rouletteTimeout) clearTimeout(rouletteTimeout);

    rouletteInterval = setInterval(() => {
        const randImg = candidates[Math.floor(Math.random() * candidates.length)];
        // 룰렛 도는 중에는 onerror 처리를 굳이 안 하거나, 랜덤 타입을 넣어줄 수 있음. 
        // 여기선 단순화를 위해 생략하거나 기본 알 이미지 사용 가능.
        display.innerHTML = `<img src="${randImg}" style="width:100px; height:100px;" onerror="this.src='assets/images/dragon/stage_egg.png'">`;
    }, 100);
    
    rouletteTimeout = setTimeout(() => stopRoulette(isShinyEgg), 3000);
}

function stopRoulette(isShinyEgg) {
    if(rouletteTimeout) clearTimeout(rouletteTimeout);
    if(rouletteInterval) clearInterval(rouletteInterval);
    
    const lv = player.level || 1;
    const bonusProb = lv * 0.05; 

    let pLegend = RARITY_DATA.legend.prob + (bonusProb * 0.5); 
    let pEpic = RARITY_DATA.epic.prob + bonusProb;
    let pHeroic = RARITY_DATA.heroic.prob;
    let pRare = RARITY_DATA.rare.prob;
    
    if(isShinyEgg) {
        pLegend += 2; pEpic += 5; pHeroic += 20;
    }

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
                if (currentTargetType) {
                    if (dragon.type === currentTargetType) candidates.push({ ...dragon, id: key });
                } else {
                    candidates.push({ ...dragon, id: key });
                }
            }
        }
    }

    if (candidates.length === 0 && currentTargetType) {
        for (const key in DRAGON_DEX) {
            if (DRAGON_DEX[key].type === currentTargetType) {
                candidates.push({ ...DRAGON_DEX[key], id: key });
                rarity = DRAGON_DEX[key].rarity; 
                break; 
            }
        }
    }

    if (candidates.length === 0) candidates.push({ name: "불도마뱀", type: "fire", rarity: "common", desc: "기본 용", id: "fire_c1" });
    
    const resultDragon = candidates[Math.floor(Math.random() * candidates.length)];
    const isShiny = Math.random() < (isShinyEgg ? 0.2 : 0.05);

    let resultImg = "assets/images/dragon/egg_fire.png";
    if(window.getDragonImage) resultImg = window.getDragonImage(resultDragon.id, 0); 

    const shinyStyle = isShiny ? 'filter:hue-rotate(150deg) brightness(1.2);' : '';
    
    // [수정] 결과창에도 onerror 적용 (알이므로 stage 0)
    document.getElementById('roulette-display').innerHTML = `
        <div style="text-align:center">
            <img src="${resultImg}" style="width:100px; height:100px; ${shinyStyle}"
             onerror="handleImgError(this, '${resultDragon.type}', 0)">
            <br>
            <b style="color:${RARITY_DATA[rarity].color}">알을 획득했습니다!</b>
        </div>
    `;
    
    setTimeout(() => {
        if(!player.discovered) player.discovered = [];
        if(!player.discovered.includes(resultDragon.id)) {
            player.discovered.push(resultDragon.id);
        }

        if(!player.maxStages) player.maxStages = {};
        if(typeof player.maxStages[resultDragon.id] === 'undefined') {
            player.maxStages[resultDragon.id] = 0;
        }

        const shinyText = isShiny ? "<br><b style='color:#ff00ff'>✨ 신비한 기운이 느껴집니다! ✨</b>" : "";
        const eggName = EGG_TYPE_NAMES[resultDragon.type] || "알";

        showAlert(`
            <b style="color:${RARITY_DATA[rarity].color} font-size:1.2rem;">[${eggName}] 획득!</b>
            ${shinyText}<br>
            <span style="font-size:0.8rem; color:#aaa;">${resultDragon.name} (${RARITY_DATA[rarity].name})</span>
        `, () => {
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
            document.getElementById('roulette-modal').classList.add('hidden');
            document.getElementById('roulette-modal').classList.remove('active');
            updateCaveUI();
            if(window.saveGame) window.saveGame();
        });
    }, 1000);
}

window.updateUI = updateCaveUI; 
window.startEggRoulette = startEggRoulette;
window.stopRoulette = stopRoulette;
