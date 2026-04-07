const express = require('express');
const prisma = require('../db');

const router = express.Router();

// ── GET /api/stats — Public (no auth) ──
router.get('/', async (req, res) => {
  try {
    const [totalStudents, totalCompanies, activeJobs, placedStudents, totalApplications] = await Promise.all([
      prisma.student.count(),
      prisma.company.count(),
      prisma.job.count({ where: { status: 'Active' } }),
      prisma.application.count({ where: { status: 'Selected' } }),
      prisma.application.count(),
    ]);

    return res.json({
      totalStudents,
      totalCompanies,
      activeJobs,
      placedStudents,
      totalApplications,
    });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching stats' });
  }
});

module.exports = router;
