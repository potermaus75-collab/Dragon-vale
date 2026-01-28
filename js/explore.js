// ==========================================
// js/explore.js (최종: 지도 UI 연동)
// ==========================================

window.isExploreActive = false; 

let currentRegionId = -1;
let movesLeft = 0;
let stealAttempts = 0; 
let selectedRegionId = null;

// [UI] 초기화 및 지도 렌더링
window.initExploreTab = function() {
    renderMap();
    updateMapCurrency(); // 상단 재화 표시
};

function updateMapCurrency() {
    const goldUI = document.getElementById('ui-gold-map');
    const gemUI = document.getElementById('ui-gem-map');
    if(goldUI) goldUI.innerText = player.gold;
    if(gemUI) gemUI.innerText = player.gem;
}

function renderMap() {
    const container = document.getElementById('map-icons-layer');
    const enterBtn = document.getElementById('btn-enter-region');
    
    if(!container) return;
    container.innerHTML = "";
    
    // 버튼 초기화
    if(enterBtn) {
        enterBtn.disabled = true;
        enterBtn.innerText = "지역을 선택하세요";
        enterBtn.style.color = "#888";
    }

    // REGION_DATA를 순회하며 지도 위에 아이콘 배치
    REGION_DATA.forEach(region => {
        const div = document.createElement('div');
        div.className = `map-icon loc-${region.type}`; // CSS 클래스로 위치 지정
        
        // 레벨 제한 확인
        if (player.level < region.levelReq) {
            div.classList.add('locked');
            // 잠긴 지역 클릭 시 알림
            div.onclick = () => {
                showAlert(`[${region.name}] 접근 불가\n(Lv.${region.levelReq} 이상 필요)`);
            };
        } else {
            // 해금된 지역 클릭 시 선택
            div.onclick = () => {
                selectRegion(region.id, div);
            };
        }
        
        container.appendChild(div);
    });
}

function selectRegion(id, element) {
    selectedRegionId = id;
    const region = REGION_DATA.find(r => r.id === id);
    
    // 모든 아이콘 선택 해제
    document.querySelectorAll('.map-icon').forEach(icon => icon.classList.remove('selected'));
    // 현재 아이콘 선택
    element.classList.add('selected');
    
    // 버튼 활성화
    const enterBtn = document.getElementById('btn-enter-region');
    if(enterBtn) {
        enterBtn.disabled = false;
        enterBtn.innerText = "진입하기"; // 이미지에 텍스트가 있으면 비워도 됨
        enterBtn.style.color = "#5dade2"; // 텍스트 색상 복구
    }
    
    // 선택 시 간단한 토스트 메시지나 효과음 가능
    console.log(`Region selected: ${region.name}`);
}

function enterSelectedRegion() {
    if (window.isExploreActive) return; 
    if (selectedRegionId === null) {
        showAlert("먼저 탐험할 지역을 선택해주세요.");
        return;
    }
    startExplore(selectedRegionId);
}

// [화면 전환] 지도 <-> 탐험 진행
function toggleExploreView(viewName) {
    const mapDiv = document.getElementById('explore-map-view');
    const runDiv = document.getElementById('explore-run-view');
    if(viewName === 'map') {
        mapDiv.classList.remove('hidden');
        runDiv.classList.add('hidden');
        updateMapCurrency(); // 돌아올 때 재화 갱신
    } else {
        mapDiv.classList.add('hidden');
        runDiv.classList.remove('hidden');
    }
}

// [로직] 탐험 시작
function startExplore(regionId) {
    currentRegionId = regionId;
    movesLeft = 10;
    tempLoot = []; 
    window.isExploreActive = true; 

    saveExploreState();
    toggleExploreView('run');
    
    const region = REGION_DATA[regionId];
    const bgElem = document.getElementById('explore-bg');
    
    // 탐험 배경 설정
    if (region.bg) {
        bgElem.style.backgroundImage = `url('${region.bg}')`;
        bgElem.style.backgroundSize = "cover";
        bgElem.style.backgroundPosition = "center";
    }
    
    document.getElementById('region-title').innerText = region.name;
    document.getElementById('event-msg').innerHTML = "탐험을 시작합니다.";
    
    updateMoveUI();
}

function saveExploreState() {
    player.exploreState = { regionId: currentRegionId, moves: movesLeft, loot: tempLoot };
    if(window.saveGame) window.saveGame(true); 
}

function moveForward() {
    if (movesLeft <= 0 || !window.isExploreActive) return;

    movesLeft--;
    const bg = document.getElementById('explore-bg');
    bg.classList.remove('walking-anim');
    void bg.offsetWidth; 
    bg.classList.add('walking-anim');

    processRandomEvent();
    saveExploreState();
    updateMoveUI();
}

