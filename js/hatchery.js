const dragonDisplay = document.getElementById('dragon-display');
const progressBar = document.getElementById('progress-fill');
const statusText = document.getElementById('click-msg');
const dragonNameUI = document.getElementById('dragon-name-ui');
const imgArea = document.getElementById('dragon-img-area');

function updateUI() {
    if(!currentDragon) return;

    const stage = currentDragon.getCurrentStageName();
    const max = currentDragon.getNextReq();
    const current = currentDragon.clicks;

    // 텍스트 업데이트
    dragonNameUI.innerText = `${currentDragon.name} [${stage}]`;

    // 게이지바 업데이트
    let percent = (current / max) * 100;
    if (max === "MAX") percent = 100;
    progressBar.style.width = `${percent}%`;

    // ★ 이미지/이모티콘 처리
    let currentEmoji = "🥚";
    if (currentDragon.stageIdx === 1) currentEmoji = "🐣";
    else if (currentDragon.stageIdx === 2) currentEmoji = "🐉";
    else if (currentDragon.stageIdx >= 3) currentEmoji = "🐲";

    imgArea.innerText = currentEmoji; // 1. 일단 이모티콘 넣기
    
    if (currentDragon.imagePath) {
        // 2. 이미지가 있으면 배경으로 덮어쓰기
        imgArea.style.backgroundImage = `url('${currentDragon.imagePath}')`;
        imgArea.style.color = "transparent"; 
    } else {
        imgArea.style.backgroundImage = "none";
        imgArea.style.color = "white"; 
    }
}

// 터치 이벤트
if(dragonDisplay) {
    dragonDisplay.addEventListener('click', () => {
        const isEvolved = currentDragon.click();
        updateUI();
    });
}
