// ==========================================
// js/explore.js (CSS 드래곤 폴백 적용)
// ==========================================

window.isExploreActive = false; 

let currentRegionId = -1;
let movesLeft = 0;
let stealAttempts = 0; 
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
        
        const typeColor = {
            fire:'#e74c3c', water:'#3498db', forest:'#2ecc71', 
            electric:'#f1c40f', metal:'#95a5a6', light:'#fffacd', dark:'#8e44ad'
        };
        const borderColor = typeColor[region.type] || '#fff';
        
        div.className = `region-card ${isLocked ? 'locked' : ''}`;
        div.style.borderColor = borderColor; 

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
                c.style.borderWidth = "1px";
                c.style.borderStyle = "solid";
                c.style.borderColor = "#aaa"; 
                c.style.background = "rgba(0,0,0,0.7)";
            });
            
            div.style.border = `2px solid ${borderColor}`; 
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

    toggleExploreView('run');
    
    const region = REGION_DATA[regionId];
    const bgElem = document.getElementById('explore-bg');
    
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
    if (movesLeft <= 0 || !window.isExploreActive) return;

    movesLeft--;
    
    const bg = document.getElementById('explore-bg');
    bg.classList.remove('walking-anim');
    void bg.offsetWidth; 
    bg.classList.add('walking-anim');

    processRandomEvent();
    updateMoveUI();
}

function updateMoveUI() {
    const counter = document.getElementById('move-counter');
    const moveBtn = document.getElementById('btn-move');
    const returnBtn = document.getElementById('btn-return');

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
        moveBtn.disabled = !window.isExploreActive;
        moveBtn.style.opacity = window.isExploreActive ? 1 : 0.5;
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
    const moveBtn = document.getElementById('btn-move');
    if(moveBtn) moveBtn.disabled = true;

    stealAttempts = 3; 

    const regionType = REGION_DATA[currentRegionId].type;
    const eggId = `egg_${regionType}`; 
    
    const nestImg = (typeof ITEM_DB !== 'undefined' && ITEM_DB[eggId]) ? ITEM_DB[eggId].img : "assets/images/dragon/stage_egg.png";

    // [수정] 둥지 알 이미지에 onerror 적용 (stage 0)
    setTimeout(() => {
        showConfirm(
            `<div style="text-align:center;">
                <img src="${nestImg}" style="width:80px;" onerror="handleImgError(this, '${regionType}', 0)"><br>
                <b>[${REGION_DATA[currentRegionId].name}] 둥지 발견!</b><br>
                알을 훔치시겠습니까?
            </div>`, 
            () => { tryStealLoop(eggId); }, 
            () => { 
                document.getElementById('event-msg').innerText = "둥지를 조용히 지나쳤습니다.";
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
        showAlert("성공! 알을 손에 넣었습니다!<br>(탐험을 성공적으로 마칩니다)", () => {
            addTempLoot(eggId, 1); 
            finishExplore(true);
        });
    } else {
        stealAttempts--;
        if (stealAttempts > 0) {
            showConfirm(`실패... 알이 너무 무겁습니다.\n(남은 기회: ${stealAttempts})\n다시 시도하시겠습니까?`,
                () => { tryStealLoop(eggId); }, 
                () => {
                    document.getElementById('event-msg').innerText = "위험을 느끼고 물러났습니다.";
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
    document.getElementById('explore-bg').style.backgroundColor = "#500"; 
    document.getElementById('event-msg').innerText = "크아앙! 부모 용 출현!";
    
    const regionType = REGION_DATA[currentRegionId].type; // 부모 용의 속성 확인

    setTimeout(() => {
        const atk = player.stats ? player.stats.atk : 10;
        const winChance = Math.min(90, 30 + atk); 

        // [수정] 부모 용 이미지에 onerror 적용 (stage 3: 성룡)
        showConfirm(
            `<div style="text-align:center; color:#ff6b6b">
                <img src="assets/images/dragon/stage_adult.png" style="width:100px; filter: drop-shadow(0 0 5px red);"
                 onerror="handleImgError(this, '${regionType}', 3)"><br>
                <b>부모 용에게 들켰습니다!</b><br>
                (승률: 약 ${winChance}%)<br>
                싸우시겠습니까?
            </div>`,
            () => fightParent(winChance, eggId),
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

function fightParent(winChance, eggId) {
    const roll = Math.random() * 100;
    const win = roll < winChance; 

    if (win) {
        addTempLoot(eggId, 1); 
        let msg = "대단합니다! 부모 용을 물리쳤습니다!";
        if (Math.random() < 0.3) { 
             player.gem += 1;
             msg += "<br><b style='color:#3498db'>(보너스: 보석 1개 획득!)</b>";
        }
        showAlert(msg + "<br>(탐험을 성공적으로 마칩니다)", () => {
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
    if (!window.isExploreActive) return;

    window.isExploreActive = false; 

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
        
        if(success) {
            const xpGain = (currentRegionId * 5) + 5;
            if(window.gainExp) window.gainExp(xpGain);
        }

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

function claimTempLoot() {
    if (tempLoot.length === 0) return "";
    
    let html = "<div style='background:rgba(0,0,0,0.3); padding:10px; border-radius:5px; display:inline-block; text-align:left; width:80%;'>";
    
    tempLoot.forEach(item => {
        if (item.id === 'gold') {
            player.gold += item.count;
            html += `<div style="margin-bottom:5px; display:flex; align-items:center;">
                        <img src="assets/images/ui/icon_gold.png" style="width:20px; margin-right:5px;">
                        <span style="color:#f1c40f">${item.count} 골드</span>
                     </div>`;
        } else if (item.id === 'gem') {
            player.gem += item.count;
            html += `<div style="margin-bottom:5px; display:flex; align-items:center;">
                        <img src="assets/images/ui/icon_gem.png" style="width:20px; margin-right:5px;">
                        <span style="color:#3498db">${item.count} 보석</span>
                     </div>`;
        } else {
            const itemData = ITEM_DB[item.id];
            const itemName = itemData ? itemData.name : "아이템";
            const itemImg = itemData ? itemData.img : "assets/images/ui/icon_question.png";
            
            addItem(item.id, item.count);
            html += `<div style="margin-bottom:5px; display:flex; align-items:center;">
                        <img src="${itemImg}" style="width:24px; margin-right:5px;">
                        <span>${itemName} x${item.count}</span>
                     </div>`;
        }
    });
    
    html += "</div>";
    tempLoot = [];
    return html;
}

window.initExploreTab = function() { renderMap(); }
window.enterSelectedRegion = enterSelectedRegion;
