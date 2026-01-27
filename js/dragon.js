// ==========================================
// js/dragon.js (알 이미지 통합 로직 적용)
// ==========================================

// [시스템 2] 용 도감 데이터
const DRAGON_DEX = {
    // 🔥 불 속성
    "fire_c1": { name: "불도마뱀", type: "fire", rarity: "common", desc: "작은 불꽃을 내뿜습니다." },
    "fire_c2": { name: "애쉬", type: "fire", rarity: "common", desc: "재를 뒤집어쓴 용입니다." },
    "fire_c3": { name: "스파크", type: "fire", rarity: "common", desc: "꼬리에서 불똥이 튀어 오릅니다." },
    "fire_r1": { name: "플레임 드레이크", type: "fire", rarity: "rare", desc: "성격이 불같이 급합니다." },
    "fire_r2": { name: "마그마 웜", type: "fire", rarity: "rare", desc: "용암 속에서 헤엄칩니다." },
    "fire_h1": { name: "이프리트", type: "fire", rarity: "heroic", desc: "화염의 정령과 계약했습니다." },
    "fire_h2": { name: "블레이즈", type: "fire", rarity: "heroic", desc: "온몸이 항상 불타고 있습니다." },
    "fire_e1": { name: "피닉스 드래곤", type: "fire", rarity: "epic", desc: "죽지 않는 영원한 불꽃을 가졌습니다." },
    "fire_e2": { name: "볼케이노", type: "fire", rarity: "epic", desc: "등에 작은 화산을 짊어지고 있습니다." },
    "fire_l1": { name: "이그니스 로드", type: "fire", rarity: "legend", desc: "모든 불꽃을 다스리는 지배자입니다." },

    // 💧 물 속성
    "water_c1": { name: "올챙이 용", type: "water", rarity: "common", desc: "아직 다리가 나오지 않았습니다." },
    "water_c2": { name: "물방울", type: "water", rarity: "common", desc: "투명하고 말랑말랑합니다." },
    "water_c3": { name: "산호 용", type: "water", rarity: "common", desc: "산호초 사이에 숨어 삽니다." },
    "water_r1": { name: "아쿠아 윙", type: "water", rarity: "rare", desc: "물 위를 날아다닐 수 있습니다." },
    "water_r2": { name: "프로스트 바이트", type: "water", rarity: "rare", desc: "매우 차가운 물을 뿜습니다." },
    "water_h1": { name: "타이달 웨이브", type: "water", rarity: "heroic", desc: "거대한 파도를 일으킵니다." },
    "water_h2": { name: "크라켄 드래곤", type: "water", rarity: "heroic", desc: "다리가 아주 많습니다." },
    "water_e1": { name: "포세이돈", type: "water", rarity: "epic", desc: "바다의 왕자라고 불립니다." },
    "water_e2": { name: "아이스 에이지", type: "water", rarity: "epic", desc: "지나간 자리를 모두 얼려버립니다." },
    "water_l1": { name: "레비아탄", type: "water", rarity: "legend", desc: "심해 깊은 곳의 전설적인 괴수입니다." },

    // 🌿 풀 속성
    "forest_c1": { name: "새싹 용", type: "forest", rarity: "common", desc: "머리에 귀여운 새싹이 자랐습니다." },
    "forest_c2": { name: "나뭇잎 용", type: "forest", rarity: "common", desc: "나뭇잎처럼 생겨 숨기 좋습니다." },
    "forest_c3": { name: "버섯 용", type: "forest", rarity: "common", desc: "독버섯일 수도 있으니 조심하세요." },
    "forest_r1": { name: "바인 드래곤", type: "forest", rarity: "rare", desc: "덩굴을 채찍처럼 다룹니다." },
    "forest_r2": { name: "플라워 퀸", type: "forest", rarity: "rare", desc: "지나갈 때마다 꽃향기가 납니다." },
    "forest_h1": { name: "트리 엔트", type: "forest", rarity: "heroic", desc: "움직이는 거대한 나무와 같습니다." },
    "forest_h2": { name: "포이즌 아이비", type: "forest", rarity: "heroic", desc: "치명적인 맹독을 가졌습니다." },
    "forest_e1": { name: "가이아", type: "forest", rarity: "epic", desc: "대지의 축복을 받았습니다." },
    "forest_e2": { name: "에인션트 루트", type: "forest", rarity: "epic", desc: "숲의 기원이 되는 존재입니다." },
    "forest_l1": { name: "이그드라실", type: "forest", rarity: "legend", desc: "세계수를 수호하는 용입니다." },

    // ⚡ 번개 속성
    "electric_c1": { name: "찌릿 용", type: "electric", rarity: "common", desc: "만지면 정전기가 일어납니다." },
    "electric_c2": { name: "건전지 용", type: "electric", rarity: "common", desc: "항상 에너지가 넘칩니다." },
    "electric_c3": { name: "전구 용", type: "electric", rarity: "common", desc: "어두운 동굴을 밝혀줍니다." },
    "electric_r1": { name: "스파크 윙", type: "electric", rarity: "rare", desc: "날개짓 할 때마다 번쩍입니다." },
    "electric_r2": { name: "테슬라", type: "electric", rarity: "rare", desc: "주변의 자기장을 조종합니다." },
    "electric_h1": { name: "썬더 볼트", type: "electric", rarity: "heroic", desc: "벼락처럼 빠르게 움직입니다." },
    "electric_h2": { name: "플라즈마", type: "electric", rarity: "heroic", desc: "고열의 플라즈마를 뿜습니다." },
    "electric_e1": { name: "라이트닝 로드", type: "electric", rarity: "epic", desc: "하늘에서 번개를 부릅니다." },
    "electric_e2": { name: "볼트카이저", type: "electric", rarity: "epic", desc: "전기의 황제입니다." },
    "electric_l1": { name: "제우스", type: "electric", rarity: "legend", desc: "천둥의 신이라 불립니다." },

    // 💎 강철 속성
    "metal_c1": { name: "고철 용", type: "metal", rarity: "common", desc: "오래되어 녹이 좀 슬었습니다." },
    "metal_c2": { name: "나사 용", type: "metal", rarity: "common", desc: "몸이 덜그럭거려 조립이 필요합니다." },
    "metal_c3": { name: "코인 용", type: "metal", rarity: "common", desc: "동전처럼 반짝거립니다." },
    "metal_r1": { name: "아이언 윙", type: "metal", rarity: "rare", desc: "강철 깃털을 가져 무겁습니다." },
    "metal_r2": { name: "기어 드래곤", type: "metal", rarity: "rare", desc: "복잡한 톱니바퀴로 움직입니다." },
    "metal_h1": { name: "실버 나이트", type: "metal", rarity: "heroic", desc: "은빛 기사의 갑옷을 입었습니다." },
    "metal_h2": { name: "골든 킹", type: "metal", rarity: "heroic", desc: "온몸이 순금으로 만들어졌습니다." },
    "metal_e1": { name: "티타늄", type: "metal", rarity: "epic", desc: "절대 부서지지 않는 강도를 자랑합니다." },
    "metal_e2": { name: "메카 드래곤", type: "metal", rarity: "epic", desc: "고대 과학 기술의 정점입니다." },
    "metal_l1": { name: "오리하르콘", type: "metal", rarity: "legend", desc: "전설 속의 금속으로 태어났습니다." }
};

