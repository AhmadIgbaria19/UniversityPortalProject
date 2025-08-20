const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const path = require('path'); // ✅ חשוב!
require('dotenv').config();

const app = express(); // ✅ קודם מגדירים את app

app.use(cors());
app.use(express.json());

// ✅ אחר כך מגדירים את הגישה לתיקיית uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// الاتصال مع قاعدة البيانات
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // בדיקת תקינות קלט
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'يرجى إدخال البريد وكلمة المرور' });

  try {
    // חיפוש המשתמש לפי אימייל
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'البريد الإلكتروني غير موجود' });
    }

    const user = result.rows[0];

    // השוואת סיסמה
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'كلمة المرور غير صحيحة' });
    }

    // שמור את זמן ההתחברות הקודם לפני העדכון
    const previousLogin = user.last_login;

    // עדכן את זמן ההתחברות הנוכחי
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // החזרת תגובה עם מידע מלא
    res.json({
      success: true,
      role: user.role,
      name: user.full_name,
      id: user.id,
      image: user.image_url,         // אם יש לך תמונה
      last_login: previousLogin      // מחזיר את ההתחברות הקודמת
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, message: 'حدث خطأ في السيرفر' });
  }
});


// 📘 API الكورسات المفتوحة للتسجيل
app.get('/api/courses', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT course_offers.id as offer_id, courses.name, users.full_name AS lecturer,
             schedule, price, remaining_seats
      FROM course_offers
      JOIN courses ON course_offers.course_id = courses.id
      JOIN users ON course_offers.lecturer_id = users.id
      WHERE remaining_seats > 0
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Fetch Courses Error:', err);
    res.status(500).json({ success: false, message: "خطأ في جلب الكورسات" });
  }
});


// 📝 API لتسجيل الطالب في كورس
app.post('/api/enroll', async (req, res) => {
  const { student_id, offer_id } = req.body;
  if (!student_id || !offer_id)
    return res.status(400).json({ success: false, message: "بيانات ناقصة" });

  try {
    const offerCheck = await pool.query(
      'SELECT remaining_seats FROM course_offers WHERE id = $1',
      [offer_id]
    );

    if (offerCheck.rows.length === 0 || offerCheck.rows[0].remaining_seats <= 0) {
      return res.json({ success: false, message: "لم يتبقى أماكن متاحة لهذا הקורס." });
    }

    const alreadyEnrolled = await pool.query(
      'SELECT * FROM enrollments WHERE student_id = $1 AND course_offer_id = $2',
      [student_id, offer_id]
    );

    if (alreadyEnrolled.rows.length > 0) {
      return res.json({ success: false, message: "أنت مسجل بالفعل في هذا הקורס." });
    }

    await pool.query(
      'INSERT INTO enrollments (student_id, course_offer_id) VALUES ($1, $2)',
      [student_id, offer_id]
    );

    await pool.query(
      'UPDATE course_offers SET remaining_seats = remaining_seats - 1 WHERE id = $1',
      [offer_id]
    );

    res.json({ success: true, message: "تم التسجيل في הקורס بنجاح!" });

  } catch (err) {
    console.error('Enrollment Error:', err);
    res.status(500).json({ success: false, message: "حدث خطأ أثناء التسجيل." });
  }
});


