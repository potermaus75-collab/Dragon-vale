// ==========================================
// js/hatchery.js (완전판)
// ==========================================

const dragonDisplay = document.getElementById('dragon-display');
const progressBar = document.getElementById('progress-fill');
const dragonNameUI = document.getElementById('dragon-name-ui');
const eggListArea = document.getElementById('my-egg-list');

// 둥지 탭 전체 UI 렌더링
window.renderCaveUI = function() {
    syncBookData(); 
    renderEggList();     
    renderNest();        
    renderCaveInventory(); 
};

// 도감 데이터 동기화
function syncBookData() {
    if (!player.myDragons) return;
    if (!player.discovered) player.discovered = [];
    if (!player.maxStages) player.maxStages = {};

    let isUpdated = false;
    player.myDragons.forEach(dragon => {
        // 발견 처리
        if (dragon.stage > 0 && !player.discovered.includes(dragon.id)) {
            player.discovered.push(dragon.id);
            isUpdated = true;
        }
        // 최대 성장 단계 기록
        const currentRec = player.maxStages[dragon.id] || 0;
        if (dragon.stage > currentRec) {
            player.maxStages[dragon.id] = dragon.stage;
            isUpdated = true;
        }
    });

    if (isUpdated && window.saveGame) {
        window.saveGame(true);
    }
}

// 왼쪽 알 목록 렌더링
function renderEggList() {
    if(!eggListArea) return;
    eggListArea.innerHTML = "";
    
    player.myDragons.forEach((dragon) => {
        const div = document.createElement('div');
        const isActive = (dragon.uId === player.currentDragonUId);
        div.className = `new-slot-item ${isActive ? 'active' : ''}`;
        
        let iconSrc = "assets/images/dragon/stage_egg.png";
        if(window.getDragonImage) iconSrc = window.getDragonImage(dragon.id, dragon.stage);

        div.innerHTML = `<img src="${iconSrc}" onerror="handleImgError(this)">`;
        div.onclick = () => {
            player.currentDragonUId = dragon.uId;
            window.renderCaveUI(); 
        };
        eggListArea.appendChild(div);
    });
}

// 중앙 둥지 화면 렌더링
function renderNest() {
    const dragonData = player.myDragons.find(d => d.uId === player.currentDragonUId);
    
    if (!dragonData) {
        if(player.myDragons.length > 0) {
            player.currentDragonUId = player.myDragons[0].uId;
            renderNest();
        } else {
            if(dragonNameUI) dragonNameUI.innerText = "드래곤 없음";
            if(dragonDisplay) dragonDisplay.innerHTML = "";
        }
        return;
    }

    // 이름 및 별 등급 표시
    let displayName = dragonData.name;
    const starLv = window.getDragonStarLevel ? window.getDragonStarLevel(dragonData.id) : 0;
    const starStr = "★".repeat(starLv);

    if (dragonData.stage === 0) {
        displayName = (window.EGG_TYPE_NAMES && window.EGG_TYPE_NAMES[dragonData.type]) ? window.EGG_TYPE_NAMES[dragonData.type] : "미확인 알";
    } else {
        if (starLv > 0) displayName = `${displayName} <span style="color:#f1c40f">${starStr}</span>`;
    }

    if(dragonNameUI) dragonNameUI.innerHTML = displayName;

    // 게이지 표시
    const max = DRAGON_DATA.reqClicks[dragonData.stage] || 9999;
    
    // [수정] 성장 한계치 설정 (에픽/전설만 4단계 고룡 가능, 나머지는 3단계 성룡이 끝)
    const isHighTier = (dragonData.rarity === 'epic' || dragonData.rarity === 'legend');
    const maxStageLimit = isHighTier ? 4 : 3; 
    
    const isMaxLevel = dragonData.stage >= maxStageLimit;
    
    let percent = 0;
    if (isMaxLevel) {
        percent = 100;
        if(dragonNameUI) dragonNameUI.innerHTML += " (MAX)";
    } else {
        percent = (dragonData.clicks / max) * 100;
    }
    
    if(progressBar) progressBar.style.width = `${percent}%`;

    const gaugeText = document.querySelector('.gauge-text');
    if(gaugeText) {
        gaugeText.innerText = isMaxLevel ? "MAX" : `${Math.floor(dragonData.clicks)} / ${max}`;
    }

    // 이미지 표시
    let imgSrc = "assets/images/dragon/stage_egg.png"; 
    if (window.getDragonImage) {
        imgSrc = window.getDragonImage(dragonData.id, dragonData.stage);
    }

    if(dragonDisplay) {
        dragonDisplay.innerHTML = `<img src="${imgSrc}" class="main-dragon-img" onerror="handleImgError(this)">`;
        
        const imgEl = dragonDisplay.querySelector('img');
        if(dragonData.isShiny && imgEl) {
            // 이로치(Shiny) 필터 효과
            imgEl.style.filter = "hue-rotate(150deg) brightness(1.2) drop-shadow(0 0 5px #f1c40f)";
        }

        if(imgEl) {
            if (!isMaxLevel) {
                imgEl.style.cursor = "pointer";
                imgEl.onclick = () => handleDragonClick(dragonData, imgEl);
            } else {
                // 만렙이면 귀속/관리 버튼으로 동작
                imgEl.style.cursor = "pointer";
                imgEl.onclick = () => checkAndBindDragon(dragonData);
            }
        }
    }
}

