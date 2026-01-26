// 용 성장 데이터
const DRAGON_DATA = {
    stages: ["알", "유아기", "성장기", "성룡", "고룡"],
    reqClicks: [10, 30, 100, 500] // 각 단계별 필요 터치/경험치
};

// 탐험 확률 데이터 (0~100)
const EXPLORE_RATES = {
    NOTHING: 40,   // 40% 확률로 꽝
    MATERIAL: 40,  // 40% 확률로 재료
    NEST: 20       // 20% 확률로 용의 둥지
};

