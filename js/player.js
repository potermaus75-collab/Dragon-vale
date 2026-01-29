// ==========================================
// js/player.js (최종: 중복 제거 및 정리)
// ==========================================

const INITIAL_PLAYER_STATE = {
    level: 1, exp: 0, maxExp: 100,  
    gold: 500, gem: 10, 
    inventory: {}, 
    myDragons: [ { id: "fire_c1", type: "fire", stage: 0, clicks: 0, name: "불도마뱀", rarity: "common", uId: "init_001" } ],
    currentDragonIndex: 0,
    equipment: { head: null, body: null, arm: null, leg: null },
    stats: { explore: 0, atk: 10, def: 5 },
    discovered: ["fire_c1"], 
    maxStages: { "fire_c1": 0 }, 
    nestLevel: 0, nickname: "Guest", exploreState: null 
};

let player = JSON.parse(JSON.stringify(INITIAL_PLAYER_STATE));
let tempLoot = []; 
let isProcessing = false; 
let saveTimeout = null;   

// 데이터 병합 (불러오기 시 사용)
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

// 재화 및 스탯 UI 업데이트
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
            window.showAlert(`<div style="text-align:center; color:#f1c40f;"><h2>LEVEL UP!</h2><br><b style="font-size:1.5rem;">Lv.${player.level} 달성!</b><br><br><span style="font-size:0.9rem; color:#fff;">이제 새로운 지역을 탐험할 수 있습니다.</span></div>`);
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
    if(atkUI) atkUI.innerText = player.stats.atk;
    if(defUI) defUI.innerText = player.stats.def;
}

function addItem(itemId, count = 1, force = false) {
    if (window.ITEM_DB && !ITEM_DB[itemId] && !force) return;
    if (!player.inventory[itemId]) player.inventory[itemId] = 0;
    player.inventory[itemId] += count;
}

function addTempLoot(itemId, count = 1) { tempLoot.push({ id: itemId, count: count }); }
function clearTempLoot() { tempLoot = []; }

// 아이템 사용
function useItem(itemId) {
    if (isProcessing) return; 
    if (!player.inventory[itemId] || player.inventory[itemId] <= 0) return;
    const item = ITEM_DB[itemId];
    if (!item) return;
    
    if (item.type === "equip") {
        isProcessing = true;
        showConfirm(
            `<div style="text-align:center"><img src="${item.img}" style="width:64px;" onerror="this.src='assets/images/ui/icon_question.png'"><br><b>${item.name}</b><br>(효과: 스탯 +${item.stat})<br>장착하시겠습니까?</div>`, 
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
            const dragon = player.myDragons[player.currentDragonIndex];
            if(dragon) {
                const effect = item.effect || 10;
                dragon.clicks += effect;
                if(window.renderCaveUI) window.renderCaveUI();
                showAlert(`[${dragon.name}]에게 물약을 먹였습니다.<br><b>성장치 +${effect}</b>`, () => { isProcessing = false; });
            } else { isProcessing = false; }
        }
        if(window.updateUI) window.updateUI();
    }
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

// 저장/불러오기
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
            if(typeof player.exp === 'undefined') player.exp = 0;
            if(!player.maxExp) player.maxExp = 100;
            if(player.nickname && typeof userNickname !== 'undefined') { userNickname = player.nickname; }
        } catch(e) {
            player = JSON.parse(JSON.stringify(INITIAL_PLAYER_STATE));
        }
    }
}

// 전역 노출
window.gainExp = gainExp;
window.saveGame = saveGame;
window.loadGame = loadGame;
window.addItem = addItem;
window.useItem = useItem;
window.equipItem = equipItem;
window.unequipItem = unequipItem;
