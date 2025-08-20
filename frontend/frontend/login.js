(() => {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorMsg = document.getElementById("error");
  const userImg = document.getElementById("userImage");
  const submitBtn = form?.querySelector('button[type="submit"]');

  if (!form) {
    console.error("loginForm not found in DOM");
    return;
  }

  // Small helpers
  const setError = (msg) => { if (errorMsg) errorMsg.textContent = msg || ""; };
  const setLoading = (loading) => {
    if (!submitBtn) return;
    submitBtn.disabled = !!loading;
    submitBtn.textContent = loading ? "Signing in…" : "Sign in";
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setError("");

    const email = (emailInput?.value || "").trim();
    const password = (passwordInput?.value || "").trim();

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    // Optional: very light email sanity check
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    // Abort after 15s to avoid hanging requests
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });

      const raw = await res.text();
      let data;
      try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }

      console.log("Login response:", { status: res.status, ok: res.ok, data });

      // Handle HTTP-level errors OR API-level errors
      if (!res.ok || !data?.success) {
        const msg = data?.message || (res.status === 401 ? "Invalid email or password." :
                                      res.status === 500 ? "Server error. Please try again." :
                                      "Login failed. Please check your details.");
        setError(msg);
        return;
      }

      // Persist user info
      const role = String(data.role || "").trim().toLowerCase();
      localStorage.setItem("userRole", role);
      localStorage.setItem("userName", data.name || "");
      localStorage.setItem("userId", data.id ?? "");
      localStorage.setItem("userLastLogin", data.last_login || "");
      localStorage.setItem("userImage", data.image || "");

      // Show avatar if present (optional)
      if (userImg && data.image) {
        userImg.src = data.image;
        userImg.style.display = "block";
      }

      // Route by role (case-insensitive)
      const routes = {
        student: "student-dashboard.html",
        lecturer: "lecturer-dashboard.html",
        admin: "admin-dashboard.html",
      };
      const target = routes[role];

      if (target) {
        window.location.assign(target);
      } else {
        console.warn("Unknown role returned:", data.role);
        setError("Your account role is not recognized. Contact support.");
      }

    } catch (err) {
      console.error("Login error:", err);
      setError(err.name === "AbortError"
        ? "Request timed out. Please try again."
        : "Network error. Please check the server connection.");
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  });
})();
