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
}

function renderNest() {
    const dragonData = player.myDragons[player.currentDragonIndex];
    if (!dragonData) return;

    // 이름 표시
    const stageName = DRAGON_DATA.stages[dragonData.stage];
    dragonNameUI.innerText = `${dragonData.name} (${stageName})`;

    // 게이지바 로직
    const max = DRAGON_DATA.reqClicks[dragonData.stage] || 9999;
    let percent = 0;
    
    // 고룡(마지막 단계) 체크
    if (dragonData.stage >= DRAGON_DATA.stages.length - 1) {
        percent = 100;
        clickMsgBtn.innerText = "성장 완료";
        clickMsgBtn.disabled = true; // 버튼 비활성화 시각 효과
        clickMsgBtn.style.opacity = 0.5;
    } else {
        percent = (dragonData.clicks / max) * 100;
        clickMsgBtn.innerText = "마력 주입";
        clickMsgBtn.disabled = false;
        clickMsgBtn.style.opacity = 1;
    }
    
    // CSS Width 적용
    if(progressBar) {
        progressBar.style.width = `${percent}%`;
    }

    // 이모티콘/이미지 (나중에 에셋으로 교체 가능)
    let emoji = "🥚";
    if (dragonData.stage === 1) emoji = "🐣";
    else if (dragonData.stage >= 2) emoji = "🐲";
    else if (dragonData.stage >= 4) emoji = "🐉";

    dragonDisplay.innerText = emoji;
    
    // 이로치(Shiny) 효과
    if(dragonData.type === 'shiny') {
        dragonDisplay.style.textShadow = "0 0 20px #f1c40f";
    } else {
        dragonDisplay.style.textShadow = "none";
    }
}

function renderEggList() {
    if(!eggListArea) return;
    eggListArea.innerHTML = "";
    
    player.myDragons.forEach((dragon, index) => {
        const div = document.createElement('div');
        div.style.marginBottom = "5px";
        div.style.padding = "5px";
        // 선택된 용 강조
        div.style.background = index === player.currentDragonIndex ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
        div.style.borderRadius = "5px";
        div.style.cursor = "pointer";
        div.style.textAlign = "center";
        div.style.border = index === player.currentDragonIndex ? "2px solid #ffd700" : "1px solid #5d4a6d";
        
        div.innerHTML = `<span style="font-size:1.5rem">🥚</span><br><span style="font-size:0.7rem">${dragon.name}</span>`;
        
        div.onclick = () => {
            player.currentDragonIndex = index;
            renderEggList();
            renderNest();
        };
        eggListArea.appendChild(div);
    });
}

// 마력 주입 버튼 클릭 이벤트 (모달 적용됨)
if(clickMsgBtn) {
    clickMsgBtn.addEventListener('click', () => {
        const dragon = player.myDragons[player.currentDragonIndex];
        if (!dragon) return;

        const max = DRAGON_DATA.reqClicks[dragon.stage];
        
        // 마지막 단계가 아닐 때만 작동
        if (dragon.stage < DRAGON_DATA.stages.length - 1) {
            dragon.clicks++;
            
            // 성장 완료 조건 달성
            if (dragon.clicks >= max) {
                dragon.stage++;
                dragon.clicks = 0;
                
                // ★ Alert -> showAlert 교체
                // 화면을 먼저 갱신하고 축하 메시지를 띄움
                renderNest(); 
                showAlert(`✨ 축하합니다!\n[${dragon.name}]이(가) 성장했습니다!`);
                
                // 저장
                if(window.saveGame) window.saveGame();
            } else {
                // 성장 중일 때는 화면만 갱신 (너무 자주 뜨면 귀찮으므로)
                renderNest();
            }
        } else {
            showAlert("더 이상 성장할 수 없습니다. (최대 레벨)");
        }
    });
}

// 룰렛 로직
let rouletteInterval;
function startRoulette() {
    document.getElementById('roulette-modal').classList.remove('hidden');
    document.getElementById('roulette-modal').classList.add('active'); // active 클래스 추가
    
    const display = document.getElementById('roulette-display');
    const candidates = ["🔥", "💧", "🌿", "⚡", "💎"];
    
    if(rouletteInterval) clearInterval(rouletteInterval);
    rouletteInterval = setInterval(() => {
        display.innerText = candidates[Math.floor(Math.random() * candidates.length)];
    }, 50);
}

function stopRoulette() {
    clearInterval(rouletteInterval);
    const types = [
        {type: "fire", emoji: "🔥", name: "불꽃용"},
        {type: "water", emoji: "💧", name: "물방울용"},
        {type: "forest", emoji: "🌿", name: "풀잎용"}
    ];
    const result = types[Math.floor(Math.random() * types.length)];
    
    document.getElementById('roulette-display').innerText = result.emoji;
    
    setTimeout(() => {
        // ★ alert -> showAlert
        showAlert(`[${result.name}] 획득!`, () => {
            player.myDragons.push({
                id: Date.now(), type: result.type, stage: 0, clicks: 0, name: result.name
            });
            document.getElementById('roulette-modal').classList.add('hidden');
            document.getElementById('roulette-modal').classList.remove('active');
            updateCaveUI();
            
            // 저장
            if(window.saveGame) window.saveGame();
        });
    }, 500);
}

function updateEquipmentUI() {
    const slots = ['head', 'body', 'arm', 'leg'];
    slots.forEach(slot => {
        const el = document.querySelector(`.equip-slot.${slot}`);
        if(!el) return;
        const itemId = player.equipment[slot];
        if (itemId && ITEM_DB[itemId]) {
            el.innerText = ITEM_DB[itemId].emoji;
            el.style.border = "2px solid #f1c40f";
            el.style.background = "rgba(0,0,0,0.5)";
        } else {
            // 장비 없을 때 텍스트
            const slotNames = {head:'머리', body:'몸', arm:'무기', leg:'다리'};
            el.innerText = slotNames[slot];
            el.style.border = "2px solid #5d4a6d";
            el.style.background = "transparent";
        }
    });
}

window.updateUI = updateCaveUI; 
window.startEggRoulette = startRoulette;
window.stopRoulette = stopRoulette;

