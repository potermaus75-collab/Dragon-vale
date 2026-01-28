// ==========================================
// js/player.js (저장 최적화 및 UI 동기화: 생략 없음)
// ==========================================

const INITIAL_PLAYER_STATE = {
    level: 1, 
    exp: 0,       
    maxExp: 100,  
    gold: 500,
    gem: 10, 
    inventory: {}, 
    myDragons: [
        { id: "fire_c1", type: "fire", stage: 0, clicks: 0, name: "불도마뱀", rarity: "common" } 
    ],
    currentDragonIndex: 0,
    equipment: { head: null, body: null, arm: null, leg: null },
    stats: { explore: 0, atk: 10, def: 5 },
    
    discovered: ["fire_c1"], 
    maxStages: { "fire_c1": 0 }, 
    
    nestLevel: 0,
    nickname: "Guest"
};

let player = JSON.parse(JSON.stringify(INITIAL_PLAYER_STATE));
let tempLoot = []; 
let isProcessing = false; // 중복 실행 방지 플래그
let saveTimeout = null;   // 저장 디바운싱용 타이머

function updateCurrency() {
    const goldUI = document.getElementById('ui-gold');
    const gemUI = document.getElementById('ui-gem');
    if(goldUI) goldUI.innerText = player.gold;
    if(gemUI) gemUI.innerText = player.gem;
    
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
            window.showAlert(`
                <div style="text-align:center; color:#f1c40f;">
                    <h2>LEVEL UP!</h2><br>
                    <b style="font-size:1.5rem;">Lv.${player.level} 달성!</b><br><br>
                    <span style="font-size:0.9rem; color:#fff;">이제 새로운 지역을 탐험할 수 있습니다.</span>
                </div>
            `);
        }
        saveGame(true); // 레벨업은 즉시 저장
    }
    updateCurrency();
}

function recalcStats() {
    let baseAtk = 10;
    let baseDef = 5;
    
    ['head', 'body', 'arm', 'leg'].forEach(slot => {
        const itemId = player.equipment[slot];
        if(itemId && ITEM_DB[itemId] && ITEM_DB[itemId].stat) {
            if(slot === 'arm') baseAtk += ITEM_DB[itemId].stat;
            else baseDef += ITEM_DB[itemId].stat;
        }
    });
    player.stats.atk = baseAtk;
    player.stats.def = baseDef;

    const atkUI = document.getElementById('stat-atk');
    const defUI = document.getElementById('stat-def');
    if(atkUI) atkUI.innerText = player.stats.atk;
    if(defUI) defUI.innerText = player.stats.def;
}

function addItem(itemId, count = 1, force = false) {
    if (!ITEM_DB[itemId] && !force) return;
    if (!player.inventory[itemId]) player.inventory[itemId] = 0;
    player.inventory[itemId] += count;
}

function addTempLoot(itemId, count = 1) {
    tempLoot.push({ id: itemId, count: count });
}

function claimTempLoot() {
    if (tempLoot.length === 0) return "";
    let html = "";
    tempLoot.forEach(item => {
        if (item.id === 'gold') player.gold += item.count;
        else if (item.id === 'gem') player.gem += item.count;
        else addItem(item.id, item.count);
    });
    tempLoot = [];
    return "보상을 수령했습니다.";
}

function clearTempLoot() { tempLoot = []; }