function updateMoveUI() {
    const counter = document.getElementById('move-counter');
    const moveBtn = document.getElementById('btn-move');
    const returnBtn = document.getElementById('btn-return');

    counter.innerHTML = `👣 남은 이동: ${movesLeft}`;
    
    if (movesLeft <= 0) {
        document.getElementById('event-msg').innerText = "날이 저물었습니다. 귀환하세요.";
        moveBtn.disabled = true;
        moveBtn.style.opacity = 0.5;
        moveBtn.innerText = "종료";

        returnBtn.innerText = "보상 받기";
        returnBtn.style.color = "#2ecc71";
        returnBtn.onclick = () => finishExplore(true);
    } else {
        moveBtn.disabled = !window.isExploreActive;
        moveBtn.style.opacity = 1;
        moveBtn.innerText = "앞으로 이동";
        
        returnBtn.innerText = "중도 포기";
        returnBtn.style.color = "#aaa"; 
        returnBtn.onclick = () => finishExplore(false);
    }
}

// [이벤트] 랜덤 인카운터
function processRandomEvent() {
    const roll = Math.floor(Math.random() * 100);
    const msgArea = document.getElementById('event-msg');

    if (roll < ENCOUNTER_RATES.NOTHING) {
        msgArea.innerHTML = "조용합니다...";
    } 
    else if (roll < ENCOUNTER_RATES.NOTHING + ENCOUNTER_RATES.RESOURCE) {
        const typeRoll = Math.random();
        if (typeRoll < 0.6) { 
            const goldAmt = Math.floor(Math.random() * 50) + 10;
            addTempLoot("gold", goldAmt);
             msgArea.innerHTML = `<span style="color:#f1c40f">+${goldAmt} 골드</span> 획득!`;
        } else if (typeRoll < 0.9) { 
             const woodAmt = Math.floor(Math.random() * 2) + 1;
             addTempLoot("nest_wood", woodAmt);
             msgArea.innerHTML = `둥지 재료 ${woodAmt}개 발견!`;
        } else { 
             addTempLoot("gem", 1);
             msgArea.innerHTML = `<span style="color:#3498db">보석</span> 발견!`;
        }
    } 
    else {
        msgArea.innerHTML = `<span style="color:#ff6b6b; font-weight:bold;">용의 기운이 느껴집니다!</span>`;
        encounterNest();
    }
}

// 둥지 발견
function encounterNest() {
    const moveBtn = document.getElementById('btn-move');
    if(moveBtn) moveBtn.disabled = true;

    stealAttempts = 3; 
    const regionType = REGION_DATA[currentRegionId].type;
    const eggId = `egg_${regionType}`; 
    const nestImg = (window.ITEM_DB && window.ITEM_DB[eggId]) ? window.ITEM_DB[eggId].img : "assets/images/dragon/stage_egg.png";

    setTimeout(() => {
        showConfirm(
            `<div style="text-align:center;">
                <img src="${nestImg}" style="width:60px;" onerror="handleImgError(this)"><br>
                <b>[${REGION_DATA[currentRegionId].name}] 둥지!</b><br>
                알을 훔치시겠습니까?
            </div>`, 
            () => { tryStealLoop(eggId); }, 
            () => { 
                document.getElementById('event-msg').innerText = "조용히 지나쳤습니다.";
                if(moveBtn) moveBtn.disabled = false;
                if(movesLeft <= 0) updateMoveUI();
            }
        );
    }, 100);
}

function tryStealLoop(eggId) {
    if (stealAttempts <= 0) {
        wakeParentDragon(eggId);
        return;
    }
    const success = Math.random() < 0.5; 
    
    if (success) {
        showAlert("알 획득 성공!<br>(탐험을 마칩니다)", () => {
            addTempLoot(eggId, 1); 
            finishExplore(true);
        });
    } else {
        stealAttempts--;
        if (stealAttempts > 0) {
            showConfirm(`실패... 알이 무겁습니다.\n(남은 기회: ${stealAttempts})\n다시 시도?`,
                () => { tryStealLoop(eggId); }, 
                () => {
                    document.getElementById('event-msg').innerText = "위험해서 물러났습니다.";
                    const moveBtn = document.getElementById('btn-move');
                    if(moveBtn) moveBtn.disabled = false;
                    if(movesLeft <= 0) updateMoveUI();
                }
            );
        } else {
            wakeParentDragon(eggId);
        }
    }
}