// ✅ NEW: API لجلب الكورسات المسجلة لطالب معيّن
app.get('/api/my-courses/:studentId', async (req, res) => {
  const { studentId } = req.params;

  if (!studentId)
    return res.status(400).json({ success: false, message: "رقم الطالب مفقود" });

  try {
    const result = await pool.query(`
      SELECT course_offers.id AS offer_id, courses.name, users.full_name AS lecturer, schedule
      FROM enrollments
      JOIN course_offers ON enrollments.course_offer_id = course_offers.id
      JOIN courses ON course_offers.course_id = courses.id
      JOIN users ON course_offers.lecturer_id = users.id
      WHERE enrollments.student_id = $1
    `, [studentId]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('My Courses Error:', err);
    res.status(500).json({ success: false, message: "فشل في تحميل الكورسات المسجلة" });
  }
});
// 📊 API لحساب שכר לימוד
app.get('/api/tuition/:studentId', async (req, res) => {
  const { studentId } = req.params;

  try {
    const result = await pool.query(`
      SELECT courses.name, course_offers.price
      FROM enrollments
      JOIN course_offers ON enrollments.course_offer_id = course_offers.id
      JOIN courses ON course_offers.course_id = courses.id
      WHERE enrollments.student_id = $1
    `, [studentId]);

    const courses = result.rows;
    const total = courses.reduce((sum, course) => sum + Number(course.price), 0);

    res.json({ success: true, data: courses, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "فشل في حساب שכר לימוד" });
  }
});

// ❌ API لحذف التسجيل
app.delete('/api/enroll', async (req, res) => {
  const { student_id, offer_id } = req.body;

  try {
    const deletion = await pool.query(
      'DELETE FROM enrollments WHERE student_id = $1 AND course_offer_id = $2',
      [student_id, offer_id]
    );

    // فقط إذا تم حذف فعلي
    if (deletion.rowCount > 0) {
      await pool.query(
        'UPDATE course_offers SET remaining_seats = remaining_seats + 1 WHERE id = $1',
        [offer_id]
      );
      res.json({ success: true, message: "تم إلغاء التسجيل بنجاح" });
    } else {
      res.json({ success: false, message: "لم تكن مسجلًا بهذا الكورس" });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "فشل في إلغاء التسجيل" });
  }
});
// ✅ API لجلب علامات الطالب
app.get('/api/grades/:studentId', async (req, res) => {
  const { studentId } = req.params;

  try {
const result = await pool.query(`
  SELECT co.id AS offer_id, c.name, u.full_name AS lecturer, g.grade
  FROM enrollments e
  JOIN course_offers co ON e.course_offer_id = co.id
  JOIN courses c ON co.course_id = c.id
  JOIN users u ON co.lecturer_id = u.id
  LEFT JOIN grades g ON g.student_id = e.student_id AND g.course_offer_id = co.id
  WHERE e.student_id = $1
`, [studentId]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "فشل في تحميل العلامات" });
  }
});




app.post('/api/grades', async (req, res) => {
  const { student_id, offer_id, grade } = req.body;

  try {
    await pool.query(`
      INSERT INTO grades (student_id, course_offer_id, grade)
      VALUES ($1, $2, $3)
      ON CONFLICT (student_id, course_offer_id)
      DO UPDATE SET grade = EXCLUDED.grade
    `, [student_id, offer_id, grade]);

    res.json({ success: true, message: "הציון נשמר בהצלחה" });
  } catch (err) {
    console.error("Error saving grade:", err);
    res.status(500).json({ success: false, message: "שגיאה בשמירת ציון" });
  }
});

