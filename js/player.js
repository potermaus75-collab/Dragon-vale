// ==========================================
// js/player.js (레벨업 시스템 포함)
// ==========================================

// 플레이어 초기 상태 정의
const INITIAL_PLAYER_STATE = {
    level: 1, 
    exp: 0,       // [신규] 현재 경험치
    maxExp: 100,  // [신규] 다음 레벨까지 필요 경험치
    gold: 500,
    gem: 10, 
    inventory: {}, 
    myDragons: [
        { id: "fire_c1", type: "fire", stage: 0, clicks: 0, name: "불도마뱀", rarity: "common" } 
    ],
    currentDragonIndex: 0,
    equipment: { head: null, body: null, arm: null, leg: null },
    stats: { explore: 0, atk: 10, def: 5 },
    discovered: [], 
    nestLevel: 0,
    nickname: "Guest"
};

// 실제 플레이어 변수
let player = JSON.parse(JSON.stringify(INITIAL_PLAYER_STATE));
let tempLoot = []; 

// 재화, 스탯, [신규] 경험치 UI 갱신
function updateCurrency() {
    const goldUI = document.getElementById('ui-gold');
    const gemUI = document.getElementById('ui-gem');
    if(goldUI) goldUI.innerText = player.gold;
    if(gemUI) gemUI.innerText = player.gem;
    
    // [신규] 레벨 및 경험치바 표시
    const levelUI = document.getElementById('ui-level');
    const expBar = document.getElementById('ui-exp-fill');
    
    if(levelUI) levelUI.innerText = `Lv.${player.level}`;
    
    if(expBar) {
        // maxExp가 0이 되는 오류 방지
        const max = player.maxExp || 100;
        const percent = Math.min(100, (player.exp / max) * 100);
        expBar.style.width = `${percent}%`;
    }

    // 스탯 재계산
    recalcStats();
}

// [신규] 경험치 획득 및 레벨업 시스템
function gainExp(amount) {
    if(typeof player.exp === 'undefined') player.exp = 0;
    if(!player.maxExp) player.maxExp = 100;

    player.exp += amount;

    // 레벨업 체크
    if (player.exp >= player.maxExp) {
        player.exp -= player.maxExp; // 초과 경험치 이월
        player.level++;
        player.maxExp = Math.floor(player.maxExp * 1.5); // 필요 경험치 1.5배씩 증가
        
        // 레벨업 축하 알림
        if(window.showAlert) {
            window.showAlert(`
                <div style="text-align:center; color:#f1c40f;">
                    <h2>LEVEL UP!</h2>
                    <br>
                    <b style="font-size:1.5rem;">Lv.${player.level} 달성!</b><br><br>
                    <span style="font-size:0.9rem; color:#fff;">이제 새로운 지역을 탐험할 수 있습니다.</span>
                </div>
            `);
        }
        // 중요 이벤트이므로 즉시 저장
        saveGame();
    }
    updateCurrency();
}

// 스탯 재계산 함수
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
    if (!ITEM_DB[itemId] && !force) {
        console.warn(`[System] 존재하지 않는 아이템 ID: ${itemId}`);
        return;
    }
    if (!player.inventory[itemId]) player.inventory[itemId] = 0;
    player.inventory[itemId] += count;
}

function addTempLoot(itemId, count = 1) {
    tempLoot.push({ id: itemId, count: count });
}

function claimTempLoot() {
    if (tempLoot.length === 0) return "";
    let html = "<div style='background:rgba(0,0,0,0.3); padding:10px; border-radius:5px; display:inline-block; text-align:left;'>";
    
    tempLoot.forEach(item => {
        if (item.id === 'gold') {
            player.gold += item.count;
            html += `<div style="margin-bottom:5px;"><span style="color:#f1c40f">${item.count} 골드</span></div>`;
        } else if (item.id === 'gem') {
            player.gem += item.count;
            html += `<div style="margin-bottom:5px;"><span style="color:#3498db">${item.count} 보석</span></div>`;
        } else {
            const itemName = ITEM_DB[item.id] ? ITEM_DB[item.id].name : "아이템";
            addItem(item.id, item.count);
            html += `<div style="margin-bottom:5px;"><span>${itemName} x${item.count}</span></div>`;
        }
    });
    
    html += "</div>";
    tempLoot = [];
    return html;
}

function clearTempLoot() { tempLoot = []; }

function useItem(itemId) {
    if (!player.inventory[itemId] || player.inventory[itemId] <= 0) return;
    
    const item = ITEM_DB[itemId];
    if (!item) {
        delete player.inventory[itemId];
        if(typeof renderInventory === 'function') renderInventory();
        return;
    }
    
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
    } else if (item.type === "egg") {
        showConfirm(
            `<div style="text-align:center">
                <img src="${item.img}" style="width:64px;"><br>
                <b>${item.name}</b>을(를) 부화시키겠습니까?
            </div>`, 
            () => {
                player.inventory[itemId]--;
                if(window.startEggRoulette) window.startEggRoulette(itemId === 'egg_shiny');
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
        addItem(player.equipment[slot], 1, true);
        player.equipment[slot] = null;
        showAlert("장비를 해제했습니다.");
        updateCurrency(); 
        if(window.updateUI) window.updateUI();
        if(typeof renderInventory === 'function') renderInventory();
        if(window.saveGame) window.saveGame();
    }
}

// 저장 및 불러오기 (데이터 병합 로직 포함)
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

            // [중요] 데이터 병합 (초기값 + 저장값)
            player = { ...INITIAL_PLAYER_STATE, ...savedPlayer };

            // 필수 객체 안전장치
            if(!player.inventory) player.inventory = {};
            if(!player.discovered) player.discovered = [];
            if(!player.myDragons) player.myDragons = JSON.parse(JSON.stringify(INITIAL_PLAYER_STATE.myDragons));
            if(!player.equipment) player.equipment = { head: null, body: null, arm: null, leg: null };
            if(!player.stats) player.stats = { explore: 0, atk: 10, def: 5 };
            
            // [신규] 경험치 필드가 없던 구버전 세이브 호환
            if(typeof player.exp === 'undefined') player.exp = 0;
            if(!player.maxExp) player.maxExp = 100;

            if(player.nickname && typeof userNickname !== 'undefined') {
                userNickname = player.nickname;
            }

            console.log("게임 불러오기 성공");
        } catch(e) {
            console.error("세이브 파일 로드 실패", e);
            player = JSON.parse(JSON.stringify(INITIAL_PLAYER_STATE));
        }
    }
}

// 전역 할당 (다른 파일에서 호출 가능하도록)
window.gainExp = gainExp;
