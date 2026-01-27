// ==========================================
// js/hatchery.js (알 이름 숨김 & 룰렛 버그 수정)
// ==========================================

const dragonDisplay = document.getElementById('dragon-display');
const progressBar = document.getElementById('progress-fill');
const dragonNameUI = document.getElementById('dragon-name-ui');
const eggListArea = document.getElementById('my-egg-list');
const clickMsgBtn = document.getElementById('click-msg'); 

// [신규] 알 이름 매핑 (속성별 가명)
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
    updateEquipmentUI(); 
    renderUpgradeBtn(); 
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

    // [수정] 0단계(알)일 때는 진짜 이름 숨기기
    let displayName = dragonData.name;
    let displayStage = DRAGON_DATA.stages[dragonData.stage];
    
    if (dragonData.stage === 0) {
        displayName = EGG_TYPE_NAMES[dragonData.type] || "미지의 알";
    }

    dragonNameUI.innerText = `${displayName} (${displayStage})`;

    const max = DRAGON_DATA.reqClicks[dragonData.stage] || 9999;
    let percent = 0;
    
    if (dragonData.stage >= DRAGON_DATA.stages.length - 1) {
        percent = 100;
        clickMsgBtn.innerText = "성장 완료";
        clickMsgBtn.disabled = true; 
        clickMsgBtn.style.opacity = 0.5;
    } else {
        percent = (dragonData.clicks / max) * 100;
        clickMsgBtn.innerText = "마력 주입";
        clickMsgBtn.disabled = false;
        clickMsgBtn.style.opacity = 1;
    }
    
    if(progressBar) progressBar.style.width = `${percent}%`;

    let imgSrc = "assets/images/dragon/stage_egg.png"; 
    if (window.getDragonImage) {
        imgSrc = window.getDragonImage(dragonData.id, dragonData.stage);
    }

    dragonDisplay.innerHTML = `<img src="${imgSrc}" class="main-dragon-img">`;
    
    const imgEl = dragonDisplay.querySelector('img');
    if(dragonData.isShiny && imgEl) {
        imgEl.style.filter = "hue-rotate(150deg) brightness(1.2) drop-shadow(0 0 5px #f1c40f)";
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

        // [수정] 리스트에서도 알 이름 숨기기
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

if(clickMsgBtn) {
    clickMsgBtn.addEventListener('click', () => {
        const dragon = player.myDragons[player.currentDragonIndex];
        if (!dragon) return;

        const max = DRAGON_DATA.reqClicks[dragon.stage];
        
        if (dragon.stage < DRAGON_DATA.stages.length - 1) {
            const clickPower = 1 + (player.nestLevel || 0);
            dragon.clicks += clickPower;
            
            if (dragon.clicks >= max) {
                dragon.stage++;
                dragon.clicks = 0;
                
                // 도감에 최대 성장 단계 기록 갱신 (player.js의 데이터)
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
                        <img src="${evolvedImg}" style="width:100px;"><br>
                        ✨ 축하합니다!<br>[${dragon.name}]이(가) 성장했습니다!<br>
                        <b style="color:#2ecc71">(경험치 +${gain})</b>
                    </div>
                `);
                
                if(window.saveGame) window.saveGame();
            } else {
                renderNest();
            }
        } else {
            showAlert("더 이상 성장할 수 없습니다. (최대 레벨)");
        }
    });
}

// [수정] 룰렛 버그 수정 (중복 실행 방지)
let rouletteInterval;
let rouletteTimeout; // [추가] 타임아웃 ID 저장용

function startEggRoulette(isShinyEgg = false) { 
    document.getElementById('roulette-modal').classList.remove('hidden');
    document.getElementById('roulette-modal').classList.add('active');
    
    const display = document.getElementById('roulette-display');
    const candidates = [
        "assets/images/element/element_fire.png",
        "assets/images/element/element_water.png",
        "assets/images/element/element_forest.png"
    ];
    
    if(rouletteInterval) clearInterval(rouletteInterval);
    if(rouletteTimeout) clearTimeout(rouletteTimeout); // [추가] 기존 타임아웃 제거

    rouletteInterval = setInterval(() => {
        const randImg = candidates[Math.floor(Math.random() * candidates.length)];
        display.innerHTML = `<img src="${randImg}" style="width:100px; height:100px;">`;
    }, 100);
    
    // [추가] 타임아웃 ID 저장
    rouletteTimeout = setTimeout(() => stopRoulette(isShinyEgg), 3000);
}

function stopRoulette(isShinyEgg) {
    // [핵심] 타임아웃과 인터벌 모두 정리하여 중복 실행 원천 차단
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

    // 결과 화면: 0단계(알) 이미지를 보여주기
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
        let isNew = false;
        if(!player.discovered.includes(resultDragon.id)) {
            player.discovered.push(resultDragon.id);
            isNew = true;
        }

        // [신규] 획득 시 maxStages에 0단계 등록
        if(!player.maxStages) player.maxStages = {};
        if(typeof player.maxStages[resultDragon.id] === 'undefined') {
            player.maxStages[resultDragon.id] = 0;
        }

        const shinyText = isShiny ? "<br><b style='color:#ff00ff'>✨ 신비한 기운이 느껴집니다! ✨</b>" : "";
        
        // 이름 대신 속성 알 이름 표시
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
