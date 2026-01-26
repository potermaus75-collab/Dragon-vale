// 탐험 상태 변수
let currentRegionId = -1;
let movesLeft = 0;
let stealAttempts = 0; 
let isExploreActive = false;

// 1. 지도 화면 그리기
function renderMap() {
    const list = document.getElementById('region-list');
    if(!list) return; 
    list.innerHTML = "";

    REGION_DATA.forEach(region => {
        const div = document.createElement('div');
        const isLocked = player.level < region.levelReq;
        
        div.className = `region-card ${isLocked ? 'locked' : ''}`;
        div.innerHTML = `<h3>${region.name}</h3><p style="font-size:0.8rem; color:#aaa;">Lv.${region.levelReq} 이상</p>`;
        
        if (!isLocked) {
            div.onclick = () => startExplore(region.id);
        } else {
            div.onclick = () => alert(`레벨 ${region.levelReq}이 필요합니다.`);
        }
        list.appendChild(div);
    });
    toggleExploreView('map');
}

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
    tempLoot = [];
    isExploreActive = true;

    toggleExploreView('run');
    
    // UI 초기화
    const region = REGION_DATA[regionId];
    document.getElementById('explore-bg').style.backgroundColor = "#222"; 
    document.getElementById('region-title').innerText = region.name;
    document.getElementById('event-msg').innerText = "탐험을 시작합니다.";
    
    updateMoveUI(); // 버튼 상태 초기화
}

// 3. 이동
function moveForward() {
    if (movesLeft <= 0 || !isExploreActive) return;

    movesLeft--;
    
    // 걷는 효과
    const bg = document.getElementById('explore-bg');
    bg.classList.add('walking');
    setTimeout(() => bg.classList.remove('walking'), 500);

    // 랜덤 이벤트
    processRandomEvent();
    
    // ★ 이동 후 UI 갱신 (여기서 0회가 되면 버튼 바뀜)
    updateMoveUI();
}

// ★ UI 갱신 (버그 수정 핵심)
function updateMoveUI() {
    const counter = document.getElementById('move-counter');
    const moveBtn = document.getElementById('btn-move');
    const returnBtn = document.getElementById('btn-return');

    counter.innerText = `남은 이동: ${movesLeft}`;
    
    if (movesLeft <= 0) {
        // 이동 종료
        document.getElementById('event-msg').innerText += "\n(날이 저물었습니다. 귀환하세요.)";
        
        moveBtn.disabled = true;
        moveBtn.style.opacity = 0.5;
        moveBtn.innerText = "이동 불가";

        // 귀환 버튼을 '완료' 버튼으로 변경
        returnBtn.innerText = "🎁 탐험 완료 (보상 받기)";
        returnBtn.classList.remove('sub');
        returnBtn.style.backgroundColor = "#2ecc71";
        returnBtn.onclick = () => finishExplore(true); // 성공 처리
    } else {
        // 진행 중
        moveBtn.disabled = false;
        moveBtn.style.opacity = 1;
        moveBtn.innerText = "👣 앞으로 이동";
        
        returnBtn.innerText = "🏠 중도 포기";
        returnBtn.classList.add('sub');
        returnBtn.style.backgroundColor = ""; // 색상 초기화
        returnBtn.onclick = () => finishExplore(false); // 포기 처리
    }
}

// 4. 랜덤 이벤트
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

// 5. 둥지 조우
function encounterNest() {
    isExploreActive = false;
    stealAttempts = 3; 

    setTimeout(() => {
        if(confirm("용의 둥지 발견! 알을 훔치시겠습니까?")) {
            tryStealLoop();
        } else {
            isExploreActive = true;
            document.getElementById('event-msg').innerText = "둥지를 지나쳤습니다.";
            // 이동 횟수가 남았는지 체크
            if(movesLeft <= 0) updateMoveUI();
        }
    }, 100);
}

function tryStealLoop() {
    if (stealAttempts <= 0) {
        wakeParentDragon();
        return;
    }
    const success = Math.random() < 0.5;
    if (success) {
        alert("성공! 알을 손에 넣었습니다!");
        addTempLoot("egg_random", 1);
        isExploreActive = true;
        document.getElementById('event-msg').innerText = "알을 챙겨 나왔습니다.";
        if(movesLeft <= 0) updateMoveUI();
    } else {
        stealAttempts--;
        alert(`실패... (남은 기회: ${stealAttempts})`);
        if (stealAttempts > 0) {
            if(confirm("다시 시도? (위험)")) tryStealLoop();
            else {
                isExploreActive = true;
                document.getElementById('event-msg').innerText = "물러났습니다.";
                if(movesLeft <= 0) updateMoveUI();
            }
        } else {
            wakeParentDragon();
        }
    }
}

// 6. 부모 용 전투
function wakeParentDragon() {
    document.getElementById('explore-bg').style.backgroundColor = "#500";
    document.getElementById('event-msg').innerText = "부모 용 출현!";
    setTimeout(() => {
        if (confirm("싸우시겠습니까?")) fightParent();
        else tryFlee();
    }, 100);
}

function tryFlee() {
    if (Math.random() < 0.3) {
        alert("도망 성공!");
        finishExplore(true);
    } else {
        alert("도망 실패... (전리품 분실)");
        clearTempLoot();
        finishExplore(false);
    }
}

function fightParent() {
    if (Math.random() < 0.4) {
        alert("승리! 알 획득!");
        addTempLoot("egg_random", 1);
        finishExplore(true);
    } else {
        alert("패배...");
        clearTempLoot();
        finishExplore(false);
    }
}

// 7. 종료 및 귀환
function finishExplore(success = true) {
    const lootMsg = claimTempLoot();
    
    if (success && lootMsg) alert(`[귀환 성공]\n${lootMsg}`);
    else if (!success) alert("[귀환] 빈손으로 돌아왔습니다.");
    else alert("[귀환] 마을로 돌아왔습니다.");

    // UI 복구
    document.getElementById('btn-move').disabled = false;
    document.getElementById('btn-move').style.opacity = 1;
    document.getElementById('explore-bg').style.backgroundColor = "#222";
    
    toggleExploreView('map');
    updateCurrency();
    if(typeof renderInventory === 'function') renderInventory();
}

window.initExploreTab = function() { renderMap(); }
