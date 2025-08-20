async function loadMyCourses() {
  const studentId = localStorage.getItem("userId"); // שימוש אמיתי ב-localStorage
  const msg = document.getElementById("msg");
  const tableBody = document.querySelector("#myCoursesTable tbody");
  tableBody.innerHTML = "";

  if (!studentId) {
    msg.textContent = "לא נמצא מזהה משתמש. התחבר מחדש.";
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/api/my-courses/${studentId}`);
    const data = await res.json();

    if (!data.success) {
      msg.textContent = "حدث خطأ في تحميل הקורסים.";
      return;
    }

    if (data.data.length === 0) {
      msg.textContent = "لم تسجل في أي كورس بعد.";
      return;
    }

    data.data.forEach(course => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${course.name}</td>
        <td>${course.lecturer}</td>
        <td>${course.schedule}</td>
        <td><a href="course-student-view.html?offer_id=${course.offer_id}&student_id=${studentId}">الدخول للكورس</a></td>
      `;
      tableBody.appendChild(row);
    });

  } catch (err) {
    console.error(err);
    msg.textContent = "فشل الاتصال بالسيرفر.";
  }
}

function goBack() {
  window.location.href = "student-dashboard.html";
}

loadMyCourses();
