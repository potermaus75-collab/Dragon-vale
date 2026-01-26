class Dragon {
    constructor(name, type) {
        this.id = Date.now();
        this.name = name;
        this.type = type; // fire, water, etc.
        this.stage = 0; // 0:알, 1:유아기...
        this.clicks = 0; // 현재 경험치
    }

    // 클릭(성장) 로직
    click() {
        this.clicks++;
        const req = DRAGON_DATA.reqClicks[this.stage];
        
        // 성장 조건 달성 시
        if (req && this.clicks >= req) {
            if (this.stage < DRAGON_DATA.stages.length - 1) {
                this.stage++;
                this.clicks = 0;
                return true; // 진화함
            }
        }
        return false; // 진화 안함
    }

    getStageName() {
        return DRAGON_DATA.stages[this.stage];
    }
    
    getNextReq() {
        return DRAGON_DATA.reqClicks[this.stage] || 9999;
    }
}
