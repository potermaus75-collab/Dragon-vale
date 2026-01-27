// ==========================================
// js/player.js (초기화 및 아이템 사용 로직 수정)
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
        saveGame();
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
    // explore.js에서 오버라이드 되거나 단독 사용될 수 있음. 기본 로직.
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

// [수정] 알 사용 시 속성(targetType) 전달
function useItem(itemId) {
    if (!player.inventory[itemId] || player.inventory[itemId] <= 0) return;
    
    const item = ITEM_DB[itemId];
    if (!item) {
        delete player.inventory[itemId];
        return;
    }
    
    if (item.type === "equip") {
        showConfirm(
            `<div style="text-align:center"><img src="${item.img}" style="width:64px;"><br><b>${item.name}</b><br>(효과: 스탯 +${item.stat})<br>장착하시겠습니까?</div>`, 
            () => equipItem(itemId, item.slot)
        );
    } else if (item.type === "egg") {
        showConfirm(
            `<div style="text-align:center"><img src="${item.img}" style="width:64px;"><br><b>${item.name}</b>을(를) 부화시키겠습니까?</div>`, 
            () => {
                player.inventory[itemId]--;
                
                // 해당 알의 속성(dragonType) 확인 (fire, light, dark 등)
                // 만약 없으면(random) null 전달
                const targetType = item.dragonType || null; 
                
                // 신비한 알 체크
                const isShiny = (itemId === 'egg_shiny');

                if(window.startEggRoulette) window.startEggRoulette(isShiny, targetType);
                if(typeof renderInventory === 'function') renderInventory();
            }
        );
    } else if (item.type === "use") {
        player.inventory[itemId]--;
        if(itemId === "potion_s") {
            const dragon = player.myDragons[player.currentDragonIndex];
            if(dragon) {
                const effect = item.effect || 10;
                dragon.clicks += effect;
                // 성장 한계 체크는 handleDragonClick에서 하므로 여기선 단순 증가만
                // 실제 UI 반영 시에는 hatchery.js 로직이 필요할 수 있음
                showAlert(`[${dragon.name}]에게 물약을 먹였습니다.<br><b>성장치 +${effect}</b>`);
                if(window.updateUI) window.updateUI(); 
            }
        }
        if(typeof renderInventory === 'function') renderInventory();
    }
}

function upgradeNest() {
    const nextLevel = (player.nestLevel || 0) + 1;
    if (nextLevel > NEST_UPGRADE_COST.length) {
        showAlert("이미 최고 레벨입니다!");
        return;
    }
    const cost = NEST_UPGRADE_COST[player.nestLevel || 0];
    const userWood = player.inventory['nest_wood'] || 0;
    
    if (userWood >= cost) {
        showConfirm(
            `<div style="text-align:center"><img src="assets/images/item/material_wood.png" style="width:40px;"><br><b>둥지 강화?</b><br>소모: ${cost} 재료</div>`,
            () => {
                player.inventory['nest_wood'] -= cost;
                player.nestLevel = (player.nestLevel || 0) + 1;
                showAlert(`<b>둥지 강화 성공! (Lv.${player.nestLevel})</b>`);
                if(window.updateUI) window.updateUI();
                saveGame();
            }
        );
    } else {
        showAlert(`재료가 부족합니다. (보유: ${userWood}/${cost})`);
    }
}

function equipItem(itemId, slot) {
    if (player.equipment[slot]) addItem(player.equipment[slot], 1, true); 
    player.equipment[slot] = itemId;
    player.inventory[itemId]--; 
    showAlert("장착 완료!");
    updateCurrency(); 
    if(window.updateUI) window.updateUI();
    if(typeof renderInventory === 'function') renderInventory();
    saveGame();
}

function unequipItem(slot) {
    if (player.equipment[slot]) {
        addItem(player.equipment[slot], 1, true);
        player.equipment[slot] = null;
        showAlert("장비를 해제했습니다.");
        updateCurrency(); 
        if(window.updateUI) window.updateUI();
        if(typeof renderInventory === 'function') renderInventory();
        saveGame();
    }
}

function saveGame() {
    player.nickname = (typeof userNickname !== 'undefined') ? userNickname : player.nickname;
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
            // 기존 데이터 호환성 체크
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
            console.log("게임 불러오기 성공");
        } catch(e) {
            console.error("로드 실패", e);
            player = JSON.parse(JSON.stringify(INITIAL_PLAYER_STATE));
        }
    }
}
window.gainExp = gainExp;
