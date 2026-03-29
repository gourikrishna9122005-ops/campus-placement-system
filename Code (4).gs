// ============================================================
// PLACEMENT MANAGEMENT SYSTEM - Google Apps Script Backend
// ============================================================

var SPREADSHEET_ID = ''; // <-- Paste your Google Sheet ID here
var ADMIN_PASSWORD = 'admin123';

var SHEET_STUDENTS = 'Students';
var SHEET_COMPANIES = 'Companies';
var SHEET_JOBS = 'Jobs';
var SHEET_APPLICATIONS = 'Applications';
var SHEET_ADMINS = 'Admins';

// ============================================================
// WEB APP ENTRY POINT
// ============================================================
function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Campus Placement System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ============================================================
// SHEET HELPERS
// ============================================================
function getSheet(name) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function sheetToObjects(sheetName) {
  var sheet = getSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    obj['_row'] = i + 1;
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      if (val instanceof Date) {
        obj[headers[j]] = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else {
        obj[headers[j]] = String(val).trim();
      }
    }
    result.push(obj);
  }
  return result;
}

// ============================================================
// SETUP
// ============================================================
function setupSheets() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var configs = [
    { name: SHEET_STUDENTS, headers: ['StudentID','Name','Email','Phone','Branch','CGPA','Backlogs','PassingYear','Skills','ResumeURL','Password','CreatedAt','ProfileUpdatedAt'] },
    { name: SHEET_COMPANIES, headers: ['CompanyID','Name','Industry','Website','Description','CreatedAt'] },
    { name: SHEET_JOBS, headers: ['JobID','CompanyID','CompanyName','Title','Description','Location','Package','JobType','MinCGPA','MaxBacklogs','AllowedBranches','Deadline','Status','CreatedAt'] },
    { name: SHEET_APPLICATIONS, headers: ['AppID','StudentID','StudentName','JobID','JobTitle','CompanyName','AppliedAt','Status','AdminRemarks'] },
    { name: SHEET_ADMINS, headers: ['AdminID','Name','Email','Password'] }
  ];
  for (var i = 0; i < configs.length; i++) {
    var c = configs[i];
    var sheet = ss.getSheetByName(c.name);
    if (!sheet) sheet = ss.insertSheet(c.name);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(c.headers);
      sheet.getRange(1, 1, 1, c.headers.length).setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff');
    }
  }
  var adminSheet = getSheet(SHEET_ADMINS);
  if (adminSheet.getLastRow() <= 1) {
    adminSheet.appendRow(['ADM001', 'Admin', 'admin@college.edu', ADMIN_PASSWORD]);
  }
  return { success: true, message: 'Setup complete!' };
}

