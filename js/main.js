// 전역 변수
let userNickname = "Guest";
let prologueIndex = 0;

const PROLOGUE_DATA = [
    { text: "옛날 옛적, 용들이 하늘을 지배하던 시대...\n(터치하여 계속)" },
    { text: "하지만 대전쟁 이후 용들은 모두 사라졌다." },
    { text: "당신은 우연히 숲속에서 낡은 알을 발견한다." },
    { text: "이제 당신의 이야기가 시작된다." }
];

function showScreen(screenId) {
    document.querySelectorAll('.full-screen').forEach(el => {
        el.classList.remove('active');
        el.classList.add('hidden');
    });
    const target = document.getElementById(screenId);
    if(target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }
}

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

// ★ 프롤로그 렌더링 수정
function renderPrologue() {
    const textEl = document.getElementById('prologue-text');
    // 텍스트가 보이도록 스타일 강제
    textEl.style.color = "#fff"; 
    textEl.style.zIndex = "100";
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

function startGame() {
    showScreen('screen-game');
    updateCurrency();
    switchTab('dragon'); // 첫 화면은 동굴
    if(window.updateUI) window.updateUI();
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    const selected = document.getElementById(`tab-${tabName}`);
    if (selected) selected.classList.remove('hidden');

    // 하단 아이콘 활성화
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

// ... (renderInventory, renderShop 등 나머지 함수는 이전과 동일) ...
// (아래 코드는 그대로 두거나 복사해서 넣으세요)

function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    if(!grid) return;
    grid.innerHTML = "";
    const itemIds = Object.keys(player.inventory);
    itemIds.forEach(id => {
        if(player.inventory[id] > 0) {
            const item = ITEM_DB[id];
            const div = document.createElement('div');
            div.className = 'item-slot';
            div.onclick = () => useItem(id);
            div.innerHTML = `<div style="font-size:1.5rem">${item.emoji}</div><div>${item.name}</div><div>x${player.inventory[id]}</div>`;
            grid.appendChild(div);
        }
    });
}

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
                <span style="font-size:2rem;">${item.emoji}</span>
                <div><div style="font-weight:bold;">${item.name}</div><div style="font-size:0.8rem; color:#aaa;">${item.desc}</div></div>
            </div>
            <button class="btn-stone" style="width:80px; height:40px; font-size:0.9rem;" onclick="buyItem('${id}')">💰 ${item.price}</button>
        `;
        list.appendChild(div);
    });
}

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
