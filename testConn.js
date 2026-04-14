require('dotenv').config({ path: './placetrack-backend/.env' });
const prisma = require('./placetrack-backend/src/db.js');

async function testConnection() {
  try {
    console.log('Connecting to Neon DB...');
    const student = await prisma.student.findFirst();
    console.log('DB connected OK! Found:', student ? student.student_id : 'no students yet');
  } catch (e) {
    console.error('DB ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
testConnection();
