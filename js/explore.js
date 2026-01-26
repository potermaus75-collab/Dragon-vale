// 탐험 상태 관리 변수
let currentRegionId = -1;
let movesLeft = 0;
let stealAttempts = 0; 
let isExploreActive = false;

// 1. 지도 화면 그리기 (main.js에서 호출)
function renderMap() {
    const list = document.getElementById('region-list');
    if(!list) return; // 에러 방지
    list.innerHTML = "";

    REGION_DATA.forEach(region => {
        const div = document.createElement('div');
        const isLocked = player.level < region.levelReq;
        
        div.className = `region-card ${isLocked ? 'locked' : ''}`;
        div.innerHTML = `
            <h3>${region.name}</h3>
            <p style="font-size:0.8rem; color:#aaa;">Lv.${region.levelReq} 이상</p>
        `;
        
        if (!isLocked) {
            div.onclick = () => startExplore(region.id);
        } else {
            div.onclick = () => alert(`레벨 ${region.levelReq}이 필요합니다.`);
        }
        list.appendChild(div);
    });

    // 화면 전환 (지도 보이기)
    toggleExploreView('map');
}

// 화면 전환 유틸 (지도 vs 진행화면)
function toggleExploreView(viewName) {
    const mapDiv = document.getElementById('explore-map-view');
    const runDiv = document.getElementById('explore-run-view');
    
    if(viewName === 'map') {
        mapDiv.classList.remove('hidden');
        runDiv.classList.add('hidden');
    } else {
        mapDiv.classList.add('hidden');
        runDiv.classList.remove('hidden');
    }
}

// 2. 탐험 시작
function startExplore(regionId) {
    currentRegionId = regionId;
    movesLeft = 10;
    tempLoot = []; // 임시 가방 초기화
    isExploreActive = true;

    toggleExploreView('run');
    
    // UI 초기화
    const region = REGION_DATA[regionId];
    const bgElem = document.getElementById('explore-bg');
    
    // 이미지가 있으면 설정, 없으면 배경색만
    // bgElem.style.backgroundImage = `url('assets/images/${region.bg}')`; 
    bgElem.style.backgroundColor = "#222"; 
    
    document.getElementById('region-title').innerText = region.name;
    document.getElementById('event-msg').innerText = "탐험을 시작합니다. 이동하세요.";
    
    // 버튼 초기화
    const moveBtn = document.getElementById('btn-move');
    moveBtn.disabled = false;
    moveBtn.style.opacity = 1;

    updateMoveUI();
}

// 3. 앞으로 이동
function moveForward() {
    if (movesLeft <= 0 || !isExploreActive) return;

    movesLeft--;
    updateMoveUI();

    // 걷는 효과 (애니메이션)
    const bg = document.getElementById('explore-bg');
    bg.classList.add('walking');
    setTimeout(() => bg.classList.remove('walking'), 500);

    // 랜덤 이벤트 발생
    processRandomEvent();
}

// UI 갱신
function updateMoveUI() {
    document.getElementById('move-counter').innerText = `남은 이동: ${movesLeft}`;
    
    if (movesLeft === 0) {
        document.getElementById('event-msg').innerText = "더 이상 이동할 수 없습니다. 귀환하세요.";
        const moveBtn = document.getElementById('btn-move');
        moveBtn.disabled = true;
        moveBtn.style.opacity = 0.5;
    }
}

// 4. 랜덤 이벤트 로직
function processRandomEvent() {
    const roll = Math.floor(Math.random() * 100);
    const msgArea = document.getElementById('event-msg');

    if (roll < ENCOUNTER_RATES.NOTHING) {
        msgArea.innerText = "조용합니다... 아무것도 없습니다.";
    } 
    else if (roll < ENCOUNTER_RATES.NOTHING + ENCOUNTER_RATES.MATERIAL) {
        const amount = Math.floor(Math.random() * 3) + 1;
        addTempLoot("nest_wood", amount);
        msgArea.innerText = `🔍 둥지 재료를 ${amount}개 발견했습니다!`;
    } 
    else {
        msgArea.innerText = "❗ 용의 둥지를 발견했습니다!";
        encounterNest();
    }
}

