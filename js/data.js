// [시스템 3] 용 성장 데이터
const DRAGON_DATA = {
    stages: ["알", "유아기", "성장기", "성룡", "고룡"],
    reqClicks: [10, 30, 100, 500] 
};

// [시스템 2] 탐험 지역 데이터 (New!)
const REGION_DATA = [
    { id: 0, name: "초보자의 숲", levelReq: 1, bg: "bg_region_0.png", desc: "안전한 숲입니다." },
    { id: 1, name: "바위 산맥", levelReq: 5, bg: "bg_region_1.png", desc: "거친 바람이 붑니다." },
    { id: 2, name: "어둠의 동굴", levelReq: 10, bg: "bg_region_2.png", desc: "앞이 잘 안 보입니다." },
    { id: 3, name: "타오르는 화산", levelReq: 20, bg: "bg_region_3.png", desc: "매우 뜨겁습니다." },
    { id: 4, name: "얼음 협곡", levelReq: 30, bg: "bg_region_4.png", desc: "살이 얼어붙습니다." },
    { id: 5, name: "용의 성지", levelReq: 50, bg: "bg_region_5.png", desc: "전설적인 용들의 고향." }
];

// 탐험 확률 설정 (0~100)
const ENCOUNTER_RATES = {
    NOTHING: 40,   // 꽝
    MATERIAL: 50,  // 재료 발견
    NEST: 10       // 둥지 발견 (희귀)
};

// 아이템 데이터베이스
const ITEM_DB = {
    "potion_s": { name: "성장 물약", emoji: "🧪", price: 100, desc: "경험치 +10" },
    "nest_wood": { name: "둥지 재료", emoji: "🪵", price: 500, desc: "둥지 강화용" },
    "egg_random": { name: "미지의 알", emoji: "🥚", price: 1000, desc: "랜덤 용 부화" }
};

// 상점 판매 목록
const SHOP_LIST = ["potion_s", "nest_wood", "egg_random"];