// 이미지 파일명 매핑
const IMG_MAPPING = {
    // 🔥 불
    "fire_c1": "fire_lizard", "fire_c2": "fire_ash", "fire_c3": "fire_spark",
    "fire_r1": "fire_drake", "fire_r2": "fire_magma",
    "fire_h1": "fire_ifrit", "fire_h2": "fire_blaze",
    "fire_e1": "fire_phoenix", "fire_e2": "fire_volcano",
    "fire_l1": "fire_ignis",
    // 💧 물
    "water_c1": "water_tadpole", "water_c2": "water_drop", "water_c3": "water_coral",
    "water_r1": "water_aqua", "water_r2": "water_frost",
    "water_h1": "water_tidal", "water_h2": "water_kraken",
    "water_e1": "water_poseidon", "water_e2": "water_ice",
    "water_l1": "water_leviathan",
    // 🌿 풀
    "forest_c1": "forest_sprout", "forest_c2": "forest_leaf", "forest_c3": "forest_mushroom",
    "forest_r1": "forest_vine", "forest_r2": "forest_flower",
    "forest_h1": "forest_ent", "forest_h2": "forest_poison",
    "forest_e1": "forest_gaia", "forest_e2": "forest_root",
    "forest_l1": "forest_yggdrasil",
    // ⚡ 번개
    "electric_c1": "elec_zzirit", "electric_c2": "elec_battery", "electric_c3": "elec_bulb",
    "electric_r1": "elec_wing", "electric_r2": "elec_tesla",
    "electric_h1": "elec_thunder", "electric_h2": "elec_plasma",
    "electric_e1": "elec_rod", "electric_e2": "elec_kaiser",
    "electric_l1": "elec_zeus",
    // 💎 강철
    "metal_c1": "metal_scrap", "metal_c2": "metal_screw", "metal_c3": "metal_coin",
    "metal_r1": "metal_iron", "metal_r2": "metal_gear",
    "metal_h1": "metal_silver", "metal_h2": "metal_gold",
    "metal_e1": "metal_titan", "metal_e2": "metal_mecha",
    "metal_l1": "metal_ori"
};

// [핵심 수정] 0단계(알)는 속성별 공통 이미지 반환
function getDragonImage(dragonId, stageIndex) {
    const stageNames = ["egg", "baby", "teen", "adult", "elder"];
    
    // 1. 알 단계(0)라면 속성을 확인하여 공통 알 이미지 반환
    if (stageIndex === 0) {
        const info = DRAGON_DEX[dragonId];
        // info가 없으면(오류 방지) 기본 불 알 반환
        const type = info ? info.type : "fire"; 
        
        // 파일명 규칙: egg_fire.png, egg_water.png 등
        // (assets/images/dragon 폴더 안에 넣었다고 가정)
        return `assets/images/dragon/egg_${type}.png`;
    }

    // 2. 그 외 단계는 고유 이미지 반환
    const baseName = IMG_MAPPING[dragonId] || "fire_lizard";
    return `assets/images/dragon/${baseName}_${stageNames[stageIndex]}.png`;
}

// 전역 할당
window.getDragonImage = getDragonImage;
window.IMG_MAPPING = IMG_MAPPING;
window.DRAGON_DEX = DRAGON_DEX;
