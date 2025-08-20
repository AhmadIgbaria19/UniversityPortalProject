window.onload = async () => {
  await loadCourses();
  bindUI();
};

/* ---------- State ---------- */
let allCourses = [];
let currentModalOffer = null;

/* ---------- Load ---------- */
async function loadCourses() {
  setMsg("Loading…");
  try {
    const res  = await fetch("http://localhost:3000/api/admin/courses");
    const data = await res.json();

    if (!data?.success) {
      setMsg("Failed to load courses.", "error");
      return;
    }

    // Support data.courses or data.data
    allCourses = Array.isArray(data.courses) ? data.courses : (Array.isArray(data.data) ? data.data : []);
    setMsg("");

    populateLecturers(allCourses);
    render(filterList());
  } catch (err) {
    console.error("Load courses error:", err);
    setMsg("Server error.", "error");
  }
}

/* ---------- UI ---------- */
function bindUI(){
  document.getElementById("searchInput").addEventListener("input", () => render(filterList()));
  document.getElementById("lecturerFilter").addEventListener("change", () => render(filterList()));
  document.getElementById("exportBtn").addEventListener("click", exportCSV);

  // Modal controls
  document.getElementById("cancelModal").addEventListener("click", closeModal);
  document.getElementById("confirmSeats").addEventListener("click", confirmAddSeats);
}

function populateLecturers(courses){
  const select = document.getElementById("lecturerFilter");
  const set = new Set(courses.map(c => (c.lecturer_name || "").trim()).filter(Boolean));
  const list = Array.from(set).sort((a,b)=>a.localeCompare(b,"en",{sensitivity:"base"}));
  select.innerHTML = `<option value="">All lecturers</option>` + list.map(l => `<option value="${escapeAttr(l)}">${escapeHtml(l)}</option>`).join("");
}

/* ---------- Render ---------- */
function render(list){
  const grid = document.getElementById("cardsGrid");
  const chip = document.getElementById("countChip");
  grid.innerHTML = "";

  if (!list.length){
    grid.innerHTML = `<div class="muted" style="padding:10px;">No courses found.</div>`;
  } else {
    list.forEach(c => grid.appendChild(buildCard(c)));
  }

  chip.textContent = `${list.length} course${list.length === 1 ? "" : "s"}`;
}

function buildCard(course){
  const card = document.createElement("div");
  card.className = "course-card";

  const remaining = Number(course.remaining_seats ?? 0);
  const maxSeats  = Number(course.max_seats ?? 0);
  const low = remaining <= Math.max(1, Math.ceil(maxSeats * 0.1)); // warn if <=10% or <=1

  card.innerHTML = `
    <div class="title">
      <i class="fa-solid fa-book-open" style="color:#93c5fd;"></i>
      <h3>${escapeHtml(course.course_name || "Untitled Course")}</h3>
    </div>
    <div class="muted">Lecturer: ${escapeHtml(course.lecturer_name || "—")}</div>
    <div class="muted">Schedule: ${escapeHtml(course.schedule || "—")}</div>

    <div class="meta">
      <span class="badge ${low ? "warn": ""}" title="Remaining / Max">
        <i class="fa-solid fa-chair"></i> ${remaining} / ${maxSeats}
      </span>
      <span class="badge" title="Offer ID">
        <i class="fa-regular fa-hashtag"></i> ${escapeHtml(String(course.offer_id ?? "—"))}
      </span>
    </div>

    <div class="actions">
      <button class="btn" data-offer="${course.offer_id}" data-action="view">
        <i class="fa-regular fa-rectangle-list"></i> Enrolled
      </button>
      <button class="btn primary" data-offer="${course.offer_id}" data-title="${escapeAttr(course.course_name || "")}" data-action="add">
        <i class="fa-solid fa-plus"></i> Add Seats
      </button>
    </div>
  `;

  // Bind buttons
  const viewBtn = card.querySelector('[data-action="view"]');
  const addBtn  = card.querySelector('[data-action="add"]');

  viewBtn.addEventListener("click", () => viewStudents(course.offer_id));
  addBtn.addEventListener("click", () => openModal(course.offer_id, course.course_name || "Course"));

  return card;
}

/* ---------- Filters ---------- */
function filterList(){
  const q = (document.getElementById("searchInput").value || "").trim().toLowerCase();
  const lf= document.getElementById("lecturerFilter").value;

  return allCourses.filter(c => {
    const matchText =
      (c.course_name || "").toLowerCase().includes(q) ||
      (c.lecturer_name || "").toLowerCase().includes(q) ||
      (c.schedule || "").toLowerCase().includes(q);

    const matchLecturer = lf ? String(c.lecturer_name || "").toLowerCase() === lf.toLowerCase() : true;

    return matchText && matchLecturer;
  });
}

/* ---------- Navigation (kept exactly) ---------- */
function viewStudents(offerId){
  localStorage.setItem("currentOfferId", offerId);
  window.location.href = "course-students.html";
}

/* ---------- Add seats ---------- */
function openModal(offerId, title){
  currentModalOffer = offerId;
  document.getElementById("modalCourseTitle").textContent = title;
  document.getElementById("seatsInput").value = "";
  document.getElementById("seatsModal").hidden = false;
}
function closeModal(){
  document.getElementById("seatsModal").hidden = true;
  currentModalOffer = null;
}

async function confirmAddSeats(){
  const numRaw = document.getElementById("seatsInput").value.trim();
  const toAdd = parseInt(numRaw, 10);
  if (!toAdd || isNaN(toAdd) || toAdd < 1) {
    alert("Please enter a valid positive number.");
    return;
  }
  const offerId = currentModalOffer;
  if (!offerId) return;

  try {
    const res = await fetch(`http://localhost:3000/api/admin/add-seats/${offerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addSeats: toAdd })
    });
    const data = await res.json();
    if (data?.success) {
      closeModal();
      alert("Seats updated successfully.");
      await loadCourses();
    } else {
      alert(data?.message || "Failed to update seats.");
    }
  } catch (err) {
    console.error("Add seats error:", err);
    alert("Server error.");
  }
}

/* ---------- Export ---------- */
function exportCSV(){
  const list = filterList();
  const rows = [["Course Name","Lecturer","Schedule","Remaining","Max","Offer ID"]];
  list.forEach(c => rows.push([
    c.course_name || "",
    c.lecturer_name || "",
    c.schedule || "",
    c.remaining_seats ?? "",
    c.max_seats ?? "",
    c.offer_id ?? ""
  ]));

  const csv = "\uFEFF" + rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "courses.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------- Utils ---------- */
function setMsg(text, type=""){ const el = document.getElementById("msg"); el.textContent = text; el.className = `msg ${type}`; }
function escapeHtml(str){ if (typeof str !== "string") return String(str ?? ""); return str.replace(/[&<>"'`=\/]/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;","`":"&#96;","=":"&#61;","/":"&#47;"}[s])); }
function escapeAttr(str){ return String(str ?? "").replace(/"/g, "&quot;"); }
