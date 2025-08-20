const offerId = localStorage.getItem("currentOfferId");
const lecturerId = localStorage.getItem("userId");

window.onload = async () => {
  await loadCourseTitle();
  await loadStudents();
  await loadMessages();
  await loadFiles();
  await loadHomework();
};

// 🔖 Course title
async function loadCourseTitle() {
  try {
    const res = await fetch(`http://localhost:3000/api/my-courses/${lecturerId}`);
    const data = await res.json();
    if (data.success) {
      const course = data.data.find(c => c.offer_id == offerId);
      if (course) {
        document.getElementById("courseTitle").textContent = `Manage Course: ${course.name}`;
      }
    }
  } catch (err) {
    console.error("Load title error", err);
  }
}

// 🧑‍🎓 Students & Grades
async function loadStudents() {
  try {
    const res = await fetch(`http://localhost:3000/api/course-students/${offerId}`);
    const data = await res.json();
    if (data.success) {
      const tbody = document.querySelector("#studentsTable tbody");
      tbody.innerHTML = "";
      data.data.forEach(student => {
        const currentGrade = student.grade !== null ? student.grade : '';
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${escapeHtml(student.full_name)}</td>
          <td>${escapeHtml(student.email)}</td>
          <td><input type="number" min="0" max="100" id="grade-${student.id}" value="${currentGrade}"></td>
          <td><button class="btn" onclick="saveGrade(${student.id})">Save</button></td>
        `;
        tbody.appendChild(row);
      });
    }
  } catch (err) {
    console.error("Load students error", err);
  }
}

async function saveGrade(studentId) {
  const gradeInput = document.getElementById(`grade-${studentId}`);
  const grade = gradeInput.value;

  if (grade === "") return alert("Please enter a grade");

  try {
    const res = await fetch("http://localhost:3000/api/grades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        offer_id: offerId,
        grade: Number(grade)
      })
    });

    const data = await res.json();
    alert(data.message || "Grade saved");
  } catch (err) {
    alert("Error saving grade");
  }
}

// 📂 Files
async function loadFiles() {
  try {
    const res = await fetch(`http://localhost:3000/api/course-files/${offerId}`);
    const data = await res.json();
    const list = document.getElementById("filesList");
    list.innerHTML = "";

    if (data.success) {
      data.data.forEach(file => {
        if (!file.file_path) return;
        const fileName = encodeURIComponent(file.file_path);
        const nameToShow = file.original_name || decodeURIComponent(file.file_path);

        const li = document.createElement("li");
        const left = document.createElement("div");
        left.style.display = "flex";
        left.style.alignItems = "center";
        left.style.gap = "8px";
        left.innerHTML = `📄 <a href="http://localhost:3000/uploads/${fileName}" target="_blank" download>${escapeHtml(nameToShow)}</a>`;

        const actions = document.createElement("div");
        actions.className = "row-actions";
        const btn = document.createElement("button");
        btn.className = "btn ghost";
        btn.textContent = "Delete";
        btn.onclick = () => deleteFile(fileName);

        actions.appendChild(btn);
        li.appendChild(left);
        li.appendChild(actions);
        list.appendChild(li);
      });
    }
  } catch (err) {
    console.error("Error loading files", err);
  }
}

async function deleteFile(filePath) {
  if (!confirm("Delete this file?")) return;

  try {
    const res = await fetch(`http://localhost:3000/api/course-files/${encodeURIComponent(filePath)}`, {
      method: "DELETE"
    });

    const data = await res.json();
    alert(data.message || "File deleted");
    loadFiles();
  } catch (err) {
    alert("Error deleting file");
  }
}

async function uploadFile() {
  const input = document.getElementById("fileInput");
  const file = input.files[0];
  const msg = document.getElementById("uploadMsg");

  if (!file) {
    msg.textContent = "Please choose a file first";
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("offer_id", offerId);
  formData.append("lecturer_id", lecturerId);

  try {
    const res = await fetch("http://localhost:3000/api/course-files", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    msg.textContent = data.message || "Uploaded";
    await loadFiles();
  } catch (err) {
    msg.textContent = "Error uploading file";
  }
}

// 📨 Messages
async function loadMessages() {
  try {
    const res = await fetch(`http://localhost:3000/api/messages/${offerId}`);
    const data = await res.json();
    const box = document.getElementById("messagesBox");
    box.innerHTML = "";

    if (data.success) {
      data.data.forEach(m => {
        const div = document.createElement("div");
        div.className = "msg-item";
        const role = m.sender_role === "lecturer" ? "Lecturer" : "Student";
        div.innerHTML = `
          <div class="meta"><strong>${escapeHtml(m.full_name)} (${role})</strong></div>
          <div class="body">${escapeHtml(m.message)}</div>
        `;
        box.appendChild(div);
      });
      // scroll to bottom
      box.scrollTop = box.scrollHeight;
    }
  } catch (err) {
    console.error("Load messages error", err);
  }
}

async function sendMessage() {
  const input = document.getElementById("messageInput");
  const message = input.value.trim();
  if (!message) return;

  try {
    const res = await fetch("http://localhost:3000/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offer_id: offerId,
        sender_id: lecturerId,
        content: message,
        sender_role: "lecturer"
      })
    });

    const data = await res.json();
    if (data.success) {
      input.value = "";
      loadMessages();
    }
  } catch (err) {
    console.error("Send message error", err);
  }
}

// 📝 Homework
async function addHomework() {
  const title = document.getElementById("homeworkTitle").value.trim();
  const description = document.getElementById("homeworkDesc").value.trim();
  const dueDate = document.getElementById("homeworkDue").value;
  const fileInput = document.getElementById("hwFile");
  const file = fileInput.files[0];
  const msg = document.getElementById("hwMsg");

  if (!title || !dueDate) {
    msg.textContent = "Please fill title and due date";
    return;
  }

  const formData = new FormData();
  formData.append("course_offer_id", offerId);
  formData.append("title", title);
  formData.append("description", description);
  formData.append("due_date", dueDate);
  if (file) formData.append("file", file);

  try {
    const res = await fetch("http://localhost:3000/api/homework", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    msg.textContent = data.message || "Homework added";
    await loadHomework();
  } catch (err) {
    msg.textContent = "Error adding homework";
  }
}

async function loadHomework() {
  try {
    const res = await fetch(`http://localhost:3000/api/homework/${offerId}`);
    const data = await res.json();
    const list = document.getElementById("homeworkList");
    list.innerHTML = "";

    if (data.success) {
      data.data.forEach(hw => {
        const li = document.createElement("li");

        const left = document.createElement("div");
        left.style.display = "flex";
        left.style.flexDirection = "column";
        left.innerHTML = `
          <strong>${escapeHtml(hw.title)}</strong>
          <span class="hint">Due: ${new Date(hw.due_date).toLocaleDateString()}</span>
        `;

        const actions = document.createElement("div");
        actions.className = "row-actions";

        const viewBtn = document.createElement("button");
        viewBtn.className = "btn";
        viewBtn.textContent = "Submissions";
        viewBtn.onclick = () => viewSubmissions(hw.id, hw.title);

        const delBtn = document.createElement("button");
        delBtn.className = "btn ghost";
        delBtn.textContent = "Delete";
        delBtn.onclick = () => deleteHomework(hw.id);

        actions.appendChild(viewBtn);
        actions.appendChild(delBtn);

        li.appendChild(left);
        li.appendChild(actions);
        list.appendChild(li);
      });
    }
  } catch (err) {
    console.error("Load homework error", err);
  }
}

async function deleteHomework(homeworkId) {
  if (!confirm("Delete this homework?")) return;

  try {
    const res = await fetch(`http://localhost:3000/api/homework/${homeworkId}`, {
      method: "DELETE"
    });

    const data = await res.json();
    alert(data.message || "Homework deleted");
    loadHomework();
  } catch (err) {
    alert("Error deleting homework");
  }
}

// 🔗 Navigation
function viewSubmissions(homeworkId, title) {
  localStorage.setItem("currentHomeworkId", homeworkId);
  localStorage.setItem("currentHomeworkTitle", title);
  window.location.href = "homework-submissions.html";
}

/* Utils */
function escapeHtml(str){
  if (typeof str !== "string") return String(str ?? "");
  return str.replace(/[&<>"'`=\/]/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;","`":"&#96;","=":"&#61;","/":"&#47;"
  }[s]));
}
