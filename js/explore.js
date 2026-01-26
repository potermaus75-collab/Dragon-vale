// 탐험 상태 변수
let currentRegionId = -1;
let movesLeft = 0;
let stealAttempts = 0; 
let isExploreActive = false;
let selectedRegionId = null; // 지도에서 선택한 지역 임시 저장

// 1. 지도 화면 그리기 (탭 열릴 때 호출)
function renderMap() {
    const list = document.getElementById('region-list');
    if(!list) return; 
    list.innerHTML = "";
    
    // 입장하기 버튼 비활성화 (초기화)
    const enterBtn = document.querySelector('.btn-long-stone');
    if(enterBtn) {
        enterBtn.disabled = true;
        enterBtn.style.filter = "grayscale(1)";
        enterBtn.innerText = "지역을 선택하세요";
    }

    REGION_DATA.forEach(region => {
        const div = document.createElement('div');
        const isLocked = player.level < region.levelReq;
        
        div.className = `region-card ${isLocked ? 'locked' : ''}`;
        
        // 카드 내용 구성
        div.innerHTML = `
            <h3>${region.name}</h3>
            <p style="font-size:0.8rem; color:#aaa;">${isLocked ? `Lv.${region.levelReq} 필요` : region.desc}</p>
        `;
        
        // 클릭 이벤트
        div.onclick = () => {
            if(isLocked) {
                alert(`레벨 ${region.levelReq} 이상이어야 입장할 수 있습니다.`);
                return;
            }
            // 선택 효과
            document.querySelectorAll('.region-card').forEach(c => c.style.border = "1px solid #aaa");
            div.style.border = "2px solid #f1c40f"; // 선택된 카드 강조
            
            // 입장 버튼 활성화
            selectedRegionId = region.id;
            if(enterBtn) {
                enterBtn.disabled = false;
                enterBtn.style.filter = "grayscale(0)";
                enterBtn.innerText = `[${region.name}] 입장하기`;
            }
        };
        
        list.appendChild(div);
    });

    // 화면 전환 (지도 보이기)
    toggleExploreView('map');
}

// "입장하기" 버튼 클릭 시 실행되는 함수
function enterSelectedRegion() {
    if (selectedRegionId === null) {
        alert("먼저 탐험할 지역을 선택해주세요.");
        return;
    }
    startExplore(selectedRegionId);
}

// 화면 전환 유틸
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

// 2. 탐험 시작 (실제 게임 화면으로 전환)
function startExplore(regionId) {
    currentRegionId = regionId;
    movesLeft = 10;
    tempLoot = [];
    isExploreActive = true;

    toggleExploreView('run');
    
    // UI 초기화
    const region = REGION_DATA[regionId];
    // 배경색 설정 (나중에 이미지로 교체 가능)
    const bgElem = document.getElementById('explore-bg');
    bgElem.style.backgroundColor = "#222"; 
    
    document.getElementById('region-title').innerText = region.name;
    document.getElementById('event-msg').innerText = "탐험을 시작합니다. 이동하세요.";
    
    updateMoveUI();
}

// 3. 이동하기
function moveForward() {
    if (movesLeft <= 0 || !isExploreActive) return;

    movesLeft--;
    
    // 걷는 효과 (CSS 애니메이션)
    const bg = document.getElementById('explore-bg');
    bg.classList.add('walking');
    setTimeout(() => bg.classList.remove('walking'), 500);

    processRandomEvent();
    updateMoveUI();
}

