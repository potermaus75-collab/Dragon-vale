// ==========================================
// js/player.js (완전판)
// ==========================================

const INITIAL_PLAYER_STATE = {
    level: 1, exp: 0, maxExp: 100,  
    gold: 500, gem: 10, 
    inventory: {}, 
    myDragons: [ { id: "fire_c1", type: "fire", stage: 0, clicks: 0, name: "불도마뱀", rarity: "common", uId: "init_001" } ],
    currentDragonUId: "init_001",
    equipment: { head: null, body: null, arm: null, leg: null },
    stats: { explore: 0, atk: 10, def: 5 },
    discovered: ["fire_c1"], 
    maxStages: { "fire_c1": 0 }, 
    dragonCounts: { "fire_c1": 1 }, 
    nestLevel: 0, nickname: "Guest", exploreState: null 
};

let player = JSON.parse(JSON.stringify(INITIAL_PLAYER_STATE));
let isProcessing = false; 
let saveTimeout = null;   

// 객체 병합 헬퍼
function deepMerge(target, source) {
    if (typeof target !== 'object' || target === null) return source;
    if (typeof source !== 'object' || source === null) return target;
    for (const key in source) {
        if (Array.isArray(source[key])) target[key] = source[key];
        else if (typeof source[key] === 'object' && source[key] !== null) {
            if (!target[key]) target[key] = {};
            deepMerge(target[key], source[key]);
        } else target[key] = source[key];
    }
    return target;
}

// 드래곤 별 등급 계산
function getDragonStarLevel(dragonId) {
    const count = (player.dragonCounts && player.dragonCounts[dragonId]) ? player.dragonCounts[dragonId] : 0;
    if (count >= 10) return 5;
    if (count >= 7) return 4;
    if (count >= 5) return 3;
    if (count >= 3) return 2;
    if (count >= 2) return 1;
    return 0;
}

// 전투력 계산 (참조용)
function calculateTotalCombatPower() {
    let equipmentPower = player.stats.atk + player.stats.def; 
    const rarityMultipliers = { "common": 1, "rare": 1.5, "heroic": 2, "epic": 3, "legend": 5 };
    
    let dragonPower = 0;
    player.myDragons.forEach(dragon => {
        const mult = rarityMultipliers[dragon.rarity] || 1;
        if (dragon.stage > 0) {
            dragonPower += (dragon.stage * 10) * mult;
        }
    });

    return Math.floor(equipmentPower + dragonPower);
}

// 재화 및 레벨 UI 업데이트
function updateCurrency() {
    const goldUI = document.getElementById('ui-gold');
    const gemUI = document.getElementById('ui-gem');
    const goldUIMap = document.getElementById('ui-gold-map');
    const gemUIMap = document.getElementById('ui-gem-map');
    
    if(goldUI) goldUI.innerText = player.gold;
    if(gemUI) gemUI.innerText = player.gem;
    if(goldUIMap) goldUIMap.innerText = player.gold;
    if(gemUIMap) gemUIMap.innerText = player.gem;
    
    const levelUI = document.getElementById('ui-level');
    const expBar = document.getElementById('ui-exp-fill');
    if(levelUI) levelUI.innerText = `Lv.${player.level}`;
    if(expBar) {
        const max = player.maxExp || 100;
        const percent = Math.min(100, (player.exp / max) * 100);
        expBar.style.width = `${percent}%`;
    }
    recalcStats();
}

// 경험치 획득
function gainExp(amount) {
    if(typeof player.exp === 'undefined') player.exp = 0;
    if(!player.maxExp) player.maxExp = 100;
    player.exp += amount;
    if (player.exp >= player.maxExp) {
        player.exp -= player.maxExp; 
        player.level++;
        player.maxExp = Math.floor(player.maxExp * 1.5); 
        if(window.showAlert) {
            window.showAlert(`<div style="text-align:center; color:#f1c40f;"><h2>LEVEL UP!</h2><br><b style="font-size:1.5rem;">Lv.${player.level} 달성!</b></div>`);
        }
        saveGame(true); 
    }
    updateCurrency();
}

