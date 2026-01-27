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
        target.style.display = "flex"; 
    }
}

// 1. 시작화면 클릭
document.getElementById('screen-start').addEventListener('click', () => {
    if (localStorage.getItem('dragonSaveData')) {
        loadGame();
        if (userNickname && userNickname !== "Guest") {
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
    saveGame();
    showScreen('screen-prologue');
    renderPrologue();
}

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
    saveGame(); 
}

// 탭 전환 (수정됨: info에서 인벤토리도 갱신, book 추가)
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    const selected = document.getElementById(`tab-${tabName}`);
    if(selected) selected.classList.remove('hidden');

    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    // 버튼 인덱스 매핑 수정 (0:Info, 1:Dragon, 2:Explore, 3:Book, 4:Shop)
    const tabMap = {'info':0, 'dragon':1, 'explore':2, 'book':3, 'shop':4};
    if(tabMap[tabName] !== undefined) navBtns[tabMap[tabName]].classList.add('active');

    // 데이터 갱신
    if (tabName === 'info') { // 내 정보 탭에서 인벤토리도 그림
        updateCurrency();
        if(window.updateUI) window.updateUI(); 
        renderInventory();
    }
    if (tabName === 'shop') renderShop();
    if (tabName === 'book') renderBook(); // 도감 그리기
    if (tabName === 'dragon') {
        updateCurrency();
        if(window.updateUI) window.updateUI(); 
    }
    if (tabName === 'explore') {
        if(window.initExploreTab) window.initExploreTab();
    }
}

// 가방 그리기 (이제 info 탭 안에서 작동)
function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    const itemIds = Object.keys(player.inventory);
    if(itemIds.length === 0) grid.innerHTML = "<p style='grid-column:span 4; text-align:center; color:#888;'>비어있음</p>";

    itemIds.forEach(id => {
        if(player.inventory[id] > 0) {
            const item = ITEM_DB[id];
            const div = document.createElement('div');
            div.className = 'slot-item';
            div.onclick = () => useItem(id); 
            div.innerHTML = `<span>${item.emoji}</span><span style="position:absolute; bottom:2px; right:2px; font-size:0.7rem;">x${player.inventory[id]}</span>`;
            grid.appendChild(div);
        }
    });
}

// 도감 그리기 (신규)
function renderBook() {
    const grid = document.getElementById('book-grid');
    if(!grid) return;
    grid.innerHTML = "";

    // player.discovered가 없으면 초기화
    if(!player.discovered) player.discovered = [];

    // DRAGON_TYPES에 정의된 모든 용을 순회
    Object.keys(DRAGON_TYPES).forEach(typeKey => {
        const dragonInfo = DRAGON_TYPES[typeKey];
        const isFound = player.discovered.includes(typeKey);

        const div = document.createElement('div');
        div.className = `book-slot ${isFound ? 'found' : ''}`;
        
        if (isFound) {
            div.innerHTML = `
                <div class="book-emoji">${dragonInfo.emoji}</div>
                <div style="font-weight:bold;">${dragonInfo.name}</div>
            `;
            div.onclick = () => showAlert(`[${dragonInfo.name}]\n${dragonInfo.desc}`);
        } else {
            div.innerHTML = `
                <div class="book-emoji" style="filter:grayscale(1); opacity:0.3;">❓</div>
                <div>???</div>
            `;
        }
        grid.appendChild(div);
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

// 구매 로직
function buyItem(id) {
    const item = ITEM_DB[id];
    if (player.gold >= item.price) {
        showConfirm(`${item.name}을(를) 구매하시겠습니까?\n(가격: ${item.price} 골드)`, () => {
            player.gold -= item.price;
            addItem(id, 1);
            updateCurrency();
            showAlert("구매 완료!", () => { saveGame(); });
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
        }
        reader.readAsDataURL(file);
    }
});

// 저장 시스템
function saveGame() {
    player.nickname = userNickname; 
    const data = { player: player, timestamp: Date.now() };
    localStorage.setItem('dragonSaveData', JSON.stringify(data));
    console.log("게임 저장 완료");
}

function loadGame() {
    const saved = localStorage.getItem('dragonSaveData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            Object.assign(player, data.player);
            if(player.nickname) userNickname = player.nickname;
            
            // 데이터 구조 호환성 체크 (도감 배열 없으면 추가)
            if(!player.discovered) player.discovered = [];
            
            console.log("게임 불러오기 성공");
        } catch(e) {
            console.error("세이브 파일 로드 실패", e);
        }
    }
}

setInterval(saveGame, 60000);

// 모달 시스템
window.showAlert = function(msg, callback) {
    const modal = document.getElementById('common-modal');
    document.getElementById('modal-title').innerText = "알림";
    document.getElementById('modal-text').innerText = msg;
    
    document.getElementById('modal-btn-alert').classList.remove('hidden');
    document.getElementById('modal-btn-confirm').classList.add('hidden');
    
    modal.classList.remove('hidden');
    modal.classList.add('active');

    const okBtn = document.querySelector('#modal-btn-alert button');
    okBtn.onclick = function() {
        closeModal();
        if(callback) callback();
    };
};

window.showConfirm = function(msg, yesCallback, noCallback) {
    const modal = document.getElementById('common-modal');
    document.getElementById('modal-title').innerText = "확인";
    document.getElementById('modal-text').innerText = msg;
    
    document.getElementById('modal-btn-alert').classList.add('hidden');
    const confirmGroup = document.getElementById('modal-btn-confirm');
    confirmGroup.classList.remove('hidden');
    
    modal.classList.remove('hidden');
    modal.classList.add('active');

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

