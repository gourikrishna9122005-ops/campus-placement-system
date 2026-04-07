const express = require('express');
const prisma = require('../db');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/adminOnly');
const { checkEligibility } = require('./applications');

const router = express.Router();

// ── Helper: map student to PascalCase (never return password_hash) ──
function mapStudent(s) {
  return {
    StudentID: s.student_id,
    Name: s.name,
    Email: s.email,
    Phone: s.phone || '',
    Branch: s.branch,
    CGPA: parseFloat(s.cgpa),
    Backlogs: s.backlogs,
    PassingYear: s.passing_year,
    Skills: s.skills || '',
    ResumeURL: s.resume_url || '',
  };
}

// ── GET /api/students — Admin only ──
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      orderBy: { created_at: 'desc' },
    });
    return res.json(students.map(mapStudent));
  } catch (err) {
    console.error('Get all students error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching students' });
  }
});

// ── PATCH /api/students/:studentId — JWT required ──
router.patch('/:studentId', requireAuth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { phone, cgpa, backlogs, skills, resumeURL } = req.body;

    const student = await prisma.student.findUnique({ where: { student_id: studentId } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Build update data — only allow specific fields
    const updateData = {};
    if (phone !== undefined) updateData.phone = phone;
    if (cgpa !== undefined) updateData.cgpa = parseFloat(cgpa);
    if (backlogs !== undefined) updateData.backlogs = parseInt(backlogs);
    if (skills !== undefined) updateData.skills = skills;
    if (resumeURL !== undefined) updateData.resume_url = resumeURL;

    await prisma.student.update({
      where: { student_id: studentId },
      data: updateData,
    });

    return res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    console.error('Update student error:', err);
    return res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
});

// ── GET /api/students/:studentId/applications — JWT required ──
router.get('/:studentId/applications', requireAuth, async (req, res) => {
  try {
    const { studentId } = req.params;

    const apps = await prisma.application.findMany({
      where: { student_id: studentId },
      orderBy: { applied_at: 'desc' },
    });

    return res.json(
      apps.map((a) => ({
        AppID: a.app_id,
        JobID: a.job_id,
        JobTitle: a.job_title,
        CompanyName: a.company_name,
        AppliedAt: a.applied_at,
        Status: a.status,
        AdminRemarks: a.admin_remarks || '',
      }))
    );
  } catch (err) {
    console.error('Get student applications error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching applications' });
  }
});

// ── GET /api/students/:studentId/eligibility/:jobId — JWT required ──
router.get('/:studentId/eligibility/:jobId', requireAuth, async (req, res) => {
  try {
    const { studentId, jobId } = req.params;

    const student = await prisma.student.findUnique({ where: { student_id: studentId } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const job = await prisma.job.findUnique({ where: { job_id: jobId } });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const result = checkEligibility(student, job);
    return res.json(result);
  } catch (err) {
    console.error('Eligibility check error:', err);
    return res.status(500).json({ success: false, message: 'Server error checking eligibility' });
  }
});

module.exports = router;
