// ==========================================
// js/hatchery.js (수정완료: 새로운 UI 디자인 대응)
// ==========================================

const dragonDisplay = document.getElementById('dragon-display');
const progressBar = document.getElementById('progress-fill');
const dragonNameUI = document.getElementById('dragon-name-ui');
const eggListArea = document.getElementById('my-egg-list');

// 전역 UI 업데이트
window.renderCaveUI = function() {
    renderEggList();     
    renderNest();        
    renderCaveInventory(); 
    updateUpgradeBtnState(); // 버튼 상태 갱신
};

// [수정] 알 목록 렌더링 (새로운 슬롯 스타일 적용)
function renderEggList() {
    if(!eggListArea) return;
    eggListArea.innerHTML = "";
    
    player.myDragons.forEach((dragon, index) => {
        const div = document.createElement('div');
        // 'new-slot-item' 클래스 사용, 선택된 알은 'active' 추가
        div.className = `new-slot-item ${index === player.currentDragonIndex ? 'active' : ''}`;
        
        let iconSrc = "assets/images/dragon/stage_egg.png";
        if(window.getDragonImage) iconSrc = window.getDragonImage(dragon.id, dragon.stage);

        div.innerHTML = `<img src="${iconSrc}" onerror="handleImgError(this, '${dragon.type}', ${dragon.stage})">`;
        
        div.onclick = () => {
            player.currentDragonIndex = index;
            window.renderCaveUI(); // 즉시 갱신
        };
        eggListArea.appendChild(div);
    });
}

// [수정] 둥지(중앙 화면) 렌더링
function renderNest() {
    const dragonData = player.myDragons[player.currentDragonIndex];
    if (!dragonData) return;

    let displayName = dragonData.name;
    if (dragonData.stage === 0) {
        displayName = EGG_TYPE_NAMES[dragonData.type] || "미확인 알";
    }
    
    // 상단 타이틀 바 갱신
    if(dragonNameUI) dragonNameUI.innerText = displayName;

    // 진행도(게이지) 업데이트
    const max = DRAGON_DATA.reqClicks[dragonData.stage] || 9999;
    
    // 등급별 최대 레벨 제한 확인
    const isHighTier = (dragonData.rarity === 'epic' || dragonData.rarity === 'legend');
    const maxStageLimit = isHighTier ? 4 : 3; 
    const isMaxLevel = dragonData.stage >= maxStageLimit;
    
    let percent = 0;
    if (isMaxLevel) {
        percent = 100;
        if(dragonNameUI) dragonNameUI.innerText += " (MAX)";
    } else {
        percent = (dragonData.clicks / max) * 100;
    }
    
    if(progressBar) progressBar.style.width = `${percent}%`;

    // 드래곤 이미지 표시
    let imgSrc = "assets/images/dragon/stage_egg.png"; 
    if (window.getDragonImage) {
        imgSrc = window.getDragonImage(dragonData.id, dragonData.stage);
    }

    // 새로운 HTML 구조에 맞춰 이미지 렌더링
    dragonDisplay.innerHTML = `
        <img src="${imgSrc}" class="main-dragon-img" 
            onerror="handleImgError(this, '${dragonData.type}', ${dragonData.stage})">
    `;
    
    const imgEl = dragonDisplay.querySelector('img');
    if(dragonData.isShiny && imgEl) {
        imgEl.style.filter = "hue-rotate(150deg) brightness(1.2) drop-shadow(0 0 5px #f1c40f)";
    }

    // 이미지 클릭 이벤트 연결
    if(imgEl) {
        if (!isMaxLevel) {
            imgEl.style.cursor = "pointer";
            imgEl.onclick = () => handleDragonClick(dragonData, imgEl);
        } else {
            imgEl.style.cursor = "default";
            imgEl.onclick = () => showAlert("이 용은 성장을 마쳤습니다.");
        }
    }
}

// [추가] TOUCH 버튼 핸들러 (HTML의 onclick="handleTouchBtn()"에서 호출)
window.handleTouchBtn = function() {
    const dragonData = player.myDragons[player.currentDragonIndex];
    const imgEl = dragonDisplay.querySelector('img');
    
    if (dragonData && imgEl) {
        // 이미지 클릭과 동일한 효과
        handleDragonClick(dragonData, imgEl);
    }
};

function handleDragonClick(dragon, imgEl) {
    // 애니메이션 효과
    imgEl.classList.remove('click-anim');
    void imgEl.offsetWidth; // 리플로우 강제
    imgEl.classList.add('click-anim');

    const isHighTier = (dragon.rarity === 'epic' || dragon.rarity === 'legend');
    const maxStageLimit = isHighTier ? 4 : 3;

    if (dragon.stage >= maxStageLimit) return; 

    const max = DRAGON_DATA.reqClicks[dragon.stage];
    const clickPower = 1 + (player.nestLevel || 0);
    dragon.clicks += clickPower;
    
    const percent = Math.min(100, (dragon.clicks / max) * 100);
    if(progressBar) progressBar.style.width = `${percent}%`;

    if (dragon.clicks >= max) {
        const oldStage = dragon.stage;
        dragon.stage++;
        dragon.clicks = 0;
        
        // 부화/진화 처리 로직 (기존과 동일)
        if (oldStage === 0 && dragon.stage === 1) {
            if(!player.discovered) player.discovered = [];
            if(!player.discovered.includes(dragon.id)) {
                player.discovered.push(dragon.id);
            }
            showAlert(`알을 깨고 <b>${dragon.name}</b>이(가) 태어났습니다!`);
        }

        if(!player.maxStages) player.maxStages = {};
        if(!player.maxStages[dragon.id] || player.maxStages[dragon.id] < dragon.stage) {
            player.maxStages[dragon.id] = dragon.stage;
        }

        const xpReward = [0, 50, 100, 300, 1000];
        const gain = xpReward[dragon.stage] || 50;
        if(window.gainExp) window.gainExp(gain);
        
        renderNest(); // 모습 갱신
        if(window.saveGame) window.saveGame();
    }
}

