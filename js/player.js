// ==========================================
// js/player.js (완전한 코드)
// ==========================================

// 플레이어 초기 상태
let player = {
    level: 1, 
    gold: 500,
    gem: 10, // 시작 보석 조금 지급
    inventory: {}, 
    
    myDragons: [
        { id: "d_init", type: "fire", stage: 0, clicks: 0, name: "불꽃용" } 
    ],
    currentDragonIndex: 0,
    
    equipment: { head: null, body: null, arm: null, leg: null },

    // 스탯은 장비에 따라 변하므로 기본값+장비값 합산 로직 사용
    stats: { explore: 0, atk: 10, def: 5 },
    
    discovered: [], // 도감용
    
    nestLevel: 0 // 둥지 레벨 (클릭 효율 증가)
};

let tempLoot = []; 

// 재화 및 스탯 UI 갱신
function updateCurrency() {
    const goldUI = document.getElementById('ui-gold');
    const gemUI = document.getElementById('ui-gem');
    if(goldUI) goldUI.innerText = player.gold;
    if(gemUI) gemUI.innerText = player.gem;
    
    // 스탯 UI 갱신
    recalcStats();
}

// 스탯 재계산 함수
function recalcStats() {
    let baseAtk = 10;
    let baseDef = 5;
    
    // 장비 스탯 합산
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

// 아이템 획득 (안전장치 추가)
function addItem(itemId, count = 1) {
    if (!ITEM_DB[itemId]) {
        console.error("존재하지 않는 아이템 추가 시도:", itemId);
        return;
    }
    if (!player.inventory[itemId]) player.inventory[itemId] = 0;
    player.inventory[itemId] += count;
}

// 탐험 전리품 담기 (골드, 보석도 문자열 ID로 들어올 수 있음)
function addTempLoot(itemId, count = 1) {
    tempLoot.push({ id: itemId, count: count });
}

// [수정] 전리품 정산 (버그 해결 핵심)
function claimTempLoot() {
    if (tempLoot.length === 0) return "";
    let html = "<div style='background:rgba(0,0,0,0.3); padding:10px; border-radius:5px; display:inline-block; text-align:left;'>";
    
    tempLoot.forEach(item => {
        // 1. 골드인 경우
        if (item.id === 'gold') {
            player.gold += item.count;
            html += `
                <div style="display:flex; align-items:center; gap:5px; margin-bottom:5px;">
                    <img src="assets/images/ui/icon_gold.png" style="width:20px;">
                    <span style="color:#f1c40f">${item.count} 골드</span>
                </div>`;
        } 
        // 2. 보석인 경우
        else if (item.id === 'gem') {
            player.gem += item.count;
            html += `
                <div style="display:flex; align-items:center; gap:5px; margin-bottom:5px;">
                    <img src="assets/images/ui/icon_gem.png" style="width:20px;">
                    <span style="color:#3498db">${item.count} 보석</span>
                </div>`;
        } 
        // 3. 일반 아이템인 경우
        else if (ITEM_DB[item.id]) {
            addItem(item.id, item.count);
            html += `
                <div style="display:flex; align-items:center; gap:5px; margin-bottom:5px;">
                    <img src="${ITEM_DB[item.id].img}" style="width:24px; height:24px;">
                    <span>${ITEM_DB[item.id].name} x${item.count}</span>
                </div>`;
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
                <b>${item.name}</b><br>
                (효과: 스탯 +${item.stat})<br>
                장착하시겠습니까?
            </div>`, 
            () => equipItem(itemId, item.slot)
        );
    } 
    // 2. 알 (룰렛)
    else if (item.type === "egg") {
        showConfirm(
            `<div style="text-align:center">
                <img src="${item.img}" style="width:64px;"><br>
                <b>${item.name}</b>을(를) 부화시키겠습니까?
            </div>`, 
            () => {
                player.inventory[itemId]--;
                // 신비한 알('egg_shiny')이면 true 전달
                if(window.startEggRoulette) window.startEggRoulette(itemId === 'egg_shiny');
                if(typeof renderInventory === 'function') renderInventory();
            }
        );
    }
    // 3. 소비 (물약 등)
    else if (item.type === "use") {
        player.inventory[itemId]--;
        if(itemId === "potion_s") {
            const dragon = player.myDragons[player.currentDragonIndex];
            if(dragon) {
                const effect = item.effect || 10;
                dragon.clicks += effect;
                showAlert(`[${dragon.name}]에게 물약을 먹였습니다.<br><b>성장치 +${effect}</b>`);
                if(window.updateUI) window.updateUI(); 
            }
        }
        if(typeof renderInventory === 'function') renderInventory();
    }
}

// 둥지 강화 함수 (신규)
function upgradeNest() {
    const nextLevel = (player.nestLevel || 0) + 1;
    // 최대 레벨 체크
    if (nextLevel > NEST_UPGRADE_COST.length) {
        showAlert("이미 최고 레벨입니다!");
        return;
    }
    
    const cost = NEST_UPGRADE_COST[player.nestLevel || 0];
    const userWood = player.inventory['nest_wood'] || 0;
    
    if (userWood >= cost) {
        showConfirm(
            `<div style="text-align:center">
                <img src="assets/images/item/material_wood.png" style="width:40px;"><br>
                <b>둥지를 강화하시겠습니까?</b><br>
                소모: 둥지 재료 ${cost}개<br>
                효과: 터치 당 경험치 +1
            </div>`,
            () => {
                player.inventory['nest_wood'] -= cost;
                player.nestLevel = (player.nestLevel || 0) + 1;
                showAlert(`<b>둥지 강화 성공! (Lv.${player.nestLevel})</b><br>이제 용이 더 빨리 자랍니다!`);
                if(window.updateUI) window.updateUI();
                if(typeof saveGame === 'function') saveGame();
            }
        );
    } else {
        showAlert(`둥지 재료가 부족합니다.<br>(보유: ${userWood} / 필요: ${cost})<br><small>탐험에서 '둥지 재료'를 모으세요.</small>`);
    }
}

function equipItem(itemId, slot) {
    if (player.equipment[slot]) addItem(player.equipment[slot], 1); 
    player.equipment[slot] = itemId;
    player.inventory[itemId]--; 
    showAlert("장착 완료!");
    updateCurrency(); // 스탯 갱신
    if(window.updateUI) window.updateUI();
    if(typeof renderInventory === 'function') renderInventory();
    if(window.saveGame) window.saveGame();
}

function unequipItem(slot) {
    if (player.equipment[slot]) {
        addItem(player.equipment[slot], 1);
        player.equipment[slot] = null;
        showAlert("장비를 해제했습니다.");
        updateCurrency(); // 스탯 갱신
        if(window.updateUI) window.updateUI();
        if(typeof renderInventory === 'function') renderInventory();
        if(window.saveGame) window.saveGame();
    }
}
