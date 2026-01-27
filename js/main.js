// 전역 변수
let userNickname = "Guest";
let prologueIndex = 0;

const PROLOGUE_DATA = [
    { text: "옛날 옛적, 용들이 하늘을 지배하던 시대...\n(터치하여 계속)" },
    { text: "하지만 대전쟁 이후 용들은 모두 사라졌다." },
    { text: "당신은 우연히 숲속에서 낡은 알을 발견한다." },
    { text: "이제 당신의 이야기가 시작된다." }
];

// 화면 전환
function showScreen(screenId) {
    document.querySelectorAll('.full-screen').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });
    const target = document.getElementById(screenId);
    if(target) {
        target.classList.remove('hidden');
        target.classList.add('active');
        target.style.display = "flex"; // 확실하게 보이게 설정
    }
}

// 1. 시작화면 클릭
document.getElementById('screen-start').addEventListener('click', () => {
    // 시작할 때 저장된 데이터가 있는지 먼저 확인
    if (localStorage.getItem('dragonSaveData')) {
        // 데이터가 있으면 로드 후 바로 게임 진입도 가능하나,
        // 여기서는 닉네임 확인 단계로 넘깁니다. (이미 닉네임이 있으면 자동 처리)
        loadGame();
        
        if (userNickname && userNickname !== "Guest") {
             // 닉네임이 이미 있으면 바로 게임 시작
            document.getElementById('ui-nickname').innerText = userNickname;
            startGame();
            return;
        }
    }
    showScreen('screen-setup');
});

// 2. 닉네임 입력 -> 프롤로그
function submitName() {
    const input = document.getElementById('input-nickname');
    if (input.value.trim() === "") return showAlert("이름을 입력해주세요!");
    
    userNickname = input.value;
    document.getElementById('ui-nickname').innerText = userNickname;
    
    // 닉네임 설정 시점에서도 저장 한 번 수행
    saveGame();
    
    showScreen('screen-prologue');
    renderPrologue();
}

// 프롤로그 렌더링
function renderPrologue() {
    const textEl = document.getElementById('prologue-text');
    textEl.innerText = PROLOGUE_DATA[prologueIndex].text;
}

function nextPrologueCut() {
    prologueIndex++;
    if (prologueIndex >= PROLOGUE_DATA.length) {
        startGame();
    } else {
        renderPrologue();
    }
}

// 3. 게임 진입
function startGame() {
    showScreen('screen-game');
    updateCurrency();
    switchTab('dragon'); 
    if(window.updateUI) window.updateUI();
    
    // 게임 시작 시 자동 저장 인터벌 시작
    saveGame(); 
}

// 탭 전환
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    const selected = document.getElementById(`tab-${tabName}`);
    if(selected) selected.classList.remove('hidden');

    // 하단 버튼 활성화 효과
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    const tabMap = {'info':0, 'dragon':1, 'explore':2, 'inventory':3, 'shop':4};
    if(tabMap[tabName] !== undefined) navBtns[tabMap[tabName]].classList.add('active');

    // 데이터 갱신
    if (tabName === 'inventory') renderInventory();
    if (tabName === 'shop') renderShop();
    if (tabName === 'info' || tabName === 'dragon') {
        updateCurrency();
        if(window.updateUI) window.updateUI(); 
    }
    if (tabName === 'explore') {
        if(window.initExploreTab) window.initExploreTab();
    }
}

// 가방 그리기
function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    const itemIds = Object.keys(player.inventory);
    if(itemIds.length === 0) grid.innerHTML = "<p>비어있음</p>";

    itemIds.forEach(id => {
        if(player.inventory[id] > 0) {
            const item = ITEM_DB[id];
            const div = document.createElement('div');
            div.className = 'slot-item';
            div.onclick = () => useItem(id); // player.js의 useItem
            div.innerHTML = `<span>${item.emoji}</span><span>x${player.inventory[id]}</span>`;
            grid.appendChild(div);
        }
    });
}

