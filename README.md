University Portal

🎥 Product demo (7 min)






A modern, full-stack portal for Students, Lecturers, and Admins.
Students register and manage courses, submit homework, view grades & tuition, and chat via a course forum.
Lecturers publish materials, create assignments, grade submissions, and manage enrolled students.
Admins manage users, courses, seats, and student tickets — all in one place.

Roles & Capabilities
👨‍🎓 Student

My Courses — card layout with course name, lecturer, schedule.

Course Registration — real-time remaining seats, price, schedule; register or cancel.

Course Page

Download materials uploaded by the lecturer.

View homework (title, description, due date, optional file).

Submit homework (PDF), see timestamp and current grade, replace or delete submission.

Forum to message the lecturer and classmates.

Personal final grade when available.

Tuition — automatic total of enrolled courses.

Grades — per-course final grades.

Contact Admin — open tickets and view admin responses.

👨‍🏫 Lecturer

Dashboard — all course offers taught by the lecturer.

Course Management

Upload / delete course files.

Create / delete homework (with optional attachment).

View enrolled students.

Grade homework submissions and set final course grades.

Forum — reply to student questions.

🛠️ Admin

Dashboard (cards UI)

Users — list and add users (student / lecturer).

Courses & Enrollments — create course offers, view capacity, add seats.

Students — browse students, view their courses, enroll them.

Student Tickets — review and respond to messages.

Add Course — lecturer, schedule, price, capacity.

Add User — full name, email, username, password, role.

Screens & Flows

The screenshots below reference files under docs/images/.

🔐 Login

🧭 Student — My Courses

📝 Course Registration

📚 Student — Course Page (Files · Homework · Forum)

🎓 Lecturer — Course Management

🧰 Admin — Dashboard & Tickets

Architecture

Frontend: HTML, CSS, Vanilla JavaScript (responsive, RTL/LTR aware).

Backend: Node.js + Express (RESTful API).

Database: PostgreSQL.

Uploads: stored under uploads/ and served statically.

Auth: email + password (bcrypt hashing); server records last_login.

Client state: localStorage (user id, name, role, previous last_login, image URL).

Project Structure
.
├─ backend/
│  ├─ server.js
│  ├─ routes/
│  ├─ controllers/
│  ├─ services/
│  ├─ db/
│  └─ uploads/
├─ frontend/
│  ├─ *.html
│  ├─ *.css
│  └─ *.js
└─ docs/
   └─ images/
      ├─ 01-login.png
      ├─ 02-student-dashboard.png
      ├─ 03-course-registration.png
      ├─ 04-course-student-view.png
      ├─ 05-lecturer-dashboard.png
      └─ 06-admin-dashboard.png

Data Model (overview)

users — id, full_name, email, password (bcrypt), role (student|lecturer|admin), created_at, last_login, image_url?

courses — id, name, price, …

course_offers — offer_id, course_id, lecturer_id, schedule, max_seats, remaining_seats

enrollments — student_id, offer_id, enrolled_at

course_files — id, offer_id, file_path, original_name, uploaded_at

homework — id, course_offer_id, title, description, due_date, file_path?

submissions — id, assignment_id, student_id, file_path, submitted_at, grade?

messages — forum posts per offer (sender_id, sender_role, message, timestamp)

grades — final grades per student_id + offer_id

API Surface (summary)

/api base:

Auth: POST /login

Student: GET /my-courses/:id, GET /courses, POST/DELETE /enroll, GET /tuition/:id, GET /grades/:id, files & homework endpoints, forum endpoints.

Lecturer: own courses, course students, files, homework CRUD, submissions & grading, final grades.

Admin: users, lecturers, create course, admin courses + add seats, students, tickets + respond.
