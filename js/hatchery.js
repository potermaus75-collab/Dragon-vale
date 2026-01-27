// DOM 요소
const dragonDisplay = document.getElementById('dragon-display');
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
    
    // CSS Width 적용
    if(progressBar) {
        progressBar.style.width = `${percent}%`;
    }

    // 단계별 이모지 설정
    let emoji = "🥚";
    if (dragonData.stage === 1) emoji = "🐣";
    else if (dragonData.stage >= 2) emoji = "🐲";
    else if (dragonData.stage >= 4) emoji = "🐉";

    dragonDisplay.innerText = emoji;
    
    // 이로치(Shiny) 효과
    if(dragonData.type === 'shiny') {
        dragonDisplay.style.textShadow = "0 0 20px #f1c40f";
    } else {
        dragonDisplay.style.textShadow = "none";
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
        // 선택된 용 강조 (노란 테두리)
        div.style.background = index === player.currentDragonIndex ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
        div.style.borderRadius = "5px";
        div.style.cursor = "pointer";
        div.style.textAlign = "center";
        div.style.border = index === player.currentDragonIndex ? "2px solid #ffd700" : "1px solid #5d4a6d";
        
        div.innerHTML = `<span style="font-size:1.5rem">🥚</span><br><span style="font-size:0.7rem">${dragon.name}</span>`;
        
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
        
        // 마지막 단계가 아닐 때만 작동
        if (dragon.stage < DRAGON_DATA.stages.length - 1) {
            dragon.clicks++;
            
            // 성장 완료 조건 달성
            if (dragon.clicks >= max) {
                dragon.stage++;
                dragon.clicks = 0;
                
                renderNest(); 
                showAlert(`✨ 축하합니다!\n[${dragon.name}]이(가) 성장했습니다!`);
                
                // 저장
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
    const candidates = ["🔥", "💧", "🌿", "⚡", "💎"];
    
    if(rouletteInterval) clearInterval(rouletteInterval);
    rouletteInterval = setInterval(() => {
        display.innerText = candidates[Math.floor(Math.random() * candidates.length)];
    }, 50);
}

function stopRoulette() {
    clearInterval(rouletteInterval);
    
    // 뽑기 확률 및 데이터 정의 (data.js의 DRAGON_TYPES와 키값이 일치해야 도감이 작동함)
    const types = [
        {type: "fire", emoji: "🔥", name: "불꽃용"},
        {type: "water", emoji: "💧", name: "물방울용"},
        {type: "forest", emoji: "🌿", name: "풀잎용"},
        {type: "electric", emoji: "⚡", name: "번개용"}, // 도감용 추가
        {type: "metal", emoji: "💎", name: "강철용"}     // 도감용 추가
    ];
    const result = types[Math.floor(Math.random() * types.length)];
    
    document.getElementById('roulette-display').innerText = result.emoji;
    
    setTimeout(() => {
        // [수정됨] 도감 등록 로직 추가
        if(!player.discovered) player.discovered = [];
        let isNew = false;
        if(!player.discovered.includes(result.type)) {
            player.discovered.push(result.type);
            isNew = true;
        }

        // 메시지 결정 (신규 발견 시 텍스트 추가)
        const msg = isNew 
            ? `[${result.name}] 획득!\n(도감에 새로 등록되었습니다!)` 
            : `[${result.name}] 획득!`;

        showAlert(msg, () => {
            player.myDragons.push({
                id: Date.now(), type: result.type, stage: 0, clicks: 0, name: result.name
            });
            document.getElementById('roulette-modal').classList.add('hidden');
            document.getElementById('roulette-modal').classList.remove('active');
            updateCaveUI();
            
            // 획득 후 자동 저장
            if(window.saveGame) window.saveGame();
        });
    }, 500);
}

// 장비 UI 갱신 (정보 탭으로 이동했지만 호환성을 위해 유지)
function updateEquipmentUI() {
    const slots = ['head', 'body', 'arm', 'leg'];
    slots.forEach(slot => {
        const el = document.querySelector(`.equip-slot.${slot}`);
        if(!el) return;
        const itemId = player.equipment[slot];
        if (itemId && ITEM_DB[itemId]) {
            el.innerText = ITEM_DB[itemId].emoji;
            el.style.border = "2px solid #f1c40f";
            el.style.background = "rgba(0,0,0,0.5)";
        } else {
            const slotNames = {head:'머리', body:'몸', arm:'무기', leg:'다리'};
            el.innerText = slotNames[slot];
            el.style.border = "2px solid #5d4a6d";
            el.style.background = "transparent";
        }
    });
}

// 전역 함수 연결
window.updateUI = updateCaveUI; 
window.startEggRoulette = startRoulette;
window.stopRoulette = stopRoulette;

