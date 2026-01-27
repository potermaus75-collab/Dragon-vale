// ==========================================
// js/hatchery.js (터치 성장 및 동굴 가방 추가)
// ==========================================

const dragonDisplay = document.getElementById('dragon-display');
const progressBar = document.getElementById('progress-fill');
const dragonNameUI = document.getElementById('dragon-name-ui');
const eggListArea = document.getElementById('my-egg-list');
// clickMsgBtn 변수는 더 이상 사용하지 않으므로 삭제해도 되지만, 오류 방지 차원에서 null 체크용으로 둡니다.
const clickMsgBtn = document.getElementById('click-msg'); 

const EGG_TYPE_NAMES = {
    "fire": "불타는 알",
    "water": "촉촉한 알",
    "forest": "싱그러운 알",
    "electric": "찌릿한 알",
    "metal": "단단한 알"
};

function updateCaveUI() {
    renderEggList();     
    renderNest();        
    // updateEquipmentUI(); // 동굴에서는 장비창 제외
    renderCaveInventory(); // [신규] 동굴 가방
    renderUpgradeBtn(); 
}

// [신규] 동굴 전용 인벤토리 (장비 제외: 알, 재료, 물약 등)
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
            // 장비(equip)가 아닌 것들만 표시
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
    
    // 클릭 가능 여부 판단
    const isMaxLevel = dragonData.stage >= DRAGON_DATA.stages.length - 1;
    
    // 게이지 업데이트
    let percent = 0;
    if (isMaxLevel) {
        percent = 100;
    } else {
        percent = (dragonData.clicks / max) * 100;
    }
    if(progressBar) progressBar.style.width = `${percent}%`;

    // 이미지 렌더링
    let imgSrc = "assets/images/dragon/stage_egg.png"; 
    if (window.getDragonImage) {
        imgSrc = window.getDragonImage(dragonData.id, dragonData.stage);
    }

    // 이미지를 새로 그릴 때마다 이벤트 핸들러 연결
    dragonDisplay.innerHTML = `<img src="${imgSrc}" class="main-dragon-img">`;
    
    const imgEl = dragonDisplay.querySelector('img');
    if(dragonData.isShiny && imgEl) {
        imgEl.style.filter = "hue-rotate(150deg) brightness(1.2) drop-shadow(0 0 5px #f1c40f)";
    }

    // [핵심] 이미지 클릭 시 성장 로직 실행
    if(imgEl && !isMaxLevel) {
        imgEl.style.cursor = "pointer";
        // 모바일 터치 반응 개선을 위해 onclick 사용
        imgEl.onclick = () => handleDragonClick(dragonData, imgEl);
    }
}

