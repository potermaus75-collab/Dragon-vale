// 플레이어 초기 상태
let player = {
    level: 1, 
    gold: 500,
    gem: 0,
    inventory: {}, 
    
    // 보유한 용 리스트
    myDragons: [
        { id: "d_init", type: "fire", stage: 0, clicks: 0, name: "불꽃용" } 
    ],
    currentDragonIndex: 0,
    
    // 장착 장비
    equipment: {
        head: null,
        body: null,
        arm: null,
        leg: null
    },

    stats: { explore: 0, atk: 10, def: 5 }
};

// 탐험 임시 보관함
let tempLoot = []; 

// 재화 업데이트
function updateCurrency() {
    const goldUI = document.getElementById('ui-gold');
    const gemUI = document.getElementById('ui-gem');
    if(goldUI) goldUI.innerText = player.gold;
    if(gemUI) gemUI.innerText = player.gem;
}

// 아이템 획득
function addItem(itemId, count = 1) {
    if (!player.inventory[itemId]) player.inventory[itemId] = 0;
    player.inventory[itemId] += count;
}

// 탐험 전리품 처리
function addTempLoot(itemId, count = 1) {
    tempLoot.push({ id: itemId, count: count });
}

function claimTempLoot() {
    if (tempLoot.length === 0) return "";
    let msg = "획득품:\n";
    tempLoot.forEach(item => {
        if(ITEM_DB[item.id]) {
            addItem(item.id, item.count);
            msg += `- ${ITEM_DB[item.id].name} x${item.count}\n`;
        }
    });
    tempLoot = [];
    return msg;
}

function clearTempLoot() { tempLoot = []; }

// 아이템 사용
function useItem(itemId) {
    if (!player.inventory[itemId] || player.inventory[itemId] <= 0) return;
    const item = ITEM_DB[itemId];
    
    // 1. 장비
    if (item.type === "equip") {
        if(confirm(`${item.name}을(를) 장착하시겠습니까?`)) {
            equipItem(itemId, item.slot);
        }
    } 
    // 2. 알 (룰렛)
    else if (item.type === "egg") {
        if(confirm("알을 부화시켜 새로운 용을 얻으시겠습니까?")) {
            player.inventory[itemId]--;
            if(window.startEggRoulette) window.startEggRoulette();
            if(typeof renderInventory === 'function') renderInventory();
        }
    }
    // 3. 소비
    else {
        player.inventory[itemId]--;
        if(itemId === "potion_s") {
            const dragon = player.myDragons[player.currentDragonIndex];
            if(dragon) {
                dragon.clicks += 10;
                alert(`[${dragon.name}]에게 물약을 먹였습니다.`);
                if(window.updateUI) window.updateUI(); 
            }
        } else {
            alert(`${item.name}을(를) 사용했습니다.`);
        }
        if(typeof renderInventory === 'function') renderInventory();
    }
}

// 장비 장착
function equipItem(itemId, slot) {
    if (player.equipment[slot]) addItem(player.equipment[slot], 1); // 기존 장비 해제
    
    player.equipment[slot] = itemId;
    player.inventory[itemId]--; 
    
    alert("장착 완료!");
    
    // UI 갱신 (hatchery.js의 updateCaveUI에 통합됨)
    if(window.updateUI) window.updateUI();
    if(typeof renderInventory === 'function') renderInventory();
}

// 장비 해제
function unequipItem(slot) {
    if (player.equipment[slot]) {
        addItem(player.equipment[slot], 1);
        player.equipment[slot] = null;
        alert("장비 해제!");
        
        if(window.updateUI) window.updateUI();
        if(typeof renderInventory === 'function') renderInventory();
    }
}