// 스탯 재계산
function recalcStats() {
    let baseAtk = 10; let baseDef = 5;
    ['head', 'body', 'arm', 'leg'].forEach(slot => {
        const itemId = player.equipment[slot];
        if(itemId && window.ITEM_DB && ITEM_DB[itemId] && ITEM_DB[itemId].stat) {
            if(slot === 'arm') baseAtk += ITEM_DB[itemId].stat; else baseDef += ITEM_DB[itemId].stat;
        }
    });
    player.stats.atk = baseAtk; player.stats.def = baseDef;
    
    const atkUI = document.getElementById('stat-atk');
    const defUI = document.getElementById('stat-def');
    const atkDisplay = document.getElementById('stat-atk-display');
    const defDisplay = document.getElementById('stat-def-display');

    if(atkUI) atkUI.innerText = player.stats.atk;
    if(defUI) defUI.innerText = player.stats.def;
    if(atkDisplay) atkDisplay.innerText = player.stats.atk;
    if(defDisplay) defDisplay.innerText = player.stats.def;
}

// 아이템 획득
function addItem(itemId, count = 1, force = false) {
    if (window.ITEM_DB && !ITEM_DB[itemId] && !force) return;
    if (!player.inventory[itemId]) player.inventory[itemId] = 0;
    player.inventory[itemId] += count;
}

// 아이템 사용
function useItem(itemId) {
    if (isProcessing) return; 
    if (!player.inventory[itemId] || player.inventory[itemId] <= 0) return;
    const item = ITEM_DB[itemId];
    if (!item) return;
    
    if (item.type === "equip") {
        isProcessing = true;
        showConfirm(
            `<div style="text-align:center"><img src="${item.img}" style="width:64px;" onerror="this.src='assets/images/ui/icon_question.png'"><br><b>${item.name}</b><br>장착하시겠습니까?</div>`, 
            () => { equipItem(itemId, item.slot); isProcessing = false; },
            () => { isProcessing = false; }
        );
    } else if (item.type === "egg") {
        isProcessing = true;
        showConfirm(
            `<div style="text-align:center"><img src="${item.img}" style="width:64px;" onerror="handleImgError(this)"><br><b>${item.name}</b>을(를) 둥지에 놓겠습니까?</div>`, 
            () => {
                player.inventory[itemId]--; 
                // 신비한 알인지 확인
                const isShiny = (itemId === 'egg_shiny');
                // 드래곤 타입 전달 (랜덤 알이면 'random', 속성 알이면 'fire' 등)
                // item.dragonType이 undefined이면 null로 처리
                window.hatchEggInternal(isShiny, item.dragonType || null);
                
                if(window.switchTab) window.switchTab('dragon');
                if(window.updateUI) window.updateUI();
                showAlert("둥지에 알을 놓았습니다!", () => { isProcessing = false; });
            },
            () => { isProcessing = false; }
        );
    } else if (item.type === "use") {
        isProcessing = true;
        player.inventory[itemId]--;
        if(itemId === "potion_s") {
            const dragon = player.myDragons.find(d => d.uId === player.currentDragonUId);
            if(dragon) {
                const effect = item.effect || 10;
                dragon.clicks += effect;
                if(window.renderCaveUI) window.renderCaveUI();
                showAlert(`[${dragon.name}]에게 물약을 먹였습니다.<br><b>성장치 +${effect}</b>`, () => { isProcessing = false; });
            } else { 
                showAlert("물약을 사용할 드래곤이 없습니다.");
                player.inventory[itemId]++;
                isProcessing = false; 
            }
        }
        if(window.updateUI) window.updateUI();
    }
}

// 인벤토리 렌더링 (장비만)
function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    if(!grid) return;
    grid.innerHTML = "";

    if(player.inventory) {
        Object.keys(player.inventory).forEach(id => {
            if(player.inventory[id] > 0) {
                const item = ITEM_DB[id];
                // 장비 타입만 필터링
                if(item && item.type === 'equip') {
                    const div = document.createElement('div');
                    div.className = 'inven-slot';
                    div.onclick = () => useItem(id); 
                    div.innerHTML = `
                        <img src="${item.img}" onerror="handleImgError(this)">
                        <span class="item-count">${player.inventory[id]}</span>
                    `;
                    grid.appendChild(div);
                }
            }
        });
    }

    updateEquipSlots();
    recalcStats();
}

