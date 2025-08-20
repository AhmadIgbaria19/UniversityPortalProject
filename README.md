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

<br/>

## 📸 Screens

**Login**  
![Login](/images/login.png)

**Student — My Courses (cards)**  
![Student Dashboard](/images/student.png)

**Student — Course Registration**  
![Course Registration](/images/courses.png)

**Student — Course Page (Files · Homework · Forum)**  
![Student Course](/images/coursepage.png)

**Lecturer — Course Management**  
![Lecturer Dashboard](/images/lecturer.png)

**Admin — Dashboard & Tickets**  
![Admin Dashboard](/images/admin.png)

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


<br/>

## 📚 Data Model

- **users** — `id`, `full_name`, `email`, `password (bcrypt)`, `role (student|lecturer|admin)`, `created_at`, `last_login`, `image_url?`
- **courses** — `id`, `name`, `price`, …
- **course_offers** — `offer_id`, `course_id`, `lecturer_id`, `schedule`, `max_seats`, `remaining_seats`
- **enrollments** — `student_id`, `offer_id`, `enrolled_at`
- **course_files** — `id`, `offer_id`, `file_path`, `original_name`, `uploaded_at`
- **homework** — `id`, `course_offer_id`, `title`, `description`, `due_date`, `file_path?`
- **submissions** — `id`, `assignment_id`, `student_id`, `file_path`, `submitted_at`, `grade?`
- **messages** — forum posts per offer (`sender_id`, `sender_role`, `message`, `timestamp`)
- **grades** — final grades per `student_id` + `offer_id`

<br/>

## 🔌 API Surface

**Base**: `/api`

- **Auth**: `POST /login`
- **Student**: `GET /my-courses/:id`, `GET /courses`, `POST/DELETE /enroll`, `GET /tuition/:id`, `GET /grades/:id`, files, homework (list/submit), forum (list/post)
- **Lecturer**: own courses, course students, files CRUD, homework CRUD, submissions & grading, final grades
- **Admin**: users, lecturers, create course, admin courses (+ add seats), students, student tickets + respond

<br/>

Igbaria Ahmad
B.Sc. Student in Computer Science
