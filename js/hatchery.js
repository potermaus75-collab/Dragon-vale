// DOM 요소
const dragonDisplay = document.getElementById('dragon-display'); // 이제 div 안에 img가 들어감
const progressBar = document.getElementById('progress-fill');
const dragonNameUI = document.getElementById('dragon-name-ui');
const eggListArea = document.getElementById('my-egg-list');
const clickMsgBtn = document.getElementById('click-msg'); 

// 화면 갱신 통합 함수
function updateCaveUI() {
    renderEggList();     
    renderNest();        
    updateEquipmentUI(); 
}

// 둥지(메인 용) 렌더링
function renderNest() {
    const dragonData = player.myDragons[player.currentDragonIndex];
    if (!dragonData) return;

    // 이름 표시
    const stageName = DRAGON_DATA.stages[dragonData.stage];
    dragonNameUI.innerText = `${dragonData.name} (${stageName})`;

    // 게이지바 로직
    const max = DRAGON_DATA.reqClicks[dragonData.stage] || 9999;
    let percent = 0;
    
    // 고룡(마지막 단계) 체크
    if (dragonData.stage >= DRAGON_DATA.stages.length - 1) {
        percent = 100;
        clickMsgBtn.innerText = "성장 완료";
        clickMsgBtn.disabled = true; 
        clickMsgBtn.style.opacity = 0.5;
    } else {
        percent = (dragonData.clicks / max) * 100;
        clickMsgBtn.innerText = "마력 주입";
        clickMsgBtn.disabled = false;
        clickMsgBtn.style.opacity = 1;
    }
    
    if(progressBar) progressBar.style.width = `${percent}%`;

    // [수정] 단계별 이미지 표시
    // data.js에 stageImages 배열이 있다고 가정 (없으면 기본값 처리)
    let imgSrc = "assets/images/dragon/stage_egg.png"; // 기본값
    if (DRAGON_DATA.stageImages && DRAGON_DATA.stageImages[dragonData.stage]) {
        imgSrc = DRAGON_DATA.stageImages[dragonData.stage];
    }

    // 이미지 태그로 교체
    dragonDisplay.innerHTML = `<img src="${imgSrc}" class="main-dragon-img">`;
    
    // 이로치(Shiny) 효과 (이미지에 필터 적용)
    const imgEl = dragonDisplay.querySelector('img');
    if(dragonData.type === 'shiny' && imgEl) {
        imgEl.style.filter = "drop-shadow(0 0 10px #f1c40f) brightness(1.2)";
    }
}

// 보유한 용 리스트 렌더링
function renderEggList() {
    if(!eggListArea) return;
    eggListArea.innerHTML = "";
    
    player.myDragons.forEach((dragon, index) => {
        const div = document.createElement('div');
        div.style.marginBottom = "5px";
        div.style.padding = "5px";
        div.style.background = index === player.currentDragonIndex ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
        div.style.borderRadius = "5px";
        div.style.cursor = "pointer";
        div.style.textAlign = "center";
        div.style.border = index === player.currentDragonIndex ? "2px solid #ffd700" : "1px solid #5d4a6d";
        
        // [수정] 알 이미지 표시 (고정된 알 이미지 사용)
        div.innerHTML = `
            <img src="assets/images/dragon/stage_egg.png" class="list-egg-img"><br>
            <span style="font-size:0.7rem">${dragon.name}</span>
        `;
        
        div.onclick = () => {
            player.currentDragonIndex = index;
            renderEggList();
            renderNest();
        };
        eggListArea.appendChild(div);
    });
}

// 마력 주입 버튼 클릭 이벤트
if(clickMsgBtn) {
    clickMsgBtn.addEventListener('click', () => {
        const dragon = player.myDragons[player.currentDragonIndex];
        if (!dragon) return;

        const max = DRAGON_DATA.reqClicks[dragon.stage];
        
        if (dragon.stage < DRAGON_DATA.stages.length - 1) {
            dragon.clicks++;
            if (dragon.clicks >= max) {
                dragon.stage++;
                dragon.clicks = 0;
                renderNest(); 
                showAlert(`
                    <div style="text-align:center;">
                        <img src="${DRAGON_DATA.stageImages[dragon.stage]}" style="width:100px;"><br>
                        ✨ 축하합니다!<br>[${dragon.name}]이(가) 성장했습니다!
                    </div>
                `);
                if(window.saveGame) window.saveGame();
            } else {
                renderNest();
            }
        } else {
            showAlert("더 이상 성장할 수 없습니다. (최대 레벨)");
        }
    });
}

