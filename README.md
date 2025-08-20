University Portal

🎥 7-minute product demo ( https://www.youtube.com/watch?v=j7cswS5_og4 )

A full university portal for Students, Lecturers, and Admin.
Students register for courses, download materials, submit homework, check grades & tuition, and message via a course forum.
Lecturers manage course content, assignments, submissions, and grades.
Admins manage users, courses, seats, and student tickets — all in one place.

What each role can do
👨‍🎓 Student

My Courses dashboard – beautiful course cards with name, lecturer, and schedule.

Register / Cancel courses – shows price, schedule, and remaining seats in real time.

Course page (student)

Download course files uploaded by the lecturer.

View homework assignments (title, description, due date, optional file).

Submit homework as a PDF; see your previous submission, timestamp, grade (if given), and delete/replace it.

Course forum – post messages and read replies from the lecturer and classmates.

See your personal grade for the course (when available).

Tuition – an automatic sum of your enrolled courses.

Grades – a simple table of final grades per course (“Not yet assigned” when empty).

Contact Admin – send a ticket, view your previous tickets, and see admin responses.

👨‍🏫 Lecturer

Lecturer dashboard – list of all the lecturer’s course offers.

Course page (lecturer)

Upload/delete course files.

Create/delete homework (title, description, due date, optional file).

View enrolled students.

Grade: set final course grades and/or grade homework submissions.

Forum – answer student questions.

🛠️ Admin

Admin dashboard (modern cards)

Users – view all users and add new users (student/lecturer).

Courses & Enrollments – create courses, view offers, add seats, see who’s enrolled.

Students – browse students, view a student’s courses, enroll a student.

Student Tickets – view and reply to messages sent by students.

Add Course – choose lecturer, schedule, price, and max seats.

Add User – full name, email, username, password, and role.

Increase Seats – update capacity for existing course offers.

Screenshots (placeholders)

Put your screenshots into docs/images/ and replace the file names below.

Login / Landing
Add a screenshot here
![Login](images/01-login.png)

Student – My Courses
Add a screenshot here
![Student Dashboard](images/02-student-dashboard.png)

Course Registration
Add a screenshot here
![Course Registration](images/03-course-registration.png)

Student Course Page (files / homework / forum)
Add a screenshot here
![Student Course](images/04-course-student-view.png)

Lecturer – Course Management
Add a screenshot here
![Lecturer Dashboard](images/05-lecturer-dashboard.png)

Admin – Dashboard & Tickets
Add a screenshot here
![Admin Dashboard](images/06-admin-dashboard.png)

Write a short 2–4 line explanation under each image describing what the user can do on that screen.

Architecture & Tech

Frontend: HTML, CSS, Vanilla JavaScript

Backend: Node.js + Express

Database: PostgreSQL

File uploads: stored under uploads/ and exposed as static files

Auth: email + password (bcrypt); server updates last_login at sign-in

Client state: localStorage (user id, name, role, previous last_login, image URL)

Quick start (local)
# 1) Clone and enter the project
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>

# 2) Install backend dependencies
npm install

# 3) Create a .env file (see example below)
#    Make sure your Postgres is up and a database is created.

# 4) Run the server (default http://localhost:3000)
npm start
# or
node server.js

# 5) Open the frontend
#    Option A: open the HTML files from /frontend/ in your browser
#    Option B: serve /frontend as static via Express or use a simple static server


The API base URL is http://localhost:3000/api.
If you use VS Code, the Live Server extension is convenient for the frontend.

.env example

Create a .env file in the backend root:

PORT=3000

# Option 1 – single URL:
DATABASE_URL=postgres://<user>:<password>@localhost:5432/<db_name>

# Option 2 – individual fields:
# PGHOST=localhost
# PGPORT=5432
# PGDATABASE=<db_name>
# PGUSER=<user>
# PGPASSWORD=<password>

UPLOADS_DIR=uploads
# JWT_SECRET=<add later if you introduce JWT>

Suggested folder layout
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


Keep your current structure if it’s already working; this is a clean reference.

Data model (short overview)

users: id, full_name, email, password (bcrypt), role (student|lecturer|admin), created_at, last_login, image_url?

courses: id, name, price, …

course_offers: id (offer_id), course_id, lecturer_id, schedule, max_seats, remaining_seats

enrollments: student_id, offer_id, enrolled_at

course_files: id, offer_id, file_path, original_name, uploaded_at

homework: id, course_offer_id, title, description, due_date, file_path?

submissions: id, assignment_id, student_id, file_path, submitted_at, grade?

messages (forum): id, offer_id, sender_id, sender_role, message/content, timestamp

grades (final): student_id, offer_id, grade

API endpoints (short summary)

Base: http://localhost:3000/api

Auth

POST /login – login (updates last_login, returns role, name, id, image, and previous last_login).

Student

GET /my-courses/:studentId – student’s courses.

GET /courses – available courses.

POST /enroll / DELETE /enroll – enroll/cancel.

GET /tuition/:studentId – tuition summary.

GET /grades/:studentId – grades table.

GET /course-files/:offerId – course files.

GET /homework/:offerId – assignments list.

POST /submit-homework – submit assignment (FormData).

DELETE /submission/:submissionId – delete submission.

Forum:

GET /messages/:offerId or GET /course-messages/:offerId

POST /course-messages (course_id/offer_id, user_id, message, role)

Lecturer

GET /lecturer-courses/:lecturerId (or /my-courses/:lecturerId)

GET /course-students/:offerId

POST /grades – save final course grade

POST /homework / DELETE /homework/:id

GET /homework-submissions/:homeworkId / POST /homework-submissions/grade

POST /course-files / DELETE /course-files/:filePath

Admin

GET /users / POST /add-user

GET /admin/courses / PUT /admin/add-seats/:offerId

GET /lecturers

POST /add-course

GET /admin/messages / POST /admin/respond

GET /admin/students

