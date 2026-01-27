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

// [시스템 2] 용 데이터베이스 (5속성 x 10마리 = 50마리)
// 이미지 경로는 'dragon_{속성}_{등급}.png' 형식을 권장하지만, 
// 현재는 구현 편의상 이미지를 공통으로 쓰거나 준비된 에셋에 맞춰주세요.
const DRAGON_DEX = {
    // 🔥 불 속성
    "fire_c1": { name: "불도마뱀", type: "fire", rarity: "common", desc: "작은 불꽃을 내뿜습니다." },
    "fire_c2": { name: "애쉬", type: "fire", rarity: "common", desc: "재를 뒤집어쓴 용입니다." },
    "fire_c3": { name: "스파크", type: "fire", rarity: "common", desc: "꼬리에서 불똥이 튑니다." },
    "fire_r1": { name: "플레임 드레이크", type: "fire", rarity: "rare", desc: "성격이 불같습니다." },
    "fire_r2": { name: "마그마 웜", type: "fire", rarity: "rare", desc: "용암에서 헤엄칩니다." },
    "fire_h1": { name: "이프리트", type: "fire", rarity: "heroic", desc: "화염의 정령과 계약했습니다." },
    "fire_h2": { name: "블레이즈", type: "fire", rarity: "heroic", desc: "온몸이 불타고 있습니다." },
    "fire_e1": { name: "피닉스 드래곤", type: "fire", rarity: "epic", desc: "죽지 않는 불꽃을 가졌습니다." },
    "fire_e2": { name: "볼케이노", type: "fire", rarity: "epic", desc: "화산 그 자체입니다." },
    "fire_l1": { name: "이그니스 로드", type: "fire", rarity: "legend", desc: "모든 불꽃의 지배자입니다." },

    // 💧 물 속성
    "water_c1": { name: "올챙이 용", type: "water", rarity: "common", desc: "아직 다리가 없습니다." },
    "water_c2": { name: "물방울", type: "water", rarity: "common", desc: "투명하고 말랑합니다." },
    "water_c3": { name: "산호 용", type: "water", rarity: "common", desc: "산호초에 숨어 삽니다." },
    "water_r1": { name: "아쿠아 윙", type: "water", rarity: "rare", desc: "물 위를 날 수 있습니다." },
    "water_r2": { name: "프로스트 바이트", type: "water", rarity: "rare", desc: "차가운 물을 뿜습니다." },
    "water_h1": { name: "타이달 웨이브", type: "water", rarity: "heroic", desc: "파도를 일으킵니다." },
    "water_h2": { name: "크라켄 드래곤", type: "water", rarity: "heroic", desc: "다리가 아주 많습니다." },
    "water_e1": { name: "포세이돈", type: "water", rarity: "epic", desc: "바다의 왕자입니다." },
    "water_e2": { name: "아이스 에이지", type: "water", rarity: "epic", desc: "모든 것을 얼려버립니다." },
    "water_l1": { name: "레비아탄", type: "water", rarity: "legend", desc: "심해의 전설적인 괴수입니다." },

    // 🌿 풀 속성
    "forest_c1": { name: "새싹 용", type: "forest", rarity: "common", desc: "머리에 새싹이 자랐습니다." },
    "forest_c2": { name: "나뭇잎 용", type: "forest", rarity: "common", desc: "나뭇잎처럼 생겼습니다." },
    "forest_c3": { name: "버섯 용", type: "forest", rarity: "common", desc: "독버섯을 조심하세요." },
    "forest_r1": { name: "바인 드래곤", type: "forest", rarity: "rare", desc: "덩굴을 자유자재로 다룹니다." },
    "forest_r2": { name: "플라워 퀸", type: "forest", rarity: "rare", desc: "아름다운 꽃향기가 납니다." },
    "forest_h1": { name: "트리 엔트", type: "forest", rarity: "heroic", desc: "움직이는 거대한 나무입니다." },
    "forest_h2": { name: "포이즌 아이비", type: "forest", rarity: "heroic", desc: "맹독을 가졌습니다." },
    "forest_e1": { name: "가이아", type: "forest", rarity: "epic", desc: "대지의 축복을 받았습니다." },
    "forest_e2": { name: "에인션트 루트", type: "forest", rarity: "epic", desc: "숲의 기원입니다." },
    "forest_l1": { name: "이그드라실", type: "forest", rarity: "legend", desc: "세계수의 수호자입니다." },

    // ⚡ 번개 속성
    "electric_c1": { name: "찌릿 용", type: "electric", rarity: "common", desc: "정전기를 일으킵니다." },
    "electric_c2": { name: "건전지 용", type: "electric", rarity: "common", desc: "에너지가 넘칩니다." },
    "electric_c3": { name: "전구 용", type: "electric", rarity: "common", desc: "어두운 곳을 밝힙니다." },
    "electric_r1": { name: "스파크 윙", type: "electric", rarity: "rare", desc: "날개짓 할 때마다 번쩍입니다." },
    "electric_r2": { name: "테슬라", type: "electric", rarity: "rare", desc: "자기장을 조종합니다." },
    "electric_h1": { name: "썬더 볼트", type: "electric", rarity: "heroic", desc: "벼락처럼 빠릅니다." },
    "electric_h2": { name: "플라즈마", type: "electric", rarity: "heroic", desc: "고열의 플라즈마를 뿜습니다." },
    "electric_e1": { name: "라이트닝 로드", type: "electric", rarity: "epic", desc: "번개를 부릅니다." },
    "electric_e2": { name: "볼트카이저", type: "electric", rarity: "epic", desc: "전기의 황제입니다." },
    "electric_l1": { name: "제우스", type: "electric", rarity: "legend", desc: "천둥의 신입니다." },

    // 💎 강철 속성
    "metal_c1": { name: "고철 용", type: "metal", rarity: "common", desc: "녹이 좀 슬었습니다." },
    "metal_c2": { name: "나사 용", type: "metal", rarity: "common", desc: "조립이 필요합니다." },
    "metal_c3": { name: "코인 용", type: "metal", rarity: "common", desc: "동전처럼 반짝입니다." },
    "metal_r1": { name: "아이언 윙", type: "metal", rarity: "rare", desc: "강철 깃털을 가졌습니다." },
    "metal_r2": { name: "기어 드래곤", type: "metal", rarity: "rare", desc: "톱니바퀴로 움직입니다." },
    "metal_h1": { name: "실버 나이트", type: "metal", rarity: "heroic", desc: "기사의 갑옷을 입었습니다." },
    "metal_h2": { name: "골든 킹", type: "metal", rarity: "heroic", desc: "황금으로 만들어졌습니다." },
    "metal_e1": { name: "티타늄", type: "metal", rarity: "epic", desc: "절대 부서지지 않습니다." },
    "metal_e2": { name: "메카 드래곤", type: "metal", rarity: "epic", desc: "과학 기술의 정점입니다." },
    "metal_l1": { name: "오리하르콘", type: "metal", rarity: "legend", desc: "전설의 금속으로 태어났습니다." }
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
