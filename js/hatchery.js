// ==========================================
// js/hatchery.js (수정됨: 수동 귀속 및 별 시스템)
// ==========================================

const dragonDisplay = document.getElementById('dragon-display');
const progressBar = document.getElementById('progress-fill');
const dragonNameUI = document.getElementById('dragon-name-ui');
const eggListArea = document.getElementById('my-egg-list');

window.renderCaveUI = function() {
    syncBookData(); 
    renderEggList();     
    renderNest();        
    renderCaveInventory(); 
};

function syncBookData() {
    if (!player.myDragons) return;
    if (!player.discovered) player.discovered = [];
    if (!player.maxStages) player.maxStages = {};

    let isUpdated = false;
    player.myDragons.forEach(dragon => {
        if (dragon.stage > 0 && !player.discovered.includes(dragon.id)) {
            player.discovered.push(dragon.id);
            isUpdated = true;
        }
        const currentRec = player.maxStages[dragon.id] || 0;
        if (dragon.stage > currentRec) {
            player.maxStages[dragon.id] = dragon.stage;
            isUpdated = true;
        }
    });

    if (isUpdated && window.saveGame) {
        window.saveGame(true);
    }
}

function renderEggList() {
    if(!eggListArea) return;
    eggListArea.innerHTML = "";
    
    player.myDragons.forEach((dragon) => {
        const div = document.createElement('div');
        const isActive = (dragon.uId === player.currentDragonUId);
        div.className = `new-slot-item ${isActive ? 'active' : ''}`;
        
        let iconSrc = "assets/images/dragon/stage_egg.png";
        if(window.getDragonImage) iconSrc = window.getDragonImage(dragon.id, dragon.stage);

        div.innerHTML = `<img src="${iconSrc}" onerror="handleImgError(this)">`;
        div.onclick = () => {
            player.currentDragonUId = dragon.uId;
            window.renderCaveUI(); 
        };
        eggListArea.appendChild(div);
    });
}

function renderNest() {
    const dragonData = player.myDragons.find(d => d.uId === player.currentDragonUId);
    
    if (!dragonData) {
        if(player.myDragons.length > 0) {
            player.currentDragonUId = player.myDragons[0].uId;
            renderNest();
        } else {
            if(dragonNameUI) dragonNameUI.innerText = "드래곤 없음";
            if(dragonDisplay) dragonDisplay.innerHTML = "";
        }
        return;
    }

    let displayName = dragonData.name;
    const starLv = window.getDragonStarLevel ? window.getDragonStarLevel(dragonData.id) : 0;
    const starStr = "★".repeat(starLv);

    if (dragonData.stage === 0) {
        displayName = (window.EGG_TYPE_NAMES && window.EGG_TYPE_NAMES[dragonData.type]) ? window.EGG_TYPE_NAMES[dragonData.type] : "미확인 알";
    } else {
        if (starLv > 0) displayName = `${displayName} <span style="color:#f1c40f">${starStr}</span>`;
    }

    if(dragonNameUI) dragonNameUI.innerHTML = displayName;

    const max = DRAGON_DATA.reqClicks[dragonData.stage] || 9999;
    const isHighTier = (dragonData.rarity === 'epic' || dragonData.rarity === 'legend');
    const maxStageLimit = isHighTier ? 4 : 3; 
    const isMaxLevel = dragonData.stage >= maxStageLimit;
    
    let percent = 0;
    if (isMaxLevel) {
        percent = 100;
        if(dragonNameUI) dragonNameUI.innerHTML += " (MAX)";
    } else {
        percent = (dragonData.clicks / max) * 100;
    }
    
    if(progressBar) progressBar.style.width = `${percent}%`;

    const gaugeText = document.querySelector('.gauge-text');
    if(gaugeText) {
        gaugeText.innerText = isMaxLevel ? "MAX" : `${Math.floor(dragonData.clicks)} / ${max}`;
    }

    let imgSrc = "assets/images/dragon/stage_egg.png"; 
    if (window.getDragonImage) {
        imgSrc = window.getDragonImage(dragonData.id, dragonData.stage);
    }

    if(dragonDisplay) {
        dragonDisplay.innerHTML = `<img src="${imgSrc}" class="main-dragon-img" onerror="handleImgError(this)">`;
        
        const imgEl = dragonDisplay.querySelector('img');
        if(dragonData.isShiny && imgEl) {
            imgEl.style.filter = "hue-rotate(150deg) brightness(1.2) drop-shadow(0 0 5px #f1c40f)";
        }

        if(imgEl) {
            if (!isMaxLevel) {
                imgEl.style.cursor = "pointer";
                imgEl.onclick = () => handleDragonClick(dragonData, imgEl);
            } else {
                // 성체 단계에서 클릭 시: 귀속 가능 여부 체크
                imgEl.style.cursor = "pointer";
                imgEl.onclick = () => checkAndBindDragon(dragonData);
            }
        }
    }
}

