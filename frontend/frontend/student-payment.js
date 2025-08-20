document.addEventListener("DOMContentLoaded", async () => {
  const studentId   = localStorage.getItem("userId");
  const tableBody   = document.querySelector("#tuitionTable tbody");
  const totalEl     = document.getElementById("total");
  const statusMsg   = document.getElementById("statusMsg");
  const payBtn      = document.getElementById("payBtn");

  if (!studentId) {
    setTableEmpty("Student ID not found.");
    setTotal(0);
    return;
  }

  // show skeleton rows while loading
  showSkeleton(tableBody);

  try {
    const res  = await fetch(`http://localhost:3000/api/tuition/${studentId}`);
    const data = await res.json();

    if (!data.success || !Array.isArray(data.data) || data.data.length === 0) {
      setTableEmpty("No courses enrolled yet.");
      setTotal(0);
      return;
    }

    let total = 0;
    tableBody.innerHTML = "";

    data.data.forEach(course => {
      const priceNum = toNumber(course.price);
      total += priceNum;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(course.name)}</td>
        <td>${escapeHtml(course.lecturer)}</td>
        <td>${formatILS(priceNum)}</td>
      `;
      tableBody.appendChild(row);
    });

    setTotal(total);
    statusMsg.textContent = "Loaded.";
  } catch (err) {
    console.error("Error loading data:", err);
    setTableEmpty("Error fetching data.");
    setTotal(0);
  }

  payBtn?.addEventListener("click", () => {
    // Placeholder click handler; hook up to your payment flow if/when ready.
    alert("Payment flow is not configured yet.");
  });
});

function goBack() {
  window.location.href = "student-dashboard.html";
}

/* ---------- helpers ---------- */
function setTableEmpty(text){
  const tbody = document.querySelector("#tuitionTable tbody");
  tbody.innerHTML = `<tr class="empty-row"><td colspan="3">${escapeHtml(text)}</td></tr>`;
}

function setTotal(amount){
  const el = document.getElementById("total");
  el.textContent = `Total: ${formatILS(amount)}`;
}

function showSkeleton(tbody){
  tbody.innerHTML = "";
  for (let i = 0; i < 3; i++){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><div class="skel"></div></td>
      <td><div class="skel"></div></td>
      <td><div class="skel"></div></td>
    `;
    tbody.appendChild(tr);
  }
}

function toNumber(v){
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    // remove any currency symbols or thousands separators
    const cleaned = v.replace(/[^\d.-]/g, "");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function formatILS(num){
  try {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0
    }).format(num || 0);
  } catch {
    return `₪${num ?? 0}`;
  }
}

function escapeHtml(str){
  if (typeof str !== "string") return String(str ?? "");
  return str.replace(/[&<>"'`=\/]/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;","`":"&#96;","=":"&#61;","/":"&#47;"
  }[s]));
}
