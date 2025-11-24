// ==============================
// 인기 일반의약품 샘플 30개
// ==============================

const productData = [
    { name: "타이레놀", shelf: 1, row: 2 },
    { name: "게보린", shelf: 1, row: 3 },
    { name: "펜잘", shelf: 1, row: 1 },
    { name: "판피린", shelf: 2, row: 4 },
    { name: "콜대원", shelf: 2, row: 2 },
    { name: "카베진", shelf: 2, row: 1 },
    { name: "닥터베아제", shelf: 3, row: 3 },
    { name: "훼스탈", shelf: 3, row: 1 },
    { name: "베나치오", shelf: 3, row: 4 },
    { name: "스트렙실", shelf: 4, row: 1 },
    { name: "목앤", shelf: 4, row: 3 },
    { name: "가그린", shelf: 4, row: 4 },
    { name: "우루사", shelf: 5, row: 2 },
    { name: "인사돌", shelf: 5, row: 1 },
    { name: "이지엔6", shelf: 5, row: 4 },

    { name: "부루펜시럽", shelf: 6, row: 1 },
    { name: "모기물파스", shelf: 6, row: 3 },
    { name: "후시딘", shelf: 6, row: 4 },
    { name: "마데카솔", shelf: 7, row: 2 },
    { name: "스킨엘", shelf: 7, row: 4 },
    { name: "연고세트", shelf: 7, row: 3 },
    { name: "큐란", shelf: 8, row: 1 },
    { name: "삼스톤", shelf: 8, row: 2 },
    { name: "지르텍", shelf: 8, row: 4 },
    { name: "알레그라", shelf: 9, row: 3 },
    { name: "씨콜드", shelf: 9, row: 1 },
    { name: "코푸렉", shelf: 9, row: 4 },
    { name: "타리온", shelf: 10, row: 2 },
    { name: "삐콤씨", shelf: 10, row: 1 },
    { name: "디오비", shelf: 10, row: 4 }
];


// ======================================================
// 선반 위치(좌표) 자동 생성 - 매장 레이아웃 설계
// ======================================================

// 매장 지도 안에서 선반 위치 좌표(중앙 기준)
const shelfPositions = {};

// 상단 1~5번 선반
for (let i = 1; i <= 5; i++) {
    shelfPositions[i] = {
        x: 350,
        y: 100 + (i - 1) * 80
    };
}

// 하단 6~10번 선반 (간격을 아래로 450 내려서 배치)
for (let i = 6; i <= 10; i++) {
    shelfPositions[i] = {
        x: 350,
        y: 100 + (i - 6) * 80 + 450
    };
}
