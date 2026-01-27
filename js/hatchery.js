// ==========================================
// js/hatchery.js (경험치 보상 & 이미지 매핑 적용)
// ==========================================

// DOM 요소
const dragonDisplay = document.getElementById('dragon-display');
const progressBar = document.getElementById('progress-fill');
const dragonNameUI = document.getElementById('dragon-name-ui');
const eggListArea = document.getElementById('my-egg-list');
const clickMsgBtn = document.getElementById('click-msg'); 

// 화면 갱신 통합 함수
function updateCaveUI() {
    renderEggList();     
    renderNest();        
    updateEquipmentUI(); 
    renderUpgradeBtn(); 
}

// 둥지 강화 버튼 렌더링
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

// 둥지(메인 용) 렌더링
function renderNest() {
    const dragonData = player.myDragons[player.currentDragonIndex];
    if (!dragonData) return;

    // 이름 표시
    const stageName = DRAGON_DATA.stages[dragonData.stage];
    dragonNameUI.innerText = `${dragonData.name} (${stageName})`;

    // 게이지바 로직
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

    // [핵심 수정] 이미지 매핑 적용
    // dragon.js에 있는 getDragonImage 함수를 사용, 없으면 기본 배열 사용
    let imgSrc = "assets/images/dragon/stage_egg.png"; 
    
    if (window.getDragonImage) {
        imgSrc = window.getDragonImage(dragonData.id, dragonData.stage);
    } else if (DRAGON_DATA.stageImages && DRAGON_DATA.stageImages[dragonData.stage]) {
        // dragon.js가 아직 업데이트 안 되었을 경우의 예비책
        imgSrc = DRAGON_DATA.stageImages[dragonData.stage];
    }

    dragonDisplay.innerHTML = `<img src="${imgSrc}" class="main-dragon-img">`;
    
    // 이로치 효과
    const imgEl = dragonDisplay.querySelector('img');
    if(dragonData.isShiny && imgEl) {
        imgEl.style.filter = "hue-rotate(150deg) brightness(1.2) drop-shadow(0 0 5px #f1c40f)";
    }
}

// 보유한 용 리스트 렌더링
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
        
        // 리스트 아이콘은 알 이미지 또는 현재 단계 이미지
        let iconSrc = "assets/images/dragon/stage_egg.png";
        if(window.getDragonImage) {
             // 리스트에는 항상 알이나 유아기 등 작은 이미지를 보여줄 수도 있음
             // 여기서는 현재 단계 이미지를 작게 보여줌
             iconSrc = window.getDragonImage(dragon.id, dragon.stage);
        }

        div.innerHTML = `
            <img src="${iconSrc}" class="list-egg-img"><br>
            <span style="font-size:0.7rem">${dragon.name}</span>
        `;
        
        div.onclick = () => {
            player.currentDragonIndex = index;
            renderEggList();
            renderNest();
        };
        eggListArea.appendChild(div);
    });
}

// 마력 주입 버튼 클릭 이벤트
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
                
                // [신규] 성장 시 플레이어 경험치 획득
                // (단계별 보상: 1->2: 50xp, 2->3: 100xp, 3->4: 300xp, 4->5: 1000xp)
                const xpReward = [0, 50, 100, 300, 1000];
                const gain = xpReward[dragon.stage] || 50;
                
                if(window.gainExp) window.gainExp(gain);

                renderNest(); 
                
                // 이미지도 갱신된 상태로 알림창 표시
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

// 룰렛 로직
let rouletteInterval;
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
    rouletteInterval = setInterval(() => {
        const randImg = candidates[Math.floor(Math.random() * candidates.length)];
        display.innerHTML = `<img src="${randImg}" style="width:100px; height:100px;">`;
    }, 100);
    
    setTimeout(() => stopRoulette(isShinyEgg), 3000);
}

function stopRoulette(isShinyEgg) {
    clearInterval(rouletteInterval);
    
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

    // 결과 화면에 베이비 이미지 보여주기
    let resultImg = "assets/images/dragon/stage_baby.png";
    if(window.getDragonImage) resultImg = window.getDragonImage(resultDragon.id, 1); // 1=baby

    const shinyStyle = isShiny ? 'filter:hue-rotate(150deg) brightness(1.2);' : '';
    document.getElementById('roulette-display').innerHTML = `
        <div style="text-align:center">
            <img src="${resultImg}" style="width:100px; height:100px; ${shinyStyle}"><br>
            <b style="color:${RARITY_DATA[rarity].color}">${RARITY_DATA[rarity].name}</b>
        </div>
    `;
    
    setTimeout(() => {
        if(!player.discovered) player.discovered = [];
        let isNew = false;
        if(!player.discovered.includes(resultDragon.id)) {
            player.discovered.push(resultDragon.id);
            isNew = true;
        }

        const shinyText = isShiny ? "<br><b style='color:#ff00ff'>✨ 색이 다른(이로치) 용입니다! ✨</b>" : "";
        const newText = isNew ? "<br>(도감에 새로 등록되었습니다!)" : "";

        showAlert(`
            <b style="color:${RARITY_DATA[rarity].color} font-size:1.2rem;">[${resultDragon.name}] 획득!</b>
            ${shinyText}${newText}<br>
            <span style="font-size:0.8rem; color:#aaa;">${resultDragon.desc}</span>
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
