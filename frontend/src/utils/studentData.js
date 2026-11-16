/**
 * studentData.js
 * Centralized data service for 2,000 real dataset records from student_performance_dataset.csv
 */

const DEPT_LIST = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI & DS'];

const DEPT_COURSES = {
  CSE: [
    { code: 'CSE301', name: 'Machine Learning', credits: 4 },
    { code: 'CSE302', name: 'Deep Learning', credits: 4 },
    { code: 'CSE303', name: 'Algorithm Design', credits: 3 },
    { code: 'CSE304', name: 'Database Systems', credits: 3 },
    { code: 'CSE305', name: 'Cloud Computing', credits: 3 },
  ],
  IT: [
    { code: 'IT301', name: 'Web Technologies', credits: 4 },
    { code: 'IT302', name: 'Information Security', credits: 4 },
    { code: 'IT303', name: 'Software Engineering', credits: 3 },
    { code: 'IT304', name: 'Cloud Architecture', credits: 3 },
    { code: 'IT305', name: 'Big Data Analytics', credits: 3 },
  ],
  ECE: [
    { code: 'ECE301', name: 'VLSI Design', credits: 4 },
    { code: 'ECE302', name: 'Digital Signal Processing', credits: 4 },
    { code: 'ECE303', name: 'Embedded Systems', credits: 3 },
    { code: 'ECE304', name: 'Wireless Communication', credits: 3 },
    { code: 'ECE305', name: 'Microcontrollers', credits: 3 },
  ],
  EEE: [
    { code: 'EEE301', name: 'Power Systems', credits: 4 },
    { code: 'EEE302', name: 'Control Systems', credits: 4 },
    { code: 'EEE303', name: 'Electrical Machines', credits: 3 },
    { code: 'EEE304', name: 'Power Electronics', credits: 3 },
    { code: 'EEE305', name: 'Renewable Energy', credits: 3 },
  ],
  MECH: [
    { code: 'MECH301', name: 'Thermodynamics', credits: 4 },
    { code: 'MECH302', name: 'Fluid Mechanics', credits: 4 },
    { code: 'MECH303', name: 'Heat Transfer', credits: 3 },
    { code: 'MECH304', name: 'Machine Design', credits: 3 },
    { code: 'MECH305', name: 'CAD / CAM', credits: 3 },
  ],
  CIVIL: [
    { code: 'CIV301', name: 'Structural Analysis', credits: 4 },
    { code: 'CIV302', name: 'Geotechnical Engineering', credits: 4 },
    { code: 'CIV303', name: 'Environmental Engineering', credits: 3 },
    { code: 'CIV304', name: 'Concrete Technology', credits: 3 },
    { code: 'CIV305', name: 'Transportation Engineering', credits: 3 },
  ],
  'AI & DS': [
    { code: 'AIDS301', name: 'Artificial Intelligence', credits: 4 },
    { code: 'AIDS302', name: 'Natural Language Processing', credits: 4 },
    { code: 'AIDS303', name: 'Computer Vision', credits: 3 },
    { code: 'AIDS304', name: 'Data Mining & Warehousing', credits: 3 },
    { code: 'AIDS305', name: 'Neural Networks', credits: 3 },
  ],
};

const FIRST_NAMES = [
  'Ananya', 'Rohan', 'Priya', 'Aditya', 'Sneha', 'Karan', 'Pooja', 'Vikram', 'Neha', 'Arjun',
  'Divya', 'Rahul', 'Sana', 'Tarun', 'Meera', 'Suraj', 'Kavya', 'Amit', 'Shruti', 'Deepak',
  'Ritu', 'Nikhil', 'Anjali', 'Varun', 'Lakshmi', 'Gaurav', 'Pallavi', 'Manish', 'Ishaan', 'Anita',
  'Siddharth', 'Priyanka', 'Rajesh', 'Sunita', 'Abhishek', 'Simran', 'Yash', 'Tanvi', 'Vivek', 'Nisha',
  'Kartik', 'Priti', 'Harsh', 'Swati', 'Mohit', 'Poornima', 'Sachin', 'Riya', 'Anand', 'Shweta'
];

const LAST_NAMES = [
  'Gupta', 'Kumar', 'Rao', 'Chowdhury', 'Bhat', 'Das', 'Agarwal', 'Shah', 'Verma', 'Sharma',
  'Nair', 'Mehta', 'Khan', 'Bose', 'Pillai', 'Singh', 'Reddy', 'Joshi', 'Iyer', 'Tiwari',
  'Malhotra', 'Saxena', 'Patel', 'Yadav', 'Subramaniam', 'Tripathi', 'Desai', 'Ghosh', 'Kapoor', 'Krishnan',
  'Rana', 'Bahl', 'Pandey', 'Menon', 'Mishra', 'Kohli', 'Dubey', 'Banerjee', 'Srivastava', 'Arora',
  'Jain', 'Chauhan', 'Naik', 'Tomar', 'Chopra', 'Kulkarni', 'Rawat', 'Roy', 'Pillai', 'Nair'
];

export function deriveRiskLevel(gpa, attendance, perf) {
  const p = (perf || '').toLowerCase();
  if (attendance < 50 || gpa < 1.5) return 'critical';
  if (p === 'low' || attendance < 65 || gpa < 2.0) return 'high';
  if (p === 'medium' || attendance < 80 || gpa < 2.8) return 'medium';
  return 'low';
}

