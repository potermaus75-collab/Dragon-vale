// DOM 요소
const dragonDisplay = document.getElementById('dragon-display');
const progressBar = document.getElementById('progress-fill');
const dragonNameUI = document.getElementById('dragon-name-ui');
const imgArea = document.getElementById('dragon-img-area');
const eggListArea = document.getElementById('my-egg-list');

// 1. 전체 화면 갱신 (동굴 + 장비)
function updateCaveUI() {
    renderEggList();     
    renderNest();        
    updateEquipmentUI(); 
}
function renderNest() {
    const dragonData = player.myDragons[player.currentDragonIndex];
    if (!dragonData) return;
    
// 2. 둥지 그리기
function renderNest() {
    const dragonData = player.myDragons[player.currentDragonIndex];
    if (!dragonData) return;

    // 이름 & 단계
    const stageName = DRAGON_DATA.stages[dragonData.stage];
    dragonNameUI.innerText = `${dragonData.name} (${stageName})`;

   // ★ 게이지바 로직 수정 (핵심)
    const max = DRAGON_DATA.reqClicks[dragonData.stage] || 9999; // 0으로 나누기 방지
    let percent = 0;
    
    if (dragonData.stage >= DRAGON_DATA.stages.length - 1) {
        percent = 100; // 마지막 단계면 꽉 채움
    } else {
        percent = (dragonData.clicks / max) * 100;
    }
    // CSS width 적용
    progressBar.style.width = `${percent}%`;
    // 이미지/이모티콘
    let emoji = "🥚";
    if (dragonData.stage === 1) emoji = "🐣";
    else if (dragonData.stage >= 2) emoji = "🐲";
    else if (dragonData.stage >= 4) emoji = "🐉";

    imgArea.innerText = emoji;
    imgArea.style.backgroundImage = "none";
    
    // 이로치(Shiny) 등 특별한 용 이미지 처리 (예시)
    if(dragonData.type === 'shiny') {
        imgArea.style.color = "#f1c40f"; // 금색 텍스트
    } else {
        imgArea.style.color = "white";
    }
}

// 3. 알 리스트 그리기
function renderEggList() {
    eggListArea.innerHTML = "";
    
    player.myDragons.forEach((dragon, index) => {
        const div = document.createElement('div');
        div.className = `egg-item ${index === player.currentDragonIndex ? 'active' : ''}`;
        div.innerHTML = `${dragon.name}<br><small>${DRAGON_DATA.stages[dragon.stage]}</small>`;
        
        div.onclick = () => {
            player.currentDragonIndex = index;
            renderEggList();
            renderNest();
        };
        eggListArea.appendChild(div);
    });
}

// 4. 둥지 터치 (성장)
dragonDisplay.addEventListener('click', () => {
    const dragon = player.myDragons[player.currentDragonIndex];
    if (!dragon) return;

    const max = DRAGON_DATA.reqClicks[dragon.stage];
    
    if (dragon.stage < DRAGON_DATA.stages.length - 1) {
        dragon.clicks++;
        if (dragon.clicks >= max) {
            dragon.stage++;
            dragon.clicks = 0;
            alert(`${dragon.name}이(가) 성장했습니다!`);
        }
        renderNest();
    }
});

// ==============================
// 룰렛 시스템 (미지의 알)
// ==============================
let rouletteInterval;
let isRouletteStopping = false;

function startRoulette() {
    const modal = document.getElementById('roulette-modal');
    modal.classList.remove('hidden');
    
    isRouletteStopping = false;
    const display = document.getElementById('roulette-display');
    const candidates = ["🔥", "💧", "🌿", "⚡", "💎"];
    
    // 빠르게 돌리기
    rouletteInterval = setInterval(() => {
        const rand = candidates[Math.floor(Math.random() * candidates.length)];
        display.innerText = rand;
    }, 50);
}

function stopRoulette() {
    if (isRouletteStopping) return;
    isRouletteStopping = true;
    
    clearInterval(rouletteInterval);
    
    // 결과 결정 (랜덤)
    const types = [
        {type: "fire", emoji: "🔥", name: "불꽃용"},
        {type: "water", emoji: "💧", name: "물방울용"},
        {type: "forest", emoji: "🌿", name: "풀잎용"},
        {type: "gold", emoji: "💎", name: "보석용"}
    ];
    const result = types[Math.floor(Math.random() * types.length)];
    
    // 깜빡이는 효과 후 정지
    let flash = 0;
    const flashInterval = setInterval(() => {
        flash++;
        const display = document.getElementById('roulette-display');
        display.style.opacity = flash % 2 === 0 ? "1" : "0.5";
        
        if (flash > 6) {
            clearInterval(flashInterval);
            display.style.opacity = "1";
            display.innerText = result.emoji;
            
            setTimeout(() => {
                alert(`[${result.name}] 알이 태어났습니다!`);
                
                // 새 용 추가
                player.myDragons.push({
                    id: Date.now(),
                    type: result.type,
                    stage: 0,
                    clicks: 0,
                    name: result.name
                });
                
                document.getElementById('roulette-modal').classList.add('hidden');
                updateCaveUI();
            }, 500);
        }
    }, 200);
}

// 5. 장비 UI 업데이트 (내 정보 탭)
function updateEquipmentUI() {
    const slots = ['head', 'body', 'arm', 'leg'];
    slots.forEach(slot => {
        const itemId = player.equipment[slot];
        const el = document.querySelector(`.equip-slot.${slot}`);
        if (itemId && ITEM_DB[itemId]) {
            el.innerText = ITEM_DB[itemId].name;
            el.style.border = "2px solid #e67e22"; 
            el.style.color = "#fff";
        } else {
            el.innerText = slot.toUpperCase();
            el.style.border = "2px solid #888";
            el.style.color = "#aaa";
        }
    });
}

// 전역 연결
window.updateUI = updateCaveUI; 
window.startEggRoulette = startRoulette;
window.stopRoulette = stopRoulette;
