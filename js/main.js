// 전역 변수
let userNickname = "Guest";
let prologueIndex = 0;

const PROLOGUE_DATA = [
    { text: "옛날 옛적, 용들이 하늘을 지배하던 시대...\n(터치하여 계속)" },
    { text: "하지만 대전쟁 이후 용들은 모두 사라졌다." },
    { text: "당신은 우연히 숲속에서 낡은 알을 발견한다." },
    { text: "이제 당신의 이야기가 시작된다." }
];

// 화면 전환 유틸
function showScreen(screenId) {
    document.querySelectorAll('.full-screen').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });
    const target = document.getElementById(screenId);
    target.classList.remove('hidden');
    target.classList.add('active');
}

// 1. 시작 및 설정
document.getElementById('screen-start').addEventListener('click', () => {
    showScreen('screen-setup');
});

function submitName() {
    const input = document.getElementById('input-nickname');
    if (input.value.trim() === "") return alert("이름을 입력해주세요!");
    
    userNickname = input.value;
    document.getElementById('ui-nickname').innerText = userNickname;
    
    showScreen('screen-prologue');
    renderPrologue();
}

// 2. 프롤로그
function renderPrologue() {
    const text = document.getElementById('prologue-text');
    text.innerText = PROLOGUE_DATA[prologueIndex].text;
}

function nextPrologueCut() {
    prologueIndex++;
    if (prologueIndex >= PROLOGUE_DATA.length) {
        startGame();
    } else {
        renderPrologue();
    }
}

// 3. 게임 시작
function startGame() {
    showScreen('screen-game');
    updateCurrency();
    updateUI(); // hatchery 초기화
    switchTab('dragon'); // 첫 화면은 용 관리
}

// 4. 탭 전환 시스템
function switchTab(tabName) {
    // 모든 탭 숨기기
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
        content.classList.remove('active');
    });

    // 선택 탭 보이기
    const selected = document.getElementById(`tab-${tabName}`);
    if (selected) {
        selected.classList.remove('hidden');
        selected.classList.add('active');
    }

    // 탭별 데이터 갱신
    if (tabName === 'inventory') renderInventory();
    if (tabName === 'shop') renderShop();
    if (tabName === 'info') updateCurrency();
}

// 인벤토리 그리기
function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = "";
    
    const itemIds = Object.keys(player.inventory);
    if (itemIds.length === 0) {
        grid.innerHTML = "<p style='grid-column: span 4; color:#888;'>가방이 비어있습니다.</p>";
        return;
    }

    itemIds.forEach(id => {
        if(player.inventory[id] > 0) {
            const item = ITEM_DB[id];
            const div = document.createElement('div');
            div.className = 'item-slot';
            div.onclick = () => useItem(id);
            div.innerHTML = `<div class="item-icon">${item.emoji}</div><div>${item.name}</div><div>x${player.inventory[id]}</div>`;
            grid.appendChild(div);
        }
    });
}

// 상점 그리기
function renderShop() {
    const list = document.getElementById('shop-list');
    list.innerHTML = "";

    SHOP_LIST.forEach(id => {
        const item = ITEM_DB[id];
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:2rem;">${item.emoji}</span>
                <div><div style="font-weight:bold;">${item.name}</div><div style="font-size:0.8rem; color:#aaa;">${item.desc}</div></div>
            </div>
            <button class="shop-btn" onclick="buyItem('${id}')">💰 ${item.price}</button>
        `;
        list.appendChild(div);
    });
}

// 구매 로직
function buyItem(id) {
    const item = ITEM_DB[id];
    if (player.gold >= item.price) {
        player.gold -= item.price;
        addItem(id, 1);
        updateCurrency();
        alert("구매 완료!");
    } else {
        alert("골드가 부족합니다.");
    }
}

// 프로필 사진 변경
function changeProfileImage() {
    document.getElementById('file-input').click();
}
document.getElementById('file-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            document.getElementById('ui-profile-img').style.backgroundImage = `url('${evt.target.result}')`;
            document.getElementById('ui-profile-img').innerText = "";
        }
        reader.readAsDataURL(file);
    }
});
