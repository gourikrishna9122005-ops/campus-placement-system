const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const crypto = require('crypto');

async function genJobId() {
  const year = new Date().getFullYear();
  return `JOB-${year}-${crypto.randomBytes(3).toString('hex')}`;
}

async function genCompanyId() {
  return `CMP-${crypto.randomBytes(3).toString('hex')}`;
}

async function main() {
  // First, create some companies
  const companies = [
    { name: 'Google', industry: 'Technology', website: 'https://google.com', description: 'Search and cloud giant.' },
    { name: 'Microsoft', industry: 'Technology', website: 'https://microsoft.com', description: 'Empowering everyone to achieve more.' },
    { name: 'Goldman Sachs', industry: 'Finance', website: 'https://goldmansachs.com', description: 'Global investment banking.' },
    { name: 'Uber', industry: 'Transportation', website: 'https://uber.com', description: 'Move the way you want.' },
    { name: 'Amazon', industry: 'E-commerce & Cloud', website: 'https://amazon.com', description: 'Work hard. Have fun. Make history.' }
  ];

  const createdCompanies = [];
  for (const c of companies) {
    let existing = await prisma.company.findUnique({ where: { name: c.name } });
    if (!existing) {
      const company_id = await genCompanyId();
      existing = await prisma.company.create({
        data: {
          company_id,
          name: c.name,
          industry: c.industry,
          website: c.website,
          description: c.description
        }
      });
    }
    createdCompanies.push(existing);
  }

  // Now create jobs
  const jobs = [
    {
       title: 'Software Engineer (SDE I)',
       companyId: createdCompanies[0].company_id,
       companyName: createdCompanies[0].name,
       location: 'Bangalore, India',
       pkg: '32 LPA',
       jobType: 'Full-Time',
       minCGPA: 8.0,
       maxBacklogs: 0,
       allowedBranches: 'CSE, IT',
       deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
       description: 'Join the Google Core systems team to build scalable infrastructure.'
    },
    {
       title: 'Data Science Intern',
       companyId: createdCompanies[3].company_id,
       companyName: createdCompanies[3].name,
       location: 'Hyderabad, India',
       pkg: '1.2 Lakh/mo',
       jobType: 'Internship',
       minCGPA: 7.5,
       maxBacklogs: 1,
       allowedBranches: 'CSE, IT, ECE',
       deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
       description: 'Work on cutting edge ML models and optimizing ETA algorithms.'
    },
    {
       title: 'Quantitative Analyst',
       companyId: createdCompanies[2].company_id,
       companyName: createdCompanies[2].name,
       location: 'Mumbai, India',
       pkg: '40 LPA',
       jobType: 'Full-Time',
       minCGPA: 8.5,
       maxBacklogs: 0,
       allowedBranches: 'CSE, ECE, EEE',
       deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
       description: 'Develop low-latency trading algorithms and risk models.'
    },
    {
       title: 'Cloud Support Associate',
       companyId: createdCompanies[4].company_id,
       companyName: createdCompanies[4].name,
       location: 'Pune, India',
       pkg: '14 LPA',
       jobType: 'Full-Time',
       minCGPA: 6.5,
       maxBacklogs: 2,
       allowedBranches: 'CSE, IT, ECE, EEE, MECH',
       deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days
       description: 'Help enterprise customers scale their AWS workloads.'
    },
    {
       title: 'Frontend Engineer',
       companyId: createdCompanies[1].company_id,
       companyName: createdCompanies[1].name,
       location: 'Noida, India',
       pkg: '24 LPA',
       jobType: 'Full-Time',
       minCGPA: 7.0,
       maxBacklogs: 0,
       allowedBranches: 'CSE, IT',
       deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days
       description: 'Build responsive and accessible web applications.'
    }
  ];

  for (const j of jobs) {
    const job_id = await genJobId();
    await prisma.job.create({
      data: {
        job_id,
        company_id: j.companyId,
        company_name: j.companyName,
        title: j.title,
        description: j.description,
        location: j.location,
        package: j.pkg,
        job_type: j.jobType,
        min_cgpa: j.minCGPA,
        max_backlogs: j.maxBacklogs,
        allowed_branches: j.allowedBranches,
        deadline: j.deadline,
        status: 'Active'
      }
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
