// ==========================================
// js/dragon.js (최종: 데이터 중복 제거)
// ==========================================

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
    "fire_e2": { name: "볼카누스", type: "fire", rarity: "epic", desc: "화산을 통째로 삼켰다고 전해집니다." },
    "fire_l1": { name: "이그니스", type: "fire", rarity: "legend", desc: "태초의 불꽃을 간직한 전설의 용입니다." },

    // 💧 물 속성
    "water_c1": { name: "물방울 용", type: "water", rarity: "common", desc: "물방울처럼 투명한 비늘을 가졌습니다." },
    "water_c2": { name: "리버", type: "water", rarity: "common", desc: "강가에서 흔히 볼 수 있습니다." },
    "water_c3": { name: "버블", type: "water", rarity: "common", desc: "거품 장난을 좋아합니다." },
    "water_r1": { name: "아쿠아 드래곤", type: "water", rarity: "rare", desc: "물속에서 자유롭게 움직입니다." },
    "water_r2": { name: "산호 용", type: "water", rarity: "rare", desc: "산호초 사이에 숨어 삽니다." },
    "water_h1": { name: "타이달", type: "water", rarity: "heroic", desc: "거대한 파도를 일으킵니다." },
    "water_h2": { name: "프로스트", type: "water", rarity: "heroic", desc: "물을 순식간에 얼려버립니다." },
    "water_e1": { name: "리바이어던", type: "water", rarity: "epic", desc: "심해의 지배자입니다." },
    "water_e2": { name: "포세이돈", type: "water", rarity: "epic", desc: "바다의 신으로 불립니다." },
    "water_l1": { name: "오케아노스", type: "water", rarity: "legend", desc: "모든 바다의 근원입니다." },

    // 🌿 풀 속성
    "forest_c1": { name: "나뭇잎 용", type: "forest", rarity: "common", desc: "나뭇잎으로 위장합니다." },
    "forest_c2": { name: "모스", type: "forest", rarity: "common", desc: "이끼가 덮여 있습니다." },
    "forest_c3": { name: "스프라우트", type: "forest", rarity: "common", desc: "머리에 새싹이 자라있습니다." },
    "forest_r1": { name: "바인 드래곤", type: "forest", rarity: "rare", desc: "덩굴을 자유자재로 다룹니다." },
    "forest_r2": { name: "플라워 드래곤", type: "forest", rarity: "rare", desc: "향기로운 꽃향기가 납니다." },
    "forest_h1": { name: "드라이어드", type: "forest", rarity: "heroic", desc: "숲의 요정과 친합니다." },
    "forest_h2": { name: "가디언", type: "forest", rarity: "heroic", desc: "오래된 숲을 지키는 수호자입니다." },
    "forest_e1": { name: "이그드라실", type: "forest", rarity: "epic", desc: "세계수의 힘을 이어받았습니다." },
    "forest_e2": { name: "데메테르", type: "forest", rarity: "epic", desc: "대지의 축복을 내립니다." },
    "forest_l1": { name: "가이아", type: "forest", rarity: "legend", desc: "대지의 어머니라 불리는 용입니다." },

    // ⚡ 번개 속성
    "electric_c1": { name: "찌릿 용", type: "electric", rarity: "common", desc: "만지면 따끔합니다." },
    "electric_c2": { name: "볼트", type: "electric", rarity: "common", desc: "빠르게 움직입니다." },
    "electric_c3": { name: "배터리", type: "electric", rarity: "common", desc: "전기를 저장합니다." },
    "electric_r1": { name: "썬더 드래곤", type: "electric", rarity: "rare", desc: "천둥 소리를 냅니다." },
    "electric_r2": { name: "플라즈마", type: "electric", rarity: "rare", desc: "고온의 에너지를 방출합니다." },
    "electric_h1": { name: "라이트닝", type: "electric", rarity: "heroic", desc: "번개처럼 빠릅니다." },
    "electric_h2": { name: "테슬라", type: "electric", rarity: "heroic", desc: "자기장을 조종합니다." },
    "electric_e1": { name: "토르", type: "electric", rarity: "epic", desc: "망치 같은 꼬리를 가졌습니다." },
    "electric_e2": { name: "제우스", type: "electric", rarity: "epic", desc: "하늘의 심판을 내립니다." },
    "electric_l1": { name: "인드라", type: "electric", rarity: "legend", desc: "모든 번개를 다스립니다." },

    // 🛡️ 강철 속성
    "metal_c1": { name: "메탈 용", type: "metal", rarity: "common", desc: "몸이 단단합니다." },
    "metal_c2": { name: "너트", type: "metal", rarity: "common", desc: "기계 부품처럼 생겼습니다." },
    "metal_c3": { name: "코인", type: "metal", rarity: "common", desc: "반짝이는 것을 좋아합니다." },
    "metal_r1": { name: "아이언 드래곤", type: "metal", rarity: "rare", desc: "강철 비늘을 가졌습니다." },
    "metal_r2": { name: "기어 드래곤", type: "metal", rarity: "rare", desc: "톱니바퀴가 돌아갑니다." },
    "metal_h1": { name: "실버", type: "metal", rarity: "heroic", desc: "은빛으로 빛납니다." },
    "metal_h2": { name: "골드", type: "metal", rarity: "heroic", desc: "황금으로 덮여 있습니다." },
    "metal_e1": { name: "티타늄", type: "metal", rarity: "epic", desc: "절대 부서지지 않습니다." },
    "metal_e2": { name: "메카 드래곤", type: "metal", rarity: "epic", desc: "고대 문명의 기술로 만들어졌습니다." },
    "metal_l1": { name: "오리하르콘", type: "metal", rarity: "legend", desc: "전설의 금속으로 이루어진 용입니다." },

    // ✨ 빛 속성 (신규)
    "light_c1": { name: "반딧불이 용", type: "light", rarity: "common", desc: "꼬리에서 희미한 빛이 납니다." },
    "light_c2": { name: "캔들", type: "light", rarity: "common", desc: "촛불처럼 따뜻합니다." },
    "light_c3": { name: "프리즘", type: "light", rarity: "common", desc: "빛을 무지개색으로 반사합니다." },
    "light_r1": { name: "윙 드래곤", type: "light", rarity: "rare", desc: "빛나는 날개를 가졌습니다." },
    "light_r2": { name: "플래시", type: "light", rarity: "rare", desc: "눈부신 섬광을 뿜습니다." },
    "light_h1": { name: "엔젤", type: "light", rarity: "heroic", desc: "천사 같은 모습을 하고 있습니다." },
    "light_h2": { name: "발키리", type: "light", rarity: "heroic", desc: "전장을 비추는 빛입니다." },
    "light_e1": { name: "세라핌", type: "light", rarity: "epic", desc: "여섯 개의 날개를 가졌습니다." },
    "light_e2": { name: "솔라리스", type: "light", rarity: "epic", desc: "태양의 힘을 품고 있습니다." },
    "light_l1": { name: "루시퍼", type: "light", rarity: "legend", desc: "가장 밝게 빛나는 샛별입니다." },

    // 🌑 어둠 속성 (신규)
    "dark_c1": { name: "그림자 용", type: "dark", rarity: "common", desc: "그림자 속에 숨어 있습니다." },
    "dark_c2": { name: "배트", type: "dark", rarity: "common", desc: "박쥐 날개를 가졌습니다." },
    "dark_c3": { name: "잉크", type: "dark", rarity: "common", desc: "어두운 액체를 뿜습니다." },
    "dark_r1": { name: "나이트메어", type: "dark", rarity: "rare", desc: "악몽을 꾸게 합니다." },
    "dark_r2": { name: "팬텀", type: "dark", rarity: "rare", desc: "실체가 없는 유령 용입니다." },
    "dark_h1": { name: "뱀파이어", type: "dark", rarity: "heroic", desc: "생명력을 흡수합니다." },
    "dark_h2": { name: "리퍼", type: "dark", rarity: "heroic", desc: "영혼을 거두러 다닙니다." },
    "dark_e1": { name: "어비스", type: "dark", rarity: "epic", desc: "심연의 공포 그 자체입니다." },
    "dark_e2": { name: "이클립스", type: "dark", rarity: "epic", desc: "달을 삼키는 어둠입니다." },
    "dark_l1": { name: "디아블로", type: "dark", rarity: "legend", desc: "공포의 군주입니다." }
};

// 0단계(알)는 속성별 공통 이미지 반환
function getDragonImage(dragonId, stageIndex) {
    if (stageIndex === 0) {
        const type = DRAGON_DEX[dragonId].type;
        return `assets/images/dragon/egg_${type}.png`;
    }
    
    // 이 파일에는 이미지 파일명 매핑이 없으므로,
    // 실제 파일명 규칙(예: fire_c1_stage1.png)을 따르거나
    // 임시로 공용 이미지를 반환합니다.
    // [참고] 사용자가 이미지를 준비했다면 여기서 파일명을 조합하면 됩니다.
    // 현재는 폴백용 기본 로직만 유지합니다.

    // 예시: assets/images/dragon/fire_c1_1.png
    return `assets/images/dragon/${dragonId}_${stageIndex}.png`;
}

// 전역으로 노출
window.DRAGON_DEX = DRAGON_DEX;
window.getDragonImage = getDragonImage;