// [수정] 둥지 강화 재료 (하단 패널) 렌더링
function renderCaveInventory() {
    const grid = document.getElementById('cave-inventory-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    if(!player.inventory) player.inventory = {};
    const itemIds = Object.keys(player.inventory);
    
    itemIds.forEach(id => {
        if(player.inventory[id] > 0) {
            const item = ITEM_DB[id];
            // 재료 타입만 표시 (material) - 데이터상 nest_wood 등
            // 혹은 기존처럼 equip이 아닌 것들을 표시하되, 스타일을 새롭게 적용
            if(item && item.type !== 'equip') {
                const div = document.createElement('div');
                div.className = 'new-slot-item'; // 새 스타일 클래스
                div.innerHTML = `
                    <img src="${item.img}" onerror="this.src='assets/images/ui/icon_question.png'">
                    <span style="position:absolute; bottom:2px; right:4px; font-size:0.7rem; color:#fff; text-shadow:1px 1px 1px #000;">${player.inventory[id]}</span>
                `;
                div.onclick = () => useItem(id); 
                grid.appendChild(div);
            }
        }
    });
}

// [수정] 업그레이드 버튼 상태 업데이트
function updateUpgradeBtnState() {
    const upgradeBtn = document.getElementById('btn-upgrade-nest');
    if (!upgradeBtn) return;

    // 이벤트 리스너 연결 (중복 방지 처리 필요하지만, 간단히 덮어쓰기)
    upgradeBtn.onclick = () => { if(window.upgradeNest) window.upgradeNest(); };

    const currentLv = player.nestLevel || 0;
    if (currentLv < NEST_UPGRADE_COST.length) {
        const cost = NEST_UPGRADE_COST[currentLv];
        upgradeBtn.innerText = `강화 (${cost})`;
        upgradeBtn.style.opacity = 1;
        upgradeBtn.disabled = false;
    } else {
        upgradeBtn.innerText = "MAX";
        upgradeBtn.style.opacity = 0.5;
        upgradeBtn.disabled = true;
    }
}

// 알 생성 유틸리티 (기존 유지)
function generateUID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 알 획득 로직 (기존 유지)
function hatchEggInternal(isShinyEgg = false, targetType = null) {
    // ... (기존 로직과 동일, 데이터 처리 부분) ...
    // 생략 없이 전체 코드 필요시 이전 hatchery.js의 hatchEggInternal 로직 그대로 사용
    const lv = player.level || 1;
    const bonusProb = lv * 0.05; 

    let pLegend = RARITY_DATA.legend.prob + (bonusProb * 0.5); 
    let pEpic = RARITY_DATA.epic.prob + bonusProb;
    let pHeroic = RARITY_DATA.heroic.prob;
    let pRare = RARITY_DATA.rare.prob;
    
    if(isShinyEgg) { pLegend += 2; pEpic += 5; pHeroic += 20; }

    const rand = Math.random() * 100;
    let rarity = 'common';

    if (rand < pLegend) rarity = 'legend';
    else if (rand < pLegend + pEpic) rarity = 'epic';
    else if (rand < pLegend + pEpic + pHeroic) rarity = 'heroic';
    else if (rand < pLegend + pEpic + pHeroic + pRare) rarity = 'rare';
    else rarity = 'common';

    const candidates = [];
    if(typeof DRAGON_DEX !== 'undefined') {
        for (const key in DRAGON_DEX) {
            const dragon = DRAGON_DEX[key];
            if (dragon.rarity === rarity) {
                if (targetType) {
                    if (dragon.type === targetType) candidates.push({ ...dragon, id: key });
                } else {
                    candidates.push({ ...dragon, id: key });
                }
            }
        }
    }

    if (candidates.length === 0 && targetType) {
        for (const key in DRAGON_DEX) {
            if (DRAGON_DEX[key].type === targetType) {
                candidates.push({ ...DRAGON_DEX[key], id: key });
                rarity = DRAGON_DEX[key].rarity; 
                break; 
            }
        }
    }
    if (candidates.length === 0) candidates.push({ name: "불도마뱀", type: "fire", rarity: "common", desc: "기본 용", id: "fire_c1" });
    
    const resultDragon = candidates[Math.floor(Math.random() * candidates.length)];
    const isShiny = Math.random() < (isShinyEgg ? 0.2 : 0.05);

    player.myDragons.push({
        uId: generateUID(), 
        id: resultDragon.id,
        type: resultDragon.type,
        isShiny: isShiny,
        rarity: rarity,
        stage: 0, 
        clicks: 0, 
        name: resultDragon.name 
    });
    
    if(!player.maxStages) player.maxStages = {};
    if(typeof player.maxStages[resultDragon.id] === 'undefined') {
        player.maxStages[resultDragon.id] = 0;
    }

    if(window.renderCaveUI) window.renderCaveUI();
    if(window.saveGame) window.saveGame();
}

window.hatchEggInternal = hatchEggInternal;
