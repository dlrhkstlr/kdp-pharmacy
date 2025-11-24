// =====================================================================
// 매장 지도 렌더링 및 상품 검색 기능 통합본
// =====================================================================

// ---------------------------
// 1. 캔버스 설정
// ---------------------------
const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

// 선반 크기
const SHELF_WIDTH = 300;
const SHELF_HEIGHT = 30;

// 현재 위치 (QR 코드로 들어온 loc 값)
let currentLocation = null;


// ---------------------------
// 2. URL 파라미터로 현재 위치 받아오기
// 예: ?loc=3-2 → 선반3, 줄2
// ---------------------------
function getCurrentLocationFromURL() {
    const params = new URLSearchParams(location.search);
    if (params.has("loc")) {
        const loc = params.get("loc");
        const parts = loc.split("-");
        if (parts.length === 2) {
            currentLocation = {
                shelf: parseInt(parts[0]),
                row: parseInt(parts[1])
            };
            document.getElementById("current-location").innerText =
                `현재 위치: 선반 ${parts[0]} / 줄 ${parts[1]}`;
        }
    }
}


// ---------------------------
// 3. 지도 그리기
// ---------------------------
function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = "16px Arial";
    ctx.textAlign = "center";

    // ===== 계산대 =====
    ctx.fillStyle = "#ffeeee";
    ctx.fillRect(50, 100, 80, 300);
    ctx.strokeRect(50, 100, 80, 300);
    ctx.fillStyle = "#000";
    ctx.fillText("계산대", 90, 250);

    // ===== 입구 표시 =====
    ctx.fillStyle = "#ffffcc";
    ctx.fillRect(300, 20, 100, 30);
    ctx.fillStyle = "#000";
    ctx.fillText("입구", 350, 42);

    ctx.fillStyle = "#ffffcc";
    ctx.fillRect(300, 650, 100, 30);
    ctx.fillStyle = "#000";
    ctx.fillText("입구", 350, 672);

    // ===== 선반 1~10 =====
    for (let i = 1; i <= 10; i++) {
        const pos = shelfPositions[i];

        ctx.fillStyle = "#e8f0ff";
        ctx.fillRect(pos.x - SHELF_WIDTH / 2, pos.y, SHELF_WIDTH, SHELF_HEIGHT);
        ctx.strokeRect(pos.x - SHELF_WIDTH / 2, pos.y, SHELF_WIDTH, SHELF_HEIGHT);

        ctx.fillStyle = "#000";
        ctx.fillText(`${i}번 선반`, pos.x, pos.y - 5);
    }

    // ===== 현재 위치 표시 (파란 점) =====
    if (currentLocation) {
        const pos = shelfPositions[currentLocation.shelf];
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y + SHELF_HEIGHT / 2, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}


// ---------------------------
// 4. 상품 검색 자동완성
// ---------------------------
const input = document.getElementById("search-input");
const autocompleteBox = document.getElementById("autocomplete");

input.addEventListener("input", () => {
    const keyword = input.value.trim();
    autocompleteBox.innerHTML = "";

    if (keyword.length < 1) return;

    const results = productData.filter(p =>
        p.name.includes(keyword)
    );

    results.forEach(item => {
        const div = document.createElement("div");
        div.className = "auto-item";
        div.innerText = item.name;
        div.onclick = () => selectProduct(item);
        autocompleteBox.appendChild(div);
    });
});


// ---------------------------
// 5. 상품 선택 시 지도에 위치 표시
// ---------------------------
function selectProduct(item) {
    autocompleteBox.innerHTML = "";
    input.value = item.name;

    const pos = shelfPositions[item.shelf];

    drawMap();

    // 빨간 점 표시
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(pos.x, pos.y + SHELF_HEIGHT / 2, 10, 0, Math.PI * 2);
    ctx.fill();

    // 거리 계산(선반 번호 차이만 기준)
    let distanceText = "";

    if (currentLocation) {
        const diff = Math.abs(item.shelf - currentLocation.shelf);
        if (diff === 0) {
            distanceText = "현재 위치와 같은 선반입니다!";
        } else {
            distanceText = `현재 위치에서 약 ${diff}칸 떨어져 있습니다.`;
        }
    }

    alert(`${item.name} 위치\n선반 ${item.shelf} / 줄 ${item.row}\n${distanceText}`);
}


// ---------------------------
// 6. 초기 실행
// ---------------------------
getCurrentLocationFromURL();
drawMap();
