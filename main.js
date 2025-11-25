// main.js

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("mapCanvas");
  const ctx = canvas.getContext("2d");
  const currentLocationText = document.getElementById("current-location");

  const searchInput = document.getElementById("search-input");
  const resultText = document.getElementById("result-text");

  const STORE_WIDTH = canvas.width;
  const STORE_HEIGHT = canvas.height;

  const SHELF_COUNT = 10;  // 선반 1~10번
  const ROW_COUNT = 4;     // 줄 1~4

  let currentShelf = null;
  let currentRow = null;
  let targetMedicine = null; // 검색으로 찾은 약(빨간 점)

  // ===== QR 파라미터에서 현재 위치 읽기 =====
  function updateCurrentLocationFromQR() {
    const params = new URLSearchParams(window.location.search);
    const loc = params.get("loc");

    if (!loc) {
      currentShelf = null;
      currentRow = null;
      currentLocationText.textContent =
        "현재 위치: QR 코드를 스캔하면 표시됩니다.";
      return;
    }

    const [shelfStr, rowStr] = loc.split("-");
    const shelf = Number(shelfStr);
    const row = Number(rowStr);

    if (!shelf || !row || shelf < 1 || shelf > SHELF_COUNT || row < 1 || row > ROW_COUNT) {
      currentShelf = null;
      currentRow = null;
      currentLocationText.textContent = "현재 위치: 알 수 없음 (QR 정보 오류)";
      return;
    }

    currentShelf = shelf;
    currentRow = row;
    currentLocationText.textContent = `현재 위치: ${shelf}번 선반, ${row}줄`;
  }

  // ===== 선반 좌표 계산 =====
  function getShelfPosition(shelf, row) {
    const marginX = 40;
    const marginY = 90;

    const shelfWidth = 18;    // 선반 두께
    const shelfHeight = 55;   // 줄 높이
    const gapX =
      (STORE_WIDTH - marginX * 2 - shelfWidth * SHELF_COUNT) /
      (SHELF_COUNT - 1);
    const gapY = 20;

    const x = marginX + (shelf - 1) * (shelfWidth + gapX) + shelfWidth / 2;
    const y = marginY + (row - 1) * (shelfHeight + gapY) + shelfHeight / 2;

    return { x, y, shelfWidth, shelfHeight };
  }

  // ===== 지도 그리기 =====
  function drawMap() {
    // 배경
    ctx.clearRect(0, 0, STORE_WIDTH, STORE_HEIGHT);
    ctx.fillStyle = "#f5f5ff";
    ctx.fillRect(0, 0, STORE_WIDTH, STORE_HEIGHT);

    // 매장 테두리
    ctx.strokeStyle = "#144a9e";
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, STORE_WIDTH - 20, STORE_HEIGHT - 20);

    // 계산대 (왼쪽)
    ctx.fillStyle = "#ffe066";
    ctx.fillRect(25, 100, 50, 200);
    ctx.fillStyle = "#333";
    ctx.font = "14px sans-serif";
    ctx.fillText("계산대", 30, 90);

    // 입구 (위, 아래)
    ctx.fillStyle = "#ffe066";
    ctx.fillRect(STORE_WIDTH - 150, 20, 120, 30); // 위쪽 입구
    ctx.fillRect(
      STORE_WIDTH / 2 - 120,
      STORE_HEIGHT - 50,
      240,
      30
    ); // 아래 입구

    ctx.fillStyle = "#333";
    ctx.font = "14px sans-serif";
    ctx.fillText("입구", STORE_WIDTH - 115, 42);
    ctx.fillText("입구", STORE_WIDTH / 2 - 15, STORE_HEIGHT - 30);

    // 선반들 (회색 막대)
    ctx.fillStyle = "#bbbbbb";
    for (let s = 1; s <= SHELF_COUNT; s++) {
      for (let r = 1; r <= ROW_COUNT; r++) {
        const { x, y, shelfWidth, shelfHeight } = getShelfPosition(s, r);
        ctx.fillRect(
          x - shelfWidth / 2,
          y - shelfHeight / 2,
          shelfWidth,
          shelfHeight
        );
      }
    }

    // 선반 번호 표시 (아래쪽)
    ctx.fillStyle = "#333";
    ctx.font = "12px sans-serif";
    for (let s = 1; s <= SHELF_COUNT; s++) {
      const { x } = getShelfPosition(s, ROW_COUNT);
      ctx.fillText(`${s}번`, x - 10, STORE_HEIGHT - 20);
    }

    // 현재 위치 (파란 점)
    if (currentShelf && currentRow) {
      const { x, y } = getShelfPosition(currentShelf, currentRow);
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#007bff";
      ctx.fill();
    }

    // 선택된 약품(검색 결과) 위치 (빨간 점)
    if (targetMedicine) {
      const { x, y } = getShelfPosition(targetMedicine.shelf, targetMedicine.row);
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#ff3b3b";
      ctx.fill();
    }
  }

  // ===== 검색 관련 =====

  function normalize(text) {
    return (text || "")
      .toString()
      .toLowerCase()
      .replace(/\s+/g, ""); // 공백 제거 (타 이 레 놀 → 타이레놀)
  }

  function searchMedicines(keyword) {
    keyword = keyword.trim();
    if (!keyword) return [];

    const q = normalize(keyword);
    const meds = Array.isArray(window.medicines) ? window.medicines : [];

    return meds.filter((m) => {
      const nameN = normalize(m.name);
      const genericN = normalize(m.generic || "");
      const companyN = normalize(m.company || "");
      const tagsN = (m.tags || []).map(normalize);

      if (nameN.includes(q)) return true;        // 약 이름
      if (genericN.includes(q)) return true;     // 성분명
      if (companyN.includes(q)) return true;     // 회사명
      if (tagsN.some((t) => t.includes(q))) return true; // 태그(해열제, 소화제, 두통 등)

      return false;
    });
  }

  function describeDirection(fromShelf, fromRow, toShelf, toRow) {
    if (!fromShelf || !fromRow) {
      return `위치: ${toShelf}번 선반, ${toRow}줄입니다.`;
    }

    const diffShelf = toShelf - fromShelf; // + 오른쪽, - 왼쪽
    const diffRow = toRow - fromRow;       // + 아래, - 위

    const parts = [];
    if (diffShelf > 0) parts.push(`오른쪽으로 ${diffShelf}칸`);
    if (diffShelf < 0) parts.push(`왼쪽으로 ${Math.abs(diffShelf)}칸`);
    if (diffRow > 0)   parts.push(`아래쪽으로 ${diffRow}줄`);
    if (diffRow < 0)   parts.push(`위쪽으로 ${Math.abs(diffRow)}줄`);

    if (parts.length === 0) return "현재 서 있는 위치입니다.";
    return `현재 위치에서 ${parts.join(", ")} 입니다.`;
  }

  function handleSearch() {
    const keyword = searchInput.value;
    const results = searchMedicines(keyword);

    if (!keyword.trim()) {
      targetMedicine = null;
      if (resultText) resultText.textContent = "약품을 검색하면 위치 안내가 표시됩니다.";
      drawMap();
      return;
    }

    if (!results.length) {
      targetMedicine = null;
      if (resultText) resultText.textContent = "검색 결과가 없습니다.";
      drawMap();
      return;
    }

    // 일단 첫 번째 결과만 사용
    const med = results[0];
    targetMedicine = med;

    const dir = describeDirection(currentShelf, currentRow, med.shelf, med.row);
    if (resultText) {
      resultText.textContent =
        `${med.name}: ${med.shelf}번 선반, ${med.row}줄 (${dir})`;
    }

    drawMap();
  }

  // 엔터로 검색
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    });
  }

  // ===== 초기 실행 =====
  updateCurrentLocationFromQR();
  drawMap();
});