// 터치 버튼 핸들러
window.handleTouchBtn = function() {
    const dragonData = player.myDragons.find(d => d.uId === player.currentDragonUId);
    if (!dragonData) return;
    
    const isHighTier = (dragonData.rarity === 'epic' || dragonData.rarity === 'legend');
    const maxStageLimit = isHighTier ? 4 : 3;
    
    if(dragonData.stage >= maxStageLimit) {
        checkAndBindDragon(dragonData);
    } else {
        const imgEl = dragonDisplay ? dragonDisplay.querySelector('img') : null;
        if(imgEl) handleDragonClick(dragonData, imgEl);
    }
};

// 드래곤 클릭(성장) 로직
function handleDragonClick(dragon, imgEl) {
    if(imgEl) {
        // 클릭 애니메이션 리셋
        imgEl.classList.remove('click-anim');
        void imgEl.offsetWidth; 
        imgEl.classList.add('click-anim');
    }

    // [수정] 성장 한계 체크 (한계에 도달하면 클릭해도 성장하지 않음)
    const isHighTier = (dragon.rarity === 'epic' || dragon.rarity === 'legend');
    const maxStageLimit = isHighTier ? 4 : 3;

    if (dragon.stage >= maxStageLimit) return; 

    const max = DRAGON_DATA.reqClicks[dragon.stage];
    const clickPower = 1 + (player.nestLevel || 0);
    dragon.clicks += clickPower;
    
    const percent = Math.min(100, (dragon.clicks / max) * 100);
    if(progressBar) progressBar.style.width = `${percent}%`;
    const gaugeText = document.querySelector('.gauge-text');
    if(gaugeText) gaugeText.innerText = `${Math.floor(dragon.clicks)} / ${max}`;

    // 성장 완료 시
    if (dragon.clicks >= max) {
        const oldStage = dragon.stage;
        dragon.stage++;
        dragon.clicks = 0;
        
        if (oldStage === 0 && dragon.stage === 1) {
            // 부화
            if(!player.discovered.includes(dragon.id)) player.discovered.push(dragon.id);
            if(!player.dragonCounts) player.dragonCounts = {};
            if(!player.dragonCounts[dragon.id]) player.dragonCounts[dragon.id] = 1;
            
            showAlert(`알을 깨고 <b style="color:${RARITY_DATA[dragon.rarity].color}">${dragon.name}</b>이(가) 태어났습니다!`);
        } else if (dragon.stage >= maxStageLimit) {
            // 최종 성장 달성
            if(!player.dragonCounts) player.dragonCounts = {};
            if(!player.dragonCounts[dragon.id]) player.dragonCounts[dragon.id] = 1;

            showAlert(`축하합니다!<br>[${dragon.name}]이(가) 최종 단계까지 성장했습니다!<br>(한 번 더 터치하여 관리할 수 있습니다)`);
        } else {
            // 일반 성장
            showAlert(`축하합니다!<br>[${dragon.name}]이(가) 성장했습니다!`);
        }

        if(!player.maxStages) player.maxStages = {};
        if(!player.maxStages[dragon.id] || player.maxStages[dragon.id] < dragon.stage) {
            player.maxStages[dragon.id] = dragon.stage;
        }

        syncBookData();
        renderNest(); 
        renderEggList(); 
        if(window.saveGame) window.saveGame(true);
    }
}