// UI 갱신 (탐험 종료 처리 포함)
function updateMoveUI() {
    const counter = document.getElementById('move-counter');
    const moveBtn = document.getElementById('btn-move');
    const returnBtn = document.getElementById('btn-return');

    counter.innerText = `남은 이동: ${movesLeft}`;
    
    if (movesLeft <= 0) {
        // 이동 종료
        document.getElementById('event-msg').innerText = "날이 저물었습니다. 귀환하세요.";
        
        moveBtn.disabled = true;
        moveBtn.style.opacity = 0.5;
        moveBtn.innerText = "이동 불가";

        // 완료 버튼으로 변경
        returnBtn.innerText = "🎁 보상 받기";
        returnBtn.classList.remove('sub');
        returnBtn.style.color = "#2ecc71"; // 녹색 텍스트
        returnBtn.onclick = () => finishExplore(true); 
    } else {
        // 진행 중
        moveBtn.disabled = false;
        moveBtn.style.opacity = 1;
        moveBtn.innerText = "👣 이동";
        
        returnBtn.innerText = "🏠 중도 포기";
        returnBtn.classList.add('sub');
        returnBtn.style.color = "#aaa"; 
        returnBtn.onclick = () => finishExplore(false);
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

    // UI가 그려진 뒤 confirm 창을 띄우기 위해 약간 지연
    setTimeout(() => {
        if(confirm("용의 둥지 발견! 알을 훔치시겠습니까?")) {
            tryStealLoop();
        } else {
            isExploreActive = true;
            document.getElementById('event-msg').innerText = "둥지를 지나쳤습니다.";
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
        document.getElementById('event-msg').innerText = "알을 챙겨서 도망쳤습니다.";
        if(movesLeft <= 0) updateMoveUI();
    } else {
        stealAttempts--;
        alert(`실패... 알이 너무 무겁습니다. (남은 기회: ${stealAttempts})`);
        
        if (stealAttempts > 0) {
            if(confirm("다시 시도하시겠습니까? (위험)")) {
                tryStealLoop();
            } else {
                isExploreActive = true;
                document.getElementById('event-msg').innerText = "위험을 느끼고 물러났습니다.";
                if(movesLeft <= 0) updateMoveUI();
            }
        } else {
            wakeParentDragon();
        }
    }
}

// 6. 부모 용 전투
function wakeParentDragon() {
    document.getElementById('explore-bg').style.backgroundColor = "#500"; // 붉은색 경고
    document.getElementById('event-msg').innerText = "크아앙! 부모 용 출현!";
    
    setTimeout(() => {
        const choice = confirm("부모 용에게 들켰습니다! 싸우시겠습니까?\n(승리 시 알 획득, 패배 시 전리품 분실)");
        if (choice) fightParent();
        else tryFlee();
    }, 100);
}

function tryFlee() {
    if (Math.random() < 0.3) {
        alert("휴... 간신히 도망쳤습니다.");
        finishExplore(true);
    } else {
        alert("도망 실패! 용의 공격을 받았습니다.\n전리품을 모두 잃었습니다.");
        clearTempLoot();
        finishExplore(false);
    }
}

function fightParent() {
    const win = Math.random() < 0.4;
    if (win) {
        alert("대단합니다! 부모 용을 물리쳤습니다!");
        addTempLoot("egg_random", 1);
        finishExplore(true);
    } else {
        alert("패배했습니다... 눈앞이 캄캄해집니다.");
        clearTempLoot();
        finishExplore(false);
    }
}

// 7. 탐험 종료
function finishExplore(success = true) {
    const lootMsg = claimTempLoot();
    
    if (success && lootMsg) alert(`[탐험 종료] 무사귀환!\n\n${lootMsg}`);
    else if (!success) alert("[탐험 종료] 빈손으로 돌아왔습니다.");
    else alert("[탐험 종료] 마을로 복귀합니다.");

    // UI 복구
    document.getElementById('btn-move').disabled = false;
    document.getElementById('btn-move').style.opacity = 1;
    document.getElementById('btn-move').innerText = "👣 이동";
    document.getElementById('explore-bg').style.backgroundColor = "#222";
    
    toggleExploreView('map');
    updateCurrency();
    
    // 가방 화면 갱신
    if(typeof renderInventory === 'function') renderInventory();
}

// 전역 연결
window.initExploreTab = function() {
    renderMap();
}
window.enterSelectedRegion = enterSelectedRegion; // HTML 버튼에서 호출

