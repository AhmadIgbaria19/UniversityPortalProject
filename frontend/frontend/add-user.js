document.addEventListener("DOMContentLoaded", () => {
  const form      = document.getElementById("addUserForm");
  const messageEl = document.getElementById("message");
  const pwd       = document.getElementById("password");
  const toggle    = document.getElementById("togglePwd");
  const submitBtn = document.getElementById("submitBtn");

  // Toggle password visibility
  toggle.addEventListener("click", () => {
    const isPwd = pwd.type === "password";
    pwd.type = isPwd ? "text" : "password";
    toggle.innerHTML = `<i class="fa-regular ${isPwd ? "fa-eye-slash" : "fa-eye"}"></i>`;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMsg();

    const full_name = document.getElementById("fullName").value.trim();
    const email     = document.getElementById("email").value.trim();
    const username  = document.getElementById("username").value.trim();
    const password  = document.getElementById("password").value.trim();
    const role      = document.getElementById("role").value;

    // Basic client-side validation (no API changes)
    if (!isValidEmail(email)) return setMsg("Please enter a valid email.", true);
    if (password.length < 6)  return setMsg("Password must be at least 6 characters.", true);

    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/api/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name, email, username, password, role })
      });

      const data = await res.json();

      if (data && data.success) {
        setMsg("User added successfully ✔", false);
        form.reset();
        pwd.type = "password";
        toggle.innerHTML = `<i class="fa-regular fa-eye"></i>`;
      } else {
        setMsg(data?.message || "Failed to add user.", true);
      }
    } catch (err) {
      console.error("Add user error:", err);
      setMsg("Server error.", true);
    } finally {
      setLoading(false);
    }
  });

  function isValidEmail(e){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  function setMsg(text, isErr=false){
    messageEl.textContent = text || "";
    messageEl.className = `msg ${isErr ? "err" : "ok"}`;
  }
  function clearMsg(){ setMsg(""); }

  function setLoading(on){
    submitBtn.classList.toggle("loading", !!on);
    submitBtn.disabled = !!on;
  }
});
