// ==========================================
// js/explore.js (완전한 코드)
// ==========================================

// 탐험 상태 변수
let currentRegionId = -1;
let movesLeft = 0;
let stealAttempts = 0; 
let isExploreActive = false;
let selectedRegionId = null; // 지도에서 선택한 지역 ID

// 1. 지도 화면 그리기 (탭이 열릴 때 initExploreTab에서 호출됨)
function renderMap() {
    const list = document.getElementById('region-list');
    if(!list) return; 
    list.innerHTML = "";
    
    // 입장하기 버튼 초기화 (비활성화 상태)
    const enterBtn = document.querySelector('.enter-btn'); // CSS 클래스 확인 필요
    // 만약 index.html에서 버튼에 클래스를 .btn-long-stone .enter-btn 등으로 주었다면 선택됨
    // 안전하게 querySelector로 찾거나 ID를 부여하는 것이 좋습니다.
    // 여기서는 index.html 구조상 '입장하기' 텍스트를 가진 버튼을 찾거나, 
    // .enter-btn 클래스가 있다고 가정하고 처리합니다. (이전 코드 기반)
    
    if(enterBtn) {
        enterBtn.disabled = true;
        enterBtn.style.filter = "grayscale(1)";
        enterBtn.innerText = "지역을 선택하세요";
    }

    REGION_DATA.forEach(region => {
        const div = document.createElement('div');
        // 레벨 제한 확인
        const isLocked = player.level < region.levelReq;
        
        div.className = `region-card ${isLocked ? 'locked' : ''}`;
        
        // 카드 내용 HTML
        div.innerHTML = `
            <h3>${region.name}</h3>
            <p style="font-size:0.8rem; color:#aaa;">${isLocked ? `Lv.${region.levelReq} 필요` : region.desc}</p>
        `;
        
        // 클릭 이벤트 (지역 선택)
        div.onclick = () => {
            if(isLocked) {
                alert(`이 지역은 레벨 ${region.levelReq} 이상이어야 입장할 수 있습니다.`);
                return;
            }
            
            // 1. 모든 카드의 선택 효과 제거
            document.querySelectorAll('.region-card').forEach(c => {
                c.style.border = "1px solid #aaa";
                c.style.background = "rgba(0,0,0,0.7)";
            });
            
            // 2. 현재 클릭한 카드 강조
            div.style.border = "2px solid #f1c40f"; 
            div.style.background = "rgba(100, 80, 120, 0.8)";
            
            // 3. 입장 버튼 활성화
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

// "입장하기" 버튼 클릭 시 실행
function enterSelectedRegion() {
    if (selectedRegionId === null) {
        alert("먼저 탐험할 지역을 선택해주세요.");
        return;
    }
    startExplore(selectedRegionId);
}

// 화면 전환 유틸리티 (지도 <-> 진행화면)
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

// 2. 탐험 시작 (실제 게임 화면으로 진입)
function startExplore(regionId) {
    currentRegionId = regionId;
    movesLeft = 10;
    tempLoot = []; // 임시 가방 초기화
    isExploreActive = true;

    toggleExploreView('run');
    
    // UI 초기화
    const region = REGION_DATA[regionId];
    
    // 배경 설정 (기본 어두운 배경)
    const bgElem = document.getElementById('explore-bg');
    bgElem.style.backgroundColor = "#222"; 
    
    document.getElementById('region-title').innerText = region.name;
    document.getElementById('event-msg').innerText = "탐험을 시작합니다. 이동하세요.";
    
    updateMoveUI(); // 버튼 상태 초기화
}

// 3. 이동하기 (👣 이동 버튼 클릭)
function moveForward() {
    if (movesLeft <= 0 || !isExploreActive) return;

    movesLeft--;
    
    // 걷는 효과 (CSS 애니메이션)
    const bg = document.getElementById('explore-bg');
    bg.classList.add('walking');
    setTimeout(() => bg.classList.remove('walking'), 500);

    // 랜덤 이벤트 발생
    processRandomEvent();
    
    // UI 갱신 (이동 횟수 차감 및 버튼 상태 변경)
    updateMoveUI();
}

// UI 갱신 (탐험 종료 처리 로직 포함)
function updateMoveUI() {
    const counter = document.getElementById('move-counter');
    const moveBtn = document.getElementById('btn-move');
    const returnBtn = document.getElementById('btn-return');

    counter.innerText = `남은 이동: ${movesLeft}`;
    
    if (movesLeft <= 0) {
        // [이동 종료]
        document.getElementById('event-msg').innerText = "날이 저물었습니다. 귀환하세요.";
        
        // 이동 버튼 비활성화
        moveBtn.disabled = true;
        moveBtn.style.opacity = 0.5;
        moveBtn.innerText = "이동 불가";

        // 귀환 버튼을 '보상 받기' 버튼으로 변경 (강조)
        returnBtn.innerText = "🎁 보상 받기";
        returnBtn.classList.remove('sub'); // 회색 스타일 제거
        returnBtn.style.color = "#2ecc71"; // 녹색 텍스트
        returnBtn.onclick = () => finishExplore(true); // 성공 처리
    } else {
        // [진행 중]
        moveBtn.disabled = false;
        moveBtn.style.opacity = 1;
        moveBtn.innerText = "👣 이동";
        
        // 귀환 버튼은 '중도 포기' 상태
        returnBtn.innerText = "🏠 중도 포기";
        returnBtn.classList.add('sub');
        returnBtn.style.color = "#aaa"; 
        returnBtn.onclick = () => finishExplore(false); // 포기 처리
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
        addTempLoot("nest_wood", amount); // player.js의 함수 호출
        msgArea.innerText = `🔍 둥지 재료를 ${amount}개 발견했습니다!`;
    } 
    else {
        msgArea.innerText = "❗ 용의 둥지를 발견했습니다!";
        encounterNest();
    }
}

// 5. 둥지 조우 및 훔치기
function encounterNest() {
    isExploreActive = false; // 이동 잠시 중단
    stealAttempts = 3; 

    // UI가 그려진 뒤 confirm 창을 띄우기 위해 약간 지연
    setTimeout(() => {
        if(confirm("용의 둥지를 발견했습니다!\n알을 훔치시겠습니까?")) {
            tryStealLoop();
        } else {
            isExploreActive = true;
            document.getElementById('event-msg').innerText = "둥지를 조용히 지나쳤습니다.";
            // 만약 이동 횟수가 끝났다면 UI 업데이트
            if(movesLeft <= 0) updateMoveUI();
        }
    }, 100);
}

function tryStealLoop() {
    if (stealAttempts <= 0) {
        wakeParentDragon();
        return;
    }
    const success = Math.random() < 0.5; // 50% 성공률
    
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

// 6. 부모 용 전투/도망
function wakeParentDragon() {
    // 배경 붉게 경고
    document.getElementById('explore-bg').style.backgroundColor = "#500"; 
    document.getElementById('event-msg').innerText = "크아앙! 부모 용 출현!";
    
    setTimeout(() => {
        const choice = confirm("부모 용에게 들켰습니다! 싸우시겠습니까?\n(승리 시 알 획득, 패배 시 전리품 모두 분실)");
        if (choice) fightParent();
        else tryFlee();
    }, 100);
}

function tryFlee() {
    if (Math.random() < 0.3) { // 30% 도망 성공
        alert("휴... 간신히 도망쳤습니다.");
        finishExplore(true); // 생환
    } else {
        alert("도망 실패! 용의 브레스에 당했습니다.\n전리품을 모두 잃었습니다.");
        clearTempLoot(); // 임시 가방 비우기
        finishExplore(false); // 실패 처리
    }
}

function fightParent() {
    const win = Math.random() < 0.4; // 40% 승리 확률
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

// 7. 탐험 종료 및 귀환 (가장 중요한 부분)
function finishExplore(success = true) {
    // 1. 전리품 정산 (player.js의 claimTempLoot 호출)
    const lootMsg = claimTempLoot();
    
    if (success && lootMsg) {
        alert(`[탐험 완료]\n마을에 무사히 도착했습니다.\n\n${lootMsg}`);
    } else if (!success) {
        alert("[탐험 실패]\n빈손으로 돌아왔습니다.");
        clearTempLoot(); // 실패 시 전리품 증발
    } else {
        alert("마을로 돌아왔습니다.");
    }

    // 2. UI 복구
    const moveBtn = document.getElementById('btn-move');
    if(moveBtn) {
        moveBtn.disabled = false;
        moveBtn.style.opacity = 1;
        moveBtn.innerText = "👣 이동";
    }
    document.getElementById('explore-bg').style.backgroundColor = "#222";
    
    // 3. 화면 전환 (지도로 복귀)
    toggleExploreView('map');
    
    // 4. 데이터 및 UI 갱신
    updateCurrency();
    
    // ★ [버그 수정] 가방(Inventory) UI 강제 갱신
    // 이 부분이 호출되어야 획득한 아이템이 가방 탭에 바로 보입니다.
    if(typeof renderInventory === 'function') {
        renderInventory(); 
    } else {
        console.error("renderInventory 함수를 찾을 수 없습니다. main.js가 로드되었는지 확인하세요.");
    }
}

// 초기화 함수 (main.js에서 호출됨)
window.initExploreTab = function() {
    renderMap();
}
// 전역 함수 연결 (HTML onclick 속성에서 사용)
window.enterSelectedRegion = enterSelectedRegion;

