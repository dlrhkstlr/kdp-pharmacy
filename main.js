// main.js

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("mapCanvas");
  const ctx = canvas.getContext("2d");

  const currentLocationText = document.getElementById("current-location");
  const searchInput = document.getElementById("search-input");
  const autocompleteBox = document.getElementById("autocomplete");

  // 매장 크기 (캔버스 크기 기준)
  const STORE_WIDTH = canvas.width;
  const STORE_HEIGHT = canvas.height;

  const SHELF_COUNT = 10;   // 선반 1~10번
  const ROW_COUNT = 4;      // 줄 1~4

  // 선반 위치 계산
  function getShelfPosition(shelf, row) {
    // 좌우 여백, 위쪽 시작 위치
    const marginX = 40;
    const marginY = 90;

    const shelfWidth = 18;   // 선반 두께
    const shelfHeight = 55;  // 각 줄 높이
    const gapX =
      (STORE_WIDTH - marginX * 2 - shelfWidth * SHELF_COUNT) /
      (SHELF_COUNT - 1);
    const gapY = 20; // 줄 간격

    const x =
      marginX + (shelf - 1) * (shelfWidth + gapX) + shelfWidth / 2;
    const y =
      marginY + (row - 1) * (shelfHeight + gapY) + shelfHeight / 2;

    return { x, y, shelfWidth, shelfHeight };
  }

  // ===== 현재 위치: QR 파라미터에서만 읽기 =====
  let currentShelf = null;
  let currentRow = null;

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

    if (
      !shelf ||
      !row ||
      shelf < 1 ||
      shelf > SHELF_COUNT ||
      row < 1 ||
      row > ROW_COUNT
    ) {
      currentShelf = null;
      currentRow = null;
      currentLocationText.textContent =
        "현재 위치: 알 수 없음 (QR 정보 오류)";
      return;
    }

    currentShelf = shelf;
    currentRow = row;
    currentLocationText.textContent = `현재 위치: ${shelf}번 선반, ${row}줄`;
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
        const { x, y, shelfWidth, shelfHeight } = getShelfPosition(
          s,
          r
        );
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

    // 선택된 약품 (빨간 점)
    if (focusedMedicine) {
      const { x, y } = getShelfPosition(
        focusedMedicine.shelf,
        focusedMedicine.row
      );
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#ff3b3b";
      ctx.fill();
    }
  }

  // ===== 약품 검색 / 자동완성 =====

  // data.js 에서 제공되는 배열
  // 예: const medicines = [{ name:"타이레놀", shelf:3, row:2, position:1 }, ...];

  function searchMedicines(keyword) {
    keyword = keyword.trim();
    if (!keyword) return [];
    const lower = keyword.toLowerCase();
    if (!Array.isArray(window.medicines)) return [];
    return window.medicines.filter((m) =>
      m.name.toLowerCase().includes(lower)
    );
  }

  function renderAutocomplete(list) {
    autocompleteBox.innerHTML = "";
    if (!list.length) {
      autocompleteBox.style.display = "none";
      return;
    }

    list.forEach((item) => {
      const div = document.createElement("div");
      div.className = "autocomplete-item";
      div.textContent = `${item.name} (선반 ${item.shelf}, 줄 ${item.row})`;
      div.addEventListener("click", () => {
        focusOnMedicine(item);
        autocompleteBox.innerHTML = "";
        autocompleteBox.style.display = "none";
        searchInput.value = item.name;
      });
      autocompleteBox.appendChild(div);
    });

    autocompleteBox.style.display = "block";
  }

  let focusedMedicine = null;

  function focusOnMedicine(med) {
    focusedMedicine = med;
    drawMap();
  }

  searchInput.addEventListener("input", () => {
    const keyword = searchInput.value;
    const res = searchMedicines(keyword);
    renderAutocomplete(res);
  });

  // ===== 초기 실행 =====
  updateCurrentLocationFromQR();
  drawMap();
});
