const offerId   = localStorage.getItem("currentOfferId");
const studentId = localStorage.getItem("userId");

window.onload = async () => {
  if (!offerId || !studentId) {
    console.warn("Missing offerId or studentId");
    return;
  }
  await Promise.all([
    loadCourseInfo(),
    loadFiles(),
    loadMessages(),
    loadGrade(),
    loadHomeworks()
  ]);
};

/* ----------------------- Utilities ----------------------- */
function escapeHtml(str){
  if (typeof str !== "string") return String(str ?? "");
  return str.replace(/[&<>"'`=\/]/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;","`":"&#96;","=":"&#61;","/":"&#47;"
  }[s]));
}
function fmtDate(d, withTime = true){
  try {
    const dt = new Date(d);
    return withTime ? dt.toLocaleString() : dt.toLocaleDateString();
  } catch { return String(d ?? ""); }
}
// encode per path segment (prevents double slashes & broken URLs)
function encodePath(p){ return String(p || "").split("/").map(encodeURIComponent).join("/"); }
function setText(id, text){ const el = document.getElementById(id); if (el) el.textContent = text; }

/* -------------------- Course Information -------------------- */
async function loadCourseInfo() {
  try {
    const res  = await fetch(`http://localhost:3000/api/my-courses/${studentId}`);
    const data = await res.json();
    if (data?.success) {
      const course = (data.data || []).find(c => String(c.offer_id) === String(offerId));
      if (course) {
        setText("courseTitle", course.name || "Course");
        setText("lecturerName", course.lecturer || "—");
        setText("schedule", course.schedule || "—");
      }
    }
  } catch (err) {
    console.error("Error loading course info", err);
  }
}