// 룰렛 로직
let rouletteInterval;
function startRoulette() {
    document.getElementById('roulette-modal').classList.remove('hidden');
    document.getElementById('roulette-modal').classList.add('active');
    
    const display = document.getElementById('roulette-display');
    // 룰렛 돌아가는 동안 보여줄 임시 이미지들
    const candidates = [
        "assets/images/element/element_fire.png",
        "assets/images/element/element_water.png",
        "assets/images/element/element_forest.png"
    ];
    
    if(rouletteInterval) clearInterval(rouletteInterval);
    rouletteInterval = setInterval(() => {
        const randImg = candidates[Math.floor(Math.random() * candidates.length)];
        display.innerHTML = `<img src="${randImg}" style="width:100px; height:100px;">`;
    }, 100);
}

function stopRoulette() {
    clearInterval(rouletteInterval);
    
    // 결과 데이터 (data.js의 DRAGON_TYPES 키와 일치해야 함)
    const types = [
        {type: "fire", img: "assets/images/element/element_fire.png", name: "불꽃용"},
        {type: "water", img: "assets/images/element/element_water.png", name: "물방울용"},
        {type: "forest", img: "assets/images/element/element_forest.png", name: "풀잎용"},
        {type: "electric", img: "assets/images/element/element_electric.png", name: "번개용"},
        {type: "metal", img: "assets/images/element/element_metal.png", name: "강철용"}
    ];
    const result = types[Math.floor(Math.random() * types.length)];
    
    document.getElementById('roulette-display').innerHTML = `<img src="${result.img}" style="width:120px; height:120px; filter:drop-shadow(0 0 10px white);">`;
    
    setTimeout(() => {
        // 도감 등록
        if(!player.discovered) player.discovered = [];
        let isNew = false;
        if(!player.discovered.includes(result.type)) {
            player.discovered.push(result.type);
            isNew = true;
        }

        const msg = isNew 
            ? `<b style="color:#f1c40f">[${result.name}] 획득!</b><br>(도감에 새로 등록되었습니다!)` 
            : `<b>[${result.name}] 획득!</b>`;

        showAlert(msg, () => {
            player.myDragons.push({
                id: Date.now(), type: result.type, stage: 0, clicks: 0, name: result.name
            });
            document.getElementById('roulette-modal').classList.add('hidden');
            document.getElementById('roulette-modal').classList.remove('active');
            updateCaveUI();
            if(window.saveGame) window.saveGame();
        });
    }, 800);
}

// 장비 UI 갱신
function updateEquipmentUI() {
    const slots = ['head', 'body', 'arm', 'leg'];
    slots.forEach(slot => {
        const el = document.querySelector(`.equip-slot.${slot}`);
        if(!el) return;
        
        // 기존 내용(글자) 비우고 새로 그림
        el.innerHTML = "";
        
        const itemId = player.equipment[slot];
        if (itemId && ITEM_DB[itemId]) {
            // [수정] 장비 이미지 표시
            el.innerHTML = `<img src="${ITEM_DB[itemId].img}" class="equip-icon">`;
            el.style.border = "none"; // CSS에서 제어하지만 확실하게
        } else {
            // 장비 없을 때 텍스트 표시
            const slotNames = {head:'머리', body:'갑옷', arm:'무기', leg:'신발'};
            el.innerHTML = `<span style="font-size:0.8rem; text-shadow:1px 1px 2px #000;">${slotNames[slot]}</span>`;
        }
    });
}

window.updateUI = updateCaveUI; 
window.startEggRoulette = startRoulette;
window.stopRoulette = stopRoulette;
