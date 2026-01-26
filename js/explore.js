const logArea = document.getElementById('explore-log-area');

// 로그 한 줄 추가 함수
function addLog(text, color = "#ddd") {
    const p = document.createElement('p');
    p.innerHTML = text;
    p.style.color = color;
    p.style.margin = "5px 0";
    
    if(logArea) {
        logArea.appendChild(p);
        logArea.scrollTop = logArea.scrollHeight;
    }
}

// 탐험 버튼 클릭 시 실행
function tryExplore() {
    const roll = Math.floor(Math.random() * 100);
    
    // 통계 증가
    player.stats.explore++;
    updateCurrency(); 

    if (roll < 40) {
        addLog("🍂 숲을 헤맸지만 아무것도 없었다...", "#888");
    } else if (roll < 80) {
        // 골드 획득
        const goldFound = Math.floor(Math.random() * 50) + 10;
        player.gold += goldFound;
        updateCurrency();
        addLog(`💰 떨어진 동전을 주웠다! (+${goldFound}G)`, "#f1c40f");
    } else {
        // 아이템 획득 (전투 대신 임시 구현)
        addLog("🎁 보물상자를 발견했다!", "#2ecc71");
        addItem("potion_s", 1);
        addLog("└ 성장 물약을 획득함", "#2ecc71");
    }
}
