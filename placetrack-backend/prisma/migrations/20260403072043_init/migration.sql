-- CreateTable
CREATE TABLE "students" (
    "student_id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(15),
    "branch" VARCHAR(10) NOT NULL,
    "cgpa" DECIMAL(3,1) NOT NULL,
    "backlogs" INTEGER NOT NULL DEFAULT 0,
    "passing_year" INTEGER NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "skills" TEXT,
    "resume_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "admins" (
    "admin_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("admin_id")
);

-- CreateTable
CREATE TABLE "companies" (
    "company_id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "industry" VARCHAR(100),
    "website" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "job_id" VARCHAR(20) NOT NULL,
    "company_id" VARCHAR(20) NOT NULL,
    "company_name" VARCHAR(150) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "location" VARCHAR(100) NOT NULL,
    "package" VARCHAR(50) NOT NULL,
    "job_type" VARCHAR(20) NOT NULL DEFAULT 'Full-Time',
    "min_cgpa" DECIMAL(3,1) NOT NULL DEFAULT 0,
    "max_backlogs" INTEGER NOT NULL DEFAULT 0,
    "allowed_branches" TEXT,
    "deadline" DATE NOT NULL,
    "status" VARCHAR(10) NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("job_id")
);

-- CreateTable
CREATE TABLE "applications" (
    "app_id" VARCHAR(20) NOT NULL,
    "student_id" VARCHAR(20) NOT NULL,
    "student_name" VARCHAR(100) NOT NULL,
    "job_id" VARCHAR(20) NOT NULL,
    "job_title" VARCHAR(150) NOT NULL,
    "company_name" VARCHAR(150) NOT NULL,
    "applied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(15) NOT NULL DEFAULT 'Applied',
    "admin_remarks" TEXT,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("app_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "applications_student_id_job_id_key" ON "applications"("student_id", "job_id");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("company_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("job_id") ON DELETE RESTRICT ON UPDATE CASCADE;