// 상점 그리기
function renderShop() {
    const list = document.getElementById('shop-list');
    if(!list) return;
    list.innerHTML = "";
    SHOP_LIST.forEach(id => {
        const item = ITEM_DB[id];
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:1.5rem;">${item.emoji}</span>
                <div><b>${item.name}</b><br><small style="color:#aaa;">${item.desc}</small></div>
            </div>
            <button class="btn-stone" style="width:80px; height:40px; font-size:0.9rem;" onclick="buyItem('${id}')">💰 ${item.price}</button>
        `;
        list.appendChild(div);
    });
}

// 구매 로직 (Alert -> ShowAlert 변경)
function buyItem(id) {
    const item = ITEM_DB[id];
    if (player.gold >= item.price) {
        showConfirm(`${item.name}을(를) 구매하시겠습니까?\n(가격: ${item.price} 골드)`, () => {
            player.gold -= item.price;
            addItem(id, 1);
            updateCurrency();
            showAlert("구매 완료!", () => {
                 saveGame(); // 구매 후 저장
            });
        });
    } else {
        showAlert("골드가 부족합니다.");
    }
}

// 프로필 이미지 변경
function changeProfileImage() {
    document.getElementById('file-input').click();
}
document.getElementById('file-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            document.getElementById('ui-profile-img').style.backgroundImage = `url('${evt.target.result}')`;
            document.getElementById('ui-profile-img').style.backgroundSize = "cover";
            // 이미지 데이터는 용량이 커서 로컬스토리지 저장은 생략하거나 별도 처리 필요
        }
        reader.readAsDataURL(file);
    }
});


// ==========================================
// [신규] 저장 시스템 및 모달 유틸리티
// ==========================================

// 1. 저장 기능
function saveGame() {
    // 닉네임도 저장 데이터에 포함
    player.nickname = userNickname; 
    
    const data = {
        player: player,
        timestamp: Date.now()
    };
    localStorage.setItem('dragonSaveData', JSON.stringify(data));
    console.log("게임 저장 완료");
}

// 2. 불러오기 기능
function loadGame() {
    const saved = localStorage.getItem('dragonSaveData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            // player 객체 덮어쓰기 (참조 유지)
            Object.assign(player, data.player);
            
            // 닉네임 복구
            if(player.nickname) userNickname = player.nickname;
            
            console.log("게임 불러오기 성공");
        } catch(e) {
            console.error("세이브 파일 로드 실패", e);
        }
    }
}

// 3. 자동 저장 (1분마다)
setInterval(saveGame, 60000);

// 4. 모달 시스템 (alert 대체)
window.showAlert = function(msg, callback) {
    const modal = document.getElementById('common-modal');
    document.getElementById('modal-title').innerText = "알림";
    document.getElementById('modal-text').innerText = msg;
    
    // 버튼 설정
    document.getElementById('modal-btn-alert').classList.remove('hidden');
    document.getElementById('modal-btn-confirm').classList.add('hidden');
    
    modal.classList.remove('hidden');
    modal.classList.add('active');

    // 확인 버튼 클릭 시 동작 재정의
    // 기존 이벤트 제거를 위해 cloneNode 사용 또는 onclick 덮어쓰기
    const okBtn = document.querySelector('#modal-btn-alert button');
    okBtn.onclick = function() {
        closeModal();
        if(callback) callback();
    };
};

// 5. 모달 시스템 (confirm 대체)
window.showConfirm = function(msg, yesCallback, noCallback) {
    const modal = document.getElementById('common-modal');
    document.getElementById('modal-title').innerText = "확인";
    document.getElementById('modal-text').innerText = msg;
    
    // 버튼 설정
    document.getElementById('modal-btn-alert').classList.add('hidden');
    const confirmGroup = document.getElementById('modal-btn-confirm');
    confirmGroup.classList.remove('hidden');
    
    modal.classList.remove('hidden');
    modal.classList.add('active');

    // 예/아니오 이벤트 연결
    document.getElementById('btn-confirm-yes').onclick = function() {
        closeModal();
        if(yesCallback) yesCallback();
    };
    document.getElementById('btn-confirm-no').onclick = function() {
        closeModal();
        if(noCallback) noCallback();
    };
};

window.closeModal = function() {
    const modal = document.getElementById('common-modal');
    modal.classList.remove('active');
    modal.classList.add('hidden');
};
