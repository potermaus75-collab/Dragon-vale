// ==========================================
// js/main.js (완전한 코드)
// ==========================================

// 전역 변수
let userNickname = "Guest";
let prologueIndex = 0;

const PROLOGUE_DATA = [
    { text: "옛날 옛적, 용들이 하늘을 지배하던 시대...\n(터치하여 계속)" },
    { text: "하지만 대전쟁 이후 용들은 모두 사라졌다." },
    { text: "당신은 우연히 숲속에서 낡은 알을 발견한다." },
    { text: "이제 당신의 이야기가 시작된다." }
];

// 화면 전환 함수
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
    // 저장된 데이터가 있는지 확인
    if (localStorage.getItem('dragonSaveData')) {
        loadGame();
        // 닉네임이 있으면 바로 게임 시작
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
    saveGame(); // 시작 시 자동 저장 시작
}

// 탭 전환 시스템
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    const selected = document.getElementById(`tab-${tabName}`);
    if(selected) selected.classList.remove('hidden');

    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    const tabMap = {'info':0, 'dragon':1, 'explore':2, 'book':3, 'shop':4};
    if(tabMap[tabName] !== undefined) navBtns[tabMap[tabName]].classList.add('active');

    // 탭별 데이터 갱신
    if (tabName === 'info') { 
        updateCurrency();
        if(window.updateUI) window.updateUI(); 
        renderInventory();
    }
    if (tabName === 'shop') renderShop();
    if (tabName === 'book') renderBook(); 
    if (tabName === 'dragon') {
        updateCurrency();
        if(window.updateUI) window.updateUI(); 
    }
    if (tabName === 'explore') {
        if(window.initExploreTab) window.initExploreTab();
    }
}

// [공통] 가방 그리기 (이미지 적용)
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
            // 이미지 태그 사용
            div.innerHTML = `<img src="${item.img}" class="item-img-lg" onerror="this.src='assets/images/ui/icon_question.png'"><span style="position:absolute; bottom:2px; right:2px; font-size:0.7rem;">x${player.inventory[id]}</span>`;
            grid.appendChild(div);
        }
    });
}

// [공통] 도감 그리기 (이미지 적용)
function renderBook() {
    const grid = document.getElementById('book-grid');
    if(!grid) return;
    grid.innerHTML = "";

    if(!player.discovered) player.discovered = [];

    // DRAGON_TYPES는 5속성 대표만 있으므로, DRAGON_DEX(50마리)를 기준으로 도감 표시
    // data.js에 있는 DRAGON_DEX를 순회
    Object.keys(DRAGON_DEX).forEach(dragonId => {
        const dragonInfo = DRAGON_DEX[dragonId];
        const isFound = player.discovered.includes(dragonId); // ID로 체크

        const div = document.createElement('div');
        div.className = `book-slot ${isFound ? 'found' : ''}`;
        
        // 희귀도 색상 (테두리 등)
        const rarityColor = RARITY_DATA[dragonInfo.rarity].color;
        if(isFound) div.style.borderColor = rarityColor;

        if (isFound) {
            // 성체 이미지(임시) 사용
            div.innerHTML = `
                <img src="assets/images/dragon/stage_adult.png" class="book-img">
                <div style="font-weight:bold; color:${rarityColor}; font-size:0.7rem;">${dragonInfo.name}</div>
            `;
            // 클릭 시 설명
            div.onclick = () => showAlert(`
                <div style="text-align:center;">
                    <img src="assets/images/dragon/stage_adult.png" style="width:100px; height:100px;"><br>
                    <b style="font-size:1.2rem; color:${rarityColor};">${dragonInfo.name}</b>
                    <br><span style="font-size:0.8rem; color:#aaa;">[${RARITY_DATA[dragonInfo.rarity].name}]</span><br><br>
                    ${dragonInfo.desc}
                </div>
            `);
        } else {
            div.innerHTML = `
                <img src="assets/images/ui/icon_question.png" class="book-img" style="opacity:0.3; filter:grayscale(1);">
                <div style="font-size:0.7rem;">???</div>
            `;
        }
        grid.appendChild(div);
    });
}

// [수정] 상점 그리기 (보석/골드 구분 표시)
function renderShop() {
    const list = document.getElementById('shop-list');
    if(!list) return;
    list.innerHTML = "";
    
    SHOP_LIST.forEach(id => {
        const item = ITEM_DB[id];
        // 비용 타입에 따라 아이콘 결정
        const costType = item.costType || 'gold';
        const currencyIcon = costType === 'gem' ? 'assets/images/ui/icon_gem.png' : 'assets/images/ui/icon_gold.png';
        const priceColor = costType === 'gem' ? '#3498db' : '#f1c40f'; // 보석:파랑, 골드:노랑

        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <img src="${item.img}" class="item-img-lg">
                <div><b>${item.name}</b><br><small style="color:#aaa;">${item.desc}</small></div>
            </div>
            <button class="btn-stone" style="width:90px; height:45px; font-size:0.9rem;" onclick="buyItem('${id}')">
                <img src="${currencyIcon}" class="currency-icon"> <span style="color:${priceColor}">${item.price}</span>
            </button>
        `;
        list.appendChild(div);
    });
}

// [수정] 구매 로직 (버그 수정: 재화 타입 구분)
function buyItem(id) {
    const item = ITEM_DB[id];
    // costType이 없으면 기본값 gold
    const costType = item.costType || 'gold'; 
    const currencyName = costType === 'gem' ? '보석' : '골드';
    
    // 플레이어의 현재 재화 확인
    const playerMoney = player[costType];

    if (playerMoney >= item.price) {
        showConfirm(`${item.name}을(를) 구매하시겠습니까?\n(가격: ${item.price} ${currencyName})`, () => {
            // 다시 한 번 체크 (안전장치)
            if (player[costType] < item.price) {
                showAlert(`${currencyName}이 부족합니다.`);
                return;
            }

            player[costType] -= item.price; // 해당 재화 차감
            addItem(id, 1);
            updateCurrency();
            showAlert("구매 완료!", () => { saveGame(); });
        });
    } else {
        showAlert(`${currencyName}이 부족합니다.`);
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

// 불러오기 시스템
function loadGame() {
    const saved = localStorage.getItem('dragonSaveData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            Object.assign(player, data.player);
            if(player.nickname) userNickname = player.nickname;
            if(!player.discovered) player.discovered = [];
            
            // [호환성] 혹시 gem이 없는 구버전 데이터라면 0으로 초기화
            if(player.gem === undefined) player.gem = 0;
            if(player.nestLevel === undefined) player.nestLevel = 0;

            console.log("게임 불러오기 성공");
        } catch(e) {
            console.error("세이브 파일 로드 실패", e);
        }
    }
}

// 자동 저장
setInterval(saveGame, 60000);

// 모달 시스템
window.showAlert = function(msg, callback) {
    const modal = document.getElementById('common-modal');
    document.getElementById('modal-title').innerText = "알림";
    document.getElementById('modal-text').innerHTML = msg; 
    
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
    document.getElementById('modal-text').innerHTML = msg; 
    
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
