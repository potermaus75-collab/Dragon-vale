// 전역 변수
let userNickname = "Guest";
let prologueIndex = 0;

// 프롤로그 대사 (나중에 이미지로 대체될 때를 대비해 텍스트도 준비)
const PROLOGUE_DATA = [
    { text: "옛날 옛적, 용들이 하늘을 지배하던 시대...", img: "" },
    { text: "하지만 대전쟁 이후 용들은 모두 사라졌다.", img: "" },
    { text: "당신은 우연히 숲속에서 낡은 알을 발견한다.", img: "" },
    { text: "이제 당신의 이야기가 시작된다.", img: "" }
];

// 화면 전환 함수
function showScreen(screenId) {
    // 모든 섹션을 숨김
    document.querySelectorAll('.full-screen').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.full-screen').forEach(el => el.classList.add('hidden'));
    
    // 타겟 섹션만 보임
    const target = document.getElementById(screenId);
    target.classList.remove('hidden');
    target.classList.add('active');
}

// 1. 시작 화면 클릭 시
document.getElementById('screen-start').addEventListener('click', () => {
    showScreen('screen-setup');
});

// 2. 닉네임 제출
function submitName() {
    const input = document.getElementById('input-nickname');
    if (input.value.trim() === "") {
        alert("이름을 입력해주세요!");
        return;
    }
    userNickname = input.value;
    document.getElementById('ui-nickname').innerText = userNickname;
    
    // 프롤로그 시작
    showScreen('screen-prologue');
    renderPrologue();
}

// 3. 프롤로그 진행
function renderPrologue() {
    const frame = document.getElementById('comic-frame');
    const text = document.getElementById('prologue-text');
    
    // 텍스트 변경 (나중엔 여기서 frame.style.backgroundImage 변경)
    text.innerText = `${prologueIndex + 1}번째 장면\n\n"${PROLOGUE_DATA[prologueIndex].text}"`;
}

function nextPrologueCut() {
    prologueIndex++;
    if (prologueIndex >= PROLOGUE_DATA.length) {
        // 프롤로그 끝 -> 게임 시작
        startGame();
    } else {
        renderPrologue();
    }
}

// 4. 게임 진입
function startGame() {
    showScreen('screen-game');
    updateUI(); // hatchery.js에 있는 초기 UI 그리기 호출
}

// 프로필 이미지 변경 (input file 트리거)
function changeProfileImage() {
    document.getElementById('file-input').click();
}

// 파일 선택 시 이미지 프리뷰 적용
document.getElementById('file-input').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('ui-profile-img').style.backgroundImage = `url('${e.target.result}')`;
        }
        reader.readAsDataURL(file);
    }
});

// 하단 메뉴 탭 전환 (콘솔 확인용)
function switchTab(tab) {
    console.log(`${tab} 탭으로 이동`);
    // 나중에 여기에 탭별 화면 전환 로직 추가 (예: game-view 내용 교체)
}
