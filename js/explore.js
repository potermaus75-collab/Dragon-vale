// ==========================================
// js/explore.js (완전판: 전투 & 탐험 시스템)
// ==========================================

window.isExploreActive = false;
window.inBattle = false;

let currentRegionId = -1;
let movesLeft = 0;
let tempLoot = [];

// 전투 관련 변수
let battleMyDragon = null; // 실제 객체 참조
let battleStats = { myHp: 0, myMaxHp: 0, myAtk: 0, enHp: 0, enMaxHp: 0, enAtk: 0 };
let currentEnemy = null;   // { name, hp, atk, img, isBoss, dropEggId }

window.initExploreTab = function() {
    renderMap();
    updateMapCurrency();
};

function updateMapCurrency() {
    const goldUI = document.getElementById('ui-gold-map');
    const gemUI = document.getElementById('ui-gem-map');
    if(goldUI) goldUI.innerText = player.gold;
    if(gemUI) gemUI.innerText = player.gem;
}

function renderMap() {
    const container = document.getElementById('map-icons-layer');
    const enterBtn = document.getElementById('btn-enter-region');
    if(!container) return; 
    container.innerHTML = "";
    
    if(enterBtn) {
        enterBtn.disabled = true;
        enterBtn.innerText = "지역을 선택하세요";
        enterBtn.style.color = "#888";
    }

    REGION_DATA.forEach(region => {
        const div = document.createElement('div');
        div.className = `map-icon loc-${region.type}`; 
        if (player.level < region.levelReq) {
            div.classList.add('locked');
            div.onclick = () => showAlert(`[${region.name}] 접근 불가\n(Lv.${region.levelReq} 이상 필요)`);
        } else {
            div.onclick = () => selectRegion(region.id, div);
        }
        container.appendChild(div);
    });
}

function selectRegion(id, element) {
    currentRegionId = id; 
    document.querySelectorAll('.map-icon').forEach(icon => icon.classList.remove('selected'));
    element.classList.add('selected');
    
    const enterBtn = document.getElementById('btn-enter-region');
    if(enterBtn) {
        enterBtn.disabled = false;
        enterBtn.innerText = "진입하기";
        enterBtn.style.color = "#5dade2";
    }
}

function enterSelectedRegion() {
    if (window.isExploreActive) return;
    if (currentRegionId === -1) { showAlert("지역을 선택하세요."); return; }

    const myDragon = player.myDragons.find(d => d.uId === player.currentDragonUId);
    if (!myDragon) {
        showAlert("함께할 드래곤이 없습니다.\n동굴에서 드래곤을 선택해주세요.");
        return;
    }
    if (myDragon.stage === 0) {
        showAlert("알 상태로는 탐험할 수 없습니다.\n부화시킨 후 시도하세요.");
        return;
    }

    startExplore(currentRegionId, myDragon);
}

function startExplore(regionId, myDragon) {
    battleMyDragon = myDragon;
    movesLeft = 10;
    tempLoot = [];
    window.isExploreActive = true;
    window.inBattle = false;

    const stats = window.getDragonStats ? window.getDragonStats(myDragon) : { maxHp: 100, atk: 10 };
    battleStats.myMaxHp = stats.maxHp;
    battleStats.myHp = stats.maxHp;
    battleStats.myAtk = stats.atk;

    toggleExploreView('run');
    
    const region = REGION_DATA[regionId];
    const bgElem = document.getElementById('explore-bg');
    if (region.bg) {
        bgElem.style.backgroundImage = `url('${region.bg}')`;
        bgElem.style.backgroundSize = "cover";
        bgElem.style.backgroundPosition = "center";
    }
    
    document.getElementById('region-title').innerText = region.name;
    document.getElementById('event-msg').innerHTML = "탐험을 시작합니다.";
    
    updateMyMiniStatus();
    updateMoveUI();
}

function toggleExploreView(mode) {
    document.getElementById('explore-map-view').classList.add('hidden');
    document.getElementById('explore-run-view').classList.add('hidden');
    document.getElementById('explore-battle-view').classList.add('hidden');

    if (mode === 'map') document.getElementById('explore-map-view').classList.remove('hidden');
    else if (mode === 'run') document.getElementById('explore-run-view').classList.remove('hidden');
    else if (mode === 'battle') document.getElementById('explore-battle-view').classList.remove('hidden');
}

