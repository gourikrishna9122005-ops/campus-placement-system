const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');

const router = express.Router();

// ── Helper: generate student ID ──
async function genStudentId() {
  const year = new Date().getFullYear();
  const lastStudent = await prisma.student.findFirst({
    where: { student_id: { startsWith: `STU-${year}-` } },
    orderBy: { student_id: 'desc' },
  });

  if (!lastStudent) return `STU-${year}-0001`;

  const parts = lastStudent.student_id.split('-');
  const lastCount = parts.length === 3 ? parseInt(parts[2], 10) : 0;
  return `STU-${year}-${String(lastCount + 1).padStart(4, '0')}`;
}

// ── POST /api/auth/student/register ──
router.post('/student/register', async (req, res) => {
  try {
    const { name, email, phone, branch, cgpa, backlogs, passingYear, password, skills, resumeURL } = req.body;

    // Validate required fields
    if (!name || !email || !branch || cgpa === undefined || !passingYear || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields: name, email, branch, cgpa, passingYear, password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check email uniqueness
    const existing = await prisma.student.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const password_hash = await bcrypt.hash(password, rounds);

    // Generate ID
    const student_id = await genStudentId();

    // Insert
    await prisma.student.create({
      data: {
        student_id,
        name,
        email,
        phone: phone || null,
        branch,
        cgpa: parseFloat(cgpa),
        backlogs: parseInt(backlogs) || 0,
        passing_year: parseInt(passingYear),
        password_hash,
        skills: skills || null,
        resume_url: resumeURL || null,
      },
    });

    return res.status(201).json({ success: true, message: 'Registration successful!' });
  } catch (err) {
    console.error('Register error:', err);
    // Return a more specific error message
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'A student with this email or ID already exists.' });
    }
    if (err.message && err.message.includes("Can't reach database")) {
      return res.status(503).json({ success: false, message: 'Database is waking up. Please try again in a few seconds.' });
    }
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// ── POST /api/auth/student/login ──
router.post('/student/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const student = await prisma.student.findUnique({ where: { email } });
    if (!student) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, student.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: student.student_id, role: 'student', email: student.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return PascalCase keys (never return password_hash)
    return res.json({
      success: true,
      token,
      student: {
        StudentID: student.student_id,
        Name: student.name,
        Email: student.email,
        Phone: student.phone || '',
        Branch: student.branch,
        CGPA: parseFloat(student.cgpa),
        Backlogs: student.backlogs,
        PassingYear: student.passing_year,
        Skills: student.skills || '',
        ResumeURL: student.resume_url || '',
      },
    });
  } catch (err) {
    console.error('Student login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// ── POST /api/auth/admin/login ──
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate JWT with admin role
    const token = jwt.sign(
      { id: admin.admin_id, role: 'admin', email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      success: true,
      token,
      admin: {
        Name: admin.name,
        Email: admin.email,
      },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

module.exports = router;