window.handleTouchBtn = function() {
    const dragonData = player.myDragons.find(d => d.uId === player.currentDragonUId);
    if (!dragonData) return;
    
    const isHighTier = (dragonData.rarity === 'epic' || dragonData.rarity === 'legend');
    const maxStageLimit = isHighTier ? 4 : 3;
    
    if(dragonData.stage >= maxStageLimit) {
        checkAndBindDragon(dragonData);
    } else {
        const imgEl = dragonDisplay ? dragonDisplay.querySelector('img') : null;
        if(imgEl) handleDragonClick(dragonData, imgEl);
    }
};

function handleDragonClick(dragon, imgEl) {
    if(imgEl) {
        imgEl.classList.remove('click-anim');
        void imgEl.offsetWidth; 
        imgEl.classList.add('click-anim');
    }

    const isHighTier = (dragon.rarity === 'epic' || dragon.rarity === 'legend');
    const maxStageLimit = isHighTier ? 4 : 3;

    if (dragon.stage >= maxStageLimit) return; 

    const max = DRAGON_DATA.reqClicks[dragon.stage];
    const clickPower = 1 + (player.nestLevel || 0);
    dragon.clicks += clickPower;
    
    const percent = Math.min(100, (dragon.clicks / max) * 100);
    if(progressBar) progressBar.style.width = `${percent}%`;
    const gaugeText = document.querySelector('.gauge-text');
    if(gaugeText) gaugeText.innerText = `${Math.floor(dragon.clicks)} / ${max}`;

    if (dragon.clicks >= max) {
        const oldStage = dragon.stage;
        dragon.stage++;
        dragon.clicks = 0;
        
        if (oldStage === 0 && dragon.stage === 1) {
            if(!player.discovered.includes(dragon.id)) player.discovered.push(dragon.id);
            // 첫 성체 카운트 등록 (없을 경우에만 1로 설정)
            if(!player.dragonCounts) player.dragonCounts = {};
            if(!player.dragonCounts[dragon.id]) player.dragonCounts[dragon.id] = 1;
            
            showAlert(`알을 깨고 <b style="color:${RARITY_DATA[dragon.rarity].color}">${dragon.name}</b>이(가) 태어났습니다!`);
        } else if (dragon.stage >= maxStageLimit) {
            // 성체 도달 시점
            if(!player.dragonCounts) player.dragonCounts = {};
            // 만약 첫 성체라면 카운트 1 보장
            if(!player.dragonCounts[dragon.id]) player.dragonCounts[dragon.id] = 1;

            showAlert(`축하합니다!<br>[${dragon.name}]이(가) 최종 단계까지 성장했습니다!<br>(한 번 더 터치하여 관리할 수 있습니다)`);
        } else {
            showAlert(`축하합니다!<br>[${dragon.name}]이(가) 성장했습니다!`);
        }

        if(!player.maxStages) player.maxStages = {};
        if(!player.maxStages[dragon.id] || player.maxStages[dragon.id] < dragon.stage) {
            player.maxStages[dragon.id] = dragon.stage;
        }

        syncBookData();
        renderNest(); 
        renderEggList(); 
        if(window.saveGame) window.saveGame(true);
    }
}

// [수정됨] 성체 클릭 시 귀속 처리 로직
function checkAndBindDragon(dragon) {
    // 1. 현재 보유한 드래곤 중, 같은 ID이며 성체인 드래곤 개수 파악
    const maxLimit = (dragon.rarity === 'epic' || dragon.rarity === 'legend') ? 4 : 3;
    const adultDragons = player.myDragons.filter(d => d.id === dragon.id && d.stage >= maxLimit);
    
    // 2. 다른 성체가 하나라도 더 있어야 귀속 가능 (최소 2마리 보유 시)
    if (adultDragons.length > 1) {
        const starLv = window.getDragonStarLevel(dragon.id);
        const currentCount = player.dragonCounts[dragon.id];
        
        showConfirm(
            `<div style="text-align:center">
                <h3 style="color:#f1c40f">초월 공명</h3>
                <br>
                다른 성체가 존재합니다.<br>
                이 용을 기존 영혼에 <b>귀속</b>하시겠습니까?<br>
                <span style="font-size:0.8rem; color:#aaa;">(이 용은 사라지고 별 등급 경험치가 오릅니다)</span>
                <br><br>
                <b>현재 수집: ${currentCount} / 등급: ${starLv}성</b>
            </div>`,
            () => performBind(dragon)
        );
    } else {
        showAlert("성장을 마친 드래곤입니다.<br>멋지게 자랐군요!");
    }
}

