window.onload = async () => {
  bindUI();
  await loadStudents();
};

let allStudents = [];

function bindUI(){
  const search = document.getElementById("searchInput");
  search.addEventListener("input", renderFiltered);
}

async function loadStudents(){
  setMsg("Loading…");
  try {
    const res = await fetch("http://localhost:3000/api/admin/students");
    const data = await res.json();

    if (!data?.success || !Array.isArray(data.students)){
      setMsg("Failed to load students.");
      return;
    }
    allStudents = data.students;
    setMsg("");
    renderFiltered();
  } catch (e){
    console.error(e);
    setMsg("Server error.");
  }
}

function renderFiltered(){
  const q = (document.getElementById("searchInput").value || "").toLowerCase().trim();
  const filtered = !q ? allStudents : allStudents.filter(s =>
    (s.full_name || "").toLowerCase().includes(q) ||
    (s.email || "").toLowerCase().includes(q)
  );
  renderTable(filtered);
}

function renderTable(list){
  const tbody = document.querySelector("#studentsTable tbody");
  const chip  = document.getElementById("countChip");
  tbody.innerHTML = "";
  chip.textContent = `${list.length}`;

  if (!list.length){
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="3" style="color:#94a3b8;">No students found.</td>`;
    tbody.appendChild(tr);
    return;
  }

  list.forEach(student => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(student.full_name)}</td>
      <td>${escapeHtml(student.email)}</td>
      <td>
        <div class="actions">
          <button class="btn primary" onclick="viewStudentCourses(${student.id})">
            <i class="fa-regular fa-rectangle-list"></i> Courses
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function viewStudentCourses(studentId){
  localStorage.setItem("currentStudentId", studentId);
  window.location.href = "student-courses.html";
}

function setMsg(text){ document.getElementById("msg").textContent = text || ""; }
function escapeHtml(str){ if (typeof str !== "string") return String(str ?? ""); return str.replace(/[&<>"'`=\/]/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;","`":"&#96;","=":"&#61;","/":"&#47;"}[s])); }