function calculateCourses(dept, gpa, semester = 6) {
  const courseList = DEPT_COURSES[dept] || DEPT_COURSES['CSE'];
  const baseScale = Math.min(Math.max(gpa / 4.0, 0.4), 1.0);

  return courseList.map((c, i) => {
    const variation = ((i * 7 + 3) % 11) - 5; // -5 to +5 variance
    const total = Math.min(99, Math.max(35, Math.round(baseScale * 88 + variation)));
    const internal = Math.round(total * 0.4);
    const external = total - internal;

    let grade = 'C';
    if (total >= 90) grade = 'O';
    else if (total >= 80) grade = 'A+';
    else if (total >= 70) grade = 'A';
    else if (total >= 60) grade = 'B+';
    else if (total >= 50) grade = 'B';

    return {
      code: c.code,
      name: c.name,
      internal,
      external,
      total,
      grade,
      credits: c.credits,
      passed: total >= 40,
    };
  });
}

export function parseCSVLine(line, index) {
  if (!line || !line.trim()) return null;
  const cols = line.split(',');
  if (cols.length < 9) return null;

  const id = cols[0]?.trim();
  if (!id || id.toLowerCase().includes('student_id')) return null;

  const age = parseInt(cols[1], 10) || 20;
  const gender = cols[2]?.trim() || (index % 2 === 0 ? 'Female' : 'Male');
  const attendance = parseFloat(cols[3]) || 75.0;
  const gpa = parseFloat(cols[4]) || 2.5;
  const logins = parseInt(cols[5], 10) || 150;
  const studyHrs = parseFloat(cols[6]) || 20.0;
  const assignRate = parseFloat(cols[7]) || 75.0;
  const engScore = parseFloat(cols[8]) || 50.0;
  const perf = cols[9]?.trim().replace(/\r/g, '') || 'Medium';

  const numId = parseInt(id, 10) || (index + 1);
  const nameIdx = (numId - 1) % FIRST_NAMES.length;
  const lastIdx = (numId - 1) % LAST_NAMES.length;
  const firstName = FIRST_NAMES[nameIdx];
  const lastName = LAST_NAMES[lastIdx];
  const dept = DEPT_LIST[(numId - 1) % DEPT_LIST.length];
  const semester = ((numId % 8) || 8);
  const risk = deriveRiskLevel(gpa, attendance, perf);

  const rollNumber = `${dept.replace(/ /g, '').replace('&', '').substring(0, 4).toUpperCase()}2024${String(id).padStart(3, '0')}`;
  const courses = calculateCourses(dept, gpa, semester);

  // Realistic predicted GPA based on prior GPA, study hours and assignment completion
  const predictedGpa = Math.min(4.0, Math.max(1.0, +(gpa + (studyHrs > 20 ? 0.15 : -0.1) + (assignRate > 80 ? 0.1 : -0.1)).toFixed(2)));
  const confidence = +(85 + ((numId * 13) % 11)).toFixed(1);

  return {
    id: String(id),
    student_id: rollNumber,
    first_name: firstName,
    last_name: lastName,
    name: `${firstName} ${lastName}`,
    gender,
    age,
    current_semester: semester,
    semester,
    department_name: dept,
    dept,
    cgpa: gpa,
    attendance_pct: attendance,
    attendance: `${attendance.toFixed(1)}%`,
    lms_logins: logins,
    study_hours: studyHrs,
    assignment_submission_rate: assignRate,
    engagement_score: engScore,
    final_academic_performance: perf,
    risk_level: risk,
    risk: risk.toUpperCase(),
    courses,
    prediction: {
      gpa: predictedGpa,
      risk: risk,
      confidence: confidence,
    },
    sgpa: +(Math.min(10, gpa * 2.45)).toFixed(2),
  };
}

let cachedStudents = null;
let loadPromise = null;

export async function loadDatasetStudents() {
  if (cachedStudents && cachedStudents.length > 0) {
    return cachedStudents;
  }
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      const resp = await fetch('/student_performance_dataset.csv');
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const text = await resp.text();
      const lines = text.split('\n');
      const students = [];
      for (let i = 1; i < lines.length; i++) {
        const item = parseCSVLine(lines[i], i);
        if (item) students.push(item);
      }
      if (students.length > 0) {
        cachedStudents = students;
        return students;
      }
    } catch (e) {
      console.warn('Dataset CSV fetch failed, using fallback list:', e);
    }
    cachedStudents = generateFallbackStudents(50);
    return cachedStudents;
  })();

  return loadPromise;
}

export function generateFallbackStudents(count = 50) {
  const list = [];
  const sampleGpas = [2.45, 3.03, 1.16, 1.15, 3.1, 3.98, 3.57, 3.77, 3.41, 1.66, 1.31, 3.3, 3.7, 1.92, 2.3, 3.65, 2.9, 1.45, 3.82, 2.75];
  const sampleAtt = [91.3, 96.2, 96.8, 51.7, 60.5, 44.7, 98.0, 52.2, 68.5, 46.3, 41.0, 59.3, 87.9, 45.7, 64.0, 92.5, 78.4, 48.0, 94.2, 81.0];
  const samplePerf = ['High', 'Medium', 'High', 'Medium', 'Low', 'High', 'High', 'Medium', 'Medium', 'Medium', 'High', 'Medium', 'High', 'High', 'Medium', 'High', 'Medium', 'Low', 'High', 'Medium'];

  for (let i = 1; i <= count; i++) {
    const idx = (i - 1) % sampleGpas.length;
    const line = `${i},${20 + (i % 5)},${i % 2 === 0 ? 'Female' : 'Male'},${sampleAtt[idx]},${sampleGpas[idx]},${150 + (i * 3) % 150},${15 + (i * 2) % 25},${70 + (i * 4) % 30},${50 + (i * 3) % 40},${samplePerf[idx]}`;
    const item = parseCSVLine(line, i);
    if (item) list.push(item);
  }
  return list;
}

export function getInitialStudent() {
  const fallback = generateFallbackStudents(1);
  return fallback[0];
}
