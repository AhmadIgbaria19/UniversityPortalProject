document.addEventListener("DOMContentLoaded", async () => {
  const studentName = localStorage.getItem("userName") || "Student";
  const studentId   = localStorage.getItem("userId");
  const lastLogin   = localStorage.getItem("userLastLogin");

  // Update welcome (Top box)
  document.getElementById("welcomeName").textContent = studentName;

  // ✅ Update sidebar name as well
  const sidebarNameEl = document.getElementById("sidebarName");
  if (sidebarNameEl) {
    // אם אתה רוצה רק שם פרטי (למשל "Ahmad" מתוך "Ahmad Ali")
    const firstName = studentName.split(" ")[0];
    sidebarNameEl.textContent = firstName;
  }

  // Last login
  document.getElementById("lastLogin").textContent =
    lastLogin ? new Date(lastLogin).toLocaleString() : "N/A";

  const coursesContainer = document.getElementById("myCourses");
  const searchInput = document.getElementById("searchInput");

  if (!studentId) {
    coursesContainer.innerHTML = `<div class="empty">Student ID not found.</div>`;
    return;
  }

  let allCourses = [];

  // Render
  function renderCourses(list){
    coursesContainer.innerHTML = "";
    if (!list || list.length === 0){
      coursesContainer.innerHTML = `<div class="empty">You are not enrolled in any courses yet.</div>`;
      return;
    }
    list.forEach(course => {
      const card = document.createElement("div");
      card.className = "course-card";
      card.innerHTML = `
        <h4>${escapeHtml(course.name)}</h4>
        <p>${escapeHtml(course.lecturer || "")}</p>
        <p class="meta">Schedule: ${escapeHtml(course.schedule || "—")}</p>
      `;
      card.onclick = () => {
        localStorage.setItem("currentOfferId", course.offer_id);
        window.location.href = "course-student-view.html";
      };
      coursesContainer.appendChild(card);
    });
  }

  // Fetch My Courses
  try {
    const res = await fetch(`http://localhost:3000/api/my-courses/${studentId}`);
    const data = await res.json();

    if (!data.success) {
      coursesContainer.innerHTML = `<div class="empty">${escapeHtml(data.message || "Failed to load courses.")}</div>`;
      return;
    }

    allCourses = Array.isArray(data.data) ? data.data : [];
    renderCourses(allCourses);
  } catch (err) {
    console.error("Fetch Error:", err);
    coursesContainer.innerHTML = `<div class="empty">An error occurred while loading courses.</div>`;
  }

  // Search filter
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    const filtered = allCourses.filter(c => (c.name || "").toLowerCase().includes(q));
    renderCourses(filtered);
  });
});

// Logout
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// Simple escape
function escapeHtml(str){
  if (typeof str !== "string") return String(str ?? "");
  return str.replace(/[&<>"'`=\/]/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;","`":"&#96;","=":"&#61;","/":"&#47;"
  }[s]));
}
