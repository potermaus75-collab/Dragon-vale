// ==========================================
// js/explore.js (수정된 완전한 코드)
// ==========================================

let currentRegionId = -1;
let movesLeft = 0;
let stealAttempts = 0; 
let isExploreActive = false; // [핵심] 중복 실행 방지 플래그
let selectedRegionId = null;

function renderMap() {
    const list = document.getElementById('region-list');
    if(!list) return; 
    list.innerHTML = "";
    
    const enterBtn = document.querySelector('.enter-btn') || document.querySelector('#tab-explore button');
    
    if(enterBtn) {
        enterBtn.disabled = true;
        enterBtn.style.filter = "grayscale(1)";
        enterBtn.innerText = "지역을 선택하세요";
    }

    REGION_DATA.forEach(region => {
        const div = document.createElement('div');
        const isLocked = player.level < region.levelReq;
        
        div.className = `region-card ${isLocked ? 'locked' : ''}`;
        div.innerHTML = `
            <h3>${region.name}</h3>
            <p style="font-size:0.8rem; color:#aaa;">${isLocked ? `Lv.${region.levelReq} 필요` : region.desc}</p>
        `;
        
        div.onclick = () => {
            if(isLocked) {
                showAlert(`이 지역은 레벨 ${region.levelReq} 이상이어야 입장할 수 있습니다.`);
                return;
            }
            document.querySelectorAll('.region-card').forEach(c => {
                c.style.border = "1px solid #aaa";
                c.style.background = "rgba(0,0,0,0.7)";
            });
            div.style.border = "2px solid #f1c40f"; 
            div.style.background = "rgba(100, 80, 120, 0.8)";
            
            selectedRegionId = region.id;
            if(enterBtn) {
                enterBtn.disabled = false;
                enterBtn.style.filter = "grayscale(0)";
                enterBtn.innerText = `[${region.name}] 입장하기`;
            }
        };
        list.appendChild(div);
    });
    toggleExploreView('map');
}

