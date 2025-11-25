// =====================================================================
// 검단태평양약국 매장 지도 + 상품 검색 통합 스크립트 (tags 검색 + 사람모양 현재위치, 강조 버전)
// =====================================================================

// ---------------------------
// 1. 캔버스 설정
// ---------------------------
const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");

// 선반 크기
const SHELF_WIDTH = 300;
const SHELF_HEIGHT = 30;

// 현재 QR 위치값 (?loc=선반-줄)
let currentLocation = null;


// ---------------------------
// 2. URL 파라미터로 loc 읽기
//    예: ?loc=3-2 → 선반3 / 줄2
// ---------------------------
function getCurrentLocationFromURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("loc")) {
    const loc = params.get("loc");
    const [shelf, row] = loc.split("-").map(Number);

    if (!isNaN(shelf) && !isNaN(row)) {
      currentLocation = { shelf, row };

      const info = document.getElementById("current-location");
      if (info) {
        info.textContent = `현재 위치: ${shelf}번 선반, ${row}줄`;
      }
    }
  }
}


// ---------------------------
// 3. 매장 지도 그리기
// ---------------------------
function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = "16px Arial";
  ctx.textAlign = "center";

  // ===== 계산대 (왼쪽 세로) =====
  ctx.fillStyle = "#ffe4e1";
  ctx.fillRect(40, 100, 90, 300);
  ctx.strokeRect(40, 100, 90, 300);
  ctx.fillStyle = "#000";
  ctx.fillText("계산대", 85, 250);

  // ===== 입구 (위) =====
  ctx.fillStyle = "#f9f9b0";
  ctx.fillRect(250, 20, 140, 30);
  ctx.strokeRect(250, 20, 140, 30);
  ctx.fillStyle = "#000";
  ctx.fillText("입구", 320, 42);

  // ===== 입구 (아래) =====
  ctx.fillStyle = "#f9f9b0";
  ctx.fillRect(250, 650, 140, 30);
  ctx.strokeRect(250, 650, 140, 30);
  ctx.fillStyle = "#000";
  ctx.fillText("입구", 320, 672);

  // ===== 선반 1~10 표시 =====
  for (let i = 1; i <= 10; i++) {
    const pos = shelfPositions[i];
    if (!pos) continue;

    // 선반 본체
    ctx.fillStyle = "#e7f0ff";
    ctx.fillRect(pos.x - SHELF_WIDTH / 2, pos.y, SHELF_WIDTH, SHELF_HEIGHT);
    ctx.strokeRect(pos.x - SHELF_WIDTH / 2, pos.y, SHELF_WIDTH, SHELF_HEIGHT);

    // 선반 번호
    ctx.fillStyle = "#000";
    ctx.fillText(`${i}번 선반`, pos.x, pos.y - 8);

    // 선반의 줄(row) 1~4 표시
    ctx.font = "12px Arial";
    ctx.fillStyle = "#444";
    const baseX = pos.x - SHELF_WIDTH / 2 + 30;
    for (let r = 1; r <= 4; r++) {
      ctx.fillText(`줄${r}`, baseX + (r - 1) * 70, pos.y + 22);
    }
    ctx.font = "16px Arial";
  }

  // ===== 현재 위치 표시 (사람 모양 + 흰 동그라미 배경) =====
  if (currentLocation) {
    const pos = shelfPositions[currentLocation.shelf];
    if (pos) {
      const cx = pos.x;
      const cy = pos.y + SHELF_HEIGHT / 2;

      // 배경 원 (흰색 + 테두리)
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#0044cc";
      ctx.stroke();

      // 머리
      ctx.beginPath();
      ctx.arc(cx, cy - 8, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#0044cc";
      ctx.fill();

      // 몸통 (삼각형)
      ctx.beginPath();
      ctx.moveTo(cx, cy - 2);
      ctx.lineTo(cx - 7, cy + 10);
      ctx.lineTo(cx + 7, cy + 10);
      ctx.closePath();
      ctx.fillStyle = "#0044cc";
      ctx.fill();

      // 다리
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy + 10);
      ctx.lineTo(cx - 3, cy + 18);
      ctx.moveTo(cx + 3, cy + 10);
      ctx.lineTo(cx + 3, cy + 18);
      ctx.strokeStyle = "#0044cc";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}


// ---------------------------
// 4. 검색 자동완성 기능
// ---------------------------
const input = document.getElementById("search-input");
const autocompleteBox = document.getElementById("autocomplete");

input.addEventListener("input", () => {
  const keyword = input.value.trim();
  autocompleteBox.innerHTML = "";

  if (keyword.length === 0) {
    // 입력이 없으면 목록 숨김
    autocompleteBox.style.display = "none";
    return;
  }

  // name + tags 기반 검색
  const results = productData.filter(p => {
    const kw = keyword.trim();
    if (!kw) return false;

    const inName = p.name && p.name.includes(kw);
    const inTags =
      Array.isArray(p.tags) &&
      p.tags.some(tag => typeof tag === "string" && tag.includes(kw));

    return inName || inTags;
  });

  if (results.length === 0) {
    autocompleteBox.style.display = "none";
    return;
  }

  results.forEach(item => {
    const div = document.createElement("div");
    div.className = "auto-item";
    div.innerText = item.name;
    div.onclick = () => selectProduct(item);
    autocompleteBox.appendChild(div);
  });

  autocompleteBox.style.display = "block";
});


// ---------------------------
// 5. 검색 선택 시 지도에 표시
// ---------------------------
function selectProduct(item) {
  autocompleteBox.innerHTML = "";
  autocompleteBox.style.display = "none";
  input.value = item.name;

  const pos = shelfPositions[item.shelf];

  drawMap();

  if (pos) {
    // 빨간 점 표시 (상품 위치)
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(pos.x, pos.y + SHELF_HEIGHT / 2, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // 거리 계산 (선반 번호 기준 단순 차이)
  let message = `${item.name}\n위치: ${item.shelf}번 선반 / ${item.row}줄`;

  if (currentLocation) {
    const diff = Math.abs(item.shelf - currentLocation.shelf);

    if (diff === 0) {
      message += "\n(현재 위치와 같은 선반입니다!)";
    } else {
      message += `\n현재 위치에서 선반 기준으로 약 ${diff}칸 떨어져 있습니다.`;
    }
  }

  alert(message);
}


// ---------------------------
// 6. 초기 실행
// ---------------------------
getCurrentLocationFromURL();
drawMap();
