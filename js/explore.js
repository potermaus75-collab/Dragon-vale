// ==========================================
// js/explore.js (최종: 버튼 버그 수정)
// ==========================================

window.isExploreActive = false; 

let currentRegionId = -1;
let movesLeft = 0;
let stealAttempts = 0; 
let selectedRegionId = null;

window.initExploreTab = function() {
    renderMap();
    updateMapCurrency(); 
};

function updateMapCurrency() {
    const goldUI = document.getElementById('ui-gold-map');
    const gemUI = document.getElementById('ui-gem-map');
    if(goldUI) goldUI.innerText = player.gold;
    if(gemUI) gemUI.innerText = player.gem;
}

function renderMap() {
    const list = document.getElementById('map-icons-layer');
    const enterBtn = document.getElementById('btn-enter-region');
    
    if(!list) return; 
    list.innerHTML = "";
    
    if(enterBtn) {
        enterBtn.disabled = true;
        enterBtn.innerText = "지역을 선택하세요";
        enterBtn.style.color = "#888";
    }

    REGION_DATA.forEach(region => {
        const div = document.createElement('div');
        div.className = `map-icon loc-${region.type}`; 
        
        if (player.level < region.levelReq) {
            div.classList.add('locked');
            div.onclick = () => showAlert(`[${region.name}] 접근 불가\n(Lv.${region.levelReq} 이상 필요)`);
        } else {
            div.onclick = () => selectRegion(region.id, div);
        }
        list.appendChild(div);
    });
}

function selectRegion(id, element) {
    selectedRegionId = id;
    document.querySelectorAll('.map-icon').forEach(icon => icon.classList.remove('selected'));
    element.classList.add('selected');
    
    const enterBtn = document.getElementById('btn-enter-region');
    if(enterBtn) {
        enterBtn.disabled = false;
        enterBtn.innerText = "진입하기";
        enterBtn.style.color = "#5dade2";
    }
}

function enterSelectedRegion() {
    if (window.isExploreActive) return; 
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
        updateMapCurrency();
    } else {
        mapDiv.classList.add('hidden');
        runDiv.classList.remove('hidden');
    }
}

function startExplore(regionId) {
    currentRegionId = regionId;
    movesLeft = 10;
    tempLoot = []; 
    window.isExploreActive = true; 

    saveExploreState();
    toggleExploreView('run');
    
    const region = REGION_DATA[regionId];
    const bgElem = document.getElementById('explore-bg');
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
        // [중요] 여기서 finishExplore(true)를 호출할 때 클릭이 막히지 않도록 확인
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

function processRandomEvent() {
    const roll = Math.floor(Math.random() * 100);
    const msgArea = document.getElementById('event-msg');

    if (roll < 20) {
        msgArea.innerHTML = "조용합니다...";
    } else if (roll < 85) {
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
    } else {
        msgArea.innerHTML = `<span style="color:#ff6b6b; font-weight:bold;">용의 기운이 느껴집니다!</span>`;
        encounterNest();
    }
}

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
    // [수정] 보상 받기 버튼 클릭 시 이미 active가 아니어도 진행 가능하도록 조건 완화
    // window.isExploreActive = false; (이미 false일 수 있음)

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
        showAlert(`<div style="text-align:center"><b>[탐험 완료]</b><br>마을에 무사히 도착했습니다.<br><br>${lootMsg}</div>`, onComplete);
    } else if (!success) {
        showAlert("빈손으로 돌아왔습니다.", onComplete);
        clearTempLoot();
        player.exploreState = null;
        if(window.saveGame) window.saveGame(true);
    } else {
        showAlert("마을로 돌아왔습니다.", onComplete);
    }
    
    // 상태 초기화
    window.isExploreActive = false;
}

function addTempLoot(itemId, count = 1) {
    tempLoot.push({ id: itemId, count: count });
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

// [복구]
window.restoreExploration = function() {
    if (!player.exploreState) return;
    const state = player.exploreState;
    currentRegionId = state.regionId;
    movesLeft = state.moves;
    tempLoot = state.loot || [];
    window.isExploreActive = true;

    const tabExplore = document.getElementById('tab-explore');
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    tabExplore.classList.remove('hidden');
    document.getElementById('explore-map-view').classList.add('hidden');
    document.getElementById('explore-run-view').classList.remove('hidden');

    const region = REGION_DATA[currentRegionId];
    const bgElem = document.getElementById('explore-bg');
    if (region.bg) {
        bgElem.style.backgroundImage = `url('${region.bg}')`;
        bgElem.style.backgroundSize = "cover";
        bgElem.style.backgroundPosition = "center";
    }
    document.getElementById('region-title').innerText = region.name;
    document.getElementById('event-msg').innerText = "탐험을 재개합니다.";
    updateMoveUI();
};

window.initExploreTab = initExploreTab;
window.enterSelectedRegion = enterSelectedRegion;
