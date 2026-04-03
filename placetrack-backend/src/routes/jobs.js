const express = require('express');
const prisma = require('../db');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/adminOnly');

const router = express.Router();

// ── Helper: map DB job row to PascalCase response ──
function mapJob(j) {
  return {
    JobID: j.job_id,
    Title: j.title,
    CompanyID: j.company_id,
    CompanyName: j.company_name,
    Description: j.description || '',
    Location: j.location,
    Package: j.package,
    JobType: j.job_type,
    MinCGPA: parseFloat(j.min_cgpa),
    MaxBacklogs: j.max_backlogs,
    AllowedBranches: j.allowed_branches || '',
    Deadline: j.deadline,
    Status: j.status,
    CreatedAt: j.created_at,
  };
}

// ── Helper: generate job ID ──
async function genJobId() {
  const year = new Date().getFullYear();
  const count = await prisma.job.count();
  return `JOB-${year}-${String(count + 1).padStart(4, '0')}`;
}

// ── GET /api/jobs/active — JWT required ──
router.get('/active', requireAuth, async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { status: 'Active' },
      orderBy: { created_at: 'desc' },
    });
    return res.json(jobs.map(mapJob));
  } catch (err) {
    console.error('Get active jobs error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching active jobs' });
  }
});

// ── GET /api/jobs — Admin only ──
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { created_at: 'desc' },
    });
    return res.json(jobs.map(mapJob));
  } catch (err) {
    console.error('Get all jobs error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching jobs' });
  }
});

// ── POST /api/jobs — Admin only ──
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, companyId, companyName, description, location, package: pkg, jobType, minCGPA, maxBacklogs, allowedBranches, deadline } = req.body;

    if (!title || !companyId || !companyName || !location || !pkg || !deadline) {
      return res.status(400).json({ success: false, message: 'Missing required fields: title, companyId, companyName, location, package, deadline' });
    }

    const job_id = await genJobId();

    await prisma.job.create({
      data: {
        job_id,
        company_id: companyId,
        company_name: companyName,
        title,
        description: description || null,
        location,
        package: pkg,
        job_type: jobType || 'Full-Time',
        min_cgpa: parseFloat(minCGPA) || 0,
        max_backlogs: parseInt(maxBacklogs) || 0,
        allowed_branches: allowedBranches || null,
        deadline: new Date(deadline),
        status: 'Active',
      },
    });

    return res.status(201).json({ success: true, message: 'Job posted successfully' });
  } catch (err) {
    console.error('Add job error:', err);
    return res.status(500).json({ success: false, message: 'Server error creating job' });
  }
});

// ── PATCH /api/jobs/:jobId/status — Admin only ──
router.patch('/:jobId/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    if (!status || !['Active', 'Closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be "Active" or "Closed"' });
    }

    const job = await prisma.job.findUnique({ where: { job_id: jobId } });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    await prisma.job.update({
      where: { job_id: jobId },
      data: { status },
    });

    return res.json({ success: true, message: `Job status updated to ${status}` });
  } catch (err) {
    console.error('Update job status error:', err);
    return res.status(500).json({ success: false, message: 'Server error updating job status' });
  }
});

module.exports = router;
