document.addEventListener("DOMContentLoaded", () => {
  const form        = document.getElementById("contactForm");
  const textarea    = document.getElementById("message");
  const statusMsg   = document.getElementById("statusMsg");
  const charCounter = document.getElementById("charCounter");
  const listMsg     = document.getElementById("listMsg");
  const filterSel   = document.getElementById("statusFilter");
  const sendBtn     = document.getElementById("sendBtn");
  const container   = document.getElementById("previousMessagesContainer");

  const studentId = localStorage.getItem("userId");
  if (!studentId){
    setStatus(statusMsg, "Student ID not found.", true);
    return;
  }

  // Live counter + Ctrl/Cmd+Enter to submit
  updateCounter();
  textarea.addEventListener("input", updateCounter);
  textarea.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") form.requestSubmit();
  });

  // Load and filter messages
  loadPreviousMessages();
  filterSel.addEventListener("change", () => loadPreviousMessages());

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = (textarea.value || "").trim();
    if (!message) { setStatus(statusMsg, "Please write a message before sending.", true); return; }

    try {
      setStatus(statusMsg, "Sending…");
      toggleSending(true);

      const res = await fetch("http://localhost:3000/api/student/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, message }),
      });

      const data = await res.json().catch(()=>({success:false}));
      if (data.success) {
        setStatus(statusMsg, "✅ Message sent successfully!");
        textarea.value = "";
        updateCounter();
        await loadPreviousMessages(); // refresh list
      } else {
        setStatus(statusMsg, "❌ Error sending message.", true);
      }
    } catch (err) {
      console.error(err);
      setStatus(statusMsg, "⚠️ Server error.", true);
    } finally {
      toggleSending(false);
    }
  });

  async function loadPreviousMessages() {
    container.innerHTML = ""; // clear
    showSkeleton(container);

    try {
      const res = await fetch(`http://localhost:3000/api/student/messages/${studentId}`);
      const data = await res.json();

      container.innerHTML = ""; // remove skeleton

      if (!data.success) {
        listMsg.textContent = "Error loading tickets.";
        return;
      }

      const messages = Array.isArray(data.messages) ? data.messages : [];
      if (!messages.length) {
        container.innerHTML = `<div class="empty">No previous tickets found.</div>`;
        listMsg.textContent = "";
        updateCounts(messages);
        return;
      }

      // Newest first
      messages.sort((a,b) => new Date(b.sent_at) - new Date(a.sent_at));

      // Filter by status
      const f = (filterSel.value || "").toLowerCase();
      const filtered = f
        ? messages.filter(m => f === "open" ? !m.admin_response : !!m.admin_response)
        : messages;

      if (!filtered.length){
        container.innerHTML = `<div class="empty">No results for the selected filter.</div>`;
      } else {
        filtered.forEach(msg => container.appendChild(renderItem(msg)));
      }

      listMsg.textContent = "";
      updateCounts(messages);
    } catch (err) {
      console.error(err);
      container.innerHTML = `<div class="empty">⚠️ Error loading tickets.</div>`;
    }
  }

  /* ---------- UI helpers ---------- */
  function renderItem(m){
    const box = document.createElement("div");
    box.className = "item";

    const isClosed = !!m.admin_response;
    const status = isClosed ? `<span class="status closed">Closed ticket</span>` :
                              `<span class="status open">Open ticket</span>`;
    const dateStr = formatDate(m.sent_at);

    box.innerHTML = `
      <div class="row">
        <span class="meta"><strong>🗓️ ${dateStr}</strong></span>
        ${status}
      </div>
      <div class="text">${escapeHtml(m.message)}</div>
      ${isClosed ? `<div class="admin">🧑‍💼 Admin reply: ${escapeHtml(m.admin_response)}</div>` : ""}
    `;
    return box;
  }

  function updateCounts(list){
    const openCountEl   = document.getElementById("openCount");
    const closedCountEl = document.getElementById("closedCount");
    const open  = list.filter(m => !m.admin_response).length;
    const close = list.length - open;
    if (openCountEl) openCountEl.textContent = `Open: ${open}`;
    if (closedCountEl) closedCountEl.textContent = `Closed: ${close}`;
  }

  function setStatus(el, text, isError=false){
    if (!el) return;
    el.textContent = text || "";
    el.style.color = isError ? "#ffb4b4" : "var(--muted)";
  }

  function updateCounter(){
    const len = (textarea.value || "").length;
    if (charCounter) charCounter.textContent = `${len}/1000`;
  }

  function toggleSending(b){
    if (sendBtn) {
      sendBtn.disabled = !!b;
      sendBtn.innerHTML = b ? `<i class="fa-solid fa-circle-notch fa-spin"></i> Sending…` :
                              `<i class="fa-solid fa-paper-plane"></i> Send Message`;
    }
  }

  function showSkeleton(target){
    for (let i=0;i<3;i++){
      const sk = document.createElement("div");
      sk.className = "skel";
      target.appendChild(sk);
    }
  }

  /* ---------- utils ---------- */
  function escapeHtml(str){
    if (typeof str !== "string") return String(str ?? "");
    return str.replace(/[&<>"'`=\/]/g, s => ({
      "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;","`":"&#96;","=":"&#61;","/":"&#47;"
    }[s]));
  }

  function formatDate(d){
    try { return new Date(d).toLocaleString("en-US"); }
    catch { return String(d ?? ""); }
  }
});
