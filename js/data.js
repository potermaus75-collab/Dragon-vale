// ==========================================
// js/data.js (색상 수정 반영)
// ==========================================

// [시스템 1] 등급 데이터 (서사 색상 변경)
const RARITY_DATA = {
    "common": { name: "일반", color: "#b0b0b0", prob: 50 },
    "rare": { name: "희귀", color: "#3498db", prob: 30 },
    // [수정] 보라색 -> 연두색(라임) 변경
    "heroic": { name: "서사", color: "#B5E61D", prob: 15 }, 
    "epic": { name: "에픽", color: "#e67e22", prob: 4 },
    "legend": { name: "전설", color: "#f1c40f", prob: 1 }
};

// [시스템 3] 성장 데이터
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

// [시스템 4] 탐험 지역
const REGION_DATA = [
    { id: 0, name: "푸른 숲", levelReq: 1, type: "forest", desc: "풀 속성 용이 서식합니다.", bg: "assets/images/bg/forest.jpg" },
    { id: 1, name: "깊은 바다", levelReq: 1, type: "water", desc: "물 속성 용이 서식합니다.", bg: "assets/images/bg/sea.jpg" },
    { id: 2, name: "화산 지대", levelReq: 1, type: "fire", desc: "불 속성 용이 서식합니다.", bg: "assets/images/bg/volcano.jpg" },
    { id: 3, name: "번개 황무지", levelReq: 1, type: "electric", desc: "번개 속성 용이 서식합니다.", bg: "assets/images/bg/storm.jpg" },
    { id: 4, name: "강철 동굴", levelReq: 1, type: "metal", desc: "강철 속성 용이 서식합니다.", bg: "assets/images/bg/cave.jpg" },
    { id: 5, name: "구름 신전", levelReq: 30, type: "light", desc: "빛 속성 용이 서식합니다. (Lv.30)", bg: "assets/images/bg/sky.jpg" },
    { id: 6, name: "지하 심연", levelReq: 30, type: "dark", desc: "어둠 속성 용이 서식합니다. (Lv.30)", bg: "assets/images/bg/abyss.jpg" }
];

const ENCOUNTER_RATES = {
    NOTHING: 20,
    RESOURCE: 65, 
    NEST: 15     
};

const NEST_UPGRADE_COST = [10, 30, 60, 100, 200]; 

// 아이템 데이터베이스
const ITEM_DB = {
    // 소비/재료
    "potion_s": { name: "성장 물약", img: "assets/images/item/potion_growth.png", price: 100, desc: "경험치 +20", type: "use", effect: 20, costType: "gold" },
    "nest_wood": { name: "둥지 재료", img: "assets/images/item/material_wood.png", price: 50, desc: "둥지 강화", type: "material", costType: "gold" },
    
    // 알 (속성별)
    "egg_fire": { name: "불의 알", img: "assets/images/dragon/egg_fire.png", price: 2000, desc: "불 속성 용 부화", type: "egg", dragonType: "fire", costType: "gold" },
    "egg_water": { name: "물의 알", img: "assets/images/dragon/egg_water.png", price: 2000, desc: "물 속성 용 부화", type: "egg", dragonType: "water", costType: "gold" },
    "egg_forest": { name: "풀의 알", img: "assets/images/dragon/egg_forest.png", price: 2000, desc: "풀 속성 용 부화", type: "egg", dragonType: "forest", costType: "gold" },
    "egg_electric": { name: "번개의 알", img: "assets/images/dragon/egg_electric.png", price: 2000, desc: "번개 속성 용 부화", type: "egg", dragonType: "electric", costType: "gold" },
    "egg_metal": { name: "강철의 알", img: "assets/images/dragon/egg_metal.png", price: 2000, desc: "강철 속성 용 부화", type: "egg", dragonType: "metal", costType: "gold" },
    "egg_light": { name: "빛의 알", img: "assets/images/dragon/egg_light.png", price: 5000, desc: "빛 속성 용 부화", type: "egg", dragonType: "light", costType: "gold" },
    "egg_dark": { name: "어둠의 알", img: "assets/images/dragon/egg_dark.png", price: 5000, desc: "어둠 속성 용 부화", type: "egg", dragonType: "dark", costType: "gold" },

    // 특수 알
    "egg_random": { name: "미지의 알", img: "assets/images/item/item_egg_box.png", price: 1000, desc: "랜덤 속성", type: "egg", dragonType: "random", costType: "gold" },
    "egg_shiny": { name: "신비한 알", img: "assets/images/ui/icon_gem.png", price: 5, desc: "높은 등급 & 이로치 확률 UP", type: "egg", dragonType: "random", costType: "gem" },

    // 장비
    "sword_wood": { name: "목검", img: "assets/images/equipment/weapon_wood_sword.png", price: 200, desc: "공격력 +5", type: "equip", slot: "arm", stat: 5, costType: "gold" },
    "helm_leather": { name: "가죽 모자", img: "assets/images/equipment/head_leather_cap.png", price: 150, desc: "방어력 +2", type: "equip", slot: "head", stat: 2, costType: "gold" },
    "armor_cloth": { name: "천 옷", img: "assets/images/equipment/body_cloth_armor.png", price: 300, desc: "방어력 +5", type: "equip", slot: "body", stat: 5, costType: "gold" },
    "boots_leather": { name: "가죽 장화", img: "assets/images/equipment/leg_leather_boots.png", price: 150, desc: "방어력 +3", type: "equip", slot: "leg", stat: 3, costType: "gold" }
};

// 상점 목록
const SHOP_LIST = ["potion_s", "nest_wood", "egg_random", "egg_shiny", "sword_wood", "helm_leather", "armor_cloth", "boots_leather"];
