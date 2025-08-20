// Protect route (basic)
const lecturerId = localStorage.getItem("userId");
if (!lecturerId) {
  window.location.href = "login.html";
}

const msg = document.getElementById("msg");
const grid = document.getElementById("coursesGrid");
const searchInput = document.getElementById("searchInput");

let allCourses = [];

// Render helpers
function courseCard(course){
  const enrolled = (course.enrolled_count !== undefined && course.enrolled_count !== null)
    ? course.enrolled_count
    : "—";

  const div = document.createElement("article");
  div.className = "card";
  div.innerHTML = `
    <h3 class="title">${escapeHtml(course.name)}</h3>
    <p class="subtitle">Schedule: ${escapeHtml(course.schedule || "—")}</p>

    <div class="meta">
      <span class="badge">👥 Students: ${enrolled}</span>
      <span class="badge">ID: ${course.offer_id}</span>
    </div>

    <div class="actions">
      <button class="btn secondary" data-action="view-students" data-offer="${course.offer_id}">
        View Students
      </button>
      <button class="btn" data-action="manage" data-offer="${course.offer_id}">
        Manage
      </button>
    </div>
  `;
  return div;
}

function renderCourses(list){
  grid.innerHTML = "";
  if (!list || list.length === 0) {
    grid.innerHTML = `<div class="empty">No courses found.</div>`;
    return;
  }
  list.forEach(c => grid.appendChild(courseCard(c)));
}

// Simple escape
function escapeHtml(str){
  if (typeof str !== "string") return String(str ?? "");
  return str.replace(/[&<>"'`=\/]/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;","`":"&#96;","=":"&#61;","/":"&#47;"
  }[s]));
}

// Fetch
async function loadLecturerCourses() {
  try {
    msg.textContent = "Loading courses…";
    const res = await fetch(`http://localhost:3000/api/lecturer-courses/${lecturerId}`);
    const data = await res.json();

    if (!data.success) {
      msg.textContent = "Failed to load courses.";
      renderCourses([]);
      return;
    }

    allCourses = Array.isArray(data.data) ? data.data : [];

    if (allCourses.length === 0) {
      msg.textContent = "";
      renderCourses([]);
      return;
    }

    msg.textContent = "";
    renderCourses(allCourses);
  } catch (err) {
    console.error(err);
    msg.textContent = "Server connection error.";
    renderCourses([]);
  }
}

// Delegated click handlers for buttons on cards
grid.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const offerId = btn.getAttribute("data-offer");
  const action = btn.getAttribute("data-action");

  if (action === "view-students") {
    viewStudents(offerId);
  } else if (action === "manage") {
    goToCourse(offerId);
  }
});

// Search filter
searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
  const filtered = allCourses.filter(c => (c.name || "").toLowerCase().includes(q));
  renderCourses(filtered);
});

// Navigation functions
function viewStudents(offerId) {
  localStorage.setItem("currentOfferId", offerId);
  window.location.href = "lecturer-course-students.html";
}

function goToCourse(offerId) {
  localStorage.setItem("currentOfferId", offerId);
  window.location.href = "course-lecturer-view.html";
}

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// Expose logout for inline onclick
window.logout = logout;

// Init
loadLecturerCourses();