function useItem(itemId) {
    if (isProcessing) return; // 중복 실행 방지
    if (!player.inventory[itemId] || player.inventory[itemId] <= 0) return;
    
    const item = ITEM_DB[itemId];
    if (!item) return;
    
    if (item.type === "equip") {
        isProcessing = true;
        showConfirm(
            `<div style="text-align:center">
                <img src="${item.img}" style="width:64px;" onerror="this.src='assets/images/ui/icon_question.png'">
                <br><b>${item.name}</b><br>(효과: 스탯 +${item.stat})<br>장착하시겠습니까?
            </div>`, 
            () => { 
                equipItem(itemId, item.slot); 
                isProcessing = false; 
            },
            () => { isProcessing = false; }
        );
    } else if (item.type === "egg") {
        const targetType = item.dragonType || 'fire';
        isProcessing = true;
        
        showConfirm(
            `<div style="text-align:center">
                <img src="${item.img}" style="width:64px;" onerror="handleImgError(this, '${targetType}', 0)">
                <br><b>${item.name}</b>을(를) 둥지에 놓겠습니까?
            </div>`, 
            () => {
                player.inventory[itemId]--; // 재고 차감
                
                const isShiny = (itemId === 'egg_shiny');
                // hatchery.js에 있는 함수 호출
                if(window.hatchEggInternal) window.hatchEggInternal(isShiny, item.dragonType || null);
                
                // [중요] 전역 UI 업데이트 호출 (인벤토리 갱신 포함)
                if(window.updateUI) window.updateUI();
                
                showAlert("둥지에 알을 놓았습니다.<br>탭해서 깨워보세요!", () => { isProcessing = false; });
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
                showAlert(`[${dragon.name}]에게 물약을 먹였습니다.<br><b>성장치 +${effect}</b>`, () => { isProcessing = false; });
            } else { isProcessing = false; }
        }
        // 사용 후 즉시 UI 갱신
        if(window.updateUI) window.updateUI();
    }
}

function upgradeNest() {
    if (isProcessing) return;
    const nextLevel = (player.nestLevel || 0) + 1;
    if (nextLevel > NEST_UPGRADE_COST.length) {
        showAlert("이미 최고 레벨입니다!");
        return;
    }
    const cost = NEST_UPGRADE_COST[player.nestLevel || 0];
    const userWood = player.inventory['nest_wood'] || 0;
    
    isProcessing = true;
    if (userWood >= cost) {
        showConfirm(
            `<div style="text-align:center">
                <img src="assets/images/item/material_wood.png" style="width:40px;" onerror="this.src='assets/images/ui/icon_question.png'">
                <br><b>둥지 강화?</b><br>소모: ${cost} 재료
            </div>`,
            () => {
                player.inventory['nest_wood'] -= cost;
                player.nestLevel = (player.nestLevel || 0) + 1;
                showAlert(`<b>둥지 강화 성공! (Lv.${player.nestLevel})</b>`, () => { isProcessing = false; });
                if(window.updateUI) window.updateUI();
                saveGame();
            },
            () => { isProcessing = false; }
        );
    } else {
        showAlert(`재료가 부족합니다. (보유: ${userWood}/${cost})`, () => { isProcessing = false; });
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

// [핵심 최적화] 저장 디바운싱 (1초 딜레이)
// immediate=true일 경우 즉시 저장 (레벨업, 중요 이벤트 등)
function saveGame(immediate = false) {
    player.nickname = (typeof userNickname !== 'undefined') ? userNickname : player.nickname;
    
    if (immediate) {
        if (saveTimeout) clearTimeout(saveTimeout);
        executeSave();
        return;
    }

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
            const savedPlayer = parsedData.player;

            player = { ...INITIAL_PLAYER_STATE, ...savedPlayer };

            if(!player.inventory) player.inventory = {};
            if(!player.discovered) player.discovered = ["fire_c1"]; 
            if(!player.myDragons) player.myDragons = JSON.parse(JSON.stringify(INITIAL_PLAYER_STATE.myDragons));
            if(!player.equipment) player.equipment = { head: null, body: null, arm: null, leg: null };
            if(!player.stats) player.stats = { explore: 0, atk: 10, def: 5 };
            
            if(!player.maxStages) player.maxStages = { "fire_c1": 0 };
            player.myDragons.forEach(d => {
                if(!player.maxStages[d.id] || player.maxStages[d.id] < d.stage) {
                    player.maxStages[d.id] = d.stage;
                }
                if(!player.discovered.includes(d.id)) player.discovered.push(d.id);
            });

            if(typeof player.exp === 'undefined') player.exp = 0;
            if(!player.maxExp) player.maxExp = 100;

            if(player.nickname && typeof userNickname !== 'undefined') {
                userNickname = player.nickname;
            }
        } catch(e) {
            console.error("로드 실패", e);
            player = JSON.parse(JSON.stringify(INITIAL_PLAYER_STATE));
        }
    }
}
window.gainExp = gainExp;
