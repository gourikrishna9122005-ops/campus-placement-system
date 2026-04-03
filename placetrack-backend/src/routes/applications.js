const express = require('express');
const prisma = require('../db');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/adminOnly');

const router = express.Router();

// ── Eligibility check (shared logic) ──
function checkEligibility(student, job) {
  const reasons = [];

  // 1. CGPA check
  if (parseFloat(student.cgpa) < parseFloat(job.min_cgpa)) {
    reasons.push(`CGPA ${student.cgpa} below required ${job.min_cgpa}`);
  }

  // 2. Backlog check
  if (parseInt(student.backlogs) > parseInt(job.max_backlogs)) {
    reasons.push(`${student.backlogs} active backlogs exceeds allowed ${job.max_backlogs}`);
  }

  // 3. Branch check (empty = open to all)
  if (job.allowed_branches && job.allowed_branches.trim() !== '') {
    const allowed = job.allowed_branches.split(',').map((b) => b.trim());
    if (!allowed.includes(student.branch)) {
      reasons.push(`Branch ${student.branch} not in allowed list`);
    }
  }

  // 4. Deadline check
  if (new Date(job.deadline) < new Date()) {
    reasons.push('Application deadline has passed');
  }

  // 5. Job status check
  if (job.status !== 'Active') {
    reasons.push('This job is no longer accepting applications');
  }

  return { eligible: reasons.length === 0, reasons };
}

// ── Helper: generate application ID ──
async function genAppId() {
  const year = new Date().getFullYear();
  const count = await prisma.application.count();
  return `APP-${year}-${String(count + 1).padStart(4, '0')}`;
}

// ── POST /api/applications — JWT required ──
router.post('/', requireAuth, async (req, res) => {
  try {
    const { studentId, jobId } = req.body;

    if (!studentId || !jobId) {
      return res.status(400).json({ success: false, message: 'studentId and jobId are required' });
    }

    // Fetch student and job
    const student = await prisma.student.findUnique({ where: { student_id: studentId } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const job = await prisma.job.findUnique({ where: { job_id: jobId } });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Server-side eligibility check
    const { eligible, reasons } = checkEligibility(student, job);
    if (!eligible) {
      return res.status(400).json({ success: false, message: `Not eligible: ${reasons.join('; ')}` });
    }

    // Check for duplicate application
    const existing = await prisma.application.findUnique({
      where: { student_id_job_id: { student_id: studentId, job_id: jobId } },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already applied for this job' });
    }

    // Create application
    const app_id = await genAppId();
    await prisma.application.create({
      data: {
        app_id,
        student_id: studentId,
        student_name: student.name,
        job_id: jobId,
        job_title: job.title,
        company_name: job.company_name,
        status: 'Applied',
      },
    });

    return res.status(201).json({ success: true, message: 'Application submitted!' });
  } catch (err) {
    console.error('Apply error:', err);
    return res.status(500).json({ success: false, message: 'Server error submitting application' });
  }
});

// ── GET /api/applications — Admin only ──
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const apps = await prisma.application.findMany({
      orderBy: { applied_at: 'desc' },
    });

    return res.json(
      apps.map((a) => ({
        AppID: a.app_id,
        StudentID: a.student_id,
        StudentName: a.student_name,
        JobID: a.job_id,
        JobTitle: a.job_title,
        CompanyName: a.company_name,
        AppliedAt: a.applied_at,
        Status: a.status,
        AdminRemarks: a.admin_remarks || '',
      }))
    );
  } catch (err) {
    console.error('Get all applications error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching applications' });
  }
});

// ── PATCH /api/applications/:appId/status — Admin only ──
router.patch('/:appId/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { appId } = req.params;
    const { status, remarks } = req.body;

    const validStatuses = ['Applied', 'Shortlisted', 'Selected', 'Rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const app = await prisma.application.findUnique({ where: { app_id: appId } });
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    await prisma.application.update({
      where: { app_id: appId },
      data: {
        status,
        admin_remarks: remarks || app.admin_remarks,
      },
    });

    return res.json({ success: true, message: `Application status updated to ${status}` });
  } catch (err) {
    console.error('Update application status error:', err);
    return res.status(500).json({ success: false, message: 'Server error updating application' });
  }
});

// Export the eligibility check for use in students route
module.exports = router;
module.exports.checkEligibility = checkEligibility;
