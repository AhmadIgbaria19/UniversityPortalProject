const homeworkId    = localStorage.getItem("currentHomeworkId");
const homeworkTitle = localStorage.getItem("currentHomeworkTitle");

// כותרת דינמית
document.getElementById("pageTitle").textContent = `הגשות עבור: ${homeworkTitle || ""}`;
window.onload = () => loadSubmissions();

/* ---------- Utils ---------- */
function setMsg(text, type = "") {
  const el = document.getElementById("msg");
  if (!el) return;
  el.textContent = text || "";
  el.className = `msg ${type}`;
}
function escapeHtml(str){
  if (typeof str !== "string") return String(str ?? "");
  return str.replace(/[&<>"'`=\/]/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;","`":"&#96;","=":"&#61;","/":"&#47;"
  }[s]));
}
// קידוד כל מקטע בנתיב כדי למנוע בעיות בקבצים עם רווחים/עברית
function encodePath(p){ return String(p||"").split("/").map(encodeURIComponent).join("/"); }

/* ---------- Load submissions ---------- */
async function loadSubmissions() {
  const tbody = document.getElementById("submissionsTable");
  tbody.innerHTML = "";
  setMsg("טוען…");

  if (!homeworkId) {
    setMsg("חסר מזהה תרגיל (homeworkId).", "error");
    return;
  }

  try {
    const res   = await fetch(`http://localhost:3000/api/homework-submissions/${homeworkId}`);
    const data  = await res.json();

    if (!data?.success) {
      setMsg(data?.message || "השאילתה נכשלה בשרת.", "error");
      return;
    }

    const rows = Array.isArray(data.data) ? data.data : [];
    if (!rows.length) {
      setMsg("");
      tbody.innerHTML = `<tr><td colspan="5" class="empty">אין הגשות עבור תרגיל זה.</td></tr>`;
      return;
    }

    setMsg(""); // clear message

    rows.forEach(sub => {
      const tr = document.createElement("tr");

      const fileName = (sub.file_path || "").split("/").pop() || "submission.pdf";
      const encoded  = encodePath(sub.file_path || "");
      const timeStr  = new Date(sub.submitted_at).toLocaleString("he-IL");

      tr.innerHTML = `
        <td>${escapeHtml(sub.full_name || "")}</td>
        <td>${escapeHtml(sub.email || "")}</td>
        <td>
          <a class="file-link" href="http://localhost:3000/uploads/homeworks/${encoded}"
             target="_blank" rel="noopener" download>
            ${escapeHtml(fileName)}
          </a>
        </td>
        <td>${timeStr}</td>
        <td>
          <div class="grade-wrap">
            <input class="grade-input" type="number" min="0" max="100"
                   id="grade-${sub.submission_id}"
                   value="${sub.grade ?? ""}" placeholder="0–100">
            <button class="btn save" data-id="${sub.submission_id}">שמור</button>
          </div>
        </td>
      `;

      // אירועים: Enter לשמירה + כפתור
      const input = tr.querySelector(".grade-input");
      const btn   = tr.querySelector(".btn.save");

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") btn.click();
      });
      btn.addEventListener("click", async () => {
        await saveGrade(sub.submission_id, input, btn);
      });

      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("שגיאה בטעינת ההגשות:", err);
    setMsg("שגיאה בטעינת ההגשות.", "error");
  }
}

/* ---------- Save grade ---------- */
async function saveGrade(submissionId, inputEl, btnEl) {
  const grade = String(inputEl?.value ?? "").trim();
  if (grade === "") return alert("נא להזין ציון");
  const num = Number(grade);
  if (Number.isNaN(num) || num < 0 || num > 100) return alert("הציון חייב להיות בין 0 ל-100");

  try {
    btnEl.disabled = true;
    setMsg("שומר…");

    const res  = await fetch("http://localhost:3000/api/homework-submissions/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submission_id: submissionId, grade: num })
    });
    const data = await res.json();
    if (data?.success) {
      setMsg("נשמר ✔", "ok");
    } else {
      setMsg(data?.message || "שגיאה בשמירת הציון", "error");
    }
  } catch (err) {
    console.error(err);
    setMsg("שגיאה בשמירת הציון", "error");
  } finally {
    btnEl.disabled = false;
  }
}

/* ---------- Nav ---------- */
function goBack(){ window.history.back(); }
window.goBack = goBack; // לחשיפה ל-HTML
