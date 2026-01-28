// ==========================================
// js/hatchery.js (완전한 코드: 생략 없음)
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
    updateUpgradeBtnState(); 
};

// [UI] 알 목록 렌더링 (사이드바)
function renderEggList() {
    if(!eggListArea) return;
    eggListArea.innerHTML = "";
    
    player.myDragons.forEach((dragon, index) => {
        const div = document.createElement('div');
        // 선택된 알은 active 클래스 추가
        div.className = `new-slot-item ${index === player.currentDragonIndex ? 'active' : ''}`;
        
        let iconSrc = "assets/images/dragon/stage_egg.png";
        if(window.getDragonImage) iconSrc = window.getDragonImage(dragon.id, dragon.stage);

        div.innerHTML = `<img src="${iconSrc}" onerror="handleImgError(this, '${dragon.type}', ${dragon.stage})">`;
        
        div.onclick = () => {
            player.currentDragonIndex = index;
            window.renderCaveUI(); 
        };
        eggListArea.appendChild(div);
    });
}

// [UI] 둥지 화면 렌더링 (중앙)
function renderNest() {
    const dragonData = player.myDragons[player.currentDragonIndex];
    if (!dragonData) return;

    // 이름 표시
    let displayName = dragonData.name;
    if (dragonData.stage === 0) {
        displayName = (window.EGG_TYPE_NAMES && window.EGG_TYPE_NAMES[dragonData.type]) ? window.EGG_TYPE_NAMES[dragonData.type] : "미확인 알";
    }
    if(dragonNameUI) dragonNameUI.innerText = displayName;

    // 성장 게이지 계산
    const max = DRAGON_DATA.reqClicks[dragonData.stage] || 9999;
    
    // 등급별 최대 레벨 제한 (일반~서사: 3단계 / 에픽~전설: 4단계)
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

    // 게이지 텍스트 갱신 (예: 50 / 100)
    const gaugeText = document.querySelector('.gauge-text');
    if(gaugeText) {
        gaugeText.innerText = isMaxLevel ? "MAX" : `${Math.floor(dragonData.clicks)} / ${max}`;
    }

    // 드래곤 이미지
    let imgSrc = "assets/images/dragon/stage_egg.png"; 
    if (window.getDragonImage) {
        imgSrc = window.getDragonImage(dragonData.id, dragonData.stage);
    }

    // HTML 구조에 이미지 삽입
    dragonDisplay.innerHTML = `
        <img src="${imgSrc}" class="main-dragon-img" 
            onerror="handleImgError(this, '${dragonData.type}', ${dragonData.stage})">
    `;
    
    // 이로치(Shiny) 효과 적용
    const imgEl = dragonDisplay.querySelector('img');
    if(dragonData.isShiny && imgEl) {
        imgEl.style.filter = "hue-rotate(150deg) brightness(1.2) drop-shadow(0 0 5px #f1c40f)";
    }

    // 클릭 이벤트 연결
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

// [Logic] TOUCH 버튼 핸들러 (HTML onclick 연결)
window.handleTouchBtn = function() {
    const dragonData = player.myDragons[player.currentDragonIndex];
    const imgEl = dragonDisplay.querySelector('img');
    
    if (dragonData && imgEl) {
        handleDragonClick(dragonData, imgEl);
    }
};

// [Logic] 드래곤 클릭 시 성장 처리
function handleDragonClick(dragon, imgEl) {
    // 애니메이션 리셋 및 실행
    imgEl.classList.remove('click-anim');
    void imgEl.offsetWidth; 
    imgEl.classList.add('click-anim');

    // 최대 레벨 체크
    const isHighTier = (dragon.rarity === 'epic' || dragon.rarity === 'legend');
    const maxStageLimit = isHighTier ? 4 : 3;

    if (dragon.stage >= maxStageLimit) return; 

    // 클릭당 경험치 계산
    const max = DRAGON_DATA.reqClicks[dragon.stage];
    const clickPower = 1 + (player.nestLevel || 0);
    dragon.clicks += clickPower;
    
    // 게이지 즉시 반영
    const percent = Math.min(100, (dragon.clicks / max) * 100);
    if(progressBar) progressBar.style.width = `${percent}%`;
    
    const gaugeText = document.querySelector('.gauge-text');
    if(gaugeText) gaugeText.innerText = `${Math.floor(dragon.clicks)} / ${max}`;

    // 레벨업 조건 달성
    if (dragon.clicks >= max) {
        const oldStage = dragon.stage;
        dragon.stage++;
        dragon.clicks = 0;
        
        // 부화 (0 -> 1) 처리 및 도감 등록
        if (oldStage === 0 && dragon.stage === 1) {
            if(!player.discovered) player.discovered = [];
            if(!player.discovered.includes(dragon.id)) {
                player.discovered.push(dragon.id);
            }

            let babyImg = "assets/images/dragon/stage_baby.png";
            if(window.getDragonImage) babyImg = window.getDragonImage(dragon.id, 1);

            showAlert(`
                <div style="text-align:center;">
                    <h3>부화 성공!</h3>
                    <img src="${babyImg}" style="width:100px; height:100px; object-fit:contain; margin:10px 0;"
                         onerror="handleImgError(this, '${dragon.type}', 1)">
                    <br>알을 깨고 <b style="color:${RARITY_DATA[dragon.rarity].color}">${dragon.name}</b>이(가) 태어났습니다!
                </div>
            `);
        } else {
            // 일반 성장 (1->2, 2->3 등)
            let evolvedImg = "assets/images/dragon/stage_adult.png";
            if(window.getDragonImage) evolvedImg = window.getDragonImage(dragon.id, dragon.stage);

            showAlert(`
                <div style="text-align:center;">
                    <img src="${evolvedImg}" style="width:100px;" onerror="handleImgError(this, '${dragon.type}', ${dragon.stage})"><br>
                    축하합니다!<br>[${dragon.name}]이(가) 성장했습니다!
                </div>
            `);
        }

        // 최대 성장 기록 업데이트
        if(!player.maxStages) player.maxStages = {};
        if(!player.maxStages[dragon.id] || player.maxStages[dragon.id] < dragon.stage) {
            player.maxStages[dragon.id] = dragon.stage;
        }

        // 경험치 보상
        const xpReward = [0, 50, 100, 300, 1000];
        const gain = xpReward[dragon.stage] || 50;
        if(window.gainExp) window.gainExp(gain);
        
        renderNest(); 
        if(window.saveGame) window.saveGame();
    }
}

// [UI] 둥지 강화 재료 렌더링 (하단 패널)
function renderCaveInventory() {
    const grid = document.getElementById('cave-inventory-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    if(!player.inventory) player.inventory = {};
    const itemIds = Object.keys(player.inventory);
    
    itemIds.forEach(id => {
        if(player.inventory[id] > 0) {
            const item = ITEM_DB[id];
            // 장비가 아닌 아이템(재료, 물약 등)만 표시
            if(item && item.type !== 'equip') {
                const div = document.createElement('div');
                div.className = 'new-slot-item'; 
                div.innerHTML = `
                    <img src="${item.img}" onerror="this.src='assets/images/ui/icon_question.png'">
                    <span class="count-badge">${player.inventory[id]}</span>
                `;
                div.onclick = () => useItem(id); 
                grid.appendChild(div);
            }
        }
    });
}

// [UI] 업그레이드 버튼 상태 (이미지 버튼 투명도 조절)
function updateUpgradeBtnState() {
    const upgradeBtn = document.getElementById('btn-upgrade-nest');
    if (!upgradeBtn) return;

    upgradeBtn.onclick = () => { if(window.upgradeNest) window.upgradeNest(); };

    const currentLv = player.nestLevel || 0;
    if (currentLv < NEST_UPGRADE_COST.length) {
        upgradeBtn.style.opacity = 1; 
        upgradeBtn.style.filter = "none";
        upgradeBtn.disabled = false;
    } else {
        upgradeBtn.style.opacity = 0.5;
        upgradeBtn.style.filter = "grayscale(1)";
        upgradeBtn.disabled = true;
    }
}

// [Util] 고유 ID 생성
function generateUID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// [Logic] 알 획득 및 드래곤 생성 (외부 호출용)
function hatchEggInternal(isShinyEgg = false, targetType = null) {
    const lv = player.level || 1;
    const bonusProb = lv * 0.05; 

    // 등급 확률 계산
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

    // 대상 드래곤 후보군 추리기
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

    // 후보가 없으면(확률상) 해당 타입의 아무 등급이나 가져옴
    if (candidates.length === 0 && targetType) {
        for (const key in DRAGON_DEX) {
            if (DRAGON_DEX[key].type === targetType) {
                candidates.push({ ...DRAGON_DEX[key], id: key });
                rarity = DRAGON_DEX[key].rarity; 
                break; 
            }
        }
    }
    // 그래도 없으면 기본 용
    if (candidates.length === 0) candidates.push({ name: "불도마뱀", type: "fire", rarity: "common", desc: "기본 용", id: "fire_c1" });
    
    const resultDragon = candidates[Math.floor(Math.random() * candidates.length)];
    const isShiny = Math.random() < (isShinyEgg ? 0.2 : 0.05);

    // 플레이어 데이터에 추가
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
