// ==========================================
// js/data.js (완전한 코드)
// ==========================================

// [시스템 1] 등급 및 확률 데이터
const RARITY_DATA = {
    "common": { name: "일반", color: "#b0b0b0", prob: 50 },
    "rare": { name: "희귀", color: "#3498db", prob: 30 },
    "heroic": { name: "서사", color: "#9b59b6", prob: 15 }, 
    "epic": { name: "에픽", color: "#e67e22", prob: 4 },
    "legend": { name: "전설", color: "#f1c40f", prob: 1 }
};

// [시스템 3] 성장 데이터 (단계별 이미지 구분)
const DRAGON_DATA = {
    stages: ["알", "유아기", "성장기", "성룡", "고룡"],
    reqClicks: [20, 50, 150, 500], 
    stageImages: [
        "assets/images/dragon/stage_egg.png",
        "assets/images/dragon/stage_baby.png",
        "assets/images/dragon/stage_adult.png", 
        "assets/images/dragon/stage_adult.png",
        "assets/images/dragon/stage_elder.png"
    ]
};

// [시스템 4] 탐험 지역 (배경 이미지 추가)
// 배경 이미지가 없으면 기본 검은 화면이 뜹니다. assets/images/bg/ 폴더에 해당 파일들을 넣어주세요.
const REGION_DATA = [
    { id: 0, name: "초보자의 숲", levelReq: 1, desc: "평화로운 숲입니다.", bg: "assets/images/bg/forest.jpg" },
    { id: 1, name: "바위 산맥", levelReq: 5, desc: "광물이 많습니다.", bg: "assets/images/bg/mountain.jpg" },
    { id: 2, name: "어둠의 동굴", levelReq: 10, desc: "희귀한 보석이 있습니다.", bg: "assets/images/bg/cave.jpg" },
    { id: 3, name: "타오르는 화산", levelReq: 20, desc: "불 속성 용이 삽니다.", bg: "assets/images/bg/volcano.jpg" },
    { id: 4, name: "얼음 협곡", levelReq: 30, desc: "물 속성 용이 삽니다.", bg: "assets/images/bg/ice.jpg" },
    { id: 5, name: "용의 성지", levelReq: 50, desc: "전설의 용이 잠들어 있습니다.", bg: "assets/images/bg/shrine.jpg" }
];

// 탐험 확률 (재화 수급 추가)
const ENCOUNTER_RATES = {
    NOTHING: 20,
    RESOURCE: 50, // 재료/골드/보석
    NEST: 30      // 둥지
};

// [신규] 둥지 강화 데이터 (필요 재료량)
const NEST_UPGRADE_COST = [10, 30, 60, 100, 200]; 

// 아이템 데이터베이스 (costType 추가 - 재화 버그 수정용)
const ITEM_DB = {
    // 소비
    "potion_s": { name: "성장 물약", img: "assets/images/item/potion_growth.png", price: 100, desc: "경험치 +20", type: "use", effect: 20, costType: "gold" },
    "nest_wood": { name: "둥지 재료", img: "assets/images/item/material_wood.png", price: 50, desc: "둥지 강화", type: "material", costType: "gold" },
    
    // 알 (뽑기권)
    "egg_random": { name: "미지의 알", img: "assets/images/item/item_egg_box.png", price: 1000, desc: "랜덤 용 (일반~희귀)", type: "egg", costType: "gold" },
    "egg_shiny": { name: "신비한 알", img: "assets/images/ui/icon_gem.png", price: 5, desc: "높은 등급 & 이로치 확률 UP", type: "egg", costType: "gem" },

    // 장비
    "sword_wood": { name: "목검", img: "assets/images/equipment/weapon_wood_sword.png", price: 200, desc: "공격력 +5", type: "equip", slot: "arm", stat: 5, costType: "gold" },
    "helm_leather": { name: "가죽 모자", img: "assets/images/equipment/head_leather_cap.png", price: 150, desc: "방어력 +2", type: "equip", slot: "head", stat: 2, costType: "gold" },
    "armor_cloth": { name: "천 옷", img: "assets/images/equipment/body_cloth_armor.png", price: 300, desc: "방어력 +5", type: "equip", slot: "body", stat: 5, costType: "gold" },
    "boots_leather": { name: "가죽 장화", img: "assets/images/equipment/leg_leather_boots.png", price: 150, desc: "방어력 +3", type: "equip", slot: "leg", stat: 3, costType: "gold" }
};

// 상점 목록
const SHOP_LIST = ["potion_s", "nest_wood", "egg_random", "egg_shiny", "sword_wood", "helm_leather", "armor_cloth", "boots_leather"];
