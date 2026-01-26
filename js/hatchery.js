// DOM 요소 가져오기
const dragonDisplay = document.getElementById('dragon-display');
const progressBar = document.getElementById('progress-fill');
const dragonNameUI = document.getElementById('dragon-name-ui');
const eggListArea = document.getElementById('my-egg-list');

// 1. 전체 화면 갱신 (동굴 + 장비창)
function updateCaveUI() {
    renderEggList();     
    renderNest();        
    updateEquipmentUI(); 
}

// 2. 둥지(Nest) 그리기
function renderNest() {
    const dragonData = player.myDragons[player.currentDragonIndex];
    if (!dragonData) return;

    // 이름 & 단계 표시
    const stageName = DRAGON_DATA.stages[dragonData.stage];
    dragonNameUI.innerText = `${dragonData.name} (${stageName})`;

    // 게이지바 (백분율 계산)
    const max = DRAGON_DATA.reqClicks[dragonData.stage] || 9999;
    let percent = 0;
    if (dragonData.stage >= DRAGON_DATA.stages.length - 1) {
        percent = 100; 
    } else {
        percent = (dragonData.clicks / max) * 100;
    }
    progressBar.style.width = `${Math.min(percent, 100)}%`;

    // ★ 알/용 비주얼 처리 (새로운 HTML 구조 대응)
    // dragon-display 안의 .glowing-egg 요소를 찾아서 변경
    let visualEl = dragonDisplay.querySelector('.glowing-egg');
    if (!visualEl) {
        // 없으면 새로 생성 (안전장치)
        visualEl = document.createElement('div');
        visualEl.className = 'glowing-egg';
        dragonDisplay.innerHTML = '';
        dragonDisplay.appendChild(visualEl);
    }

    // 단계별 이모티콘 설정
    let emoji = "🥚";
    if (dragonData.stage === 1) emoji = "🐣";
    else if (dragonData.stage >= 2) emoji = "🐲";
    else if (dragonData.stage >= 4) emoji = "🐉";

    visualEl.innerText = emoji;
    
    // 이로치(Shiny) 텍스트 색상 효과
    if(dragonData.type === 'shiny') {
        visualEl.style.textShadow = "0 0 10px #f1c40f";
        visualEl.style.filter = "brightness(1.5)";
    } else {
        visualEl.style.textShadow = "";
        visualEl.style.filter = "";
    }
}

// 3. 알 리스트 그리기 (왼쪽 패널)
function renderEggList() {
    if(!eggListArea) return;
    eggListArea.innerHTML = "";
    
    player.myDragons.forEach((dragon, index) => {
        const div = document.createElement('div');
        // CSS 클래스: egg-item-stone 사용
        div.className = `egg-item-stone ${index === player.currentDragonIndex ? 'active' : ''}`;
        div.innerHTML = `${dragon.name}<br><span style="font-size:0.7rem">${DRAGON_DATA.stages[dragon.stage]}</span>`;
        
        div.onclick = () => {
            player.currentDragonIndex = index;
            renderEggList(); // 리스트 갱신 (하이라이트 변경)
            renderNest();    // 둥지 갱신
        };
        eggListArea.appendChild(div);
    });
}

// 4. 둥지 터치 이벤트 (성장)
if(dragonDisplay) {
    dragonDisplay.addEventListener('click', () => {
        const dragon = player.myDragons[player.currentDragonIndex];
        if (!dragon) return;

        const max = DRAGON_DATA.reqClicks[dragon.stage];
        
        // 성장 가능 상태인지 체크
        if (dragon.stage < DRAGON_DATA.stages.length - 1) {
            const evolved = dragon.click(); // dragon.js의 click 메서드 호출
            if (evolved) {
                alert(`✨ ${dragon.name}이(가) [${DRAGON_DATA.stages[dragon.stage]}]로 진화했습니다!`);
            } else {
                // 클릭 효과 (임시) - 나중에 사운드 추가 가능
                const visualEl = dragonDisplay.querySelector('.glowing-egg');
                if(visualEl) {
                    visualEl.style.transform = "scale(0.9)";
                    setTimeout(() => visualEl.style.transform = "scale(1)", 100);
                }
            }
            renderNest();
        } else {
            alert("더 이상 성장할 수 없습니다. (최고 단계)");
        }
    });
}

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
    
    // 기존 인터벌 제거 후 시작
    if(rouletteInterval) clearInterval(rouletteInterval);
    
    rouletteInterval = setInterval(() => {
        const rand = candidates[Math.floor(Math.random() * candidates.length)];
        display.innerText = rand;
    }, 50); // 0.05초마다 변경
}

function stopRoulette() {
    if (isRouletteStopping) return;
    isRouletteStopping = true;
    
    clearInterval(rouletteInterval);
    
    // 결과 결정 (랜덤 로직)
    const types = [
        {type: "fire", emoji: "🔥", name: "불꽃용"},
        {type: "water", emoji: "💧", name: "물방울용"},
        {type: "forest", emoji: "🌿", name: "풀잎용"},
        {type: "gold", emoji: "💎", name: "보석용"}
    ];
    const result = types[Math.floor(Math.random() * types.length)];
    
    // 깜빡이는 연출
    let flash = 0;
    const display = document.getElementById('roulette-display');
    
    const flashInterval = setInterval(() => {
        flash++;
        display.style.opacity = flash % 2 === 0 ? "1" : "0.5";
        
        if (flash > 6) {
            clearInterval(flashInterval);
            display.style.opacity = "1";
            display.innerText = result.emoji;
            
            setTimeout(() => {
                alert(`알이 깨어났습니다! [${result.name}] 획득!`);
                
                // 플레이어 데이터에 새 용 추가
                player.myDragons.push(new Dragon(result.name, result.type));
                
                document.getElementById('roulette-modal').classList.add('hidden');
                updateCaveUI();
            }, 500);
        }
    }, 150);
}

// 5. 장비 UI 업데이트 (내 정보 탭)
function updateEquipmentUI() {
    const slots = ['head', 'body', 'arm', 'leg'];
    
    slots.forEach(slot => {
        // querySelector로 해당 클래스를 가진 요소를 찾음 (.equip-slot.head 등)
        const el = document.querySelector(`.equip-slot.${slot}`);
        if(!el) return;

        const itemId = player.equipment[slot];
        
        if (itemId && ITEM_DB[itemId]) {
            el.innerText = ITEM_DB[itemId].emoji; // 이모티콘으로 표시
            el.style.border = "2px solid #f1c40f"; // 장착 시 금색 테두리
            el.style.color = "#fff";
            el.style.textShadow = "0 0 5px #f1c40f";
        } else {
            // 장비 없을 때 슬롯 이름 표시 (HEAD, BODY...)
            el.innerText = slot.toUpperCase(); 
            el.style.border = ""; // 기본 스타일로 복귀 (CSS 따름)
            el.style.color = "";
            el.style.textShadow = "";
        }
    });
}

// 전역 함수 연결
window.updateUI = updateCaveUI; 
window.startEggRoulette = startRoulette;
window.stopRoulette = stopRoulette;

