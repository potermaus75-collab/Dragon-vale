// ==========================================
// js/breeding.js (수정완료: 새로운 모달 디자인 적용)
// ==========================================

let selectedParents = { 1: null, 2: null }; 
let currentSelectingSlot = 0; 

function openBreedingModal() {
    selectedParents = { 1: null, 2: null };
    updateParentSlots();
    
    // 리스트 초기화 및 숨김
    const listDiv = document.getElementById('breeding-select-list');
    if(listDiv) {
        listDiv.classList.add('hidden');
        listDiv.innerHTML = "";
    }
    
    const modal = document.getElementById('breeding-modal');
    modal.classList.remove('hidden');
    modal.classList.add('active');
}

function closeBreedingModal() {
    const modal = document.getElementById('breeding-modal');
    modal.classList.remove('active');
    modal.classList.add('hidden');
}

function updateParentSlots() {
    for(let i=1; i<=2; i++) {
        const slotEl = document.getElementById(`parent-slot-${i}`);
        const pIndex = selectedParents[i];
        
        // 슬롯 스타일 초기화 (기존 book-slot 클래스 활용하되 테두리 제거)
        slotEl.style.border = "none";
        slotEl.className = "new-slot-item"; // 새로운 슬롯 스타일 적용

        if (pIndex !== null) {
            const dragon = player.myDragons[pIndex];
            let imgSrc = window.getDragonImage(dragon.id, dragon.stage);
            
            slotEl.innerHTML = `
                <img src="${imgSrc}" style="width:80%; height:80%; object-fit:contain;" 
                onerror="handleImgError(this, '${dragon.type}', ${dragon.stage})">
                <div style="position:absolute; bottom:-20px; width:100%; text-align:center; font-size:0.7rem; color:#fff; text-shadow:1px 1px 1px #000; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                    ${dragon.name}
                </div>
            `;
            // 선택된 효과
            slotEl.classList.add('active');
        } else {
            slotEl.innerHTML = `<span style="font-size:2rem; color:#555;">+</span>`;
            slotEl.classList.remove('active');
        }
    }
}

function selectParent(slotNum) {
    currentSelectingSlot = slotNum;
    const listDiv = document.getElementById('breeding-select-list');
    listDiv.innerHTML = "";
    listDiv.classList.remove('hidden');

    // [변경] 리스트를 그리드 형태로 표시 (인벤토리처럼)
    listDiv.style.display = "grid";
    listDiv.style.gridTemplateColumns = "repeat(4, 1fr)";
    listDiv.style.gap = "5px";

    const otherSlot = slotNum === 1 ? 2 : 1;
    const otherIndex = selectedParents[otherSlot];

    let count = 0;
    player.myDragons.forEach((dragon, index) => {
        // 이미 선택된 용 제외
        if (index === otherIndex) return;

        // 성체(3단계) 이상만 교배 가능
        if (dragon.stage >= 3) {
            const div = document.createElement('div');
            div.className = "new-slot-item"; 
            div.style.cursor = "pointer";
            
            let imgSrc = window.getDragonImage(dragon.id, dragon.stage);
            div.innerHTML = `
                <img src="${imgSrc}" style="width:70%; height:70%; object-fit:contain;"
                onerror="handleImgError(this, '${dragon.type}', ${dragon.stage})">
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
        listDiv.style.display = "block"; // 메시지 표시를 위해 블록으로 변경
        listDiv.innerHTML = "<p style='padding:10px; text-align:center; color:#aaa; font-size:0.8rem;'>교배 가능한 성체가 없습니다.<br>(성장기까지 키운 후 시도하세요)</p>";
    }
}

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
            // 중앙 UI 갱신 (재화 감소 반영)
            if(window.updateUI) window.updateUI(); 
        }
    );
}

function processBreeding(parent1, parent2) {
    // 50% 확률로 부모 중 하나의 속성을 따라감
    const targetType = Math.random() < 0.5 ? parent1.type : parent2.type;
    const eggId = `egg_${targetType}`;
    
    // 인벤토리에 알 추가
    addItem(eggId, 1, true); 

    const eggName = (window.EGG_TYPE_NAMES && window.EGG_TYPE_NAMES[targetType]) ? window.EGG_TYPE_NAMES[targetType] : "알";
    const eggImgSrc = `assets/images/dragon/egg_${targetType}.png`;

    let msg = `
        <div style="text-align:center;">
            <h3 style="color:#f1c40f; margin-bottom:10px;">교배 성공!</h3>
            
            <div style="display:inline-block; padding:10px; background:rgba(255,255,255,0.1); border-radius:10px;">
                <img src="${eggImgSrc}" style="width:80px; height:80px; object-fit:contain;"
                     onerror="handleImgError(this, '${targetType}', 0)">
            </div>
            
            <br><br>사랑의 결실로 <b>[${eggName}]</b>을(를)<br>얻었습니다!
        </div>
    `;
    
    // 10% 확률로 보너스
    if (Math.random() < 0.1) {
        player.gem += 1;
        msg += `<br><br><b style="color:#3498db">✨ 보너스: 보석 1개 발견! ✨</b>`;
    }

    showAlert(msg);
    if(window.saveGame) window.saveGame();
}
