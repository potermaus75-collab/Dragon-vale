// ==========================================
// js/breeding.js (수정됨: uId 기반 교배)
// ==========================================

let selectedParents = { 1: null, 2: null }; 
let currentSelectingSlot = 0; 

function openBreedingModal() {
    selectedParents = { 1: null, 2: null };
    updateParentSlots();
    
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
        const pUId = selectedParents[i];
        
        slotEl.className = "new-slot-item"; 
        slotEl.style.border = "none"; 

        const dragon = pUId ? player.myDragons.find(d => d.uId === pUId) : null;

        if (dragon) {
            let imgSrc = window.getDragonImage(dragon.id, dragon.stage);
            slotEl.innerHTML = `
                <img src="${imgSrc}" style="width:70%; height:70%; object-fit:contain;" 
                onerror="handleImgError(this)">
                <div style="position:absolute; bottom:-20px; width:100%; text-align:center; font-size:0.7rem; color:#fff; text-shadow:1px 1px 1px #000; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                    ${dragon.name}
                </div>
            `;
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

    listDiv.style.display = "grid";
    listDiv.style.gridTemplateColumns = "repeat(4, 1fr)";
    listDiv.style.gap = "5px";

    const otherSlot = slotNum === 1 ? 2 : 1;
    const otherUId = selectedParents[otherSlot];

    let count = 0;
    player.myDragons.forEach((dragon) => {
        if (dragon.uId === otherUId) return;

        if (dragon.stage >= 3) {
            const div = document.createElement('div');
            div.className = "new-slot-item"; 
            div.style.cursor = "pointer";
            
            let imgSrc = window.getDragonImage(dragon.id, dragon.stage);
            div.innerHTML = `
                <img src="${imgSrc}" style="width:70%; height:70%; object-fit:contain;"
                onerror="handleImgError(this)">
            `;
            
            div.onclick = () => {
                selectedParents[slotNum] = dragon.uId; 
                updateParentSlots();
                listDiv.classList.add('hidden');
            };
            listDiv.appendChild(div);
            count++;
        }
    });

    if (count === 0) {
        listDiv.style.display = "block"; 
        listDiv.innerHTML = "<p style='padding:10px; text-align:center; color:#aaa; font-size:0.8rem;'>교배 가능한 성체가 없습니다.<br>(성장기까지 키운 후 시도하세요)</p>";
    }
}

function tryBreeding() {
    if (!selectedParents[1] || !selectedParents[2]) {
        showAlert("두 마리의 부모 용을 모두 선택해주세요.");
        return;
    }

    const cost = 500;
    if (player.gold < cost) {
        showAlert(`골드가 부족합니다. (${cost} 골드 필요)`);
        return;
    }

    const p1 = player.myDragons.find(d => d.uId === selectedParents[1]);
    const p2 = player.myDragons.find(d => d.uId === selectedParents[2]);

    showConfirm(
        `[${p1.name}]와(과) [${p2.name}]을(를)<br>교배하시겠습니까?\n(소모: ${cost} 골드)`,
        () => {
            player.gold -= cost;
            processBreeding(p1, p2);
            closeBreedingModal();
            if(window.updateUI) window.updateUI(); 
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
            <h3 style="color:#f1c40f; margin-bottom:10px;">교배 성공!</h3>
            <div style="display:inline-block; padding:10px; background:rgba(255,255,255,0.1); border-radius:10px;">
                <img src="${eggImgSrc}" style="width:80px; height:80px; object-fit:contain;"
                     onerror="handleImgError(this)">
            </div>
            <br><br>사랑의 결실로 <b>[${eggName}]</b>을(를)<br>얻었습니다!
        </div>
    `;
    
    if (Math.random() < 0.1) {
        player.gem += 1;
        msg += `<br><br><b style="color:#3498db">✨ 보너스: 보석 1개 발견! ✨</b>`;
    }

    showAlert(msg);
    saveGame();
}
