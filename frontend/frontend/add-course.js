document.addEventListener("DOMContentLoaded", async () => {
  const lecturerSelect = document.getElementById("lecturer");
  const form = document.getElementById("addCourseForm");
  const messageEl = document.getElementById("message");
  const submitBtn = document.getElementById("submitBtn");

  /* Load lecturers */
  try {
    const res = await fetch("http://localhost:3000/api/lecturers");
    const data = await res.json();
    if (data?.success && Array.isArray(data.lecturers)) {
      data.lecturers.forEach(lecturer => {
        const opt = document.createElement("option");
        opt.value = lecturer.id;
        opt.textContent = lecturer.full_name;
        lecturerSelect.appendChild(opt);
      });
      setMsg(""); // clear
    } else {
      setMsg("Failed to load lecturers.", true);
    }
  } catch (err) {
    console.error("Lecturers fetch error:", err);
    setMsg("Server error while loading lecturers.", true);
  }

  /* Submit add course */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMsg();

    const courseName = document.getElementById("courseName").value.trim();
    const lecturerId = lecturerSelect.value;
    const schedule   = document.getElementById("schedule").value.trim();
    const price      = Number(document.getElementById("price").value);
    const maxSeats   = Number(document.getElementById("maxSeats").value);

    // Basic validation (no API changes)
    if (!courseName) return setMsg("Please enter course name.", true);
    if (!lecturerId) return setMsg("Please select a lecturer.", true);
    if (!schedule)   return setMsg("Please enter schedule.", true);
    if (!(price >= 0)) return setMsg("Price must be a non-negative number.", true);
    if (!(maxSeats >= 1)) return setMsg("Max seats must be at least 1.", true);

    const payload = { courseName, lecturerId, schedule, price, maxSeats };

    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/api/add-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data?.success) {
        setMsg("Course added successfully ✔", false);
        form.reset();
        lecturerSelect.value = "";
      } else {
        setMsg(data?.message || "Failed to add course.", true);
      }
    } catch (err) {
      console.error("Add course error:", err);
      setMsg("Server error while adding course.", true);
    } finally {
      setLoading(false);
    }
  });

  /* Helpers */
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
