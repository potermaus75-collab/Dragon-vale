// ==========================================
// js/breeding.js (교배 시스템 전담)
// ==========================================

// 교배 관련 상태 변수
let selectedParents = { 1: null, 2: null }; 
let currentSelectingSlot = 0; 

// [UI] 교배 모달 열기
function openBreedingModal() {
    selectedParents = { 1: null, 2: null };
    updateParentSlots();
    
    const listDiv = document.getElementById('breeding-select-list');
    if(listDiv) listDiv.classList.add('hidden');
    
    const modal = document.getElementById('breeding-modal');
    modal.classList.remove('hidden');
    modal.classList.add('active');
}

// [UI] 교배 모달 닫기
function closeBreedingModal() {
    const modal = document.getElementById('breeding-modal');
    modal.classList.remove('active');
    modal.classList.add('hidden');
}

// [UI] 부모 슬롯 업데이트
function updateParentSlots() {
    for(let i=1; i<=2; i++) {
        const slotEl = document.getElementById(`parent-slot-${i}`);
        const pIndex = selectedParents[i];
        
        if (pIndex !== null) {
            const dragon = player.myDragons[pIndex];
            let imgSrc = window.getDragonImage(dragon.id, dragon.stage);
            
            // 이미지 에러 처리 포함
            slotEl.innerHTML = `
                <img src="${imgSrc}" style="width:60px; height:60px; object-fit:contain;" 
                onerror="handleImgError(this, '${dragon.type}', ${dragon.stage})">
                <div style="font-size:0.6rem; color:#fff; text-shadow:1px 1px 1px #000;">${dragon.name}</div>
            `;
            slotEl.style.border = "2px solid #ff9ff3";
        } else {
            slotEl.innerHTML = `<span style="font-size:2rem; color:#555;">+</span>`;
            slotEl.style.border = "2px solid #555";
        }
    }
}

// [동작] 부모 선택 창 띄우기
function selectParent(slotNum) {
    currentSelectingSlot = slotNum;
    const listDiv = document.getElementById('breeding-select-list');
    listDiv.innerHTML = "";
    listDiv.classList.remove('hidden');

    // 교배 가능한 용 목록 생성 (성체(3) 이상)
    let count = 0;
    player.myDragons.forEach((dragon, index) => {
        // 이미 다른 슬롯에 선택된 용은 제외
        const otherSlot = slotNum === 1 ? 2 : 1;
        if (selectedParents[otherSlot] === index) return;

        // 성체(3) 혹은 고룡(4)만 가능
        if (dragon.stage >= 3) {
            const div = document.createElement('div');
            div.className = "breeding-list-item"; // CSS에서 스타일 정의
            div.style.display = "flex";
            div.style.alignItems = "center";
            div.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
            div.style.padding = "8px";
            div.style.cursor = "pointer";
            
            let imgSrc = window.getDragonImage(dragon.id, dragon.stage);
            div.innerHTML = `
                <img src="${imgSrc}" style="width:40px; height:40px; margin-right:10px; object-fit:contain;"
                onerror="handleImgError(this, '${dragon.type}', ${dragon.stage})">
                <span>${dragon.name} (Lv.${dragon.stage})</span>
            `;
            
            div.onclick = () => {
                selectedParents[slotNum] = index;
                updateParentSlots();
                listDiv.classList.add('hidden');
            };
            listDiv.appendChild(div);
            count++;
        }
    });

    if (count === 0) {
        listDiv.innerHTML = "<p style='padding:10px; text-align:center; color:#aaa;'>교배 가능한 성체 용이 없습니다.<br><small>(성장기까지 키운 후 시도하세요)</small></p>";
    }
}

// [동작] 교배 시도
function tryBreeding() {
    if (selectedParents[1] === null || selectedParents[2] === null) {
        showAlert("두 마리의 부모 용을 모두 선택해주세요.");
        return;
    }

    const cost = 500;
    if (player.gold < cost) {
        showAlert(`골드가 부족합니다. (${cost} 골드 필요)`);
        return;
    }

    const p1 = player.myDragons[selectedParents[1]];
    const p2 = player.myDragons[selectedParents[2]];

    showConfirm(
        `[${p1.name}]와(과) [${p2.name}]을(를)<br>교배하시겠습니까?\n(소모: ${cost} 골드)`,
        () => {
            player.gold -= cost;
            processBreeding(p1, p2);
            closeBreedingModal();
            updateCurrency(); // main.js 연동
        }
    );
}

// [동작] 교배 결과 처리
function processBreeding(parent1, parent2) {
    // 50% 확률로 엄마 속성, 50% 확률로 아빠 속성
    const targetType = Math.random() < 0.5 ? parent1.type : parent2.type;
    const eggId = `egg_${targetType}`;
    
    // 인벤토리에 알 추가 (강제 추가 모드 true)
    addItem(eggId, 1, true); 

    // 결과 메시지
    // EGG_TYPE_NAMES가 hatchery.js에 있다면 전역 접근이 필요합니다. 
    // 만약 접근이 안 된다면 여기서 직접 텍스트 처리하거나 hatchery.js에서 window 객체에 할당해야 합니다.
    const eggName = (window.EGG_TYPE_NAMES && window.EGG_TYPE_NAMES[targetType]) ? window.EGG_TYPE_NAMES[targetType] : "알";

    let msg = `
        <div style="text-align:center;">
            <h3>💕 교배 성공!</h3>
            <div style="font-size:3rem; margin:10px;">🥚</div>
            사랑의 결실로 <b>[${eggName}]</b>을(를) 얻었습니다!<br>
            <span style="color:#aaa; font-size:0.8rem;">(인벤토리로 지급됨)</span>
        </div>
    `;
    
    // 10% 확률로 보석 보너스
    if (Math.random() < 0.1) {
        player.gem += 1;
        msg += `<br><br><b style="color:#3498db">✨ 축하합니다!<br>보석 1개를 추가로 발견했습니다!</b>`;
    }

    showAlert(msg);
    saveGame();
}
