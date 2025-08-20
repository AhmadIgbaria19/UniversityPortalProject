const grid = document.getElementById("coursesGrid");
const msg  = document.getElementById("msg");
const searchInput = document.getElementById("searchInput");
const lecturerFilter = document.getElementById("lecturerFilter");

let allCourses = [];
let enrolledIds = new Set();

init();

async function init(){
  const studentId = localStorage.getItem("userId");
  if (!studentId){
    message("Student ID not found.", true);
    render([]);
    return;
  }
  message("Loading courses…");

  try {
    const [coursesRes, myRes] = await Promise.all([
      fetch("http://localhost:3000/api/courses"),
      fetch(`http://localhost:3000/api/my-courses/${studentId}`)
    ]);

    const coursesData = await coursesRes.json().catch(() => ({success:false}));
    const myData      = await myRes.json().catch(() => ({success:false, data:[]}));

    if (!coursesData.success){
      message("Failed to load available courses.", true);
      render([]);
      return;
    }

    allCourses = Array.isArray(coursesData.data) ? coursesData.data : [];
    const myList = Array.isArray(myData.data) ? myData.data : [];
    enrolledIds = new Set(myList.map(c => c.offer_id));

    // Build lecturer filter options
    buildLecturerFilter(allCourses);

    message("");       // clear
    render(allCourses);

    // Wire up search/filter
    searchInput.addEventListener("input", handleFilter);
    lecturerFilter.addEventListener("change", handleFilter);

  } catch (err) {
    console.error(err);
    message("An error occurred while connecting to the server.", true);
    render([]);
  }
}

/* ---------- UI Rendering ---------- */
function render(list){
  grid.innerHTML = "";
  if (!list || list.length === 0){
    grid.innerHTML = `<div class="empty">No courses available for registration at the moment.</div>`;
    return;
  }

  list.forEach(course => {
    const card = document.createElement("article");
    card.className = "card";
    const isEnrolled = enrolledIds.has(course.offer_id);
    const seatsLeft = Number(course.remaining_seats ?? 0);
    const price = Number(course.price ?? 0);
    const full = seatsLeft <= 0 && !isEnrolled;

    // progress (assumes we don’t know total seats → show relative by remaining only)
    const progressPct = clamp( (seatsLeft <= 0 ? 0 : seatsLeft) / Math.max(seatsLeft, 1) * 100 );

    card.innerHTML = `
      <h3 class="title">${escapeHtml(course.name)}</h3>
      <p class="subtitle">Schedule: ${escapeHtml(course.schedule || "—")}</p>

      <div class="badges">
        <span class="badge">👨‍🏫 ${escapeHtml(course.lecturer || "—")}</span>
        <span class="badge">💲 ${formatPrice(price)}</span>
        <span class="badge">${full ? "⛔ Full" : `🪑 Seats: ${seatsLeft}`}</span>
      </div>

      <div class="seats" aria-label="Remaining seats">
        <div class="progress"><span style="width:${progressPct}%"></span></div>
      </div>

      <div class="actions">
        ${full ? `<button class="btn" disabled>Register</button>` :
                 `<button class="btn ${isEnrolled ? "danger" : "success"}" data-offer="${course.offer_id}" data-enrolled="${isEnrolled ? 1 : 0}">
                    ${isEnrolled ? "Cancel" : "Register"}
                  </button>`}
      </div>
    `;

    // Wire button if enabled
    const btn = card.querySelector("button[data-offer]");
    if (btn){
      btn.addEventListener("click", async () => {
        const offerId = Number(btn.getAttribute("data-offer"));
        const isEnrolledNow = btn.getAttribute("data-enrolled") === "1";
        await toggleEnrollment(offerId, isEnrolledNow);
      });
    }

    grid.appendChild(card);
  });
}

/* ---------- Actions ---------- */
async function toggleEnrollment(offerId, isEnrolled){
  const studentId = localStorage.getItem("userId");
  if (!studentId) return;

  try {
    const res = await fetch("http://localhost:3000/api/enroll", {
      method: isEnrolled ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId, offer_id: offerId })
    });

    const data = await res.json();
    message(data.message || (isEnrolled ? "Canceled." : "Registered."));

    if (data.success){
      // Refresh both lists
      await refreshEnrollment(studentId);
      // Update opener tab if exists
      updateOtherPagesIfOpen();
      // Re-apply current filters
      handleFilter();
    }
  } catch (e) {
    console.error(e);
    message("Failed to update enrollment.", true);
  }
}

async function refreshEnrollment(studentId){
  try{
    const resMy = await fetch(`http://localhost:3000/api/my-courses/${studentId}`);
    const myData = await resMy.json();
    const myList = Array.isArray(myData.data) ? myData.data : [];
    enrolledIds = new Set(myList.map(c => c.offer_id));
  }catch(e){
    console.error(e);
  }
}

function updateOtherPagesIfOpen() {
  if (window.opener && !window.opener.closed) {
    window.opener.location.reload();
  }
}

/* ---------- Filters ---------- */
function handleFilter(){
  const q = (searchInput.value || "").trim().toLowerCase();
  const lec = lecturerFilter.value || "";

  const filtered = allCourses.filter(c => {
    const nameOk = (c.name || "").toLowerCase().includes(q);
    const lecOk  = !lec || String(c.lecturer || "").toLowerCase() === lec;
    return nameOk && lecOk;
  });

  render(filtered);
}

function buildLecturerFilter(list){
  const names = Array.from(new Set(
    list.map(c => String(c.lecturer || "").trim()).filter(Boolean)
  ));
  names.sort((a,b)=>a.localeCompare(b));
  names.forEach(n => {
    const opt = document.createElement("option");
    opt.value = n.toLowerCase();
    opt.textContent = n;
    lecturerFilter.appendChild(opt);
  });
}

/* ---------- Utils ---------- */
function message(text, isError=false){
  if (!msg) return;
  msg.textContent = text || "";
  msg.style.color = isError ? "#ffb4b4" : "var(--muted)";
}

function escapeHtml(str){
  if (typeof str !== "string") return String(str ?? "");
  return str.replace(/[&<>"'`=\/]/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;","`":"&#96;","=":"&#61;","/":"&#47;"
  }[s]));
}

function formatPrice(num){
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", { style:"currency", currency:"ILS", maximumFractionDigits:0 }).format(num);
}

function clamp(v){ return Math.max(0, Math.min(100, v)); }

/* Back */
function goBack(){ window.location.href = "student-dashboard.html"; }
window.goBack = goBack;
