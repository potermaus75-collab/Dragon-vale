// DOM 요소
const dragonDisplay = document.getElementById('dragon-display');
const progressBar = document.getElementById('progress-fill');
const dragonNameUI = document.getElementById('dragon-name-ui');
const eggListArea = document.getElementById('my-egg-list');
const clickMsgBtn = document.getElementById('click-msg'); // 버튼으로 변경됨

function updateCaveUI() {
    renderEggList();     
    renderNest();        
    updateEquipmentUI(); 
}

function renderNest() {
    const dragonData = player.myDragons[player.currentDragonIndex];
    if (!dragonData) return;

    // 이름
    const stageName = DRAGON_DATA.stages[dragonData.stage];
    dragonNameUI.innerText = `${dragonData.name} (${stageName})`;

    // ★ 게이지바 로직 (확실하게 수정)
    const max = DRAGON_DATA.reqClicks[dragonData.stage] || 9999;
    let percent = 0;
    if (dragonData.stage >= DRAGON_DATA.stages.length - 1) {
        percent = 100;
        clickMsgBtn.innerText = "성장 완료";
    } else {
        percent = (dragonData.clicks / max) * 100;
        clickMsgBtn.innerText = "마력 주입";
    }
    
    // CSS Width 적용
    if(progressBar) {
        progressBar.style.width = `${percent}%`;
    }

    // 이모티콘/이미지
    let emoji = "🥚";
    if (dragonData.stage === 1) emoji = "🐣";
    else if (dragonData.stage >= 2) emoji = "🐲";
    else if (dragonData.stage >= 4) emoji = "🐉";

    dragonDisplay.innerText = emoji;
    
    // 이로치 효과
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
        div.style.background = index === player.currentDragonIndex ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)";
        div.style.borderRadius = "5px";
        div.style.cursor = "pointer";
        div.style.textAlign = "center";
        div.style.border = "1px solid #5d4a6d";
        
        div.innerHTML = `<span style="font-size:1.5rem">🥚</span><br><span style="font-size:0.7rem">${dragon.name}</span>`;
        
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
            dragon.clicks++;
            if (dragon.clicks >= max) {
                dragon.stage++;
                dragon.clicks = 0;
                alert(`✨ ${dragon.name}이(가) 성장했습니다!`);
            }
            renderNest(); // 화면 갱신 (게이지바 업데이트)
        } else {
            alert("더 이상 성장할 수 없습니다.");
        }
    });
}

// 룰렛 로직 (기존 유지)
let rouletteInterval;
function startRoulette() {
    document.getElementById('roulette-modal').classList.remove('hidden');
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
        alert(`[${result.name}] 획득!`);
        player.myDragons.push({
            id: Date.now(), type: result.type, stage: 0, clicks: 0, name: result.name
        });
        document.getElementById('roulette-modal').classList.add('hidden');
        updateCaveUI();
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
        } else {
            el.innerText = slot.toUpperCase();
            el.style.border = "";
        }
    });
}

window.updateUI = updateCaveUI; 
window.startEggRoulette = startRoulette;
window.stopRoulette = stopRoulette;