function performBind(dragon) {
    // 1. 카운트 증가
    if(!player.dragonCounts[dragon.id]) player.dragonCounts[dragon.id] = 1;
    player.dragonCounts[dragon.id]++;
    
    const newCount = player.dragonCounts[dragon.id];
    const starLv = window.getDragonStarLevel(dragon.id);
    
    // 2. 드래곤 삭제
    const idx = player.myDragons.findIndex(d => d.uId === dragon.uId);
    if (idx > -1) {
        player.myDragons.splice(idx, 1);
        // 인덱스 조정
        if (player.myDragons.length > 0) {
            player.currentDragonUId = player.myDragons[Math.max(0, idx - 1)].uId;
        } else {
            player.currentDragonUId = null;
        }
    }

    showAlert(
        `<div style="text-align:center">
            <h3 style="color:#f1c40f">귀속 완료!</h3>
            <br>
            영혼이 강해졌습니다.<br>
            <b>총 수집: ${newCount}마리</b><br>
            <b style="font-size:1.2rem; color:#ff6b6b">현재 등급: ${starLv}성</b>
        </div>`,
        () => {
            renderNest();
            renderEggList();
            saveGame(true);
        }
    );
}

function renderCaveInventory() {
    const grid = document.getElementById('cave-inventory-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    if(!player.inventory) player.inventory = {};
    const itemIds = Object.keys(player.inventory);
    
    itemIds.forEach(id => {
        if(player.inventory[id] > 0) {
            const item = ITEM_DB[id];
            if(item && item.type !== 'equip') {
                const div = document.createElement('div');
                div.className = 'new-slot-item'; 
                div.innerHTML = `
                    <img src="${item.img}" onerror="this.src='assets/images/ui/icon_question.png'">
                    <span class="count-badge">${player.inventory[id]}</span>
                `;
                div.onclick = () => useItem(id); 
                grid.appendChild(div);
            }
        }
    });
}

function generateUID() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }

function hatchEggInternal(isShinyEgg = false, targetType = null) {
    const lv = player.level || 1;
    const bonusProb = lv * 0.05; 

    let pLegend = RARITY_DATA.legend.prob + (bonusProb * 0.5); 
    let pEpic = RARITY_DATA.epic.prob + bonusProb;
    let pHeroic = RARITY_DATA.heroic.prob;
    let pRare = RARITY_DATA.rare.prob;
    
    if(isShinyEgg) { pLegend += 2; pEpic += 5; pHeroic += 20; }

    const rand = Math.random() * 100;
    let rarity = 'common';

    if (rand < pLegend) rarity = 'legend';
    else if (rand < pLegend + pEpic) rarity = 'epic';
    else if (rand < pLegend + pEpic + pHeroic) rarity = 'heroic';
    else if (rand < pLegend + pEpic + pHeroic + pRare) rarity = 'rare';
    else rarity = 'common';

    const candidates = [];
    if(typeof DRAGON_DEX !== 'undefined') {
        for (const key in DRAGON_DEX) {
            const dragon = DRAGON_DEX[key];
            if (dragon.rarity === rarity) {
                if (targetType) {
                    if (dragon.type === targetType) candidates.push({ ...dragon, id: key });
                } else {
                    candidates.push({ ...dragon, id: key });
                }
            }
        }
    }

    if (candidates.length === 0 && targetType) {
        for (const key in DRAGON_DEX) {
            if (DRAGON_DEX[key].type === targetType) {
                candidates.push({ ...DRAGON_DEX[key], id: key });
                rarity = DRAGON_DEX[key].rarity; 
                break; 
            }
        }
    }
    if (candidates.length === 0) candidates.push({ name: "불도마뱀", type: "fire", rarity: "common", desc: "기본 용", id: "fire_c1" });
    
    const resultDragon = candidates[Math.floor(Math.random() * candidates.length)];
    const isShiny = Math.random() < (isShinyEgg ? 0.2 : 0.05);

    const newDragon = {
        uId: generateUID(), 
        id: resultDragon.id,
        type: resultDragon.type,
        isShiny: isShiny,
        rarity: rarity,
        stage: 0, 
        clicks: 0, 
        name: resultDragon.name 
    };

    player.myDragons.push(newDragon);
    player.currentDragonUId = newDragon.uId;

    if(!player.maxStages) player.maxStages = {};
    if(typeof player.maxStages[resultDragon.id] === 'undefined') {
        player.maxStages[resultDragon.id] = 0;
    }

    syncBookData(); 
    if(window.renderCaveUI) window.renderCaveUI();
    if(window.saveGame) window.saveGame();
}

window.hatchEggInternal = hatchEggInternal;