// 📘 קורסים שמועברים ע"י מרצה מסוים
app.get('/api/lecturer-courses/:lecturerId', async (req, res) => {
  const { lecturerId } = req.params;
  try {
    const result = await pool.query(`
      SELECT course_offers.id AS offer_id, courses.name, schedule,
             (SELECT COUNT(*) FROM enrollments WHERE course_offer_id = course_offers.id) AS num_students
      FROM course_offers
      JOIN courses ON course_offers.course_id = courses.id
      WHERE course_offers.lecturer_id = $1
    `, [lecturerId]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Lecturer Courses Error:", err);
    res.status(500).json({ success: false, message: "שגיאה בטעינת הקורסים" });
  }
});

const multer = require('multer');

// אחסון קבצים זמני בתיקייה uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// 📥 העלאת קובץ מהמרצה
app.post('/api/course-files', upload.single('file'), async (req, res) => {
  const { offer_id, lecturer_id } = req.body;

  try {
    await pool.query(
      'INSERT INTO course_files (course_offer_id, lecturer_id, file_path) VALUES ($1, $2, $3)',
      [offer_id, lecturer_id, req.file.filename]
    );
    res.json({ success: true, message: 'הקובץ הועלה בהצלחה!' });
  } catch (err) {
    console.error('Upload File Error:', err);
    res.status(500).json({ success: false, message: 'שגיאה בהעלאת קובץ' });
  }
});

app.get('/api/course-students/:offerId', async (req, res) => {
  const { offerId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.full_name,
        u.email,
        g.grade
      FROM users u
      JOIN enrollments e ON u.id = e.student_id
      LEFT JOIN grades g ON g.student_id = u.id AND g.course_offer_id = $1
      WHERE e.course_offer_id = $1
    `, [offerId]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error loading students', err);
    res.status(500).json({ success: false });
  }
});



// 📥 העלאת קובץ מהמרצה
// 📥 העלאת קובץ מהמרצה
app.post('/api/course-files', upload.single('file'), async (req, res) => {
  const { offer_id, lecturer_id } = req.body;

  // בדיקה שהקובץ קיים
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'לא נשלח קובץ' });
  }

  try {
    const filePath = req.file.filename;
    const originalName = req.file.originalname;

    await pool.query(
      `INSERT INTO course_files (course_offer_id, lecturer_id, file_path, original_name) 
       VALUES ($1, $2, $3, $4)`,
      [offer_id, lecturer_id, filePath, originalName]
    );

    res.json({ success: true, message: 'הקובץ הועלה בהצלחה!' });

  } catch (err) {
    console.error('Upload File Error:', err);
    res.status(500).json({ success: false, message: 'שגיאה בהעלאת קובץ' });
  }
});

app.get('/api/course-files/:offerId', async (req, res) => {
  const { offerId } = req.params;

  try {
    const result = await pool.query(`
      SELECT file_path, original_name
      FROM course_files
      WHERE course_offer_id = $1
    `, [offerId]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Fetch Course Files Error:', err);
    res.status(500).json({ success: false, message: 'שגיאה בטעינת קבצים' });
  }
});

const fs = require("fs");

const hwStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/homeworks";  // הגדרת תיקיית השמירה
    fs.mkdirSync(dir, { recursive: true });  // יצירת התיקייה אם היא לא קיימת
    cb(null, dir);  // שמירה בתיקיית uploads/homeworks
  },
  filename: (req, file, cb) => {
    // השתמש בשם המקורי של הקובץ (file.originalname)
    cb(null, file.originalname); // שינוי השם לשם הקובץ המקורי
  }
});

const uploadHW = multer({ storage: hwStorage });

app.post("/api/homework", uploadHW.single("file"), async (req, res) => {
  const { course_offer_id, title, description, due_date } = req.body;
  const filePath = req.file ? req.file.filename : null;

  if (!course_offer_id || !title || !due_date) {
    return res.status(400).json({ success: false, message: "נתונים חסרים" });
  }

  try {
    await pool.query(`
      INSERT INTO homework_assignments (course_offer_id, title, description, due_date, file_path)
      VALUES ($1, $2, $3, $4, $5)
    `, [course_offer_id, title, description, due_date, filePath]);

    res.json({ success: true, message: "תרגיל הבית נוסף בהצלחה" });
  } catch (err) {
    console.error("Error adding homework:", err);
    res.status(500).json({ success: false, message: "שגיאה בהוספת תרגיל הבית" });
  }
});


app.get('/api/homework/:offerId', async (req, res) => {
  const offerId = req.params.offerId;

  try {
    const result = await pool.query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.due_date,
        a.file_path,  -- ✅ הוספה חשובה
        a.is_closed,
        COUNT(s.id) AS submission_count
      FROM homework_assignments a
      LEFT JOIN homework_submissions s ON a.id = s.assignment_id
      WHERE a.course_offer_id = $1
      GROUP BY a.id
      ORDER BY a.due_date ASC
    `, [offerId]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching homework assignments:", err);
    res.status(500).json({ success: false, message: "שגיאה בשליפת תרגילים" });
  }
});

app.delete('/api/homework/:assignmentId', async (req, res) => {
  const { assignmentId } = req.params;

  try {
    // מחיקת ההגשות תחילה (אם קיימות)
    await pool.query(`DELETE FROM homework_submissions WHERE assignment_id = $1`, [assignmentId]);

    // מחיקת התרגיל עצמו
    await pool.query(`DELETE FROM homework_assignments WHERE id = $1`, [assignmentId]);

    res.json({ success: true, message: "התרגיל נמחק בהצלחה" });
  } catch (err) {
    console.error("Error deleting homework assignment:", err);
    res.status(500).json({ success: false, message: "שגיאה במחיקת התרגיל" });
  }
});


// ✅ שלב 5: סגירת הגשה של תרגיל
app.post('/api/homework/close/:assignmentId', async (req, res) => {
  const assignmentId = req.params.assignmentId;

  try {
    await pool.query(`
      UPDATE homework_assignments
      SET is_closed = true
      WHERE id = $1
    `, [assignmentId]);

    res.json({ success: true, message: "תיבת ההגשה נסגרה בהצלחה" });
  } catch (err) {
    console.error("Error closing assignment:", err);
    res.status(500).json({ success: false, message: "שגיאה בסגירת התרגיל" });
  }
});


app.get("/api/homework-submissions/:homeworkId", async (req, res) => {
  const homeworkId = req.params.homeworkId;
  try {
    const query = `
    SELECT 
        hs.id AS submission_id,
        hs.file_path,
        hs.submitted_at,
        hs.grade,
        u.full_name,
        u.email,
        u.id AS student_id
    FROM homework_submissions hs
    JOIN users u ON u.id = hs.student_id
    WHERE hs.assignment_id = $1
    ORDER BY hs.submitted_at DESC
    `;

    const result = await pool.query(query, [homeworkId]);

    console.log("✅ Submissions fetched:", result.rows); // ✅ הוספנו

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("❌ Error fetching submissions:", err); // ✅ נראה את השגיאה
    res.status(500).json({ success: false, message: "שגיאה בטעינת ההגשות" });
  }
});


// 🔽 עדכון ציון של הגשה מסוימת
app.post("/api/homework-submissions/grade", async (req, res) => {
  const { submission_id, grade } = req.body;
  try {
    await pool.query(
      `UPDATE homework_submissions SET grade = $1 WHERE id = $2`,
      [grade, submission_id]
    );
    res.json({ success: true, message: "הציון נשמר בהצלחה" });
  } catch (err) {
    console.error("Error updating grade:", err);
    res.status(500).json({ success: false, message: "שגיאה בשמירת הציון" });
  }
});


app.post("/api/submit-homework", uploadHW.single("file"), async (req, res) => {
  const { assignment_id, student_id } = req.body;
  const filePath = req.file ? req.file.originalname : null;  // השתמש בשם המקורי של הקובץ

  if (!assignment_id || !student_id || !filePath) {
    return res.status(400).json({ success: false, message: "נתונים חסרים" });
  }

  try {
    // שמירת קובץ ההגשה עם שם הקובץ המקורי
    await pool.query(`
      INSERT INTO homework_submissions (assignment_id, student_id, file_path, submitted_at)
      VALUES ($1, $2, $3, NOW())
    `, [assignment_id, student_id, filePath]);

    res.json({ success: true, message: "ההגשה בוצעה בהצלחה" });
  } catch (err) {
    console.error("Error submitting homework:", err);
    res.status(500).json({ success: false, message: "שגיאה בהגשה" });
  }
});


app.get('/api/submission/:assignmentId/:studentId', async (req, res) => {
  const { assignmentId, studentId } = req.params;

  try {
    const result = await pool.query(`
      SELECT id, file_path, submitted_at, grade 
      FROM homework_submissions 
      WHERE assignment_id = $1 AND student_id = $2
    `, [assignmentId, studentId]);

    res.json({ success: true, data: result.rows[0] || null });

  } catch (err) {
    console.error("Error fetching submission:", err);
    res.status(500).json({ success: false, message: "שגיאה בטעינת ההגשה" });
  }
});

app.delete('/api/submission/:submissionId', async (req, res) => {
  const { submissionId } = req.params;

  try {
    await pool.query(`
      DELETE FROM homework_submissions WHERE id = $1
    `, [submissionId]);

    res.json({ success: true, message: "ההגשה נמחקה בהצלחה" });
  } catch (err) {
    console.error("Error deleting submission:", err);
    res.status(500).json({ success: false, message: "שגיאה במחיקת ההגשה" });
  }
});


// 📄 שליפת כל המשתמשים (סטודנטים ומרצים בלבד)
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, full_name, email, role FROM users WHERE role IN ('student', 'lecturer') ORDER BY full_name"
    );
    res.json({ success: true, users: result.rows });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: "שגיאה בשרת" });
  }
});


