// ==========================================
// js/player.js (수정된 완전한 코드)
// ==========================================

// 플레이어 초기 상태 정의 (템플릿)
const INITIAL_PLAYER_STATE = {
    level: 1, 
    gold: 500,
    gem: 10, 
    inventory: {}, 
    myDragons: [
        { id: "d_init", type: "fire", stage: 0, clicks: 0, name: "불꽃용", rarity: "common" } 
    ],
    currentDragonIndex: 0,
    equipment: { head: null, body: null, arm: null, leg: null },
    stats: { explore: 0, atk: 10, def: 5 },
    discovered: [], 
    nestLevel: 0,
    nickname: "Guest"
};

// 실제 플레이어 변수 (초기값 복사)
let player = JSON.parse(JSON.stringify(INITIAL_PLAYER_STATE));
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
        // 아이템 DB에 존재하는 경우에만 스탯 적용
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

// 아이템 획득 (force: DB에 없어도 강제 추가 여부 - 장비 해제 등에서 사용)
function addItem(itemId, count = 1, force = false) {
    // DB에 없는 아이템 체크 (force가 true면 무시하고 추가)
    if (!ITEM_DB[itemId] && !force) {
        console.warn(`[System] 존재하지 않는 아이템 ID: ${itemId}`);
        return;
    }
    
    if (!player.inventory[itemId]) player.inventory[itemId] = 0;
    player.inventory[itemId] += count;
}

// 탐험 전리품 담기
function addTempLoot(itemId, count = 1) {
    tempLoot.push({ id: itemId, count: count });
}

// 전리품 정산
function claimTempLoot() {
    if (tempLoot.length === 0) return "";
    let html = "<div style='background:rgba(0,0,0,0.3); padding:10px; border-radius:5px; display:inline-block; text-align:left;'>";
    
    tempLoot.forEach(item => {
        // 1. 골드
        if (item.id === 'gold') {
            player.gold += item.count;
            html += `
                <div style="display:flex; align-items:center; gap:5px; margin-bottom:5px;">
                    <img src="assets/images/ui/icon_gold.png" style="width:20px;">
                    <span style="color:#f1c40f">${item.count} 골드</span>
                </div>`;
        } 
        // 2. 보석
        else if (item.id === 'gem') {
            player.gem += item.count;
            html += `
                <div style="display:flex; align-items:center; gap:5px; margin-bottom:5px;">
                    <img src="assets/images/ui/icon_gem.png" style="width:20px;">
                    <span style="color:#3498db">${item.count} 보석</span>
                </div>`;
        } 
        // 3. 일반 아이템
        else {
            // DB에 정보가 있으면 이름 표시, 없으면 ID 표시
            const itemName = ITEM_DB[item.id] ? ITEM_DB[item.id].name : "알 수 없는 아이템";
            const itemImg = ITEM_DB[item.id] ? ITEM_DB[item.id].img : "assets/images/ui/icon_question.png";
            
            addItem(item.id, item.count);
            html += `
                <div style="display:flex; align-items:center; gap:5px; margin-bottom:5px;">
                    <img src="${itemImg}" style="width:24px; height:24px; object-fit:contain;">
                    <span>${itemName} x${item.count}</span>
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
    if (!item) {
        // 유효하지 않은 아이템이 인벤토리에 있는 경우 제거
        delete player.inventory[itemId];
        if(typeof renderInventory === 'function') renderInventory();
        return;
    }
    
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
                // Dragon 클래스 메서드 대신 직접 프로퍼티 조작 (저장 데이터 호환성 위함)
                dragon.clicks += effect;
                showAlert(`[${dragon.name}]에게 물약을 먹였습니다.<br><b>성장치 +${effect}</b>`);
                if(window.updateUI) window.updateUI(); 
            }
        }
        if(typeof renderInventory === 'function') renderInventory();
    }
}

// 둥지 강화 함수
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
    // 기존 장비가 있다면 인벤토리로 복귀
    if (player.equipment[slot]) addItem(player.equipment[slot], 1, true); 
    
    player.equipment[slot] = itemId;
    player.inventory[itemId]--; 
    
    showAlert("장착 완료!");
    updateCurrency(); 
    if(window.updateUI) window.updateUI();
    if(typeof renderInventory === 'function') renderInventory();
    if(window.saveGame) window.saveGame();
}

function unequipItem(slot) {
    if (player.equipment[slot]) {
        // [버그 수정] DB에 없는 아이템이어도 강제로 인벤토리에 추가 (true 파라미터)
        addItem(player.equipment[slot], 1, true);
        
        player.equipment[slot] = null;
        showAlert("장비를 해제했습니다.");
        updateCurrency(); 
        if(window.updateUI) window.updateUI();
        if(typeof renderInventory === 'function') renderInventory();
        if(window.saveGame) window.saveGame();
    }
}

// ==========================================
// [핵심 수정] 저장/불러오기 로직 강화
// ==========================================

function saveGame() {
    // 전역 변수 userNickname을 player 객체에 동기화
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

            // [중요] 병합 로직 (Merge)
            // 초기 상태(INITIAL_PLAYER_STATE) 위에 저장된 데이터(savedPlayer)를 덮어씁니다.
            // 이렇게 하면 업데이트로 새로 생긴 필드(예: nestLevel)가 저장 데이터에 없어도
            // 초기값으로 유지되어 오류가 발생하지 않습니다.
            player = { ...INITIAL_PLAYER_STATE, ...savedPlayer };

            // 중첩 객체들에 대한 안전장치 (Deep Merge가 아니므로 수동 체크)
            if(!player.inventory) player.inventory = {};
            if(!player.discovered) player.discovered = [];
            if(!player.myDragons) player.myDragons = JSON.parse(JSON.stringify(INITIAL_PLAYER_STATE.myDragons));
            if(!player.equipment) player.equipment = { head: null, body: null, arm: null, leg: null };
            if(!player.stats) player.stats = { explore: 0, atk: 10, def: 5 };

            // 닉네임 전역 변수 복구
            if(player.nickname && typeof userNickname !== 'undefined') {
                userNickname = player.nickname;
            }

            console.log("게임 불러오기 성공");
        } catch(e) {
            console.error("세이브 파일 로드 실패 (데이터 손상 가능성)", e);
            alert("저장된 데이터를 불러오는 중 오류가 발생했습니다. 초기화됩니다.");
            player = JSON.parse(JSON.stringify(INITIAL_PLAYER_STATE));
        }
    }
}