// [신규] 용 클릭 핸들러 (기존 버튼 로직 이동)
function handleDragonClick(dragon, imgEl) {
    // 클릭 애니메이션 (CSS 클래스 활용)
    imgEl.classList.remove('click-anim');
    void imgEl.offsetWidth; // 리플로우 강제 (애니메이션 리셋용)
    imgEl.classList.add('click-anim');

    const max = DRAGON_DATA.reqClicks[dragon.stage];
    
    // 성장 로직
    const clickPower = 1 + (player.nestLevel || 0);
    dragon.clicks += clickPower;
    
    // 게이지 즉시 업데이트 (부드러운 반응)
    const percent = Math.min(100, (dragon.clicks / max) * 100);
    if(progressBar) progressBar.style.width = `${percent}%`;

    if (dragon.clicks >= max) {
        dragon.stage++;
        dragon.clicks = 0;
        
        // 도감 갱신
        if(!player.maxStages) player.maxStages = {};
        if(!player.maxStages[dragon.id] || player.maxStages[dragon.id] < dragon.stage) {
            player.maxStages[dragon.id] = dragon.stage;
        }

        const xpReward = [0, 50, 100, 300, 1000];
        const gain = xpReward[dragon.stage] || 50;
        
        if(window.gainExp) window.gainExp(gain);

        renderNest(); // 이미지 변경을 위해 재렌더링
        
        let evolvedImg = "assets/images/dragon/stage_adult.png";
        if(window.getDragonImage) evolvedImg = window.getDragonImage(dragon.id, dragon.stage);

        showAlert(`
            <div style="text-align:center;">
                <img src="${evolvedImg}" style="width:100px;"><br>
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

        div.innerHTML = `
            <img src="${iconSrc}" class="list-egg-img"><br>
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

// 룰렛 로직 (기존 유지 + 안전장치)
let rouletteInterval;
let rouletteTimeout;

function startEggRoulette(isShinyEgg = false) { 
    document.getElementById('roulette-modal').classList.remove('hidden');
    document.getElementById('roulette-modal').classList.add('active');
    
    const display = document.getElementById('roulette-display');
    const candidates = [
        "assets/images/dragon/egg_fire.png",
        "assets/images/dragon/egg_water.png",
        "assets/images/dragon/egg_forest.png"
    ];
    
    if(rouletteInterval) clearInterval(rouletteInterval);
    if(rouletteTimeout) clearTimeout(rouletteTimeout);

    rouletteInterval = setInterval(() => {
        const randImg = candidates[Math.floor(Math.random() * candidates.length)];
        display.innerHTML = `<img src="${randImg}" style="width:100px; height:100px;">`;
    }, 100);
    
    rouletteTimeout = setTimeout(() => stopRoulette(isShinyEgg), 3000);
}

function stopRoulette(isShinyEgg) {
    if(rouletteTimeout) clearTimeout(rouletteTimeout);
    if(rouletteInterval) clearInterval(rouletteInterval);
    
    const rand = Math.random() * 100;
    let rarity = 'common';
    const bonus = isShinyEgg ? 20 : 0; 

    if (rand < RARITY_DATA.legend.prob + (isShinyEgg ? 2 : 0)) rarity = 'legend';
    else if (rand < RARITY_DATA.epic.prob + (isShinyEgg ? 5 : 0)) rarity = 'epic';
    else if (rand < RARITY_DATA.heroic.prob + bonus) rarity = 'heroic';
    else if (rand < RARITY_DATA.rare.prob + bonus) rarity = 'rare';
    else rarity = 'common';

    const candidates = [];
    if(typeof DRAGON_DEX !== 'undefined') {
        for (const key in DRAGON_DEX) {
            if (DRAGON_DEX[key].rarity === rarity) {
                candidates.push({ ...DRAGON_DEX[key], id: key });
            }
        }
    }

    if (candidates.length === 0) candidates.push({ name: "불도마뱀", type: "fire", rarity: "common", desc: "기본 용", id: "fire_c1" });
    
    const resultDragon = candidates[Math.floor(Math.random() * candidates.length)];
    const isShiny = Math.random() < (isShinyEgg ? 0.2 : 0.05);

    let resultImg = "assets/images/dragon/egg_fire.png";
    if(window.getDragonImage) resultImg = window.getDragonImage(resultDragon.id, 0); 

    const shinyStyle = isShiny ? 'filter:hue-rotate(150deg) brightness(1.2);' : '';
    document.getElementById('roulette-display').innerHTML = `
        <div style="text-align:center">
            <img src="${resultImg}" style="width:100px; height:100px; ${shinyStyle}"><br>
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
            <span style="font-size:0.8rem; color:#aaa;">정성껏 보살펴주세요.</span>
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

function updateEquipmentUI() {
    const slots = ['head', 'body', 'arm', 'leg'];
    slots.forEach(slot => {
        const el = document.querySelector(`.equip-slot.${slot}`);
        if(!el) return;
        el.innerHTML = "";
        
        const itemId = player.equipment[slot];
        if (itemId && ITEM_DB[itemId]) {
            el.innerHTML = `<img src="${ITEM_DB[itemId].img}" class="equip-icon">`;
            el.style.border = "none"; 
        } else {
            const slotNames = {head:'머리', body:'갑옷', arm:'무기', leg:'신발'};
            el.innerHTML = `<span style="font-size:0.8rem; text-shadow:1px 1px 2px #000;">${slotNames[slot]}</span>`;
        }
    });
}

window.updateUI = updateCaveUI; 
window.startEggRoulette = startEggRoulette;
window.stopRoulette = stopRoulette;
