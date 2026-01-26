// 플레이어 초기 상태
let player = {
    level: 1, 
    gold: 500,
    gem: 0,
    inventory: {}, 
    
    // ★ 보유한 용 리스트 (초기값: 알 1개)
    myDragons: [
        { id: "d_init", type: "fire", stage: 0, clicks: 0, name: "불꽃용" } 
    ],
    currentDragonIndex: 0, // 현재 동굴 둥지에 꺼내둔 용
    
    // ★ 장착 장비
    equipment: {
        head: null,
        body: null,
        arm: null,
        leg: null
    },

    stats: { explore: 0, maxRank: "C" }
};

// 탐험 중 얻은 임시 아이템 보관함
let tempLoot = []; 

// 화면 상단 재화 업데이트
function updateCurrency() {
    const goldUI = document.getElementById('ui-gold');
    const gemUI = document.getElementById('ui-gem');
    // 탐험 횟수 등은 필요 시 갱신
    if(goldUI) goldUI.innerText = player.gold;
    if(gemUI) gemUI.innerText = player.gem;
}

// 아이템 획득
function addItem(itemId, count = 1) {
    if (!player.inventory[itemId]) {
        player.inventory[itemId] = 0;
    }
    player.inventory[itemId] += count;
}

// [탐험용] 임시 전리품 추가
function addTempLoot(itemId, count = 1) {
    tempLoot.push({ id: itemId, count: count });
}

// [탐험용] 임시 전리품 수령
function claimTempLoot() {
    if (tempLoot.length === 0) return "";
    let msg = "획득품:\n";
    tempLoot.forEach(item => {
        addItem(item.id, item.count);
        msg += `- ${ITEM_DB[item.id].name} x${item.count}\n`;
    });
    tempLoot = []; 
    return msg;
}

function clearTempLoot() { tempLoot = []; }

// ★ 아이템 사용 분기 처리
function useItem(itemId) {
    if (player.inventory[itemId] <= 0) return;

    const item = ITEM_DB[itemId];
    
    // 1. 장비 아이템인 경우
    if (item.type === "equip") {
        if(confirm(`${item.name}을(를) 장착하시겠습니까?`)) {
            equipItem(itemId, item.slot);
        }
    } 
    // 2. 알 아이템인 경우 (룰렛)
    else if (item.type === "egg") {
        if(confirm("알을 부화시켜 새로운 용을 얻으시겠습니까?")) {
            player.inventory[itemId]--; // 알 소모
            // hatchery.js에 있는 룰렛 함수 호출
            if(window.startEggRoulette) window.startEggRoulette();
            if(typeof renderInventory === 'function') renderInventory();
        }
    }
    // 3. 소비 아이템
    else {
        player.inventory[itemId]--;
        if(itemId === "potion_s") {
            // 현재 키우는 용에게 경험치
            const dragon = player.myDragons[player.currentDragonIndex];
            dragon.clicks += 10;
            alert(`[${dragon.name}]에게 물약을 먹였습니다. (경험치+10)`);
            if(window.updateUI) window.updateUI(); 
        } else {
            alert(`${item.name}을(를) 사용했습니다.`);
        }
        if(typeof renderInventory === 'function') renderInventory();
    }
}

// ★ 장비 장착 로직
function equipItem(itemId, slot) {
    // 이미 착용 중인 게 있으면 벗어서 가방으로
    if (player.equipment[slot]) {
        addItem(player.equipment[slot], 1);
    }
    
    player.equipment[slot] = itemId;
    player.inventory[itemId]--; // 가방에서 제거
    
    alert("장착 완료!");
    
    // UI 갱신 (hatchery.js의 updateCaveUI가 장비창도 갱신함)
    if(window.updateUI) window.updateUI();
    if(typeof renderInventory === 'function') renderInventory();
}

// ★ 장비 해제 로직
function unequipItem(slot) {
    if (player.equipment[slot]) {
        addItem(player.equipment[slot], 1); // 가방으로
        player.equipment[slot] = null;
        alert("장비 해제!");
        
        if(window.updateUI) window.updateUI();
        if(typeof renderInventory === 'function') renderInventory();
    }
}