// 5. 둥지 발견 및 상호작용
function encounterNest() {
    isExploreActive = false; // 이동 잠금
    stealAttempts = 3; 

    // setTimeout을 써서 UI가 그려진 뒤 confirm 창을 띄움
    setTimeout(() => {
        if(confirm("용의 둥지를 발견했습니다!\n잠입하여 알을 훔치시겠습니까?\n(취소 시 그냥 지나갑니다)")) {
            tryStealLoop();
        } else {
            isExploreActive = true;
            document.getElementById('event-msg').innerText = "둥지를 조용히 지나쳤습니다.";
        }
    }, 100);
}

// 훔치기 시도 (재귀)
function tryStealLoop() {
    if (stealAttempts <= 0) {
        wakeParentDragon();
        return;
    }

    const success = Math.random() < 0.5; // 50% 확률
    
    if (success) {
        alert("성공! 알을 손에 넣었습니다!");
        addTempLoot("egg_random", 1);
        isExploreActive = true;
        document.getElementById('event-msg').innerText = "알을 챙겨서 둥지를 빠져나왔습니다.";
    } else {
        stealAttempts--;
        alert(`실패! 알이 꿈쩍도 안 합니다...\n(남은 기회: ${stealAttempts}번)`);
        
        if (stealAttempts > 0) {
            if(confirm("다시 시도하시겠습니까? (위험 증가)")) {
                tryStealLoop();
            } else {
                isExploreActive = true;
                document.getElementById('event-msg').innerText = "위험을 느끼고 물러났습니다.";
            }
        } else {
            wakeParentDragon();
        }
    }
}

// 6. 부모 용 등장
function wakeParentDragon() {
    document.getElementById('explore-bg').style.backgroundColor = "#500"; // 붉은 배경
    document.getElementById('event-msg').innerText = "크아앙!! 부모 용이 나타났습니다!";

    setTimeout(() => {
        const choice = confirm("부모 용에게 들켰습니다!!\n\n[확인] 싸운다 (승리 시 알 100%)\n[취소] 도망친다 (성공률 30%)");
        if (choice) fightParent();
        else tryFlee();
    }, 100);
}

// 도망
function tryFlee() {
    if (Math.random() < 0.3) {
        alert("휴... 간신히 도망쳤습니다.");
        finishExplore(true);
    } else {
        alert("도망 실패! 용의 브레스에 당했습니다.\n전리품을 모두 잃었습니다.");
        clearTempLoot();
        finishExplore(false);
    }
}

// 싸우기
function fightParent() {
    const win = Math.random() < 0.4; // 40% 승리 확률

    if (win) {
        // 이로치 판별 (10%)
        const isShiny = Math.random() < 0.1;
        if (isShiny) {
            alert("대승리! ✨'황금빛 알(이로치)'을 발견했습니다!");
            // 실제론 egg_shiny 아이템이 DB에 있어야 함. 일단 랜덤알로 지급
            addTempLoot("egg_random", 1); 
            addTempLoot("egg_random", 1); // 보너스
        } else {
            alert("승리! 둥지에 있던 알을 챙겼습니다.");
            addTempLoot("egg_random", 1);
        }
        finishExplore(true);
    } else {
        alert("패배했습니다... 눈앞이 깜깜해집니다.");
        clearTempLoot();
        finishExplore(false);
    }
}

// 7. 탐험 종료 및 귀환
function finishExplore(success = true) {
    const lootMsg = claimTempLoot(); // 전리품 수령
    
    if (success && lootMsg) {
        alert(`[탐험 종료]\n무사히 귀환했습니다!\n\n${lootMsg}`);
    } else if (!success) {
        alert("[탐험 종료]\n빈손으로 마을에 돌아왔습니다...");
    } else {
        alert("[탐험 종료]\n마을로 돌아왔습니다.");
    }

    // UI 복구
    document.getElementById('btn-move').disabled = false;
    document.getElementById('btn-move').style.opacity = 1;
    document.getElementById('explore-bg').style.backgroundColor = "#222";
    
    // 맵 화면으로 복귀
    toggleExploreView('map');
    
    // 정보 갱신
    updateCurrency();
    if(typeof renderInventory === 'function') renderInventory();
}

// 외부에서 호출할 초기화 함수
window.initExploreTab = function() {
    renderMap();
}