function updateMyMiniStatus() {
    document.getElementById('explore-my-name').innerText = battleMyDragon.name;
    const hpPct = Math.max(0, (battleStats.myHp / battleStats.myMaxHp) * 100);
    document.getElementById('explore-my-hp').style.width = `${hpPct}%`;
    document.getElementById('explore-my-hp-text').innerText = `${battleStats.myHp} / ${battleStats.myMaxHp}`;
}

function moveForward() {
    if (movesLeft <= 0 || !window.isExploreActive || window.inBattle) return;

    movesLeft--;
    
    const bg = document.getElementById('explore-bg');
    bg.classList.remove('walking-anim');
    void bg.offsetWidth; 
    bg.classList.add('walking-anim');

    processRandomEvent();
    updateMoveUI();
}

function updateMoveUI() {
    const counter = document.getElementById('move-counter');
    const moveBtn = document.getElementById('btn-move');
    const returnBtn = document.getElementById('btn-return');

    counter.innerHTML = `👣 남은 이동: ${movesLeft}`;
    
    if (movesLeft <= 0) {
        document.getElementById('event-msg').innerText = "날이 저물었습니다. 귀환하세요.";
        moveBtn.disabled = true;
        moveBtn.innerText = "종료";
        returnBtn.innerText = "보상 받기";
        returnBtn.style.color = "#2ecc71";
        returnBtn.onclick = () => finishExplore(true);
    } else {
        moveBtn.disabled = false;
        moveBtn.innerText = "이동";
        returnBtn.innerText = "포기";
        returnBtn.style.color = "#aaa"; 
        returnBtn.onclick = () => finishExplore(false);
    }
}

function processRandomEvent() {
    const roll = Math.random() * 100;
    const msgArea = document.getElementById('event-msg');

    if (roll < 30) {
        msgArea.innerText = "평화로운 숲길입니다...";
    } else if (roll < 60) {
        const isGold = Math.random() < 0.7;
        if (isGold) {
            const amt = Math.floor(Math.random() * 30) + 10;
            addTempLoot('gold', amt);
            msgArea.innerHTML = `<span style="color:#f1c40f">${amt} 골드</span>를 주웠습니다.`;
        } else {
            addTempLoot('nest_wood', 1);
            msgArea.innerHTML = `둥지 재료를 발견했습니다.`;
        }
    } else if (roll < 95) {
        encounterMonster();
    } else {
        encounterNest();
    }
}

// ---- 전투 시스템 ----

function encounterMonster() {
    const list = window.MONSTER_LIST || [{ name: "슬라임", hp: 50, atk: 5 }];
    const monData = list[Math.floor(Math.random() * list.length)];
    const levelBonus = 1 + (currentRegionId * 0.2); 
    
    startBattle({
        name: monData.name,
        hp: Math.floor(monData.hp * levelBonus),
        maxHp: Math.floor(monData.hp * levelBonus),
        atk: Math.floor(monData.atk * levelBonus),
        img: "assets/images/ui/icon_alert.png", 
        isBoss: false
    });
}

function encounterParentDragon() {
    const roll = Math.random() * 100;
    let rarity = 'common';
    if (roll > 99) rarity = 'legend';
    else if (roll > 95) rarity = 'epic';
    else if (roll > 80) rarity = 'heroic';
    else if (roll > 50) rarity = 'rare';

    const regionType = REGION_DATA[currentRegionId].type;
    const candidates = [];
    if (window.DRAGON_DEX) {
        for(const key in DRAGON_DEX) {
            if(DRAGON_DEX[key].type === regionType && DRAGON_DEX[key].rarity === rarity) {
                candidates.push({ ...DRAGON_DEX[key], id: key });
            }
        }
        if(candidates.length === 0) {
            for(const key in DRAGON_DEX) {
                if(DRAGON_DEX[key].type === regionType && DRAGON_DEX[key].rarity === 'common') {
                    candidates.push({ ...DRAGON_DEX[key], id: key });
                }
            }
        }
    }
    
    const target = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : { name: "알 수 없는 용", rarity: "common" };
    const stats = window.BASE_STATS ? BASE_STATS[target.rarity] : { hp: 200, atk: 30 };
    
    const bossHp = stats.hp * 2;
    const bossAtk = stats.atk * 1.5;
    const img = window.getDragonImage ? window.getDragonImage(target.id, 3) : "";

    startBattle({
        name: `[보스] ${target.name}`,
        hp: bossHp, maxHp: bossHp, atk: bossAtk,
        img: img,
        isBoss: true,
        dropEggId: `egg_${regionType}`, 
        dragonId: target.id 
    });
}