function updateEquipSlots() {
    const slots = ['head', 'body', 'arm', 'leg'];
    slots.forEach(slot => {
        const displayId = `equip-display-${slot}`;
        const container = document.getElementById(displayId);
        if(!container) return;

        container.innerHTML = ""; 
        const itemId = player.equipment[slot];
        
        if(itemId && ITEM_DB[itemId]) {
            const img = document.createElement('img');
            img.src = ITEM_DB[itemId].img;
            img.className = 'equipped-item-img';
            img.onerror = function() { this.src = "assets/images/ui/icon_question.png"; };
            container.appendChild(img);
        }
    });
}

function equipItem(itemId, slot) {
    if (player.equipment[slot]) addItem(player.equipment[slot], 1, true); 
    player.equipment[slot] = itemId;
    player.inventory[itemId]--; 
    showAlert("장착 완료!");
    if(window.updateUI) window.updateUI();
    saveGame();
}

function unequipItem(slot) {
    if (player.equipment[slot]) {
        addItem(player.equipment[slot], 1, true);
        player.equipment[slot] = null;
        showAlert("장비를 해제했습니다.");
        if(window.updateUI) window.updateUI();
        saveGame();
    }
}

// 저장 및 로드
function saveGame(immediate = false) {
    player.nickname = (typeof userNickname !== 'undefined') ? userNickname : player.nickname;
    if (immediate) { if (saveTimeout) clearTimeout(saveTimeout); executeSave(); return; }
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(executeSave, 1000);
}

function executeSave() {
    const data = { player: player, timestamp: Date.now() };
    localStorage.setItem('dragonSaveData', JSON.stringify(data));
    console.log("게임 저장 완료");
}

function loadGame() {
    const saved = localStorage.getItem('dragonSaveData');
    if (saved) {
        try {
            const parsedData = JSON.parse(saved);
            player = deepMerge(JSON.parse(JSON.stringify(INITIAL_PLAYER_STATE)), parsedData.player);
            
            if (!player.myDragons || player.myDragons.length === 0) {
                player.myDragons = JSON.parse(JSON.stringify(INITIAL_PLAYER_STATE.myDragons));
            }
            player.myDragons.forEach((d, idx) => {
                if(!d.uId) d.uId = `legacy_${Date.now()}_${idx}`;
            });
            if(!player.currentDragonUId && player.myDragons.length > 0) {
                player.currentDragonUId = player.myDragons[0].uId;
            }

            if(typeof player.exp === 'undefined') player.exp = 0;
            if(!player.maxExp) player.maxExp = 100;
            if(player.nickname && typeof userNickname !== 'undefined') { userNickname = player.nickname; }
        } catch(e) {
            console.error("세이브 파일 손상, 초기화합니다.", e);
            player = JSON.parse(JSON.stringify(INITIAL_PLAYER_STATE));
        }
    }
}

// 모달 관련 함수
window.closeModal = function(modalId = 'common-modal') {
    const m = document.getElementById(modalId);
    if(m) {
        m.classList.remove('active');
        m.classList.add('hidden');
    }
};

window.showAlert = function(msg, callback) {
    const modal = document.getElementById('common-modal');
    document.getElementById('modal-title').innerText = "알림";
    document.getElementById('modal-text').innerHTML = msg; 
    document.getElementById('modal-btn-alert').classList.remove('hidden');
    document.getElementById('modal-btn-confirm').classList.add('hidden');
    modal.classList.remove('hidden');
    modal.classList.add('active');
    
    // 이벤트 리스너 중복 방지
    const btn = modal.querySelector('#modal-btn-alert button');
    btn.onclick = function() {
        closeModal('common-modal'); 
        if(callback) callback();
    };
};

