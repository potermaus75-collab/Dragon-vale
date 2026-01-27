// [시스템 1] 용 성장 단계
const DRAGON_DATA = {
    stages: ["알", "유아기", "성장기", "성룡", "고룡"],
    reqClicks: [10, 30, 100, 500] 
};

// [시스템 2] 도감 및 획득 가능한 용 목록 (신규 추가)
const DRAGON_TYPES = {
    "fire": { name: "불꽃용", emoji: "🔥", desc: "뜨거운 열기를 내뿜습니다." },
    "water": { name: "물방울용", emoji: "💧", desc: "촉촉한 눈망울을 가졌습니다." },
    "forest": { name: "풀잎용", emoji: "🌿", desc: "숲의 향기가 납니다." },
    "electric": { name: "번개용", emoji: "⚡", desc: "찌릿찌릿합니다." },
    "metal": { name: "강철용", emoji: "💎", desc: "단단한 비늘을 가졌습니다." }
};

// [시스템 3] 탐험 지역 데이터
const REGION_DATA = [
    { id: 0, name: "초보자의 숲", levelReq: 1, desc: "안전한 숲입니다." },
    { id: 1, name: "바위 산맥", levelReq: 5, desc: "거친 바람이 붑니다." },
    { id: 2, name: "어둠의 동굴", levelReq: 10, desc: "앞이 잘 안 보입니다." },
    { id: 3, name: "타오르는 화산", levelReq: 20, desc: "매우 뜨겁습니다." },
    { id: 4, name: "얼음 협곡", levelReq: 30, desc: "살이 얼어붙습니다." },
    { id: 5, name: "용의 성지", levelReq: 50, desc: "전설적인 용들의 고향." }
];

// 탐험 확률
const ENCOUNTER_RATES = {
    NOTHING: 40,
    MATERIAL: 50,
    NEST: 10
};

// 아이템 데이터베이스
const ITEM_DB = {
    "potion_s": { name: "성장 물약", emoji: "🧪", price: 100, desc: "경험치 +10", type: "use" },
    "nest_wood": { name: "둥지 재료", emoji: "🪵", price: 500, desc: "둥지 강화용", type: "material" },
    "egg_random": { name: "미지의 알", emoji: "🥚", price: 1000, desc: "랜덤 용 부화", type: "egg" },
    
    // 장비
    "sword_wood": { name: "목검", emoji: "🗡️", price: 200, desc: "초보자용", type: "equip", slot: "arm" },
    "helm_leather": { name: "가죽 모자", emoji: "🧢", price: 150, desc: "가벼운 모자", type: "equip", slot: "head" },
    "armor_cloth": { name: "천 옷", emoji: "👕", price: 300, desc: "기본적인 옷", type: "equip", slot: "body" },
    "boots_leather": { name: "가죽 장화", emoji: "👢", price: 150, desc: "튼튼한 신발", type: "equip", slot: "leg" }
};

// 상점 목록
const SHOP_LIST = ["potion_s", "nest_wood", "egg_random", "sword_wood", "helm_leather", "armor_cloth", "boots_leather"];
