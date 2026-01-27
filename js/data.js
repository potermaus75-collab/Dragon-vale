// [시스템 1] 용 성장 단계
const DRAGON_DATA = {
    stages: ["알", "유아기", "성장기", "성룡", "고룡"],
    reqClicks: [20, 50, 150, 500], // 레벨업 요구량 조절
    stageImages: [
        "assets/images/dragon/stage_egg.png",
        "assets/images/dragon/stage_baby.png",
        "assets/images/dragon/stage_adult.png", 
        "assets/images/dragon/stage_adult.png",
        "assets/images/dragon/stage_elder.png"
    ]
};

// [시스템 2] 도감 및 용 타입
const DRAGON_TYPES = {
    "fire": { name: "불꽃용", img: "assets/images/element/element_fire.png", desc: "뜨거운 열기를 내뿜습니다." },
    "water": { name: "물방울용", img: "assets/images/element/element_water.png", desc: "촉촉한 눈망울을 가졌습니다." },
    "forest": { name: "풀잎용", img: "assets/images/element/element_forest.png", desc: "숲의 향기가 납니다." },
    "electric": { name: "번개용", img: "assets/images/element/element_electric.png", desc: "찌릿찌릿합니다." },
    "metal": { name: "강철용", img: "assets/images/element/element_metal.png", desc: "단단한 비늘을 가졌습니다." }
};

// [시스템 3] 탐험 지역
const REGION_DATA = [
    { id: 0, name: "초보자의 숲", levelReq: 1, desc: "안전한 숲입니다. (나무가 많음)" },
    { id: 1, name: "바위 산맥", levelReq: 5, desc: "거친 바람이 붑니다." },
    { id: 2, name: "어둠의 동굴", levelReq: 10, desc: "앞이 잘 안 보입니다." },
    { id: 3, name: "타오르는 화산", levelReq: 20, desc: "매우 뜨겁습니다." },
    { id: 4, name: "얼음 협곡", levelReq: 30, desc: "살이 얼어붙습니다." },
    { id: 5, name: "용의 성지", levelReq: 50, desc: "전설적인 용들의 고향." }
];

const ENCOUNTER_RATES = {
    NOTHING: 30,
    MATERIAL: 50,
    NEST: 20 // 둥지 발견 확률 상향
};

// [신규] 둥지 강화 데이터 (필요 재료량)
const NEST_UPGRADE_COST = [10, 30, 60, 100, 200]; 

// 아이템 데이터베이스
const ITEM_DB = {
    // 소비
    "potion_s": { name: "성장 물약", img: "assets/images/item/potion_growth.png", price: 100, desc: "경험치 +20", type: "use", effect: 20 },
    
    // 재료
    "nest_wood": { name: "둥지 재료", img: "assets/images/item/material_wood.png", price: 50, desc: "둥지 강화에 사용됩니다.", type: "material" },
    
    // 알 (뽑기권)
    "egg_random": { name: "미지의 알", img: "assets/images/item/item_egg_box.png", price: 1000, desc: "무슨 용이 나올까요?", type: "egg", costType: "gold" },
    "egg_shiny": { name: "신비한 알", img: "assets/images/ui/icon_gem.png", price: 5, desc: "보석으로 구매하는 알", type: "egg", costType: "gem" }, // [신규]

    // 장비 (스탯 상향)
    "sword_wood": { name: "목검", img: "assets/images/equipment/weapon_wood_sword.png", price: 200, desc: "공격력 +5", type: "equip", slot: "arm", stat: 5 },
    "helm_leather": { name: "가죽 모자", img: "assets/images/equipment/head_leather_cap.png", price: 150, desc: "방어력 +2", type: "equip", slot: "head", stat: 2 },
    "armor_cloth": { name: "천 옷", img: "assets/images/equipment/body_cloth_armor.png", price: 300, desc: "방어력 +5", type: "equip", slot: "body", stat: 5 },
    "boots_leather": { name: "가죽 장화", img: "assets/images/equipment/leg_leather_boots.png", price: 150, desc: "방어력 +3", type: "equip", slot: "leg", stat: 3 }
};

// 상점 목록 (신비한 알 추가)
const SHOP_LIST = ["potion_s", "nest_wood", "egg_random", "egg_shiny", "sword_wood", "helm_leather", "armor_cloth", "boots_leather"];
