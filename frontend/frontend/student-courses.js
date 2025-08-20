const studentId = localStorage.getItem("currentStudentId");

window.onload = async () => {
  if (!studentId){
    document.getElementById("msgEnrolled").textContent = "Student ID not found.";
    return;
  }
  await loadEnrolledCourses();
  await loadAvailableCourses();
};

async function loadEnrolledCourses() {
  const tbody = document.querySelector("#enrolledTable tbody");
  const msg   = document.getElementById("msgEnrolled");
  tbody.innerHTML = ""; msg.textContent = "Loading…";
  try {
    const res = await fetch(`http://localhost:3000/api/student/enrolled/${studentId}`);
    const data = await res.json();
    msg.textContent = "";
    if (!data?.success || !Array.isArray(data.courses)){
      msg.textContent = "Failed to load courses.";
      return;
    }
    if (!data.courses.length){
      msg.textContent = "No enrolled courses yet.";
      return;
    }
    data.courses.forEach(course => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(course.course_name)}</td>
        <td>${escapeHtml(course.lecturer_name)}</td>
        <td>${escapeHtml(course.schedule)}</td>
        <td>${course.grade ?? "-"}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e){
    console.error(e);
    msg.textContent = "Server error.";
  }
}

async function loadAvailableCourses() {
  const select = document.getElementById("availableCoursesSelect");
  const msg    = document.getElementById("msgRegister");
  select.innerHTML = `<option value="" selected disabled>— Select a course —</option>`;
  msg.textContent = "Loading catalog…";
  try {
    const res = await fetch(`http://localhost:3000/api/student/available-courses/${studentId}`);
    const data = await res.json();
    msg.textContent = "";
    if (!data?.courses || !Array.isArray(data.courses)){
      msg.textContent = "Failed to load available courses.";
      return;
    }
    if (!data.courses.length){
      msg.textContent = "No available courses to register.";
      return;
    }
    data.courses.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.offer_id;
      opt.textContent = `${c.course_name} (${c.schedule})`;
      select.appendChild(opt);
    });
  } catch (e){
    console.error(e);
    msg.textContent = "Server error.";
  }
}

async function enrollToCourse() {
  const select = document.getElementById("availableCoursesSelect");
  const msg    = document.getElementById("msgRegister");
  const offerId = select.value;
  if (!offerId){
    msg.textContent = "Please choose a course first.";
    msg.className = "msg err";
    return;
  }
  msg.textContent = "Submitting…"; msg.className = "msg";
  try {
    const res = await fetch("http://localhost:3000/api/student/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, offerId })
    });
    const data = await res.json();
    if (data?.success){
      msg.textContent = "Student enrolled successfully.";
      msg.className = "msg ok";
      await loadEnrolledCourses();
      await loadAvailableCourses();
    } else {
      msg.textContent = `Registration failed${data?.message ? ": " + data.message : ""}`;
      msg.className = "msg err";
    }
  } catch (e){
    console.error(e);
    msg.textContent = "Server error.";
    msg.className = "msg err";
  }
}

function escapeHtml(str){ if (typeof str !== "string") return String(str ?? ""); return str.replace(/[&<>"'`=\/]/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;","`":"&#96;","=":"&#61;","/":"&#47;"}[s])); }
