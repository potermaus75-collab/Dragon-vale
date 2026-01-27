// ==========================================
// js/explore.js
// ==========================================

let currentRegionId = -1;
let movesLeft = 0;
let stealAttempts = 0; 
let isExploreActive = false;
let selectedRegionId = null;

function renderMap() {
    const list = document.getElementById('region-list');
    if(!list) return; 
    list.innerHTML = "";
    
    // 버튼 찾기 (main.js가 생성한 구조에 맞춤)
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
        // 텍스트 위주지만 필요시 이미지 추가 가능
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
    isExploreActive = true;

    toggleExploreView('run');
    
    const region = REGION_DATA[regionId];
    const bgElem = document.getElementById('explore-bg');
    bgElem.style.backgroundColor = "#222"; 
    
    document.getElementById('region-title').innerText = region.name;
    document.getElementById('event-msg').innerHTML = "탐험을 시작합니다. 이동하세요.";
    
    updateMoveUI();
}

function moveForward() {
    if (movesLeft <= 0 || !isExploreActive) return;

    movesLeft--;
    const bg = document.getElementById('explore-bg');
    bg.classList.add('walking');
    setTimeout(() => bg.classList.remove('walking'), 500);

    processRandomEvent();
    updateMoveUI();
}

function updateMoveUI() {
    const counter = document.getElementById('move-counter');
    const moveBtn = document.getElementById('btn-move');
    const returnBtn = document.getElementById('btn-return');

    // 이동 아이콘 추가
    counter.innerHTML = `<img src="assets/images/ui/icon_move.png" style="width:16px; vertical-align:middle"> 남은 이동: ${movesLeft}`;
    
    if (movesLeft <= 0) {
        document.getElementById('event-msg').innerText = "날이 저물었습니다. 귀환하세요.";
        moveBtn.disabled = true;
        moveBtn.style.opacity = 0.5;
        moveBtn.innerHTML = "이동 불가";

        returnBtn.innerHTML = "<img src='assets/images/ui/icon_gift.png' style='width:20px;vertical-align:middle'> 보상 받기";
        returnBtn.classList.remove('sub');
        returnBtn.style.color = "#2ecc71";
        returnBtn.onclick = () => finishExplore(true);
    } else {
        moveBtn.disabled = false;
        moveBtn.style.opacity = 1;
        moveBtn.innerHTML = "<img src='assets/images/ui/icon_move.png' style='width:20px;vertical-align:middle'> 이동";
        
        returnBtn.innerHTML = "<img src='assets/images/ui/icon_home.png' style='width:20px;vertical-align:middle'> 중도 포기";
        returnBtn.classList.add('sub');
        returnBtn.style.color = "#aaa"; 
        returnBtn.onclick = () => finishExplore(false);
    }
}

function processRandomEvent() {
    const roll = Math.floor(Math.random() * 100);
    const msgArea = document.getElementById('event-msg');

    if (roll < ENCOUNTER_RATES.NOTHING) {
        msgArea.innerHTML = "조용합니다... 아무것도 없습니다.";
    } 
    else if (roll < ENCOUNTER_RATES.NOTHING + ENCOUNTER_RATES.MATERIAL) {
        const amount = Math.floor(Math.random() * 3) + 1;
        addTempLoot("nest_wood", amount);
        
        // [수정] 아이콘과 함께 메시지 출력
        const itemImg = ITEM_DB["nest_wood"].img;
        msgArea.innerHTML = `<img src="assets/images/ui/icon_search.png" style="width:20px; vertical-align:middle"> <img src="${itemImg}" style="width:24px; vertical-align:middle"> 둥지 재료를 ${amount}개 발견했습니다!`;
    } 
    else {
        msgArea.innerHTML = `<img src="assets/images/ui/icon_alert.png" style="width:24px; vertical-align:middle; animation: blinker 0.5s infinite;"> <b style="color:#e74c3c">용의 둥지를 발견했습니다!</b>`;
        encounterNest();
    }
}

function encounterNest() {
    isExploreActive = false; 
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
                isExploreActive = true;
                document.getElementById('event-msg').innerText = "둥지를 조용히 지나쳤습니다.";
                if(movesLeft <= 0) updateMoveUI();
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
            isExploreActive = true;
            document.getElementById('event-msg').innerText = "알을 챙겨서 도망쳤습니다.";
            if(movesLeft <= 0) updateMoveUI();
        });
    } else {
        stealAttempts--;
        if (stealAttempts > 0) {
            showConfirm(`실패... 알이 너무 무겁습니다.\n(남은 기회: ${stealAttempts})\n다시 시도하시겠습니까?`,
                () => { tryStealLoop(); }, 
                () => {
                    isExploreActive = true;
                    document.getElementById('event-msg').innerText = "위험을 느끼고 물러났습니다.";
                    if(movesLeft <= 0) updateMoveUI();
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
        showConfirm(
            `<div style="text-align:center; color:#ff6b6b">
                <img src="assets/images/dragon/stage_adult.png" style="width:100px; filter: drop-shadow(0 0 5px red);"><br>
                <b>부모 용에게 들켰습니다!</b><br>
                싸우시겠습니까?
            </div>`,
            () => fightParent(),
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

function fightParent() {
    const win = Math.random() < 0.4; 
    if (win) {
        showAlert("대단합니다! 부모 용을 물리쳤습니다!", () => {
            addTempLoot("egg_random", 1);
            finishExplore(true);
        });
    } else {
        showAlert("패배했습니다... 눈앞이 캄캄해집니다.", () => {
            clearTempLoot();
            finishExplore(false);
        });
    }
}

function finishExplore(success = true) {
    const lootMsg = claimTempLoot();
    
    const onComplete = () => {
        const moveBtn = document.getElementById('btn-move');
        if(moveBtn) {
            moveBtn.disabled = false;
            moveBtn.style.opacity = 1;
            moveBtn.innerHTML = "<img src='assets/images/ui/icon_move.png' style='width:20px;vertical-align:middle'> 이동";
        }
        document.getElementById('explore-bg').style.backgroundColor = "#222";
        toggleExploreView('map');
        updateCurrency();
        
        if(typeof renderInventory === 'function') renderInventory();
        if(typeof saveGame === 'function') saveGame();
    };

    if (success && lootMsg) {
        // [수정] HTML 결과 메시지 출력
        showAlert(`<div style="text-align:center"><b>[탐험 완료]</b><br>마을에 무사히 도착했습니다.<br><br>${lootMsg}</div>`, onComplete);
    } else if (!success) {
        showAlert("[탐험 실패]\n빈손으로 돌아왔습니다.", onComplete);
        clearTempLoot();
    } else {
        showAlert("마을로 돌아왔습니다.", onComplete);
    }
}

window.initExploreTab = function() { renderMap(); }
window.enterSelectedRegion = enterSelectedRegion;

