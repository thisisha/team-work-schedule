// ✅ Firebase NPM SDK 기반 팀 시간표 코드 (team-schedule.js)

import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDj94ptbF8ZoXLRZz3vbTZY6UQAhEIOgNw",
  authDomain: "team-work-schedule.firebaseapp.com",
  databaseURL: "https://team-work-schedule-default-rtdb.firebaseio.com",
  projectId: "team-work-schedule",
  storageBucket: "team-work-schedule.firebasestorage.app",
  messagingSenderId: "888817683956",
  appId: "1:888817683956:web:3468cc140b5bfdcb4f7da1",
  measurementId: "G-WHD03RQJYH"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentUser = null;
const selectedCells = new Set();
const cellElements = {};
const allCellRefs = {};
const colorPalette = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const colors = {};

function getColor(name) {
  if (!colors[name]) {
    colors[name] = colorPalette[Object.keys(colors).length % colorPalette.length];
  }
  return colors[name];
}

function registerUser(name) {
  if (!name) throw new Error("이름이 필요합니다.");
  currentUser = name;
}

function toggleCell(key) {
  if (!currentUser) return;
  if (selectedCells.has(key)) {
    selectedCells.delete(key);
  } else {
    selectedCells.add(key);
  }
  updateCellDisplay(key);
}

function updateCellDisplay(key) {
  const cell = cellElements[key];
  const users = new Set(allCellRefs[key] || []);
  if (selectedCells.has(key)) {
    users.add(currentUser);
  } else {
    users.delete(currentUser);
  }
  allCellRefs[key] = Array.from(users);

  cell.innerHTML = "";
  allCellRefs[key].forEach(name => {
    const label = document.createElement("span");
    label.className = "name-label";
    label.style.backgroundColor = getColor(name);
    label.textContent = name;
    cell.appendChild(label);
    cell.appendChild(document.createElement("br"));
  });
}

function saveToFirebase() {
  selectedCells.forEach(key => {
    set(ref(db, `schedule/${key}/${currentUser}`), true);
  });
  alert("저장 완료!");
}

function clearMySchedule() {
  if (!currentUser) return;
  const updates = {};
  for (let h = 0; h < 24; h++) {
    for (let d = 0; d < 7; d++) {
      updates[`schedule/${d}-${h}/${currentUser}`] = null;
    }
  }
  update(ref(db), updates);
  alert("삭제 완료!");
  location.reload();
}

function loadRealtimeUpdates(key, cell) {
  onValue(ref(db, `schedule/${key}`), snapshot => {
    const data = snapshot.val();
    const users = data ? Object.keys(data) : [];
    allCellRefs[key] = users;
    cell.innerHTML = "";
    users.forEach(name => {
      const label = document.createElement("span");
      label.className = "name-label";
      label.style.backgroundColor = getColor(name);
      label.textContent = name;
      cell.appendChild(label);
      cell.appendChild(document.createElement("br"));
    });
  });
}

export function createSchedule(container, nameInput, registerBtn, saveBtn, clearBtn) {
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  table.appendChild(thead);
  table.appendChild(tbody);
  table.style.borderCollapse = "collapse";
  table.style.margin = "0 auto";

  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `<th>시간</th><th>일</th><th>월</th><th>화</th><th>수</th><th>목</th><th>금</th><th>토</th>`;
  thead.appendChild(headerRow);

  for (let h = 0; h < 24; h++) {
    const row = document.createElement("tr");
    const timeCell = document.createElement("th");
    timeCell.textContent = `${String(h).padStart(2, '0')}:00`;
    row.appendChild(timeCell);

    for (let d = 0; d < 7; d++) {
      const key = `${d}-${h}`;
      const cell = document.createElement("td");
      cell.style.border = "1px solid #ccc";
      cell.style.height = "50px";
      cell.style.width = "80px";
      cell.dataset.key = key;

      cell.addEventListener("mousedown", () => toggleCell(key));
      cellElements[key] = cell;
      loadRealtimeUpdates(key, cell);
      row.appendChild(cell);
    }
    tbody.appendChild(row);
  }

  container.appendChild(table);
  registerBtn.addEventListener("click", () => {
    try {
      registerUser(nameInput.value);
      alert(`${currentUser}님 등록 완료`);
    } catch (err) {
      alert(err.message);
    }
  });
  saveBtn.addEventListener("click", saveToFirebase);
  clearBtn.addEventListener("click", clearMySchedule);
}
