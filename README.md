🎓 University Portal — Students • Lecturers • Admin

▶️ Watch 7-minute demo

What is this?

A modern full-stack portal that streamlines academic life for students, lecturers, and administration: course registration, materials & homework flows, grading, tuition overview, and ticketing — all with a clean, card-based UI.

📸 Screens (place 5–6 images)

Put your screenshots under docs/images/ and keep the file names below, or change paths as needed.

Login


Student – My Courses (cards)


Student – Course Registration


Student – Course Page (Files • Homework • Forum)


Lecturer – Course Management


Admin – Dashboard (cards) & Tickets


🧩 Roles & Core Capabilities
👨‍🎓 Student

My Courses: card layout with course name, lecturer, schedule.

Course Registration: live remaining seats, price, schedule, register/cancel.

Course Page

Download materials uploaded by the lecturer.

View homework (title, description, due date, optional file).

Submit homework (PDF), see timestamp and current grade; replace/delete submission.

Forum to message the lecturer/class.

Personal final grade when available.

Tuition: automatic total of all enrolled courses.

Grades: per-course final grades.

Contact Admin: open tickets and view responses.

👨‍🏫 Lecturer

Dashboard: all course offers taught by the lecturer.

Course Management

Upload/delete course files.

Create/delete homework (with optional attachment).

View enrolled students.

Grade homework submissions and set final course grades.

Forum: reply to student messages.

🛠️ Admin

Dashboard (cards UI)

Users: list and add users (student/lecturer).

Courses & Enrollments: create course offers, view capacity, add seats.

Students: browse students, view their courses, enroll them.

Student Tickets: review and respond to messages.

Add Course: lecturer, schedule, price, capacity.

Add User: full name, email, username, password, role.

🗺️ Key Flows
Student

Discover & register for courses with live capacity and pricing.

Follow a course: download materials, read announcements.

Submit homework: upload a PDF, see submission time and grade.

Talk to the lecturer via course forum.

Track finances in the tuition page and see grades centrally.

Lecturer

Publish materials and create assignments with due dates.

Monitor enrollment and grade both submissions and final course marks.

Support students directly in the forum.

Admin

Spin up offers (lecturer + schedule + capacity + price).

Add seats as demand grows.

Onboard users (students/lecturers).

Handle tickets from students.

🏗️ Architecture

Frontend: HTML, CSS, Vanilla JavaScript (responsive, dark theme, RTL/LTR aware).

Backend: Node.js + Express (REST API).

Database: PostgreSQL.

Uploads: stored under uploads/, served statically.

Auth: email + password (bcrypt). Server records last_login.

Client state: localStorage for userId, userName, role, previous last_login, image.

🗂️ Project Structure
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

🧾 Data Model (overview)

users — id, full_name, email, password (bcrypt), role (student|lecturer|admin), created_at, last_login, image_url?

courses — id, name, price, …

course_offers — offer_id, course_id, lecturer_id, schedule, max_seats, remaining_seats

enrollments — student_id, offer_id, enrolled_at

course_files — id, offer_id, file_path, original_name, uploaded_at

homework — id, course_offer_id, title, description, due_date, file_path?

submissions — id, assignment_id, student_id, file_path, submitted_at, grade?

messages (forum) — offer_id, sender_id, sender_role, message, timestamp

grades — final course grades per student_id + offer_id

🔌 API Surface (summary)

Auth: POST /api/login

Student: GET /api/my-courses/:id, GET /api/courses, POST/DELETE /api/enroll, GET /api/tuition/:id, GET /api/grades/:id, course files, homework (list/submit), forum (list/post).

Lecturer: own courses, course students, files CRUD, homework CRUD, submissions & grading, final grades.

Admin: users, lecturers, create course, admin courses (+ add seats), students, student tickets + respond.

✨ UX Notes

Card-based layouts, soft shadows, rounded corners.

Accessible buttons & focus states; keyboard-friendly.

Lightweight frontend with no heavy framework.

Consistent palette across roles.

📄 License

MIT (or your preferred license).
