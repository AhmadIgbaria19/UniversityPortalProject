window.onload = async () => {
  bindUI();
  await loadMessages();
};

let allMessages = [];

function bindUI(){
  document.getElementById("searchInput").addEventListener("input", renderFiltered);
  document.getElementById("statusFilter").addEventListener("change", renderFiltered);
}

async function loadMessages(){
  setMsg("Loading…");
  try {
    const res = await fetch("http://localhost:3000/api/admin/messages");
    const data = await res.json();
    if (!data?.success || !Array.isArray(data.messages)){
      setMsg("No tickets to show.");
      allMessages = [];
    } else {
      allMessages = data.messages;
      setMsg("");
    }
    renderFiltered();
  } catch (e){
    console.error(e);
    setMsg("Server error.");
  }
}

function renderFiltered(){
  const q = (document.getElementById("searchInput").value || "").toLowerCase().trim();
  const st= document.getElementById("statusFilter").value; // '', 'open', 'closed'

  const filtered = allMessages.filter(m => {
    const isClosed = !!m.admin_response;
    const statusOk = st ? (st === "closed" ? isClosed : !isClosed) : true;
    const text = `${m.full_name || ""} ${m.email || ""} ${m.message || ""} ${m.admin_response || ""}`.toLowerCase();
    const textOk = !q || text.includes(q);
    return statusOk && textOk;
  });

  renderList(filtered);
}

function renderList(list){
  const wrap = document.getElementById("messagesContainer");
  const chip = document.getElementById("countChip");
  wrap.innerHTML = "";
  chip.textContent = `${list.length}`;

  if (!list.length){
    wrap.innerHTML = `<div class="msg">No tickets found.</div>`;
    return;
  }

  list.forEach(msg => wrap.appendChild(buildTicket(msg)));
}

function buildTicket(msg){
  const isClosed = !!msg.admin_response;
  const el = document.createElement("div");
  el.className = "ticket";
  el.innerHTML = `
    <div class="head">
      <div>
        <div class="who">${escapeHtml(msg.full_name)} <span class="meta">(${escapeHtml(msg.email)})</span></div>
        <div class="meta"><i class="fa-regular fa-clock"></i> ${new Date(msg.sent_at).toLocaleString()}</div>
      </div>
      <span class="status ${isClosed ? "closed" : "open"}">${isClosed ? "Closed" : "Open"}</span>
    </div>

    <div class="body">
      ${escapeHtml(msg.message)}
    </div>

    <div class="reply" id="reply-${msg.id}">
      ${isClosed
        ? `<div class="meta"><i class="fa-solid fa-reply"></i> Admin response:</div>
           <div style="margin-top:6px;">${escapeHtml(msg.admin_response)}</div>`
        : `<textarea placeholder="Write an admin response…"></textarea>
           <div style="margin-top:8px;">
             <button class="btn primary" onclick="saveResponse(${msg.id})">
               <i class="fa-solid fa-paper-plane"></i> Save Response
             </button>
           </div>`
      }
    </div>
  `;
  return el;
}

async function saveResponse(messageId){
  const replyBox = document.querySelector(`#reply-${messageId} textarea`);
  if (!replyBox) return;
  const responseText = replyBox.value.trim();
  if (!responseText) { alert("Please write a response."); return; }

  try {
    const res = await fetch("http://localhost:3000/api/admin/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, response: responseText })
    });
    const data = await res.json();
    if (data?.success){
      // Replace editor with static response
      const wrap = document.getElementById(`reply-${messageId}`);
      wrap.innerHTML = `
        <div class="meta"><i class="fa-solid fa-reply"></i> Admin response:</div>
        <div style="margin-top:6px;">${escapeHtml(responseText)}</div>
      `;
      // update local cache
      const m = allMessages.find(x => x.id === messageId);
      if (m){ m.admin_response = responseText; }
      renderFiltered(); // refresh for status chip
    } else {
      alert(data?.message || "Failed to save response.");
    }
  } catch (e){
    console.error(e);
    alert("Server error.");
  }
}

function setMsg(text){ document.getElementById("msg").textContent = text || ""; }
function escapeHtml(str){ if (typeof str !== "string") return String(str ?? ""); return str.replace(/[&<>"'`=\/]/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;","`":"&#96;","=":"&#61;","/":"&#47;"}[s])); }
