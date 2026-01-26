function startExploration() {
    const roll = Math.floor(Math.random() * 100); // 0 ~ 99 랜덤

    if (roll < EXPLORE_RATES.NOTHING) {
        // 꽝
        alert("탐험 결과: 아무것도 발견하지 못했습니다.");
    } 
    else if (roll < EXPLORE_RATES.NOTHING + EXPLORE_RATES.MATERIAL) {
        // 재료 발견
        alert("탐험 결과: '나뭇가지'를 주웠습니다!");
        // TODO: 인벤토리에 추가 로직
    } 
    else {
        // 용의 둥지 발견 (선택지 발생)
        const choice = confirm("용의 둥지를 발견했습니다!\n\n[확인] 몰래 알 훔치기 (성공률 30%)\n[취소] 어미용과 싸우기 (위험!)");

        if (choice) {
            // 몰래 훔치기 시도
            if (Math.random() < 0.3) {
                alert("성공! '미지의 알'을 획득했습니다.");
            } else {
                alert("실패! 어미용에게 들켜서 도망쳤습니다.");
            }
        } else {
            // 싸우기 (임시)
            alert("전투 기능은 준비중입니다. 무사히 도망쳤습니다.");
        }
    }
}