// 만렙 드래곤 귀속(별 등급 상승) 시스템
function checkAndBindDragon(dragon) {
    const maxLimit = (dragon.rarity === 'epic' || dragon.rarity === 'legend') ? 4 : 3;
    // 같은 종류의 만렙 드래곤이 존재하는지 확인
    const adultDragons = player.myDragons.filter(d => d.id === dragon.id && d.stage >= maxLimit);
    
    if (adultDragons.length > 1) {
        const starLv = window.getDragonStarLevel(dragon.id);
        const currentCount = player.dragonCounts[dragon.id];
        
        showConfirm(
            `<div style="text-align:center">
                <h3 style="color:#f1c40f">초월 공명</h3>
                <br>
                다른 성체가 존재합니다.<br>
                이 용을 기존 영혼에 <b>귀속</b>하시겠습니까?<br>
                <span style="font-size:0.8rem; color:#aaa;">(이 용은 사라지고 별 등급 경험치가 오릅니다)</span>
                <br><br>
                <b>현재 수집: ${currentCount} / 등급: ${starLv}성</b>
            </div>`,
            () => performBind(dragon)
        );
    } else {
        showAlert("성장을 마친 드래곤입니다.<br>멋지게 자랐군요!");
    }
}

// 귀속 실행
function performBind(dragon) {
    if(!player.dragonCounts[dragon.id]) player.dragonCounts[dragon.id] = 1;
    player.dragonCounts[dragon.id]++;
    
    const newCount = player.dragonCounts[dragon.id];
    const starLv = window.getDragonStarLevel(dragon.id);
    
    // 현재 드래곤 삭제
    const idx = player.myDragons.findIndex(d => d.uId === dragon.uId);
    if (idx > -1) {
        player.myDragons.splice(idx, 1);
        // 다음 드래곤 선택
        if (player.myDragons.length > 0) {
            player.currentDragonUId = player.myDragons[Math.max(0, idx - 1)].uId;
        } else {
            player.currentDragonUId = null;
        }
    }

    showAlert(
        `<div style="text-align:center">
            <h3 style="color:#f1c40f">귀속 완료!</h3>
            <br>
            영혼이 강해졌습니다.<br>
            <b>총 수집: ${newCount}마리</b><br>
            <b style="font-size:1.2rem; color:#ff6b6b">현재 등급: ${starLv}성</b>
        </div>`,
        () => {
            renderNest();
            renderEggList();
            saveGame(true);
        }
    );
}

// 동굴 인벤토리 렌더링 (장비 제외)
function renderCaveInventory() {
    const grid = document.getElementById('cave-inventory-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    if(!player.inventory) player.inventory = {};
    const itemIds = Object.keys(player.inventory);
    
    itemIds.forEach(id => {
        if(player.inventory[id] > 0) {
            const item = ITEM_DB[id];
            // 장비가 아닌 것(재료, 알, 소비 등)만 필터
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
