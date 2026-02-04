// ==========================================
// js/breeding.js (완전판)
// ==========================================

// 교배 슬롯 상태
let breedingSlots = { 1: null, 2: null };

// 교배 모달 열기
window.openBreedingModal = function() {
    breedingSlots = { 1: null, 2: null };
    updateBreedingSlots();
    
    const modal = document.getElementById('breeding-modal');
    modal.classList.remove('hidden');
    // 드래곤 선택 리스트는 처음에 숨김
    document.getElementById('breeding-select-list').classList.add('hidden');
};

// 교배 모달 닫기
window.closeBreedingModal = function() {
    const modal = document.getElementById('breeding-modal');
    modal.classList.add('hidden');
};

// 부모 선택하기 (리스트 표시)
window.selectParent = function(slotNum) {
    const list = document.getElementById('breeding-select-list');
    list.innerHTML = "";
    list.classList.remove('hidden'); // 리스트 보이기

    // 교배 가능한 성체(stage >= 3) 필터링
    const adults = player.myDragons.filter(d => d.stage >= 3);
    
    if (adults.length === 0) {
        list.innerHTML = "<div style='color:#888; padding:10px;'>교배 가능한 성체(성룡)가 없습니다.</div>";
        return;
    }

    adults.forEach(dragon => {
        // 이미 다른 슬롯에 선택된 드래곤은 제외
        if (slotNum === 1 && breedingSlots[2] && breedingSlots[2].uId === dragon.uId) return;
        if (slotNum === 2 && breedingSlots[1] && breedingSlots[1].uId === dragon.uId) return;

        const row = document.createElement('div');
        row.style.cssText = "display:flex; align-items:center; background:rgba(255,255,255,0.1); margin-bottom:5px; padding:5px; border-radius:5px; cursor:pointer;";
        
        let imgSrc = window.getDragonImage ? window.getDragonImage(dragon.id, dragon.stage) : "";
        
        row.innerHTML = `
            <img src="${imgSrc}" style="width:40px; height:40px; margin-right:10px; object-fit:contain;">
            <div style="text-align:left;">
                <div style="font-weight:bold; color:${RARITY_DATA[dragon.rarity].color}">${dragon.name}</div>
                <div style="font-size:0.8rem; color:#aaa;">${dragon.type} 타입</div>
            </div>
        `;
        
        // 클릭 시 슬롯에 할당하고 리스트 닫기
        row.onclick = () => {
            breedingSlots[slotNum] = dragon;
            updateBreedingSlots();
            list.classList.add('hidden'); // 리스트 즉시 닫힘
        };
        
        list.appendChild(row);
    });
};

// 슬롯 UI 업데이트
function updateBreedingSlots() {
    for(let i=1; i<=2; i++) {
        const el = document.getElementById(`parent-slot-${i}`);
        if(breedingSlots[i]) {
            let imgSrc = window.getDragonImage(breedingSlots[i].id, breedingSlots[i].stage);
            el.innerHTML = `<img src="${imgSrc}" style="width:100%; height:100%; object-fit:contain;">`;
            el.classList.add('active');
        } else {
            el.innerHTML = `<span style="font-size:2rem; color:#555;">+</span>`;
            el.classList.remove('active');
        }
    }
}

// 교배 시도
window.tryBreeding = function() {
    if (!breedingSlots[1] || !breedingSlots[2]) {
        showAlert("두 마리의 드래곤을 모두 선택해주세요.");
        return;
    }

    const p1 = breedingSlots[1];
    const p2 = breedingSlots[2];

    showConfirm(`[${p1.name}]와(과) [${p2.name}]<br>교배하시겠습니까?`, () => {
        // 부모의 타입 중 하나를 랜덤으로 상속
        const types = [p1.type, p2.type];
        const targetType = types[Math.floor(Math.random() * types.length)];
        
        // 알 생성 (player.js의 hatchEggInternal 활용)
        // isShinyEgg = false, targetType 지정
        window.hatchEggInternal(false, targetType); 
        
        closeBreedingModal();
        showAlert("축하합니다!<br>사랑의 결실로 알이 생겼습니다!", () => {
            // 알이 있는 둥지 탭으로 이동
            if(window.switchTab) window.switchTab('dragon');
        });
    });
};