function startBattle(enemyData) {
    window.inBattle = true;
    currentEnemy = enemyData;
    battleStats.enHp = enemyData.hp;
    battleStats.enMaxHp = enemyData.maxHp;
    battleStats.enAtk = enemyData.atk;

    toggleExploreView('battle');

    document.getElementById('enemy-name').innerText = enemyData.name;
    document.getElementById('enemy-img').src = enemyData.img || "assets/images/ui/icon_alert.png";
    updateBattleUI();
    
    document.getElementById('battle-my-name').innerText = battleMyDragon.name;
    const myImg = window.getDragonImage ? window.getDragonImage(battleMyDragon.id, battleMyDragon.stage) : "";
    document.getElementById('battle-my-img').src = myImg;

    const log = document.getElementById('battle-log');
    log.innerHTML = ""; 
    logBattle(`[${enemyData.name}]이(가) 나타났다!`);
}

function updateBattleUI() {
    const enPct = Math.max(0, (battleStats.enHp / battleStats.enMaxHp) * 100);
    document.getElementById('enemy-hp-bar').style.width = `${enPct}%`;
    document.getElementById('enemy-hp-text').innerText = `${Math.floor(battleStats.enHp)}/${battleStats.enMaxHp}`;

    const myPct = Math.max(0, (battleStats.myHp / battleStats.myMaxHp) * 100);
    document.getElementById('battle-my-hp-bar').style.width = `${myPct}%`;
    document.getElementById('battle-my-hp-text').innerText = `${Math.floor(battleStats.myHp)}/${battleStats.myMaxHp}`;
}

function logBattle(msg) {
    const log = document.getElementById('battle-log');
    log.innerHTML += `<div>${msg}</div>`;
    log.scrollTop = log.scrollHeight;
}

window.battleAttack = function() {
    if (!window.inBattle) return;

    const isCrit = Math.random() < 0.1;
    let dmg = Math.floor(battleStats.myAtk * (Math.random() * 0.2 + 0.9)); 
    if (isCrit) { dmg = Math.floor(dmg * 1.5); }
    
    battleStats.enHp -= dmg;
    updateBattleUI();
    logBattle(`내 공격! ${dmg} 피해${isCrit ? "(치명타!)" : ""}`);

    if (battleStats.enHp <= 0) {
        winBattle();
        return;
    }

    setTimeout(() => {
        if (!window.inBattle) return;
        let enDmg = Math.floor(battleStats.enAtk * (Math.random() * 0.2 + 0.9));
        
        if (Math.random() < 0.05) {
            logBattle(`적의 공격을 회피했습니다!`);
        } else {
            battleStats.myHp -= enDmg;
            updateBattleUI();
            logBattle(`적의 공격! ${enDmg} 피해를 입음.`);
        }

        if (battleStats.myHp <= 0) {
            loseBattle();
        }
    }, 500);
};

window.battleFlee = function() {
    if (!window.inBattle) return;
    if (currentEnemy.isBoss) {
        logBattle("보스에게서는 도망칠 수 없습니다!");
        return;
    }
    if (Math.random() < 0.5) {
        logBattle("성공적으로 도망쳤습니다.");
        setTimeout(() => endBattle(false), 800);
    } else {
        logBattle("도망 실패! 공격받습니다.");
        setTimeout(() => {
            let enDmg = Math.floor(battleStats.enAtk);
            battleStats.myHp -= enDmg;
            updateBattleUI();
            if (battleStats.myHp <= 0) loseBattle();
        }, 500);
    }
};

function winBattle() {
    window.inBattle = false;
    let rewardsHtml = "";
    
    if (currentEnemy.isBoss) {
        addTempLoot('gem', 10);
        rewardsHtml += `<div style="color:#3498db">보석 +10</div>`;

        if (Math.random() < 0.5) {
            addTempLoot(currentEnemy.dropEggId, 1);
            rewardsHtml += `<div style="color:#f1c40f">알 획득!</div>`;
        }
    } else {
        const gold = Math.floor(Math.random() * 20) + 10;
        addTempLoot('gold', gold);
        rewardsHtml += `<div style="color:#f1c40f">골드 +${gold}</div>`;
    }

    if(window.gainExp) window.gainExp(10); 
    showBattleResult("VICTORY", currentEnemy.img, "승리했습니다!", rewardsHtml);
}

