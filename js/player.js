// ==========================================
// js/player.js (수정됨: 장비 인벤토리 필터링)
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

function getDragonStarLevel(dragonId) {
    const count = (player.dragonCounts && player.dragonCounts[dragonId]) ? player.dragonCounts[dragonId] : 0;
    if (count >= 10) return 5;
    if (count >= 7) return 4;
    if (count >= 5) return 3;
    if (count >= 3) return 2;
    if (count >= 2) return 1;
    return 0;
}

// 전투력 계산 (장비 + 드래곤 합산)
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

function addItem(itemId, count = 1, force = false) {
    if (window.ITEM_DB && !ITEM_DB[itemId] && !force) return;
    if (!player.inventory[itemId]) player.inventory[itemId] = 0;
    player.inventory[itemId] += count;
}

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
                const isShiny = (itemId === 'egg_shiny');
                if(window.hatchEggInternal) {
                    window.hatchEggInternal(isShiny, item.dragonType || null);
                    if(window.switchTab) window.switchTab('dragon');
                }
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

// [수정] '내 정보' 탭의 인벤토리: 장비(equip)만 표시
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

// [수정] 모달 닫기 기능 (ID 지정 가능)
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
    
    // 이벤트 리스너 중복 방지: 새 함수 할당
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
