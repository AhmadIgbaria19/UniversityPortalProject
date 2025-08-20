<!-- Hero -->
<h1 align="center">🎓 University Portal</h1>
<p align="center">
  <a href="https://www.youtube.com/watch?v=j7cswS5_og4"><b>▶️ Watch the 7-minute demo</b></a>
</p>

<p align="center">
  <img alt="Frontend" src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JS-111827?labelColor=0b1022&color=1f2937">
  <img alt="Backend"  src="https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-0ea5e9?labelColor=0b1022">
  <img alt="Database" src="https://img.shields.io/badge/Database-PostgreSQL-22c55e?labelColor=0b1022">
</p>

<p align="center">
  A clean, card-based academic portal for <b>Students</b>, <b>Lecturers</b>, and <b>Admins</b>:
  registrations, materials, homework, grading, tuition, and tickets — unified and modern.
</p>

<br/>

## 🧭 Navigation

- [Screens](#-screens)
- [Roles & Capabilities](#-roles--capabilities)
- [Key Flows](#-key-flows)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Data Model](#-data-model)
- [API Surface](#-api-surface)
- [Roadmap](#-roadmap)
- [License](#-license)

<br/>

## 📸 Screens

> Images are referenced from `docs/images/`. Keep the file names or adjust paths as needed.

**Login**  
![Login](docs/images/01-login.png)

**Student — My Courses (cards)**  
![Student Dashboard](docs/images/02-student-dashboard.png)

**Student — Course Registration**  
![Course Registration](docs/images/03-course-registration.png)

**Student — Course Page (Files · Homework · Forum)**  
![Student Course](docs/images/04-course-student-view.png)

**Lecturer — Course Management**  
![Lecturer Dashboard](docs/images/05-lecturer-dashboard.png)

**Admin — Dashboard & Tickets**  
![Admin Dashboard](docs/images/06-admin-dashboard.png)

<br/>

## 🧩 Roles & Capabilities

### 👨‍🎓 Student
- **My Courses** — card layout with name, lecturer, schedule.
- **Registration** — real-time remaining seats, price, schedule. Register or cancel.
- **Course Page**
  - Download **materials** uploaded by the lecturer.
  - View **homework** (title, description, due date, optional file).
  - **Submit homework** (PDF), see submission timestamp and grade, replace/delete submission.
  - **Forum** with the lecturer and peers.
  - Personal **final grade** when available.
- **Tuition** — automatic total of enrolled courses.
- **Grades** — per-course final grades.
- **Contact Admin** — open tickets and view responses.

### 👨‍🏫 Lecturer
- **Dashboard** — all taught course offers.
- **Course Management**
  - Upload/delete **course files**.
  - Create/delete **homework** (with due date and optional file).
  - View **enrolled students**.
  - Grade **homework submissions** and set **final course grades**.
- **Forum** — reply to student questions.

### 🛠️ Admin
- **Dashboard (cards UI)**
  - **Users** — list and add users (student/lecturer).
  - **Courses & Enrollments** — create course offers, view capacity, add seats.
  - **Students** — browse students, view their courses, enroll them.
  - **Student Tickets** — review and respond.
- **Add Course** — lecturer, schedule, price, capacity.
- **Add User** — full name, email, username, password, role.

<br/>

## 🔄 Key Flows

**Student**
1. Discover & register for courses with live capacity and pricing.  
2. Follow course materials and announcements.  
3. Submit homework (PDF), track submission time and grade.  
4. Communicate in the forum.  
5. Track tuition and view grades.

**Lecturer**
1. Publish materials and create assignments.  
2. Monitor enrollment.  
3. Grade submissions and set final grades.  
4. Support students via the forum.

**Admin**
1. Create course offers and manage capacity.  
2. Add users and enroll students when needed.  
3. Handle student tickets.

<br/>

## 🏗️ Architecture

- **Frontend**: HTML, CSS, Vanilla JS (responsive, RTL/LTR aware)
- **Backend**: Node.js + Express (REST API)
- **Database**: PostgreSQL
- **Uploads**: `uploads/` served statically
- **Auth**: email + password (bcrypt); server records `last_login`
- **Client state**: `localStorage` (`userId`, `userName`, `role`, previous `last_login`, `image`)

<br/>

## 🗂️ Project Structure

