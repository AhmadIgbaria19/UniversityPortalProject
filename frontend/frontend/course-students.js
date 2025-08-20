const offerId = localStorage.getItem("currentOfferId");

window.onload = async () => {
  try {
    const res = await fetch(`http://localhost:3000/api/course-registrations/${offerId}`);
    const data = await res.json();

    if (data.success) {
      const tableBody = document.querySelector('#studentsTable tbody');
      data.students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${student.full_name}</td>
          <td>${student.email}</td>
          <td>${new Date(student.enrolled_at).toLocaleDateString()}</td>
          <td>${student.grade !== null ? student.grade : '-'}</td>
        `;
        tableBody.appendChild(row);
      });
    } else {
      alert("לא נמצאו סטודנטים");
    }
  } catch (err) {
    console.error("Load Students Error:", err);
    alert("שגיאה בטעינת הנתונים");
  }
};