app.post("/api/add-user", async (req, res) => {
  const { full_name, email, password, role } = req.body;

  if (!full_name || !email || !password || !role) {
    return res.json({ success: false, message: "חסרים נתונים" });
  }

  try {
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.json({ success: false, message: "דוא\"ל כבר קיים" });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, $4)",
      [full_name, email, hash, role]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("שגיאה בהוספה:", err);
    res.status(500).json({ success: false, message: "שגיאה בשרת" });
  }
});

// 📌 שליפת רשימת הקורסים להנהלה
app.get('/api/admin/courses', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT co.id AS offer_id, c.name AS course_name, u.full_name AS lecturer_name, 
             co.schedule, co.max_seats, co.remaining_seats
      FROM course_offers co
      JOIN courses c ON co.course_id = c.id
      JOIN users u ON co.lecturer_id = u.id
      ORDER BY co.id ASC
    `);
    res.json({ success: true, courses: result.rows });
  } catch (err) {
    console.error("Error loading courses:", err);
    res.status(500).json({ success: false });
  }
});

// 📌 הוספת מקומות לקורס
app.put('/api/admin/add-seats/:offerId', async (req, res) => {
  const { offerId } = req.params;
  const { addSeats } = req.body;

  try {
    await pool.query(`
      UPDATE course_offers 
      SET max_seats = max_seats + $1, remaining_seats = remaining_seats + $1
      WHERE id = $2
    `, [addSeats, offerId]);

    res.json({ success: true });
  } catch (err) {
    console.error("Error adding seats:", err);
    res.status(500).json({ success: false });
  }
});

app.get('/api/lecturers', async (req, res) => {
  try {
    const result = await pool.query("SELECT id, full_name FROM users WHERE role = 'lecturer'");
    res.json({ success: true, lecturers: result.rows });
  } catch (err) {
    console.error("Lecturers Fetch Error:", err);
    res.status(500).json({ success: false, message: 'שגיאה בשרת' });
  }
});

app.post('/api/add-course', async (req, res) => {
  const { courseName, lecturerId, schedule, price, maxSeats } = req.body;

  try {
    // שלב 1: הוספת שם הקורס (אם לא קיים כבר)
    const courseInsert = await pool.query(
      'INSERT INTO courses (name) VALUES ($1) RETURNING id',
      [courseName]
    );

    const courseId = courseInsert.rows[0].id;

    // שלב 2: הוספת להצעת הקורס (course_offers)
    await pool.query(
      `INSERT INTO course_offers (course_id, lecturer_id, schedule, price, max_seats, remaining_seats)
       VALUES ($1, $2, $3, $4, $5, $5)`,
      [courseId, lecturerId, schedule, price, maxSeats]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Add Course Error:", err);
    res.status(500).json({ success: false, message: 'שגיאה בשרת' });
  }
});

app.get('/api/course-registrations/:offerId', async (req, res) => {
  const offerId = req.params.offerId;

  try {
    const result = await pool.query(`
      SELECT u.full_name, u.email, e.submitted_at AS enrolled_at, e.grade
      FROM enrollments e
      JOIN users u ON u.id = e.student_id
      WHERE e.course_offer_id = $1
    `, [offerId]);

    res.json({ success: true, students: result.rows });
  } catch (err) {
    console.error("Fetch Course Students Error:", err);
    res.status(500).json({ success: false, message: "שגיאת שרת" });
  }
});




// 📌 שליפת כל הסטודנטים
app.get('/api/admin/students', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, full_name, email FROM users WHERE role = 'student'"
    );
    res.json({ success: true, students: result.rows });
  } catch (err) {
    console.error("Error loading students:", err);
    res.status(500).json({ success: false, message: "שגיאת שרת" });
  }
});

// 📌 קורסים שהסטודנט רשום אליהם
app.get("/api/student/enrolled/:studentId", async (req, res) => {
  const studentId = req.params.studentId;
  try {
    const result = await pool.query(`
      SELECT c.name AS course_name, o.schedule, u.full_name AS lecturer_name, e.grade
      FROM enrollments e
      JOIN course_offers o ON e.course_offer_id = o.id
      JOIN courses c ON o.course_id = c.id
      JOIN users u ON o.lecturer_id = u.id
      WHERE e.student_id = $1
    `, [studentId]);

    res.json({ success: true, courses: result.rows });
  } catch (err) {
    console.error("Enrolled Courses Error:", err);
    res.status(500).json({ success: false });
  }
});

// 📌 קורסים שעדיין לא רשום אליהם
app.get("/api/student/available-courses/:studentId", async (req, res) => {
  const studentId = req.params.studentId;
  try {
    const result = await pool.query(`
      SELECT o.id AS offer_id, c.name AS course_name, o.schedule
      FROM course_offers o
      JOIN courses c ON o.course_id = c.id
      WHERE o.id NOT IN (
        SELECT course_offer_id FROM enrollments WHERE student_id = $1
      )
    `, [studentId]);

    res.json({ success: true, courses: result.rows });
  } catch (err) {
    console.error("Available Courses Error:", err);
    res.status(500).json({ success: false });
  }
});

// 📌 רישום סטודנט לקורס
app.post("/api/student/enroll", async (req, res) => {
  const { studentId, offerId } = req.body;
  try {
    // בדיקה אם כבר רשום
    const check = await pool.query(`
      SELECT * FROM enrollments WHERE student_id = $1 AND course_offer_id = $2
    `, [studentId, offerId]);

    if (check.rows.length > 0) {
      return res.json({ success: false, message: "כבר רשום לקורס זה" });
    }

    // רישום בפועל
    await pool.query(`
      INSERT INTO enrollments (student_id, course_offer_id, submitted_at)
      VALUES ($1, $2, NOW())
    `, [studentId, offerId]);

    res.json({ success: true });
  } catch (err) {
    console.error("Enroll Error:", err);
    res.status(500).json({ success: false });
  }
});

app.post("/api/student/message", async (req, res) => {
  const { studentId, message } = req.body;
  try {
    await pool.query(
      "INSERT INTO student_messages (student_id, message) VALUES ($1, $2)",
      [studentId, message]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Message Submit Error:", err);
    res.status(500).json({ success: false });
  }
});

app.get("/api/admin/messages", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.id, m.message, m.sent_at, u.full_name, u.email
      FROM student_messages m
      JOIN users u ON m.student_id = u.id
      ORDER BY m.sent_at DESC
    `);
    res.json({ success: true, messages: result.rows });
  } catch (err) {
    console.error("Admin Message Fetch Error:", err);
    res.status(500).json({ success: false });
  }
});
app.post('/api/admin/respond', async (req, res) => {
  const { messageId, response } = req.body;
  try {
    await pool.query(
      'UPDATE student_messages SET admin_response = $1 WHERE id = $2',
      [response, messageId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Admin response error:", err);
    res.status(500).json({ success: false });
  }
});

app.post('/api/admin/respond', async (req, res) => {
  const { messageId, response } = req.body;
  try {
    await pool.query(
      'UPDATE student_messages SET admin_response = $1 WHERE id = $2',
      [response, messageId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Admin response error:", err);
    res.status(500).json({ success: false });
  }
});


app.get("/api/student/messages/:studentId", async (req, res) => {
  const { studentId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM student_messages WHERE student_id = $1 ORDER BY sent_at DESC",
      [studentId]
    );
    res.json({ success: true, messages: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// 📨 שליחת הודעה חדשה לפורום הקורס
app.post("/api/course-messages", async (req, res) => {
  const { offer_id, user_id, message } = req.body; // שים לב: offer_id במקום course_id
  try {
    const result = await pool.query(
      "INSERT INTO course_messages (offer_id, user_id, message, timestamp) VALUES ($1, $2, $3, NOW()) RETURNING *",
      [offer_id, user_id, message]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
});


// 📩 קבלת כל ההודעות בפורום לפי קורס (offer_id)
app.get("/api/course-messages/:offerId", async (req, res) => {
  const offerId = req.params.offerId;
  try {
    const result = await pool.query(`
      SELECT cm.*, u.full_name
      FROM course_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.offer_id = $1
      ORDER BY cm.timestamp ASC
    `, [offerId]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, error: "Failed to load messages" });
  }
});

// 💬 שליחת הודעה לפורום
app.post("/api/messages", async (req, res) => {
  const { offer_id, sender_id, content, sender_role } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO course_messages (offer_id, user_id, message, timestamp, sender_role)
      VALUES ($1, $2, $3, NOW(), $4)
      RETURNING *`,
      [offer_id, sender_id, content, sender_role]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
});

// 💬 שליפת הודעות של פורום לפי offer_id
app.get("/api/messages/:offerId", async (req, res) => {
  const offerId = req.params.offerId;

  try {
    const result = await pool.query(`
      SELECT cm.*, u.full_name
      FROM course_messages cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.offer_id = $1
      ORDER BY cm.timestamp ASC
    `, [offerId]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, error: "Failed to load messages" });
  }
});

app.get("/api/lecturer/course-students/:offerId", async (req, res) => {
  const offerId = req.params.offerId;

  try {
    const result = await pool.query(`
      SELECT u.full_name, u.email, e.submitted_at AS enrolled_at, e.grade
      FROM enrollments e
      JOIN users u ON u.id = e.student_id
      WHERE e.course_offer_id = $1
    `, [offerId]);

    res.json({ success: true, students: result.rows });
  } catch (err) {
    console.error("Lecturer View Students Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



// 🎧 تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
