const express = require('express');
const prisma = require('../db');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/adminOnly');

const router = express.Router();

// ── Helper: generate company ID (no year) ──
async function genCompanyId() {
  const count = await prisma.company.count();
  return `CMP-${String(count + 1).padStart(4, '0')}`;
}

// ── GET /api/companies — JWT required ──
router.get('/', requireAuth, async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { created_at: 'desc' },
    });

    return res.json(
      companies.map((c) => ({
        CompanyID: c.company_id,
        Name: c.name,
        Industry: c.industry || '',
        Website: c.website || '',
        Description: c.description || '',
      }))
    );
  } catch (err) {
    console.error('Get companies error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching companies' });
  }
});

// ── POST /api/companies — Admin only ──
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, industry, website, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    // Check uniqueness
    const existing = await prisma.company.findUnique({ where: { name } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Company already exists' });
    }

    const company_id = await genCompanyId();

    await prisma.company.create({
      data: {
        company_id,
        name,
        industry: industry || null,
        website: website || null,
        description: description || null,
      },
    });

    return res.status(201).json({ success: true, message: 'Company added successfully' });
  } catch (err) {
    console.error('Add company error:', err);
    return res.status(500).json({ success: false, message: 'Server error creating company' });
  }
});

module.exports = router;
