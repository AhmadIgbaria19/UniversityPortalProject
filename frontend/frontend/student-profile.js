function loadProfile() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("User not logged in");
    window.location.href = "login.html";
    return;
  }

  document.getElementById("fullName").textContent = user.full_name || "N/A";
  document.getElementById("email").textContent = user.email || "N/A";
  document.getElementById("studentId").textContent = user.id || "N/A";
  document.getElementById("role").textContent = user.role || "N/A";
  document.getElementById("createdAt").textContent = user.created_at?.split("T")[0] || "N/A";

  const imageElement = document.getElementById("profileImage");
  if (user.image) {
    imageElement.src = user.image;
    imageElement.style.display = "block";
  } else {
    imageElement.style.display = "none";
  }
}

function goBack() {
  window.location.href = "student-dashboard.html";
}

window.onload = loadProfile;
