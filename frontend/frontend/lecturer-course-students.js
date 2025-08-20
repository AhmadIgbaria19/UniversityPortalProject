const offerId = localStorage.getItem("currentOfferId");

let allStudents = [];
let sortState = { key: null, dir: 1 }; // 1=asc, -1=desc

document.addEventListener("DOMContentLoaded", () => {
  loadStudents();

  document.getElementById("searchInput").addEventListener("input", onSearch);
  document.getElementById("exportBtn").addEventListener("click", exportCSV);

  // sort on header click
  document.querySelectorAll("#studentsTable thead th").forEach(th => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      if (!key) return;
      if (sortState.key === key) sortState.dir *= -1;
      else { sortState.key = key; sortState.dir = 1; }
      render(filterList(document.getElementById("searchInput").value));
    });
  });
});

/* ---------- Load ---------- */
async function loadStudents() {
  const msg = document.getElementById("msg");
  const tbody = document.querySelector("#studentsTable tbody");
  tbody.innerHTML = "";
  setMsg("טוען…");

  try {
    const res = await fetch(`http://localhost:3000/api/lecturer/course-students/${offerId}`);
    const data = await res.json();

    if (!data?.success) {
      setMsg("לא נמצאו סטודנטים", "error");
      return;
    }

    allStudents = Array.isArray(data.students) ? data.students : (data.data || []);
    setMsg("");
    render(allStudents);
  } catch (err) {
    console.error("Load Students Error:", err);
    setMsg("שגיאה בטעינת הנתונים", "error");
  }
}

/* ---------- Render ---------- */
function render(list) {
  const tbody = document.querySelector("#studentsTable tbody");
  const count = document.getElementById("studentCount");
  tbody.innerHTML = "";

  // sort
  const sorted = [...list];
  if (sortState.key) {
    sorted.sort((a,b) => {
      const va = getVal(a, sortState.key);
      const vb = getVal(b, sortState.key);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (sortState.key === "enrolled_at") {
        return (new Date(va) - new Date(vb)) * sortState.dir;
      }
      return String(va).localeCompare(String(vb), "he") * sortState.dir;
    });
  }

  if (!sorted.length) {
    tbody.innerHTML = `<tr><td data-label="שם מלא" colspan="4" style="text-align:center;color:#9aa6b2">אין תוצאות</td></tr>`;
  } else {
    sorted.forEach(st => {
      const tr = document.createElement("tr");
      const dateStr = st.enrolled_at ? new Date(st.enrolled_at).toLocaleDateString("he-IL") : "-";
      const gradeStr = (st.grade !== null && st.grade !== undefined) ? st.grade : "-";
      tr.innerHTML = `
        <td data-label="שם מלא">${escapeHtml(st.full_name || "")}</td>
        <td data-label="מייל"><a class="email" href="mailto:${escapeAttr(st.email || "")}" title="לחץ להעתקה">${escapeHtml(st.email || "")}</a></td>
        <td data-label="תאריך הרשמה">${dateStr}</td>
        <td data-label="ציון">${escapeHtml(String(gradeStr))}</td>
      `;
      // copy email on click
      tr.querySelector(".email").addEventListener("click", (e) => {
        e.preventDefault();
        copy(st.email || "");
      });
      tbody.appendChild(tr);
    });
  }

  count.textContent = `${sorted.length} סטודנטים`;
}

/* ---------- Search / Filter ---------- */
function onSearch(e){
  const q = e.target.value;
  render(filterList(q));
}
function filterList(q){
  const s = (q || "").trim().toLowerCase();
  if (!s) return allStudents;
  return allStudents.filter(st =>
    (st.full_name || "").toLowerCase().includes(s) ||
    (st.email || "").toLowerCase().includes(s)
  );
}

/* ---------- Export ---------- */
function exportCSV(){
  const rows = [["Full Name","Email","Enrolled At","Grade"]];
  const list = filterList(document.getElementById("searchInput").value);

  list.forEach(st => {
    rows.push([
      st.full_name || "",
      st.email || "",
      st.enrolled_at ? new Date(st.enrolled_at).toLocaleString("he-IL") : "",
      (st.grade !== null && st.grade !== undefined) ? st.grade : ""
    ]);
  });

  const csv = "\uFEFF" + rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "course-students.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------- Utils ---------- */
function setMsg(text, type=""){ const el = document.getElementById("msg"); el.textContent = text; el.className = `msg ${type}`; }
function getVal(obj, key){ return obj ? obj[key] : undefined; }
function escapeHtml(str){ if (typeof str !== "string") return String(str ?? ""); return str.replace(/[&<>"'`=\/]/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;","`":"&#96;","=":"&#61;","/":"&#47;"}[s])); }
function escapeAttr(str){ return String(str ?? "").replace(/"/g, "&quot;"); }
async function copy(text){
  try { await navigator.clipboard.writeText(text); setMsg("המייל הועתק ✔"); setTimeout(()=>setMsg(""), 900); }
  catch { setMsg("נכשל להעתיק", "error"); setTimeout(()=>setMsg(""), 1200); }
}
