require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const districts = ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Nalanda', 'Vaishali'];
const blocks = ['Block A', 'Block B', 'Block C', 'Block D', 'Block E'];
const domains = ['IT', 'Healthcare', 'Retail', 'Manufacturing', 'Agriculture', 'Construction', 'Hospitality'];
const courses = ['Computer Basics', 'Tally ERP', 'Web Design', 'Healthcare Assistant', 'Retail Management', 'Electrician'];
const activityTypes = ['Theory Session', 'Practical Session', 'Guest Lecture', 'Assessment', 'Placement Activity'];
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const daysLater = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

async function main() {
  console.log('🌱 Seeding database...');

  // Clear all
  await prisma.placement.deleteMany();
  await prisma.onlineSession.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.trainerAttendance.deleteMany();
  await prisma.candidateFollowUp.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.jobFair.deleteMany();
  await prisma.company.deleteMany();
  await prisma.donor.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const hash = (p) => bcrypt.hashSync(p, 10);
  const admin = await prisma.user.create({ data: { name: 'Admin User', email: 'admin@lms.com', hashedPassword: hash('admin123'), role: 'admin', phone: '9876543210', district: 'Patna' } });
  const manager = await prisma.user.create({ data: { name: 'Manager User', email: 'manager@lms.com', hashedPassword: hash('manager123'), role: 'manager', phone: '9876543200', district: 'Patna' } });
  const hr1 = await prisma.user.create({ data: { name: 'Priya Sharma', email: 'hr@lms.com', hashedPassword: hash('hr123'), role: 'hr', phone: '9876543211', district: 'Patna' } });
  const hr2 = await prisma.user.create({ data: { name: 'Ravi Kumar', email: 'hr2@lms.com', hashedPassword: hash('hr123'), role: 'hr', phone: '9876543212', district: 'Gaya' } });
  const t1 = await prisma.user.create({ data: { name: 'Suresh Trainer', email: 'trainer@lms.com', hashedPassword: hash('trainer123'), role: 'trainer', phone: '9876543213', district: 'Muzaffarpur' } });
  const t2 = await prisma.user.create({ data: { name: 'Meena Devi', email: 'trainer2@lms.com', hashedPassword: hash('trainer123'), role: 'trainer', phone: '9876543214', district: 'Bhagalpur' } });

  // Swadesh Donor (manager's donor)
  await prisma.donor.create({
    data: {
      name: 'Swadesh', organization: 'Swadesh Foundation', contactPerson: 'Manager User',
      email: 'swadesh@example.com', phone: '9876543201', district: 'Patna', block: 'Block A',
      domain: 'Agriculture', date: new Date(), remarks: 'Manager exclusive donor', isActive: true,
      createdById: admin.id, managerId: manager.id
    }
  });

  // Companies
  const companyNames = ['TechCorp India', 'MediPlus', 'RetailMart', 'BuildWell', 'AgriTech Solutions', 'InfoSys Ltd', 'HealthFirst', 'ShopEasy', 'PowerGrid', 'GreenFarm'];
  const companies = [];
  for (let i = 0; i < companyNames.length; i++) {
    const c = await prisma.company.create({
      data: {
        companyName: companyNames[i], address: `Plot ${i+1}, Industrial Area`,
        district: rand(districts), block: rand(blocks), domain: rand(domains),
        contactPerson: `Manager ${i+1}`, contactNumber: `98765${43200+i}`,
        totalVacancies: randInt(5, 50), urgentHiring: i < 3,
        lastFollowupDate: daysAgo(randInt(1, 30)), nextFollowupDate: daysLater(randInt(1, 15)),
        remarks: `Active hiring company in ${rand(domains)} sector`,
        isNewClient: i >= 7, createdById: hr1.id
      }
    });
    companies.push(c);
  }

  // Job Fairs
  const fairStatuses = ['Upcoming', 'Upcoming', 'Ongoing', 'Completed'];
  for (let i = 0; i < 8; i++) {
    await prisma.jobFair.create({
      data: {
        eventName: `Job Fair ${i+1} - ${rand(domains)}`, companies: rand(companyNames),
        district: rand(districts), block: rand(blocks), venue: `Community Hall, Sector ${i+1}`,
        vacancyCount: randInt(20, 100), domain: rand(domains),
        startDate: daysLater(randInt(-5, 30)), endDate: daysLater(randInt(31, 45)),
        coordinator: rand(['Priya Sharma', 'Ravi Kumar', 'Amit Singh']),
        status: rand(fairStatuses)
      }
    });
  }

  // Candidates
  const names = ['Amit Kumar','Sunita Devi','Rahul Singh','Pooja Kumari','Vijay Yadav','Anita Sharma','Deepak Raj','Priyanka Das','Sanjay Kumar','Kavita Rani','Raju Prasad','Sita Devi','Mohan Lal','Geeta Kumari','Arun Mishra','Rekha Singh','Sunil Gupta','Nisha Verma','Manoj Kumar','Laxmi Devi'];
  const statuses = ['Interested','Not Interested','Interview Scheduled','Selected','Joined','Rejected','Not Responded'];
  const candidates = [];
  for (let i = 0; i < names.length; i++) {
    const c = await prisma.candidate.create({
      data: {
        candidateId: `CND${1000+i}`, fullName: names[i],
        mobileNumber: `70000${10000+i}`, email: `candidate${i}@gmail.com`,
        gender: i % 2 === 0 ? 'Male' : 'Female',
        district: rand(districts), block: rand(blocks),
        address: `Village ${i+1}, Near Main Road`,
        qualification: rand(['10th','12th','Graduate','ITI']),
        course: rand(courses), batch: `Batch-${randInt(1,5)}`,
        month: rand(['January','February','March','April','May','June']),
        trainerId: i % 2 === 0 ? t1.id : t2.id,
        batchStartDate: daysAgo(randInt(120, 180)), batchEndDate: daysAgo(randInt(30, 60)), placementStatus: rand(statuses),
        lastFollowupDate: daysAgo(randInt(1, 20)), nextFollowupDate: daysLater(randInt(1, 10))
      }
    });
    candidates.push(c);
  }

  // Follow-ups
  for (const c of candidates.slice(0, 10)) {
    const n = randInt(1, 3);
    for (let j = 0; j < n; j++) {
      await prisma.candidateFollowUp.create({
        data: { candidateId: c.id, followupDate: daysAgo(randInt(5, 60)), nextFollowupDate: daysLater(randInt(1, 14)), status: rand(statuses), remark: rand(['Candidate is responsive', 'Not picking up calls', 'Interested in IT role', 'Needs counseling before placement']), createdById: hr1.id }
      });
    }
  }

  // Trainer Attendance (14 days)
  for (const trainer of [t1, t2]) {
    for (let d = 0; d < 14; d++) {
      const date = daysAgo(d); date.setHours(0,0,0,0);
      const checkin = new Date(date); checkin.setHours(9, randInt(0, 30), 0);
      const checkout = new Date(date); checkout.setHours(17, randInt(0, 30), 0);
      try {
        await prisma.trainerAttendance.create({
          data: { trainerId: trainer.id, date, checkinTime: checkin, checkoutTime: checkout, vdcName: `VDC ${trainer.name}`, district: trainer.district, block: rand(blocks), activityType: rand(activityTypes), workDetails: `Conducted ${rand(activityTypes)} with batch students today.` }
        });
      } catch (e) { /* skip duplicates */ }
    }
  }

  // Batches
  for (let i = 0; i < 5; i++) {
    await prisma.batch.create({
      data: { batchName: `Batch-${i+1}`, course: rand(courses), domain: rand(domains), trainerId: i % 2 === 0 ? t1.id : t2.id, startDate: daysAgo(randInt(30, 120)), endDate: daysLater(randInt(30, 90)), district: rand(districts), block: rand(blocks), vdcName: `VDC Center ${i+1}`, totalStudents: randInt(15, 30), status: rand(['Active','Active','Completed','Upcoming']) }
    });
  }

  // Chat messages
  const msgs = ['Good morning team! Please check today\'s follow-up list.', 'TechCorp is hot hiring — need 10 candidates urgently!', 'Job Fair at Patna on 15th June, coordinate candidates.', '3 candidates from Batch-2 got selected at MediPlus!', 'Please update follow-up status for all pending candidates.'];
  for (const msg of msgs) {
    await prisma.chatMessage.create({ data: { senderId: rand([admin.id, hr1.id, hr2.id]), content: msg } });
  }

  // Schedules
  const scheduleItems = [
    { title: 'Computer Basics — Module 1', scheduleType: 'Class', domain: 'IT', course: 'Computer Basics', status: 'Scheduled', priority: 'Normal', venue: 'Training Hall A', daysFromNow: 1, hour: 9 },
    { title: 'Tally ERP Assessment', scheduleType: 'Assessment', domain: 'IT', course: 'Tally ERP', status: 'Scheduled', priority: 'High', venue: 'Computer Lab', daysFromNow: 2, hour: 10 },
    { title: 'Healthcare Guest Lecture', scheduleType: 'Guest Lecture', domain: 'Healthcare', status: 'Scheduled', priority: 'Normal', meetingLink: 'https://meet.google.com/abc-defg-hij', daysFromNow: 3, hour: 11 },
    { title: 'Monthly Team Meeting', scheduleType: 'Meeting', status: 'Scheduled', priority: 'High', venue: 'Conference Room', daysFromNow: 0, hour: 14 },
    { title: 'Industry Visit — RetailMart', scheduleType: 'Industry Visit', domain: 'Retail', status: 'Upcoming', priority: 'Normal', venue: 'RetailMart HQ, Patna', daysFromNow: 5, hour: 8 },
    { title: 'Web Design Practical Session', scheduleType: 'Session', domain: 'IT', course: 'Web Design', status: 'Completed', priority: 'Normal', venue: 'Computer Lab', daysFromNow: -3, hour: 9 },
    { title: 'Placement Counseling — Batch 2', scheduleType: 'Meeting', status: 'Scheduled', priority: 'High', meetingLink: 'https://zoom.us/j/123456789', daysFromNow: 7, hour: 15 },
    { title: 'Electrician Safety Assessment', scheduleType: 'Assessment', domain: 'Construction', course: 'Electrician', status: 'Scheduled', priority: 'Normal', venue: 'Workshop Area', daysFromNow: 4, hour: 10 },
  ];
  for (const item of scheduleItems) {
    const start = new Date(); start.setDate(start.getDate() + item.daysFromNow); start.setHours(item.hour, 0, 0, 0);
    const end   = new Date(start); end.setHours(start.getHours() + 2);
    await prisma.schedule.create({
      data: {
        title: item.title, scheduleType: item.scheduleType,
        domain: item.domain || null, course: item.course || null,
        startDateTime: start, endDateTime: end,
        venue: item.venue || null, meetingLink: item.meetingLink || null,
        status: item.status, priority: item.priority,
        trainerId: rand([t1.id, t2.id]), trainerName: rand([t1.name, t2.name]),
        createdById: hr1.id,
      }
    });
  }

  // Online Sessions
  const sessionData = [
    { title: 'Introduction to Computer Basics - Module 1', description: 'Learn fundamental computer skills including hardware, software, and basic operations.', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', domain: 'IT', course: 'Computer Basics', duration: '45m', tags: 'basics,module-1,hindi', visibility: 'all', isPublished: true },
    { title: 'Tally ERP 9 - Complete Tutorial for Beginners', description: 'Step-by-step guide to Tally ERP 9 for accounting and inventory management.', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', domain: 'IT', course: 'Tally ERP', duration: '1h 20m', tags: 'tally,accounting,erp', visibility: 'all', isPublished: true },
    { title: 'Healthcare Assistant - Patient Care Basics', description: 'Understanding patient care, hygiene protocols, and basic first aid.', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', domain: 'Healthcare', course: 'Healthcare Assistant', duration: '55m', tags: 'patient-care,first-aid', visibility: 'all', isPublished: true },
    { title: 'Retail Management - Customer Handling Skills', description: 'How to handle customers, billing, and inventory in retail stores.', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', domain: 'Retail', course: 'Retail Management', duration: '40m', tags: 'retail,customer-service', visibility: 'domain', isPublished: true },
    { title: 'Web Design - HTML & CSS Fundamentals', description: 'Build your first webpage with HTML tags and CSS styling.', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', domain: 'IT', course: 'Web Design', duration: '1h 10m', tags: 'html,css,web', visibility: 'all', isPublished: true },
    { title: 'Electrician Safety Protocols - Must Watch', description: 'Safety measures and protocols every electrician must follow on-site.', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', domain: 'Construction', course: 'Electrician', duration: '30m', tags: 'safety,electrician', visibility: 'all', isPublished: true },
    { title: 'Agriculture Techniques - Modern Farming Methods', description: 'Modern farming, crop management, and agri-business basics.', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', domain: 'Agriculture', duration: '50m', tags: 'farming,agriculture', visibility: 'all', isPublished: false },
  ];
  for (const s of sessionData) {
    await prisma.onlineSession.create({
      data: { ...s, trainerName: rand([t1.name, t2.name]), trainerId: rand([t1.id, t2.id]), sessionDate: daysAgo(randInt(1, 30)), createdById: hr1.id, views: randInt(5, 120) }
    });
  }

  for (const c of candidates.slice(0, 8)) {
    await prisma.placement.create({
      data: { candidateId: c.id, companyId: rand(companies).id, jobRole: rand(['Data Entry','Sales Executive','Lab Assistant','Field Officer']), joiningDate: daysAgo(randInt(1, 60)), salary: rand([8000,10000,12000,15000,18000]), district: rand(districts), block: rand(blocks), domain: rand(domains), status: 'Joined' }
    });
  }

  console.log('\n✅ Database seeded successfully!');
  console.log('─────────────────────────────────');
  console.log('Login Credentials:');
  console.log('  👑 Admin:    admin@lms.com    / admin123');
  console.log('  💼 Manager:  manager@lms.com  / manager123');
  console.log('  👔 Placement: hr@lms.com      / hr123');
  console.log('  🏫 Trainer:  trainer@lms.com  / trainer123');
  console.log('─────────────────────────────────\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
