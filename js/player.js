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

    stats: { explore: 0, atk: 10, def: 5 },
    discovered: [] // 도감용
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

// [수정] 전리품 정산 메시지를 HTML로 생성
function claimTempLoot() {
    if (tempLoot.length === 0) return "";
    let html = "<div style='background:rgba(0,0,0,0.3); padding:10px; border-radius:5px; display:inline-block;'>";
    
    tempLoot.forEach(item => {
        if(ITEM_DB[item.id]) {
            addItem(item.id, item.count);
            // 이미지와 텍스트 한 줄로
            html += `
                <div style="display:flex; align-items:center; gap:5px; margin-bottom:5px;">
                    <img src="${ITEM_DB[item.id].img}" style="width:24px; height:24px;">
                    <span>${ITEM_DB[item.id].name} x${item.count}</span>
                </div>
            `;
        }
    });
    html += "</div>";
    tempLoot = [];
    return html;
}

function clearTempLoot() { tempLoot = []; }

// 아이템 사용
function useItem(itemId) {
    if (!player.inventory[itemId] || player.inventory[itemId] <= 0) return;
    const item = ITEM_DB[itemId];
    
    // 1. 장비
    if (item.type === "equip") {
        showConfirm(
            `<div style="text-align:center">
                <img src="${item.img}" style="width:64px;"><br>
                <b>${item.name}</b>을(를) 장착하시겠습니까?
            </div>`, 
            () => equipItem(itemId, item.slot)
        );
    } 
    // 2. 알 (룰렛)
    else if (item.type === "egg") {
        showConfirm(
            "알을 부화시켜 새로운 용을 얻으시겠습니까?", 
            () => {
                player.inventory[itemId]--;
                if(window.startEggRoulette) window.startEggRoulette();
                if(typeof renderInventory === 'function') renderInventory();
            }
        );
    }
    // 3. 소비
    else {
        player.inventory[itemId]--;
        if(itemId === "potion_s") {
            const dragon = player.myDragons[player.currentDragonIndex];
            if(dragon) {
                dragon.clicks += 10;
                showAlert(`[${dragon.name}]에게 물약을 먹였습니다.\n(성장치 +10)`);
                if(window.updateUI) window.updateUI(); 
            }
        } else {
            showAlert(`${item.name}을(를) 사용했습니다.`);
        }
        if(typeof renderInventory === 'function') renderInventory();
    }
}

// 장비 장착
function equipItem(itemId, slot) {
    if (player.equipment[slot]) addItem(player.equipment[slot], 1); // 기존 장비 해제
    
    player.equipment[slot] = itemId;
    player.inventory[itemId]--; 
    
    showAlert("장착 완료!");
    
    if(window.updateUI) window.updateUI();
    if(typeof renderInventory === 'function') renderInventory();
    if(window.saveGame) window.saveGame();
}

// 장비 해제
function unequipItem(slot) {
    if (player.equipment[slot]) {
        addItem(player.equipment[slot], 1);
        player.equipment[slot] = null;
        showAlert("장비를 해제했습니다.");
        
        if(window.updateUI) window.updateUI();
        if(typeof renderInventory === 'function') renderInventory();
        if(window.saveGame) window.saveGame();
    }
}

