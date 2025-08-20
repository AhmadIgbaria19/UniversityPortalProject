window.onload = async () => {
  await loadUsers();
  bindUI();
};

/* ---------- State ---------- */
let allUsers = [];
let sortState = { key: null, dir: 1 }; // 1=asc, -1=desc

/* ---------- API ---------- */
async function loadUsers() {
  const tbody = document.getElementById("usersTableBody");
  const msg   = document.getElementById("msg");
  setMsg("Loading…");

  try {
    const res  = await fetch("http://localhost:3000/api/users");
    const data = await res.json();

    if (!data?.success) {
      setMsg("Failed to load users.", "error");
      return;
    }

    // Support either data.users or data.data from backend
    allUsers = Array.isArray(data.users) ? data.users : (Array.isArray(data.data) ? data.data : []);
    setMsg("");

    // Populate role filter
    populateRoles(allUsers);

    // Initial render
    render(filterList());
  } catch (err) {
    console.error("Error fetching users:", err);
    setMsg("Server error.", "error");
  }
}

/* ---------- UI Bindings ---------- */
function bindUI() {
  const search = document.getElementById("searchInput");
  const role   = document.getElementById("roleFilter");
  const exportBtn = document.getElementById("exportBtn");

  search.addEventListener("input", () => render(filterList()));
  role.addEventListener("change", () => render(filterList()));
  exportBtn.addEventListener("click", exportCSV);

  // Sort headers
  document.querySelectorAll("#usersTable thead th").forEach(th => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      if (!key) return;
      if (sortState.key === key) sortState.dir *= -1;
      else { sortState.key = key; sortState.dir = 1; }
      render(filterList());
    });
  });
}

/* ---------- Render ---------- */
function render(list) {
  const tbody = document.getElementById("usersTableBody");
  const count = document.getElementById("usersCount");

  // Sort
  const sorted = [...list];
  if (sortState.key) {
    sorted.sort((a, b) => {
      const va = get(a, sortState.key);
      const vb = get(b, sortState.key);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return String(va).localeCompare(String(vb), "en", { sensitivity: "base" }) * sortState.dir;
    });
  }

  tbody.innerHTML = "";
  if (!sorted.length) {
    tbody.innerHTML = `<tr><td data-label="Full Name" colspan="3" style="text-align:center;color:#9aa6b2">No results.</td></tr>`;
  } else {
    sorted.forEach(user => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td data-label="Full Name">${escapeHtml(user.full_name || "")}</td>
        <td data-label="Email"><a class="email" href="mailto:${escapeAttr(user.email || "")}" title="Click to copy">${escapeHtml(user.email || "")}</a></td>
        <td data-label="Role">${escapeHtml(user.role || "")}</td>
      `;
      tr.querySelector(".email").addEventListener("click", (e) => {
        e.preventDefault();
        copyToClipboard(user.email || "");
      });
      tbody.appendChild(tr);
    });
  }

  count.textContent = `${sorted.length} user${sorted.length === 1 ? "" : "s"}`;
}

/* ---------- Filters ---------- */
function filterList() {
  const q = (document.getElementById("searchInput").value || "").trim().toLowerCase();
  const role = document.getElementById("roleFilter").value;

  return allUsers.filter(u => {
    const matchText =
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q);

    const matchRole = role ? String(u.role || "").toLowerCase() === role.toLowerCase() : true;

    return matchText && matchRole;
  });
}

function populateRoles(users) {
  const select = document.getElementById("roleFilter");
  const roles = [...new Set(users.map(u => (u.role || "").trim()).filter(Boolean))].sort();
  select.innerHTML = `<option value="">All roles</option>` + roles.map(r => `<option value="${escapeAttr(r)}">${escapeHtml(r)}</option>`).join("");
}

/* ---------- Export ---------- */
function exportCSV() {
  const list = filterList();
  const rows = [["Full Name","Email","Role"]];
  list.forEach(u => rows.push([u.full_name || "", u.email || "", u.role || ""]));

  const csv = "\uFEFF" + rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "users.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------- Navigation ---------- */
function goToAddUser() {
  window.location.href = "add-user.html";
}
window.goToAddUser = goToAddUser;

/* ---------- Utils ---------- */
function setMsg(text, type=""){ const el = document.getElementById("msg"); el.textContent = text; el.className = `msg ${type}`; }
function get(obj, key){ return obj ? obj[key] : undefined; }
function escapeHtml(str){ if (typeof str !== "string") return String(str ?? ""); return str.replace(/[&<>"'`=\/]/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;","`":"&#96;","=":"&#61;","/":"&#47;"}[s])); }
function escapeAttr(str){ return String(str ?? "").replace(/"/g, "&quot;"); }
async function copyToClipboard(text){
  try { await navigator.clipboard.writeText(text); setMsg("Email copied ✔"); setTimeout(()=>setMsg(""), 900); }
  catch { setMsg("Copy failed", "error"); setTimeout(()=>setMsg(""), 1200); }
}
