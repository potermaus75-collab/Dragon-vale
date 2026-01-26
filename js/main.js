// 탭 전환 기능 (지금은 단순 알림용)
function switchTab(tabName) {
    if(tabName === 'hatchery') {
        // 부화장 화면으로 돌아오기 (현재 기본 화면이므로 로직 생략 가능)
        console.log("부화장으로 이동");
    }
}

// 게임 시작 시 초기화
window.onload = function() {
    console.log("게임이 시작되었습니다.");
    updateUI(); // hatchery.js에 있는 함수 호출해서 초기 화면 그림
}