// ============================================================
// STUDENT FUNCTIONS
// ============================================================
function registerStudent(data) {
  try {
    var students = sheetToObjects(SHEET_STUDENTS);
    for (var i = 0; i < students.length; i++) {
      if (students[i].Email === data.email) {
        return { success: false, message: 'Email already registered.' };
      }
    }
    var id = 'STU' + Date.now();
    var now = new Date().toISOString();
    getSheet(SHEET_STUDENTS).appendRow([
      id, data.name, data.email, data.phone, data.branch,
      data.cgpa, data.backlogs || '0', data.passingYear,
      data.skills || '', data.resumeURL || '',
      data.password, now, now
    ]);
    return { success: true, studentId: id, message: 'Registration successful!' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function studentLogin(email, password) {
  var students = sheetToObjects(SHEET_STUDENTS);
  for (var i = 0; i < students.length; i++) {
    if (students[i].Email === email && students[i].Password === password) {
      var s = students[i];
      delete s.Password;
      return { success: true, student: s };
    }
  }
  return { success: false, message: 'Invalid email or password.' };
}

function getStudentById(studentId) {
  var students = sheetToObjects(SHEET_STUDENTS);
  for (var i = 0; i < students.length; i++) {
    if (students[i].StudentID === studentId) {
      var s = students[i];
      delete s.Password;
      return s;
    }
  }
  return null;
}

function updateStudentProfile(studentId, data) {
  try {
    var sheet = getSheet(SHEET_STUDENTS);
    var allData = sheet.getDataRange().getValues();
    var headers = allData[0];
    for (var i = 1; i < allData.length; i++) {
      if (String(allData[i][headers.indexOf('StudentID')]).trim() === studentId) {
        var row = i + 1;
        if (data.phone) sheet.getRange(row, headers.indexOf('Phone') + 1).setValue(data.phone);
        if (data.cgpa) sheet.getRange(row, headers.indexOf('CGPA') + 1).setValue(data.cgpa);
        if (data.backlogs !== undefined) sheet.getRange(row, headers.indexOf('Backlogs') + 1).setValue(data.backlogs);
        if (data.skills) sheet.getRange(row, headers.indexOf('Skills') + 1).setValue(data.skills);
        if (data.resumeURL) sheet.getRange(row, headers.indexOf('ResumeURL') + 1).setValue(data.resumeURL);
        sheet.getRange(row, headers.indexOf('ProfileUpdatedAt') + 1).setValue(new Date().toISOString());
        return { success: true, message: 'Profile updated!' };
      }
    }
    return { success: false, message: 'Student not found.' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function getAllStudents() {
  var students = sheetToObjects(SHEET_STUDENTS);
  for (var i = 0; i < students.length; i++) {
    delete students[i].Password;
  }
  return students;
}

// ============================================================
// COMPANY FUNCTIONS
// ============================================================
function getCompanies() {
  return sheetToObjects(SHEET_COMPANIES);
}

function addCompany(data) {
  try {
    var id = 'COM' + Date.now();
    getSheet(SHEET_COMPANIES).appendRow([
      id, data.name, data.industry || '',
      data.website || '', data.description || '',
      new Date().toISOString()
    ]);
    return { success: true, companyId: id };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ============================================================
// JOB FUNCTIONS
// ============================================================
function addJob(data) {
  try {
    var id = 'JOB' + Date.now();
    getSheet(SHEET_JOBS).appendRow([
      id, data.companyId, data.companyName, data.title,
      data.description, data.location, data.package,
      data.jobType, data.minCGPA || '0', data.maxBacklogs || '0',
      data.allowedBranches || '', data.deadline,
      'Active', new Date().toISOString()
    ]);
    return { success: true, jobId: id };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function getAllJobs() {
  return sheetToObjects(SHEET_JOBS);
}

function getActiveJobs() {
  var jobs = sheetToObjects(SHEET_JOBS);
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var active = [];
  for (var i = 0; i < jobs.length; i++) {
    var j = jobs[i];
    var status = String(j.Status).trim().toLowerCase();
    if (status !== 'active') continue;
    var deadline = new Date(j.Deadline);
    if (isNaN(deadline.getTime())) continue;
    if (deadline >= today) active.push(j);
  }
  return active;
}

function updateJobStatus(jobId, status) {
  try {
    var sheet = getSheet(SHEET_JOBS);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var jobIdCol = headers.indexOf('JobID');
    var statusCol = headers.indexOf('Status');
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][jobIdCol]).trim() === jobId) {
        sheet.getRange(i + 1, statusCol + 1).setValue(status);
        return { success: true };
      }
    }
    return { success: false, message: 'Job not found.' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ============================================================
// ELIGIBILITY CHECK
// ============================================================
function checkEligibility(studentId, jobId) {
  var student = getStudentById(studentId);
  var jobs = sheetToObjects(SHEET_JOBS);
  var job = null;
  for (var i = 0; i < jobs.length; i++) {
    if (jobs[i].JobID === jobId) { job = jobs[i]; break; }
  }
  if (!student || !job) return { eligible: false, reasons: ['Invalid student or job.'] };

  var reasons = [];
  var studentCGPA = parseFloat(student.CGPA) || 0;
  var minCGPA = parseFloat(job.MinCGPA) || 0;
  if (studentCGPA < minCGPA) {
    reasons.push('CGPA ' + studentCGPA + ' is below required ' + minCGPA);
  }

  var studentBacklogs = parseInt(student.Backlogs) || 0;
  var maxBacklogs = parseInt(job.MaxBacklogs) || 0;
  if (studentBacklogs > maxBacklogs) {
    reasons.push('Backlogs ' + studentBacklogs + ' exceeds allowed ' + maxBacklogs);
  }

  var allowedStr = String(job.AllowedBranches).trim();
  if (allowedStr && allowedStr !== '' && allowedStr !== 'undefined') {
    var allowed = allowedStr.split(',');
    var found = false;
    for (var k = 0; k < allowed.length; k++) {
      if (allowed[k].trim() === student.Branch) { found = true; break; }
    }
    if (!found) reasons.push('Branch ' + student.Branch + ' not allowed for this job.');
  }

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var deadline = new Date(job.Deadline);
  if (isNaN(deadline.getTime()) || deadline < today) {
    reasons.push('Application deadline has passed.');
  }

  return { eligible: reasons.length === 0, reasons: reasons };
}

// ============================================================
// APPLICATION FUNCTIONS
// ============================================================
function applyForJob(studentId, jobId) {
  try {
    var eligibility = checkEligibility(studentId, jobId);
    if (!eligibility.eligible) {
      return { success: false, message: eligibility.reasons.join('; ') };
    }
    var apps = sheetToObjects(SHEET_APPLICATIONS);
    for (var i = 0; i < apps.length; i++) {
      if (apps[i].StudentID === studentId && apps[i].JobID === jobId) {
        return { success: false, message: 'Already applied for this job.' };
      }
    }
    var student = getStudentById(studentId);
    var jobs = sheetToObjects(SHEET_JOBS);
    var job = null;
    for (var j = 0; j < jobs.length; j++) {
      if (jobs[j].JobID === jobId) { job = jobs[j]; break; }
    }
    if (!student || !job) return { success: false, message: 'Student or job not found.' };
    var id = 'APP' + Date.now();
    getSheet(SHEET_APPLICATIONS).appendRow([
      id, studentId, student.Name, jobId,
      job.Title, job.CompanyName,
      new Date().toISOString(), 'Applied', ''
    ]);
    return { success: true, appId: id, message: 'Application submitted successfully!' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function getStudentApplications(studentId) {
  var apps = sheetToObjects(SHEET_APPLICATIONS);
  var result = [];
  for (var i = 0; i < apps.length; i++) {
    if (apps[i].StudentID === studentId) result.push(apps[i]);
  }
  return result;
}

function getAllApplications() {
  return sheetToObjects(SHEET_APPLICATIONS);
}

function updateApplicationStatus(appId, status, remarks) {
  try {
    var sheet = getSheet(SHEET_APPLICATIONS);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var appIdCol = headers.indexOf('AppID');
    var statusCol = headers.indexOf('Status');
    var remarksCol = headers.indexOf('AdminRemarks');
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][appIdCol]).trim() === appId) {
        sheet.getRange(i + 1, statusCol + 1).setValue(status);
        sheet.getRange(i + 1, remarksCol + 1).setValue(remarks || '');
        return { success: true };
      }
    }
    return { success: false };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ============================================================
// ADMIN FUNCTIONS
// ============================================================
function adminLogin(email, password) {
  var admins = sheetToObjects(SHEET_ADMINS);
  for (var i = 0; i < admins.length; i++) {
    if (admins[i].Email === email && admins[i].Password === password) {
      return { success: true, admin: { AdminID: admins[i].AdminID, Name: admins[i].Name, Email: admins[i].Email } };
    }
  }
  return { success: false, message: 'Invalid admin credentials.' };
}

function getDashboardStats() {
  var students = sheetToObjects(SHEET_STUDENTS);
  var jobs = sheetToObjects(SHEET_JOBS);
  var apps = sheetToObjects(SHEET_APPLICATIONS);
  var companies = sheetToObjects(SHEET_COMPANIES);
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var activeCount = 0;
  for (var i = 0; i < jobs.length; i++) {
    var status = String(jobs[i].Status).trim().toLowerCase();
    var deadline = new Date(jobs[i].Deadline);
    if (status === 'active' && !isNaN(deadline.getTime()) && deadline >= today) {
      activeCount++;
    }
  }
  var placedIds = [];
  for (var j = 0; j < apps.length; j++) {
    if (apps[j].Status === 'Selected' && placedIds.indexOf(apps[j].StudentID) === -1) {
      placedIds.push(apps[j].StudentID);
    }
  }
  return {
    totalStudents: students.length,
    totalCompanies: companies.length,
    totalJobs: jobs.length,
    activeJobs: activeCount,
    totalApplications: apps.length,
    placedStudents: placedIds.length
  };
}