window.showConfirm = function(msg, yesCallback, noCallback) {
    const modal = document.getElementById('common-modal');
    document.getElementById('modal-title').innerText = "확인";
    document.getElementById('modal-text').innerHTML = msg; 
    document.getElementById('modal-btn-alert').classList.add('hidden');
    document.getElementById('modal-btn-confirm').classList.remove('hidden');
    modal.classList.remove('hidden');
    modal.classList.add('active');
    
    document.getElementById('btn-confirm-yes').onclick = function() { closeModal('common-modal'); if(yesCallback) yesCallback(); };
    document.getElementById('btn-confirm-no').onclick = function() { closeModal('common-modal'); if(noCallback) noCallback(); };
};

// [수정] 알 부화 로직 (확률 수정 및 대상 필터링 강화)
function hatchEggInternal(isShinyEgg = false, targetType = null) {
    const lv = player.level || 1;
    const bonusProb = lv * 0.05; 

    // 등급 확률 설정 (레벨 비례)
    let pLegend = RARITY_DATA.legend.prob + (bonusProb * 0.5); 
    let pEpic = RARITY_DATA.epic.prob + bonusProb;
    let pHeroic = RARITY_DATA.heroic.prob;
    
    // 신비한 알일 경우 고등급 확률 증가
    if(isShinyEgg) { pLegend += 5; pEpic += 10; pHeroic += 25; }

    const rand = Math.random() * 100;
    let rarity = 'common';

    if (rand < pLegend) rarity = 'legend';
    else if (rand < pLegend + pEpic) rarity = 'epic';
    else if (rand < pLegend + pEpic + pHeroic) rarity = 'heroic';
    else if (rand < pLegend + pEpic + pHeroic + RARITY_DATA.rare.prob) rarity = 'rare';
    else rarity = 'common';

    // 해당 조건(rarity, type)에 맞는 드래곤 후보군 검색
    let candidates = [];
    if(typeof DRAGON_DEX !== 'undefined') {
        for (const key in DRAGON_DEX) {
            const dragon = DRAGON_DEX[key];
            if (dragon.rarity === rarity) {
                // targetType이 'random'이 아니고 지정되어 있다면 타입 필터링
                if (targetType && targetType !== 'random') {
                    if (dragon.type === targetType) candidates.push({ ...dragon, id: key });
                } else {
                    candidates.push({ ...dragon, id: key });
                }
            }
        }
    }

    // 만약 후보군이 없으면 (예: 해당 속성의 전설 등급이 없을 경우)
    // rarity 조건을 무시하고 타입만 맞춰서 다시 검색
    if (candidates.length === 0) {
        for (const key in DRAGON_DEX) {
            const dragon = DRAGON_DEX[key];
            if (targetType && targetType !== 'random') {
                if (dragon.type === targetType) candidates.push({ ...dragon, id: key });
            } else {
                candidates.push({ ...dragon, id: key });
            }
        }
    }
    
    // 그래도 후보군이 없으면 기본 드래곤(불도마뱀) 추가 (안전장치)
    if (candidates.length === 0) candidates.push({ name: "불도마뱀", type: "fire", rarity: "common", desc: "기본 용", id: "fire_c1" });
    
    // 최종 드래곤 선택
    const resultDragon = candidates[Math.floor(Math.random() * candidates.length)];
    
    // 이로치(Shiny) 확률 적용
    // 신비한 알은 이로치 확률 30%, 일반 알은 5%
    const isShiny = Math.random() < (isShinyEgg ? 0.3 : 0.05);

    const newDragon = {
        uId: Date.now().toString(36) + Math.random().toString(36).substr(2, 5), // 고유 ID 생성
        id: resultDragon.id,
        type: resultDragon.type,
        isShiny: isShiny,
        rarity: resultDragon.rarity, // 실제 뽑힌 드래곤의 등급 적용
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

    if(window.renderCaveUI) window.renderCaveUI();
    if(window.saveGame) window.saveGame();
}

// 전역 변수 노출
window.player = player;
window.getDragonStarLevel = getDragonStarLevel; 
window.gainExp = gainExp;
window.saveGame = saveGame;
window.loadGame = loadGame;
window.addItem = addItem;
window.useItem = useItem;
window.equipItem = equipItem;
window.unequipItem = unequipItem;
window.calculateTotalCombatPower = calculateTotalCombatPower;
window.renderInventory = renderInventory;
window.hatchEggInternal = hatchEggInternal;
