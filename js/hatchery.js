// DOM 요소
const dragonDisplay = document.getElementById('dragon-display');
const progressBar = document.getElementById('progress-fill');
const dragonNameUI = document.getElementById('dragon-name-ui');
const eggListArea = document.getElementById('my-egg-list');
const clickMsgBtn = document.getElementById('click-msg'); 

function updateCaveUI() {
    renderEggList();     
    renderNest();        
    updateEquipmentUI(); 
    renderUpgradeBtn(); // [신규] 강화 버튼 렌더링
}

// [신규] 둥지 강화 버튼 생성
function renderUpgradeBtn() {
    // 둥지 패널 하단에 버튼이 들어갈 자리가 있는지 확인 후 추가
    const nestPanel = document.querySelector('.nest-panel');
    let upgradeBtn = document.getElementById('btn-upgrade-nest');
    
    if (!upgradeBtn) {
        upgradeBtn = document.createElement('button');
        upgradeBtn.id = 'btn-upgrade-nest';
        upgradeBtn.className = 'btn-stone';
        upgradeBtn.style.marginTop = '10px';
        upgradeBtn.style.fontSize = '0.9rem';
        upgradeBtn.onclick = () => { if(window.upgradeNest) window.upgradeNest(); }; // player.js 함수 호출
        nestPanel.appendChild(upgradeBtn);
    }
    
    // 버튼 텍스트 갱신 (비용 표시)
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

    const stageName = DRAGON_DATA.stages[dragonData.stage];
    dragonNameUI.innerText = `${dragonData.name} (${stageName})`;

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
    if (DRAGON_DATA.stageImages && DRAGON_DATA.stageImages[dragonData.stage]) {
        imgSrc = DRAGON_DATA.stageImages[dragonData.stage];
    }

    dragonDisplay.innerHTML = `<img src="${imgSrc}" class="main-dragon-img">`;
    
    const imgEl = dragonDisplay.querySelector('img');
    if(dragonData.type === 'shiny' && imgEl) {
        imgEl.style.filter = "drop-shadow(0 0 10px #f1c40f) brightness(1.2)";
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

// [수정] 마력 주입 로직 (강화 효과 적용)
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
function startEggRoulette(isShiny = false) {
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
    setTimeout(() => stopRoulette(isShiny), 3000);
}

function stopRoulette(isShiny) {
    clearInterval(rouletteInterval);
    
    const types = [
        {type: "fire", img: "assets/images/element/element_fire.png", name: "불꽃용"},
        {type: "water", img: "assets/images/element/element_water.png", name: "물방울용"},
        {type: "forest", img: "assets/images/element/element_forest.png", name: "풀잎용"},
        {type: "electric", img: "assets/images/element/element_electric.png", name: "번개용"},
        {type: "metal", img: "assets/images/element/element_metal.png", name: "강철용"}
    ];
    
    // [신규] 신비한 알이면 이로치 확률 증가 로직 등을 넣을 수 있음
    // 여기서는 단순히 랜덤
    const result = types[Math.floor(Math.random() * types.length)];
    
    document.getElementById('roulette-display').innerHTML = `<img src="${result.img}" style="width:120px; height:120px; filter:drop-shadow(0 0 10px white);">`;
    
    setTimeout(() => {
        if(!player.discovered) player.discovered = [];
        let isNew = false;
        if(!player.discovered.includes(result.type)) {
            player.discovered.push(result.type);
            isNew = true;
        }

        const msg = isNew 
            ? `<b style="color:#f1c40f">[${result.name}] 획득!</b><br>(도감에 새로 등록되었습니다!)` 
            : `<b>[${result.name}] 획득!</b>`;

        showAlert(msg, () => {
            player.myDragons.push({
                id: Date.now(), type: result.type, stage: 0, clicks: 0, name: result.name
            });
            document.getElementById('roulette-modal').classList.add('hidden');
            document.getElementById('roulette-modal').classList.remove('active');
            updateCaveUI();
            if(window.saveGame) window.saveGame();
        });
    }, 800);
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
// window.stopRoulette -> startEggRoulette 내부에서 호출됨
