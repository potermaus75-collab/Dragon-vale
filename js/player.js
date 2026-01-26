// 플레이어 초기 상태
let player = {
    gold: 500, // 시작 골드
    gem: 0,
    inventory: {}, // {"potion_s": 2} 형태
    stats: { explore: 0, dragons: 1, maxRank: "C" }
};

// 화면 상단 재화 업데이트
function updateCurrency() {
    const goldUI = document.getElementById('ui-gold');
    const gemUI = document.getElementById('ui-gem');
    const exploreUI = document.getElementById('stat-explore');
    
    if(goldUI) goldUI.innerText = player.gold;
    if(gemUI) gemUI.innerText = player.gem;
    if(exploreUI) exploreUI.innerText = player.stats.explore;
}

// 아이템 획득 함수
function addItem(itemId, count = 1) {
    if (!player.inventory[itemId]) {
        player.inventory[itemId] = 0;
    }
    player.inventory[itemId] += count;
    console.log(`획득: ${itemId} x${count}`);
}

// 아이템 사용 함수
function useItem(itemId) {
    if (player.inventory[itemId] > 0) {
        player.inventory[itemId]--;
        
        // 아이템 효과 적용 (임시)
        if(itemId === "potion_s") {
            currentDragon.clicks += 10;
            updateUI(); // hatchery.js 함수 호출
            alert("성장 물약을 사용하여 경험치 +10!");
        } else {
            alert(`${ITEM_DB[itemId].name}을(를) 사용했습니다.`);
        }
        
        renderInventory(); // 가방 화면 갱신
    }
}