function loseBattle() {
    window.inBattle = false;
    showBattleResult("DEFEAT", "assets/images/ui/icon_alert.png", "쓰러졌습니다...<br>탐험을 중단하고 복귀합니다.", "");
    tempLoot = []; 
}

function showBattleResult(title, img, msg, rewards) {
    const modal = document.getElementById('battle-result-modal');
    const panel = modal.querySelector('.panel-box'); 

    // [신규 로직] 결과에 따라 팝업 배경 클래스 토글
    panel.classList.remove('panel-battle-victory', 'panel-battle-defeat');
    
    if (title === "VICTORY") {
        panel.classList.add('panel-battle-victory');
        document.getElementById('battle-result-title').style.color = "#f1c40f"; 
    } else {
        panel.classList.add('panel-battle-defeat');
        document.getElementById('battle-result-title').style.color = "#888"; 
    }

    document.getElementById('battle-result-title').innerText = title;
    document.getElementById('battle-result-img').src = img;
    document.getElementById('battle-result-msg').innerHTML = msg;
    document.getElementById('battle-rewards').innerHTML = rewards;
    
    modal.classList.remove('hidden');
    
    const btn = modal.querySelector('button');
    btn.onclick = () => {
        closeBattleResult();
        if (title === "VICTORY") {
            endBattle(true);
        } else {
            toggleExploreView('map');
            window.isExploreActive = false;
            if(window.updateUI) window.updateUI();
        }
    };
}

window.closeBattleResult = function() {
    const modal = document.getElementById('battle-result-modal');
    modal.classList.add('hidden');
};

function endBattle(win) {
    window.inBattle = false;
    toggleExploreView('run');
    updateMyMiniStatus(); 
    
    if (win) {
        document.getElementById('event-msg').innerText = "전투에서 승리했습니다.";
    }
}

function encounterNest() {
    const moveBtn = document.getElementById('btn-move');
    moveBtn.disabled = true;

    showConfirm("둥지를 발견했습니다! 알을 훔칠까요?", 
        () => {
            if (Math.random() < 0.1) {
                const regionType = REGION_DATA[currentRegionId].type;
                const eggId = `egg_${regionType}`;
                addTempLoot(eggId, 1);
                showAlert("성공적으로 알을 훔쳤습니다!", () => {
                    moveBtn.disabled = false;
                    updateMoveUI();
                });
            } else {
                showAlert("들켰습니다!! 부모 용이 깨어났습니다!", () => {
                    encounterParentDragon();
                });
            }
        },
        () => {
            document.getElementById('event-msg').innerText = "조용히 지나갑니다.";
            moveBtn.disabled = false;
            updateMoveUI();
        }
    );
}

function finishExplore(success) {
    window.isExploreActive = false;
    const lootMsg = claimTempLoot();
    toggleExploreView('map');
    
    if(success && lootMsg) {
        showAlert(`<div style="text-align:center"><b>[탐험 완료]</b><br>${lootMsg}</div>`);
    } else if (!success) {
        showAlert("탐험을 중단하고 돌아왔습니다.");
    }
    
    if(window.updateUI) window.updateUI();
    if(window.saveGame) window.saveGame(true);
}

function claimTempLoot() {
    if (tempLoot.length === 0) return "";
    let html = "";
    tempLoot.forEach(item => {
        if (item.id === 'gold') {
            player.gold += item.count;
            html += `<div>${item.count} 골드</div>`;
        } else if (item.id === 'gem') {
            player.gem += item.count;
            html += `<div>${item.count} 보석</div>`;
        } else {
            window.addItem(item.id, item.count);
            const name = (window.ITEM_DB && window.ITEM_DB[item.id]) ? window.ITEM_DB[item.id].name : item.id;
            html += `<div>${name} x${item.count}</div>`;
        }
    });
    return html;
}

function addTempLoot(id, count) {
    tempLoot.push({ id: id, count: count });
}

window.initExploreTab = initExploreTab;
window.enterSelectedRegion = enterSelectedRegion;
