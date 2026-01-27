// ==========================================
// js/hatchery.js (완전한 코드)
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
    renderUpgradeBtn(); // [신규] 강화 버튼 렌더링
}

// [신규] 둥지 강화 버튼 생성
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

    // 이미지 표시
    let imgSrc = "assets/images/dragon/stage_egg.png"; 
    if (DRAGON_DATA.stageImages && DRAGON_DATA.stageImages[dragonData.stage]) {
        imgSrc = DRAGON_DATA.stageImages[dragonData.stage];
    }

    dragonDisplay.innerHTML = `<img src="${imgSrc}" class="main-dragon-img">`;
    
    // 이로치(Shiny) 효과 (이미지에 필터 적용)
    const imgEl = dragonDisplay.querySelector('img');
    if(dragonData.isShiny && imgEl) {
        // 색조 변경 및 밝기 조절로 '다른 색' 표현
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
        
        div.innerHTML = `
            <img src="assets/images/dragon/stage_egg.png" class="list-egg-img"><br>
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
            // [핵심] 둥지 레벨만큼 클릭 효율 증가 (기본 1 + 레벨)
            const clickPower = 1 + (player.nestLevel || 0);
            dragon.clicks += clickPower;
            
            if (dragon.clicks >= max) {
                dragon.stage++;
                dragon.clicks = 0;
                renderNest(); 
                showAlert(`
                    <div style="text-align:center;">
                        <img src="${DRAGON_DATA.stageImages[dragon.stage]}" style="width:100px;"><br>
                        ✨ 축하합니다!<br>[${dragon.name}]이(가) 성장했습니다!
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
function startEggRoulette(isShinyEgg = false) { // isShinyEgg: 보석 알 여부
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
    
    // 3초 후 멈춤
    setTimeout(() => stopRoulette(isShinyEgg), 3000);
}

// [핵심] 50마리 중 뽑기 로직
function stopRoulette(isShinyEgg) {
    clearInterval(rouletteInterval);
    
    // 1. 뽑을 용의 등급 결정 (가중치 랜덤)
    const rand = Math.random() * 100;
    let rarity = 'common';
    
    // 신비한 알(보석)이면 확률 보정 (희귀 이상 나올 확률 증가)
    const bonus = isShinyEgg ? 20 : 0; 

    if (rand < RARITY_DATA.legend.prob + (isShinyEgg ? 2 : 0)) rarity = 'legend';
    else if (rand < RARITY_DATA.epic.prob + (isShinyEgg ? 5 : 0)) rarity = 'epic';
    else if (rand < RARITY_DATA.heroic.prob + bonus) rarity = 'heroic';
    else if (rand < RARITY_DATA.rare.prob + bonus) rarity = 'rare';
    else rarity = 'common';

    // 2. 해당 등급의 용 목록 추출
    const candidates = [];
    for (const key in DRAGON_DEX) {
        if (DRAGON_DEX[key].rarity === rarity) {
            candidates.push({ ...DRAGON_DEX[key], id: key }); // 데이터에 ID 포함
        }
    }

    // 3. 후보 중 랜덤 선택 (혹시 없으면 불도마뱀)
    if (candidates.length === 0) candidates.push({ ...DRAGON_DEX['fire_c1'], id: 'fire_c1' });
    const resultDragon = candidates[Math.floor(Math.random() * candidates.length)];
    
    // 4. 이로치(색이 다른 용) 결정 (기본 5%, 보석알 20%)
    const isShiny = Math.random() < (isShinyEgg ? 0.2 : 0.05);

    // UI 표시
    const shinyStyle = isShiny ? 'filter:hue-rotate(150deg) brightness(1.2);' : '';
    document.getElementById('roulette-display').innerHTML = `
        <div style="text-align:center">
            <img src="assets/images/dragon/stage_baby.png" style="width:100px; height:100px; ${shinyStyle}"><br>
            <b style="color:${RARITY_DATA[rarity].color}">${RARITY_DATA[rarity].name}</b>
        </div>
    `;
    
    setTimeout(() => {
        // 도감 등록
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
                uId: Date.now(), // 고유 ID
                id: resultDragon.id, // 도감 ID
                type: resultDragon.type,
                isShiny: isShiny, // 이로치 여부 저장
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

// 장비 UI 갱신
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