/* ------------------------- Files ------------------------- */
async function loadFiles() {
  const list = document.getElementById("filesList");
  if (!list) return;
  list.innerHTML = "";

  try {
    const res  = await fetch(`http://localhost:3000/api/course-files/${offerId}`);
    const data = await res.json();

    if (!data?.success || !Array.isArray(data.data) || !data.data.length) {
      list.innerHTML = `<li style="color:#666">No files yet.</li>`;
      return;
    }

    const role = localStorage.getItem("userRole"); // only lecturers see delete (if they ever use this page)

    data.data.forEach(file => {
      const encoded = encodePath(file.file_path || "");
      const name    = file.original_name || file.file_path || "file";
      const li = document.createElement("li");

      const link = document.createElement("a");
      link.href = `http://localhost:3000/uploads/${encoded}`;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = name;

      if (role === "lecturer") {
        const del = document.createElement("button");
        del.textContent = "🗑";
        del.style.marginRight = "10px";
        del.onclick = () => deleteFile(encoded);
        li.appendChild(del);
      }

      li.appendChild(link);
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Error loading files", err);
    list.innerHTML = `<li style="color:#c00">Failed to load files.</li>`;
  }
}

// Optional (if a lecturer ever lands here)
async function deleteFile(encodedPath){
  if (!confirm("Delete this file?")) return;
  try {
    const res  = await fetch(`http://localhost:3000/api/course-files/${encodedPath}`, { method: "DELETE" });
    const data = await res.json();
    alert(data.message || "Done.");
    loadFiles();
  } catch {
    alert("Failed to delete file.");
  }
}

/* ---------------------- Homework ---------------------- */
async function loadHomeworks() {
  const container = document.getElementById("homeworkList");
  if (!container) return;
  container.innerHTML = "";

  try {
    const res  = await fetch(`http://localhost:3000/api/homework/${offerId}`);
    const data = await res.json();

    if (!data?.success || !Array.isArray(data.data) || !data.data.length) {
      container.innerHTML = `<div style="color:#666">No assignments yet.</div>`;
      return;
    }

    for (const hw of data.data) {
      const hwDiv = document.createElement("div");
      hwDiv.classList.add("homework-block");

      // file link for the assignment (if any)
      let fileLinkHtml = "";
      if (hw.file_path) {
        const encoded = encodePath(hw.file_path);
        fileLinkHtml = `
          <p>📄 <a href="http://localhost:3000/uploads/homeworks/${encoded}" target="_blank" rel="noopener" download>
            Download assignment file
          </a></p>`;
      }

      // existing submission (if any)
      let submissionHtml = `
        <input type="file" accept="application/pdf" id="hwFile-${hw.id}">
        <button onclick="submitHomework(${hw.id})">Submit</button>
      `;

      try {
        const subRes  = await fetch(`http://localhost:3000/api/submission/${hw.id}/${studentId}`);
        const subData = await subRes.json();

        if (subData?.success && subData.data) {
          const sub = subData.data;
          const encodedSub = encodePath(sub.file_path || "");
          const fileName   = (sub.file_path || "").split("/").pop() || "submission.pdf";
          submissionHtml = `
            <p>Existing submission:
              <a href="http://localhost:3000/uploads/homeworks/${encodedSub}" target="_blank" rel="noopener">${escapeHtml(fileName)}</a>
            </p>
            <p>Submitted: ${fmtDate(sub.submitted_at)}</p>
            ${sub.grade !== null ? `<p>Grade: ${escapeHtml(String(sub.grade))}</p>` : ""}
            <button onclick="deleteSubmission(${sub.id})">🗑 Delete submission</button>
          `;
        }
      } catch (e) {
        console.warn("Submission check failed", e);
      }

      hwDiv.innerHTML = `
        <h4>${escapeHtml(hw.title)}</h4>
        <p>${escapeHtml(hw.description || "")}</p>
        ${fileLinkHtml}
        <p>📅 Deadline: ${fmtDate(hw.due_date, false)}</p>
        ${submissionHtml}
        <hr>
      `;
      container.appendChild(hwDiv);
    }
  } catch (err) {
    console.error("Error loading homeworks", err);
    container.innerHTML = `<div style="color:#c00">Failed to load assignments.</div>`;
  }
}

// Submit homework
async function submitHomework(homeworkId) {
  const input = document.getElementById(`hwFile-${homeworkId}`);
  const file  = input?.files?.[0];
  if (!file) return alert("Please select a PDF file.");

  const btn = input.nextElementSibling;
  if (btn) btn.disabled = true;

  const formData = new FormData();
  formData.append("assignment_id", homeworkId);
  formData.append("student_id", studentId);
  formData.append("file", file);

  try {
    const res  = await fetch("http://localhost:3000/api/submit-homework", { method: "POST", body: formData });
    const data = await res.json();
    alert(data.message || "Submitted.");
    await loadHomeworks();
  } catch (err) {
    alert("Error sending submission");
  } finally {
    if (btn) btn.disabled = false;
  }
}

// Delete submission
async function deleteSubmission(submissionId) {
  if (!confirm("Are you sure you want to delete the submission?")) return;

  try {
    const res  = await fetch(`http://localhost:3000/api/submission/${submissionId}`, { method: "DELETE" });
    const data = await res.json();
    alert(data.message || "Deleted.");
    await loadHomeworks();
  } catch (err) {
    alert("Error deleting submission");
  }
}

/* ------------------------ Forum ------------------------ */
async function loadMessages() {
  const container = document.getElementById("messagesBox");
  if (!container) return;
  container.innerHTML = "";

  try {
    const res  = await fetch(`http://localhost:3000/api/course-messages/${offerId}`);
    const data = await res.json();

    if (!data?.success || !Array.isArray(data.data) || !data.data.length) {
      container.innerHTML = `<div style="color:#666">No messages yet.</div>`;
      return;
    }

    data.data.forEach(msg => {
      const time = fmtDate(msg.timestamp || msg.created_at || msg.sent_at);
      const div  = document.createElement("div");
      div.classList.add("forum-message");
      div.innerHTML = `
        <div style="padding:10px; background:#f0f8ff; border-radius:8px; margin-bottom:10px;">
          <p style="margin:0;"><strong style="color:#2c3e50;">${escapeHtml(msg.full_name || "User")}:</strong>
            ${escapeHtml(msg.message || "")}
          </p>
          <small style="color:gray;">${time}</small>
        </div>
      `;
      container.appendChild(div);
    });

    // Auto-scroll to newest
    container.scrollTop = container.scrollHeight;
  } catch (err) {
    console.error("Error loading messages", err);
    container.innerHTML = `<div style="color:#c00">Failed to load messages.</div>`;
  }
}

async function sendMessage() {
  const input = document.getElementById("messageInput");
  const content = input.value.trim();
  if (!content) return;

  try {
    const res  = await fetch("http://localhost:3000/api/course-messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: offerId, user_id: studentId, message: content })
    });
    const data = await res.json();
    if (data?.success) {
      input.value = "";
      await loadMessages();
    }
  } catch (err) {
    console.error("Error sending message", err);
  }
}

/* ------------------------ Grade ------------------------ */
async function loadGrade() {
  try {
    const res  = await fetch(`http://localhost:3000/api/grades/${studentId}`);
    const data = await res.json();
    if (data?.success) {
      const record = (data.data || []).find(g => String(g.offer_id) === String(offerId));
      if (record && record.grade !== null && record.grade !== undefined) {
        setText("studentGrade", String(record.grade));
      } else {
        setText("studentGrade", "No Grade");
      }
    }
  } catch (err) {
    console.error("Error loading grade", err);
  }
}

/* ---------------------- Navigation ---------------------- */
function goBack() { window.location.href = "student-dashboard.html"; }
window.sendMessage   = sendMessage;
window.submitHomework = submitHomework;
window.deleteSubmission = deleteSubmission;
window.goBack = goBack;
