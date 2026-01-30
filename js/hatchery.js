// ==========================================
// js/hatchery.js (최종: 5마리 제한 및 로직 전체 포함)
// ==========================================

// 알 부화 로직
window.hatchEggInternal = function(isShiny, type) {
    if (!type) {
        const types = ["fire", "water", "forest", "electric", "metal", "light", "dark"];
        type = types[Math.floor(Math.random() * types.length)];
    }
    const newId = `dragon_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newDragon = {
        uId: newId,
        id: `${type}_c1`, 
        type: type,
        stage: 0, 
        clicks: 0,
        name: "알",
        rarity: "common"
    };
    if (isShiny) { newDragon.rarity = "epic"; newDragon.name = "빛나는 알"; }
    
    player.myDragons.push(newDragon);
    
    // 알 획득 시 바로 그 알을 선택
    player.currentDragonIndex = player.myDragons.length - 1; 
    
    // 도감 발견 처리
    if(!player.discovered.includes(newDragon.id)) player.discovered.push(newDragon.id);
    if(!player.maxStages[newDragon.id]) player.maxStages[newDragon.id] = 0;
    
    saveGame();
    if(window.renderCaveUI) window.renderCaveUI();
};

// 둥지 UI 렌더링 메인 함수
window.renderCaveUI = function() {
    renderEggList();
    renderCenterStage();
    renderCaveInventory();
    
    // 재화 업데이트
    if(window.updateCurrency) window.updateCurrency();
};

// 알 목록 렌더링 (최대 5마리)
function renderEggList() {
    const list = document.getElementById('my-egg-list');
    if (!list) return;
    list.innerHTML = "";
    
    // [중요] 5마리까지만 표시 (slice 사용)
    const displayList = player.myDragons.slice(0, 5); 

    displayList.forEach((d, idx) => {
        const div = document.createElement('div');
        div.className = `new-slot-item ${idx === player.currentDragonIndex ? 'active' : ''}`;
        div.onclick = () => {
            player.currentDragonIndex = idx;
            renderCaveUI();
        };
        
        let displayImg = "assets/images/dragon/stage_egg.png"; 
        if(window.getDragonImage) {
            // 알 단계(0)일 때는 속성별 알 이미지 사용
            if (d.stage === 0) {
                 displayImg = `assets/images/dragon/egg_${d.type}.png`;
            } else {
                 displayImg = window.getDragonImage(d.id, d.stage);
            }
        }

        div.innerHTML = `<img src="${displayImg}" onerror="handleImgError(this)">`;
        list.appendChild(div);
    });
}

// 중앙 무대 렌더링
function renderCenterStage() {
    const d = player.myDragons[player.currentDragonIndex];
    if (!d) return;
    
    // 이름
    const nameBox = document.getElementById('dragon-name-ui');
    if(nameBox) nameBox.innerText = d.name;
    
    // 이미지
    const visualBox = document.getElementById('dragon-display');
    if(visualBox) {
        let displayImg = "assets/images/dragon/stage_egg.png";
        if (d.stage === 0) {
             displayImg = `assets/images/dragon/egg_${d.type}.png`;
        } else if(window.getDragonImage) {
             displayImg = window.getDragonImage(d.id, d.stage);
        }
        visualBox.innerHTML = `<img src="${displayImg}" onerror="handleImgError(this)">`;
    }
    
    // 게이지
    const maxClicks = getRequiredClicks(d.stage);
    const percent = Math.min(100, (d.clicks / maxClicks) * 100);
    const fill = document.getElementById('progress-fill');
    const text = document.querySelector('.gauge-text');
    if(fill) fill.style.width = `${percent}%`;
    if(text) text.innerText = `${d.clicks} / ${maxClicks}`;
}

// 터치(클릭) 처리
window.handleTouchBtn = function() {
    const d = player.myDragons[player.currentDragonIndex];
    if (!d) return;
    
    // 클릭 효과
    const btn = document.querySelector('.btn-touch-img');
    if(btn) {
        btn.classList.remove('click-anim');
        void btn.offsetWidth; 
        btn.classList.add('click-anim');
    }
    
    // 드래곤 흔들림 효과
    const dragonImg = document.querySelector('.dragon-visual-area img');
    if(dragonImg) {
        dragonImg.classList.remove('walking-anim');
        void dragonImg.offsetWidth;
        dragonImg.classList.add('walking-anim');
    }
    
    d.clicks++;
    const max = getRequiredClicks(d.stage);
    if (d.clicks >= max) {
        d.clicks = 0;
        // 진화 시도
        const nextStage = d.stage + 1;
        const maxStageLimit = (d.rarity === 'legend' || d.rarity === 'epic') ? 4 : 3; // 고룡까지 or 성룡까지
        
        if (nextStage <= maxStageLimit) {
            d.stage = nextStage;
            // 도감 업데이트
            if (!player.maxStages[d.id] || player.maxStages[d.id] < d.stage) {
                player.maxStages[d.id] = d.stage;
            }
            // 이름 변경 (예시)
            if (d.stage === 1) d.name = "유아기 용";
            else if (d.stage === 2) d.name = "성장기 용";
            else if (d.stage === 3) d.name = "성룡";
            else if (d.stage === 4) d.name = "고룡";
            
            showAlert(`[${d.name}]로 진화했습니다!`);
        } else {
            d.clicks = max; // 최대치 유지
            showAlert("더 이상 진화할 수 없습니다.");
        }
        saveGame();
    }
    renderCaveUI();
};

// 필요 클릭 수 계산
function getRequiredClicks(stage) {
    if (stage === 0) return 10; // 알 -> 유아기
    if (stage === 1) return 20;
    if (stage === 2) return 50;
    if (stage === 3) return 100;
    return 9999;
}

// 둥지 인벤토리 렌더링
function renderCaveInventory() {
    const grid = document.getElementById('cave-inventory-grid');
    if (!grid) return;
    grid.innerHTML = "";
    
    // 사용할 수 있는 아이템(물약 등)만 표시
    if (player.inventory) {
        Object.keys(player.inventory).forEach(id => {
            if (player.inventory[id] > 0) {
                const item = ITEM_DB[id];
                if (item && item.type === 'use') { 
                    const div = document.createElement('div');
                    div.className = 'new-slot-item';
                    div.onclick = () => useItem(id);
                    div.innerHTML = `<img src="${item.img}" onerror="handleImgError(this)"><span class="count-badge">${player.inventory[id]}</span>`;
                    grid.appendChild(div);
                }
            }
        });
    }
}