function wakeParentDragon(eggId) {
    document.getElementById('event-msg').innerText = "부모 용 출현!";
    const regionType = REGION_DATA[currentRegionId].type; 

    setTimeout(() => {
        const atk = player.stats ? player.stats.atk : 10;
        const winChance = Math.min(90, 30 + atk); 

        showConfirm(
            `<div style="text-align:center; color:#ff6b6b">
                <b>부모 용에게 들켰습니다!</b><br>
                (승률: ${winChance}%) 싸우시겠습니까?
            </div>`,
            () => fightParent(winChance, eggId),
            () => tryFlee()
        );
    }, 500);
}

function tryFlee() {
    if (Math.random() < 0.3) { 
        showAlert("휴... 도망쳤습니다.", () => finishExplore(true));
    } else {
        showAlert("도망 실패! 공격당했습니다.\n전리품을 잃었습니다.", () => {
            clearTempLoot();
            finishExplore(false);
        });
    }
}

function fightParent(winChance, eggId) {
    const win = Math.random() * 100 < winChance; 
    if (win) {
        addTempLoot(eggId, 1); 
        let msg = "승리! 부모 용을 물리쳤습니다!";
        if (Math.random() < 0.3) { 
             addTempLoot("gem", 1);
             msg += "<br><b style='color:#3498db'>보석 획득!</b>";
        }
        showAlert(msg, () => finishExplore(true));
    } else {
        showAlert("패배했습니다...", () => {
            clearTempLoot();
            finishExplore(false);
        });
    }
}

function finishExplore(success = true) {
    if (!window.isExploreActive) return;
    window.isExploreActive = false; 

    const lootMsg = claimTempLoot();
    
    const onComplete = () => {
        const moveBtn = document.getElementById('btn-move');
        if(moveBtn) {
            moveBtn.disabled = false;
            moveBtn.style.opacity = 1;
        }
        toggleExploreView('map');
        
        if(success) {
            const xpGain = (currentRegionId * 5) + 5;
            if(window.gainExp) window.gainExp(xpGain);
        }

        player.exploreState = null;
        if(window.saveGame) window.saveGame(true);
        if(window.updateUI) window.updateUI();
    };

    if (success && lootMsg) {
        showAlert(`[탐험 완료]<br>${lootMsg}`, onComplete);
    } else if (!success) {
        showAlert("빈손으로 돌아왔습니다.", onComplete);
        clearTempLoot();
        player.exploreState = null; 
        if(window.saveGame) window.saveGame(true);
    } else {
        showAlert("마을로 돌아왔습니다.", onComplete);
    }
}

function claimTempLoot() {
    if (tempLoot.length === 0) return "";
    let html = "<div style='background:rgba(0,0,0,0.3); padding:5px; border-radius:5px; text-align:left; font-size:0.8rem;'>";
    tempLoot.forEach(item => {
        if (item.id === 'gold') {
            player.gold += item.count;
            html += `<div><span style="color:#f1c40f">${item.count} 골드</span></div>`;
        } else if (item.id === 'gem') {
            player.gem += item.count;
            html += `<div><span style="color:#3498db">${item.count} 보석</span></div>`;
        } else {
            const itemData = window.ITEM_DB ? window.ITEM_DB[item.id] : { name: "아이템" };
            addItem(item.id, item.count);
            html += `<div>${itemData.name} x${item.count}</div>`;
        }
    });
    html += "</div>";
    tempLoot = [];
    return html;
}

// [복구] 새로고침 시 탐험 복원 로직
window.restoreExploration = function() {
    if (!player.exploreState) return;
    const state = player.exploreState;
    currentRegionId = state.regionId;
    movesLeft = state.moves;
    tempLoot = state.loot || [];
    window.isExploreActive = true;

    // 강제 화면 전환
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('tab-explore').classList.remove('hidden');
    document.getElementById('explore-map-view').classList.add('hidden');
    document.getElementById('explore-run-view').classList.remove('hidden');

    const region = REGION_DATA[currentRegionId];
    document.getElementById('region-title').innerText = region.name;
    document.getElementById('event-msg').innerText = "탐험을 재개합니다.";
    
    // 배경 복구
    const bgElem = document.getElementById('explore-bg');
    if (region.bg) {
        bgElem.style.backgroundImage = `url('${region.bg}')`;
        bgElem.style.backgroundSize = "cover";
        bgElem.style.backgroundPosition = "center";
    }
    updateMoveUI();
};

window.initExploreTab = initExploreTab;
window.enterSelectedRegion = enterSelectedRegion;
