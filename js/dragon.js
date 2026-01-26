class Dragon {
    constructor(name, rank) {
        this.name = name;
        this.rank = rank; // C, B, A, S
        this.stageIdx = 0; // 0:알, 1:유아기...
        this.clicks = 0; // 현재 경험치(터치수)
    }

    // 터치 시 실행
    click() {
        this.clicks++;
        return this.checkEvolution();
    }

    // 진화 체크
    checkEvolution() {
        const required = DRAGON_DATA.reqClicks[this.stageIdx];
        
        // 경험치가 찼으면 진화
        if (this.clicks >= required && this.stageIdx < DRAGON_DATA.stages.length - 1) {
            this.stageIdx++;
            this.clicks = 0; // 경험치 초기화
            alert(`축하합니다! ${DRAGON_DATA.stages[this.stageIdx]}로 성장했습니다!`);
            return true; // 진화함
        }
        return false; // 진화 안함
    }

    getCurrentStageName() {
        return DRAGON_DATA.stages[this.stageIdx];
    }
    
    getNextReq() {
        return DRAGON_DATA.reqClicks[this.stageIdx] || "MAX";
    }
}

// 현재 키우고 있는 용 전역 변수
let currentDragon = new Dragon("불꽃용", "C");

