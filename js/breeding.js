// ==========================================
// js/breeding.js (이모지 제거 및 이미지화)
// ==========================================

let selectedParents = { 1: null, 2: null }; 
let currentSelectingSlot = 0; 

function openBreedingModal() {
    selectedParents = { 1: null, 2: null };
    updateParentSlots();
    
    const listDiv = document.getElementById('breeding-select-list');
    if(listDiv) listDiv.classList.add('hidden');
    
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
        
        if (pIndex !== null) {
            const dragon = player.myDragons[pIndex];
            let imgSrc = window.getDragonImage(dragon.id, dragon.stage);
            
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

function selectParent(slotNum) {
    currentSelectingSlot = slotNum;
    const listDiv = document.getElementById('breeding-select-list');
    listDiv.innerHTML = "";
    listDiv.classList.remove('hidden');

    let count = 0;
    player.myDragons.forEach((dragon, index) => {
        const otherSlot = slotNum === 1 ? 2 : 1;
        if (selectedParents[otherSlot] === index) return;

        if (dragon.stage >= 3) {
            const div = document.createElement('div');
            div.className = "breeding-list-item"; 
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
            updateCurrency(); 
        }
    );
}

function processBreeding(parent1, parent2) {
    const targetType = Math.random() < 0.5 ? parent1.type : parent2.type;
    const eggId = `egg_${targetType}`;
    
    addItem(eggId, 1, true); 

    const eggName = (window.EGG_TYPE_NAMES && window.EGG_TYPE_NAMES[targetType]) ? window.EGG_TYPE_NAMES[targetType] : "알";
    const eggImgSrc = `assets/images/dragon/egg_${targetType}.png`;

    let msg = `
        <div style="text-align:center;">
            <h3>교배 성공!</h3>
            
            <img src="${eggImgSrc}" style="width:100px; height:100px; object-fit:contain; margin:10px 0;"
                 onerror="handleImgError(this, '${targetType}', 0)">
            
            <br>사랑의 결실로 <b>[${eggName}]</b>을(를) 얻었습니다!
            <br><span style="color:#aaa; font-size:0.8rem;">(인벤토리로 지급됨)</span>
        </div>
    `;
    
    if (Math.random() < 0.1) {
        player.gem += 1;
        msg += `<br><br><b style="color:#3498db">축하합니다!<br>보석 1개를 추가로 발견했습니다!</b>`;
    }

    showAlert(msg);
    saveGame();
}
