
const dragonDisplay = document.getElementById('dragon-display');
const progressBar = document.getElementById('progress-fill');
const statusText = document.getElementById('status-text');
const dragonNameUI = document.getElementById('dragon-name');

// 1. 화면 업데이트 함수
function updateUI() {
    const stage = currentDragon.getCurrentStageName();
    const max = currentDragon.getNextReq();
    const current = currentDragon.clicks;

    // 텍스트 변경
    dragonNameUI.innerText = `${currentDragon.name} (${stage})`;
    statusText.innerText = `성장도: ${current} / ${max}`;

    // 게이지바 변경
    let percent = (current / max) * 100;
    if(max === "MAX") percent = 100;
    progressBar.style.width = `${percent}%`;

    // 이미지(박스 색깔) 변경 - 클래스 교체 방식
    dragonDisplay.className = 'dragon-placeholder'; // 초기화
    if(currentDragon.stageIdx === 0) dragonDisplay.classList.add('egg');
    else if(currentDragon.stageIdx === 1) dragonDisplay.classList.add('baby');
    else dragonDisplay.classList.add('adult');
    
    // 박스 내부 텍스트 변경
    dragonDisplay.querySelector('p').innerText = stage;
}

// 2. 터치 이벤트 리스너
dragonDisplay.addEventListener('click', () => {
    // 용 클릭(성장) 로직 실행
    const isEvolved = currentDragon.click();
    
    // UI 반영
    updateUI();
});
