document.addEventListener("DOMContentLoaded", async () => {
  const tableBody   = document.querySelector("#gradesTable tbody");
  const noGradesMsg = document.getElementById("noGrades");
  const userId      = localStorage.getItem("userId");
  const searchInput = document.getElementById("searchInput");
  const lecturerSel = document.getElementById("lecturerFilter");
  const avgChip     = document.getElementById("avgChip");

  if (!userId){
    noGradesMsg.textContent = "Student ID not found.";
    noGradesMsg.style.display = "block";
    return;
  }

  showSkeleton(tableBody);

  let allGrades = [];

  try {
    const res  = await fetch(`http://localhost:3000/api/grades/${userId}`);
    const data = await res.json();

    if (!data.success) {
      noGradesMsg.textContent = "Failed to load data.";
      noGradesMsg.style.display = "block";
      tableBody.innerHTML = "";
      return;
    }

    allGrades = Array.isArray(data.data) ? data.data : [];

    if (allGrades.length === 0) {
      noGradesMsg.style.display = "block";
      tableBody.innerHTML = "";
      setAverage(allGrades, avgChip);
      return;
    }

    noGradesMsg.style.display = "none";
    buildLecturerFilter(allGrades, lecturerSel);
    render(allGrades, tableBody);
    setAverage(allGrades, avgChip);

    // filters
    searchInput.addEventListener("input", () => applyFilters());
    lecturerSel.addEventListener("change", () => applyFilters());

  } catch (err) {
    console.error(err);
    noGradesMsg.textContent = "An error occurred while connecting to the server.";
    noGradesMsg.style.display = "block";
    tableBody.innerHTML = "";
  }

  function applyFilters(){
    const q   = (searchInput.value || "").trim().toLowerCase();
    const lec = (lecturerSel.value || "").toLowerCase();

    const filtered = allGrades.filter(g => {
      const nameOk = (g.name || "").toLowerCase().includes(q);
      const lecOk  = !lec || String(g.lecturer || "").toLowerCase() === lec;
      return nameOk && lecOk;
    });

    render(filtered, tableBody);
    setAverage(filtered, avgChip);
    noGradesMsg.style.display = filtered.length ? "none" : "block";
  }
});

/* ---------- render ---------- */
function render(list, tbody){
  tbody.innerHTML = "";
  if (!list || !list.length) return;

  list.forEach(item => {
    const grade = normalizeGrade(item.grade);
    const { label, cls } = gradeToChip(grade);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.lecturer)}</td>
      <td><span class="grade-chip ${cls}">${label}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

/* ---------- helpers ---------- */
function normalizeGrade(g){
  if (g === null || g === undefined || g === "") return null;
  const n = Number(g);
  return Number.isFinite(n) ? n : null;
}
function gradeToChip(grade){
  if (grade === null) return { label: "Not yet assigned", cls:"pending" };
  // threshold: pass >= 60, warn: 50–59 (optional), fail < 50 or <60?
  if (grade >= 60) return { label: `${grade}`, cls:"pass" };
  if (grade >= 50) return { label: `${grade}`, cls:"warn" };
  return { label: `${grade}`, cls:"fail" };
}

function setAverage(list, el){
  if (!el) return;
  const nums = list.map(x => normalizeGrade(x.grade)).filter(n => n !== null);
  if (!nums.length){ el.textContent = "Average: —"; return; }
  const avg = Math.round(nums.reduce((a,b)=>a+b,0) / nums.length);
  el.textContent = `Average: ${avg}`;
}

function buildLecturerFilter(list, select){
  if (!select) return;
  const names = Array.from(new Set(list.map(x => String(x.lecturer || "").trim()).filter(Boolean)));
  names.sort((a,b)=>a.localeCompare(b));
  names.forEach(n => {
    const opt = document.createElement("option");
    opt.value = n.toLowerCase();
    opt.textContent = n;
    select.appendChild(opt);
  });
}

function escapeHtml(str){
  if (typeof str !== "string") return String(str ?? "");
  return str.replace(/[&<>"'`=\/]/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;","`":"&#96;","=":"&#61;","/":"&#47;"
  }[s]));
}

function showSkeleton(tbody){
  tbody.innerHTML = "";
  for (let i=0;i<3;i++){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><div class="skel"></div></td>
      <td><div class="skel"></div></td>
      <td><div class="skel"></div></td>
    `;
    tbody.appendChild(tr);
  }
}

function goBack(){ window.location.href = "student-dashboard.html"; }
window.goBack = goBack;