function enterSelectedRegion() {
    // 이미 탐험 중이라면 중복 진입 방지
    if (isExploreActive) return;

    if (selectedRegionId === null) {
        showAlert("먼저 탐험할 지역을 선택해주세요.");
        return;
    }
    startExplore(selectedRegionId);
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

function startExplore(regionId) {
    currentRegionId = regionId;
    movesLeft = 10;
    tempLoot = []; 
    isExploreActive = true; // 탐험 시작 플래그 ON

    toggleExploreView('run');
    
    const region = REGION_DATA[regionId];
    const bgElem = document.getElementById('explore-bg');
    
    // 배경 이미지 설정
    if (region.bg) {
        bgElem.style.backgroundImage = `url('${region.bg}')`;
        bgElem.style.backgroundSize = "cover";
        bgElem.style.backgroundPosition = "center";
    } else {
        bgElem.style.backgroundImage = "none";
        bgElem.style.backgroundColor = "#222"; 
    }
    
    document.getElementById('region-title').innerText = region.name;
    document.getElementById('event-msg').innerHTML = "탐험을 시작합니다. 이동하세요.";
    
    updateMoveUI();
}

function moveForward() {
    // [중요] 탐험 비활성화 상태거나 이동 횟수가 없으면 동작 안 함
    if (movesLeft <= 0 || !isExploreActive) return;

    movesLeft--;
    
    // 흔들림 효과
    const bg = document.getElementById('explore-bg');
    bg.classList.remove('walking-anim');
    void bg.offsetWidth; // 리플로우 강제
    bg.classList.add('walking-anim');

    processRandomEvent();
    updateMoveUI();
}

function updateMoveUI() {
    const counter = document.getElementById('move-counter');
    const moveBtn = document.getElementById('btn-move');
    const returnBtn = document.getElementById('btn-return');

    counter.innerHTML = `<img src="assets/images/ui/icon_move.png" style="width:16px; vertical-align:middle"> 남은 이동: ${movesLeft}`;
    
    // 이동 버튼 상태 제어
    if (movesLeft <= 0) {
        document.getElementById('event-msg').innerText = "날이 저물었습니다. 귀환하세요.";
        moveBtn.disabled = true;
        moveBtn.style.opacity = 0.5;
        moveBtn.innerHTML = "이동 불가";

        returnBtn.innerHTML = "<img src='assets/images/ui/icon_gift.png' style='width:20px;vertical-align:middle'> 보상 받기";
        returnBtn.classList.remove('sub');
        returnBtn.style.color = "#2ecc71";
        // 성공 귀환
        returnBtn.onclick = () => finishExplore(true);
    } else {
        // 이동 가능 상태일 때만 버튼 활성화 (이벤트 중이면 비활성화 처리 가능)
        moveBtn.disabled = !isExploreActive;
        moveBtn.style.opacity = isExploreActive ? 1 : 0.5;
        moveBtn.innerHTML = "<img src='assets/images/ui/icon_move.png' style='width:20px;vertical-align:middle'> 이동";
        
        returnBtn.innerHTML = "<img src='assets/images/ui/icon_home.png' style='width:20px;vertical-align:middle'> 중도 포기";
        returnBtn.classList.add('sub');
        returnBtn.style.color = "#aaa"; 
        // 포기 귀환
        returnBtn.onclick = () => finishExplore(false);
    }
}

function processRandomEvent() {
    const roll = Math.floor(Math.random() * 100);
    const msgArea = document.getElementById('event-msg');

    if (roll < ENCOUNTER_RATES.NOTHING) {
        msgArea.innerHTML = "조용합니다... 바람 소리만 들립니다.";
    } 
    else if (roll < ENCOUNTER_RATES.NOTHING + ENCOUNTER_RATES.RESOURCE) {
        const typeRoll = Math.random();
        
        if (typeRoll < 0.6) { 
            const goldAmt = Math.floor(Math.random() * 50) + 10;
            addTempLoot("gold", goldAmt);
             msgArea.innerHTML = `<img src="assets/images/ui/icon_gold.png" style="width:20px; vertical-align:middle"> <b style="color:#f1c40f">${goldAmt} 골드</b>를 주웠습니다!`;
        } else if (typeRoll < 0.9) { 
             const woodAmt = Math.floor(Math.random() * 2) + 1;
             addTempLoot("nest_wood", woodAmt);
             msgArea.innerHTML = `🔍 둥지 재료를 ${woodAmt}개 발견했습니다!`;
        } else { 
             const gemAmt = 1;
             addTempLoot("gem", gemAmt);
             msgArea.innerHTML = `<img src="assets/images/ui/icon_gem.png" style="width:20px; vertical-align:middle"> <b style="color:#3498db">반짝이는 보석</b>을 발견했습니다!`;
        }
    } 
    else {
        msgArea.innerHTML = `<div style="color:red; font-weight:bold; animation: blinker 0.2s infinite;">⚠️ 경고: 용의 기운이 느껴집니다! ⚠️</div>`;
        encounterNest();
    }
}

function encounterNest() {
    isExploreActive = false; // [중요] 이벤트 중 이동 차단
    updateMoveUI(); // 버튼 비활성화 적용

    stealAttempts = 3; 

    setTimeout(() => {
        showConfirm(
            `<div style="text-align:center;">
                <img src="assets/images/dragon/stage_egg.png" style="width:80px;"><br>
                <b>용의 둥지를 발견했습니다!</b><br>
                알을 훔치시겠습니까?
            </div>`, 
            () => { tryStealLoop(); },
            () => { 
                isExploreActive = true; // [중요] 거절 시 다시 이동 가능
                document.getElementById('event-msg').innerText = "둥지를 조용히 지나쳤습니다.";
                updateMoveUI();
            }
        );
    }, 100);
}

function tryStealLoop() {
    if (stealAttempts <= 0) {
        wakeParentDragon();
        return;
    }
    const success = Math.random() < 0.5; 
    
    if (success) {
        showAlert("성공! 알을 손에 넣었습니다!", () => {
            addTempLoot("egg_random", 1);
            isExploreActive = true; // 성공 후 이동 재개
            document.getElementById('event-msg').innerText = "알을 챙겨서 도망쳤습니다.";
            updateMoveUI();
        });
    } else {
        stealAttempts--;
        if (stealAttempts > 0) {
            showConfirm(`실패... 알이 너무 무겁습니다.\n(남은 기회: ${stealAttempts})\n다시 시도하시겠습니까?`,
                () => { tryStealLoop(); }, 
                () => {
                    isExploreActive = true; // 포기 후 이동 재개
                    document.getElementById('event-msg').innerText = "위험을 느끼고 물러났습니다.";
                    updateMoveUI();
                }
            );
        } else {
            wakeParentDragon();
        }
    }
}

function wakeParentDragon() {
    document.getElementById('explore-bg').style.backgroundColor = "#500"; 
    document.getElementById('event-msg').innerText = "크아앙! 부모 용 출현!";
    
    setTimeout(() => {
        const atk = player.stats ? player.stats.atk : 10;
        const winChance = Math.min(90, 30 + atk); 

        showConfirm(
            `<div style="text-align:center; color:#ff6b6b">
                <img src="assets/images/dragon/stage_adult.png" style="width:100px; filter: drop-shadow(0 0 5px red);"><br>
                <b>부모 용에게 들켰습니다!</b><br>
                (승률: 약 ${winChance}%)<br>
                싸우시겠습니까?
            </div>`,
            () => fightParent(winChance),
            () => tryFlee()
        );
    }, 500);
}

function tryFlee() {
    if (Math.random() < 0.3) { 
        showAlert("휴... 간신히 도망쳤습니다.", () => finishExplore(true));
    } else {
        showAlert("도망 실패! 용의 브레스에 당했습니다.\n전리품을 모두 잃었습니다.", () => {
            clearTempLoot();
            finishExplore(false);
        });
    }
}

function fightParent(winChance) {
    const roll = Math.random() * 100;
    const win = roll < winChance; 

    if (win) {
        addTempLoot("egg_random", 1);
        let msg = "대단합니다! 부모 용을 물리쳤습니다!";
        if (Math.random() < 0.3) { 
             player.gem += 1;
             msg += "<br><b style='color:#3498db'>(보너스: 보석 1개 획득!)</b>";
        }

        showAlert(msg, () => {
            finishExplore(true);
        });
    } else {
        showAlert("패배했습니다... 눈앞이 캄캄해집니다.", () => {
            clearTempLoot();
            finishExplore(false);
        });
    }
}

// [핵심] 탐험 종료 로직 (중복 실행 방지 적용)
function finishExplore(success = true) {
    // 1. 이미 탐험이 끝난 상태라면 즉시 리턴 (중복 호출 방지)
    if (!isExploreActive) return;

    // 2. 상태 닫음
    isExploreActive = false; 

    const lootMsg = claimTempLoot();
    
    const onComplete = () => {
        const moveBtn = document.getElementById('btn-move');
        if(moveBtn) {
            moveBtn.disabled = false;
            moveBtn.style.opacity = 1;
            moveBtn.innerHTML = "<img src='assets/images/ui/icon_move.png' style='width:20px;vertical-align:middle'> 이동";
        }
        document.getElementById('explore-bg').style.backgroundColor = "#222";
        document.getElementById('explore-bg').style.backgroundImage = "none";
        
        toggleExploreView('map');
        updateCurrency();
        
        if(typeof renderInventory === 'function') renderInventory();
        if(typeof saveGame === 'function') saveGame();
    };

    if (success && lootMsg) {
        showAlert(`<div style="text-align:center"><b>[탐험 완료]</b><br>마을에 무사히 도착했습니다.<br><br>${lootMsg}</div>`, onComplete);
    } else if (!success) {
        showAlert("[탐험 실패]\n빈손으로 돌아왔습니다.", onComplete);
        clearTempLoot();
    } else {
        showAlert("마을로 돌아왔습니다.", onComplete);
    }
}

// 전역 할당
window.initExploreTab = function() { renderMap(); }
window.enterSelectedRegion = enterSelectedRegion;
