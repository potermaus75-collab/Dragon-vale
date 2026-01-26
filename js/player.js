// 플레이어 초기 상태
let player = {
    level: 1, // 플레이어 레벨 (지역 해금용)
    gold: 500,
    gem: 0,
    inventory: {}, // {"potion_s": 2} 형태
    stats: { explore: 0, dragons: 1, maxRank: "C" }
};

// 탐험 중 얻은 임시 아이템 보관함
let tempLoot = []; 

// 화면 상단 재화 업데이트
function updateCurrency() {
    const goldUI = document.getElementById('ui-gold');
    const gemUI = document.getElementById('ui-gem');
    const exploreUI = document.getElementById('stat-explore');
    
    if(goldUI) goldUI.innerText = player.gold;
    if(gemUI) gemUI.innerText = player.gem;
    if(exploreUI) exploreUI.innerText = player.stats.explore;
}

// 아이템 획득 (확정)
function addItem(itemId, count = 1) {
    if (!player.inventory[itemId]) {
        player.inventory[itemId] = 0;
    }
    player.inventory[itemId] += count;
    console.log(`획득: ${itemId} x${count}`);
}

// [탐험용] 임시 전리품 추가
function addTempLoot(itemId, count = 1) {
    tempLoot.push({ id: itemId, count: count });
}

// [탐험용] 임시 전리품을 진짜 인벤토리로 이동 (귀환 성공 시)
function claimTempLoot() {
    if (tempLoot.length === 0) return "";
    
    let msg = "획득품:\n";
    tempLoot.forEach(item => {
        addItem(item.id, item.count);
        msg += `- ${ITEM_DB[item.id].name} x${item.count}\n`;
    });
    tempLoot = []; // 비우기
    return msg;
}

// [탐험용] 전리품 폐기 (사망 시)
function clearTempLoot() {
    tempLoot = [];
}

// 아이템 사용 함수
function useItem(itemId) {
    if (player.inventory[itemId] > 0) {
        player.inventory[itemId]--;
        
        // 아이템 효과 적용 (임시)
        if(itemId === "potion_s") {
            // dragon.js의 currentDragon이 전역변수라 접근 가능
            if(typeof currentDragon !== 'undefined') {
                currentDragon.clicks += 10;
                if(typeof updateUI === 'function') updateUI(); 
                alert("성장 물약을 사용하여 경험치 +10!");
            }
        } else {
            alert(`${ITEM_DB[itemId].name}을(를) 사용했습니다.`);
        }
        
        // 인벤토리 화면 갱신 (main.js 함수 호출)
        if(typeof renderInventory === 'function') renderInventory();
    }
}
