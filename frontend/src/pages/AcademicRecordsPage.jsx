import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { academicAPI, studentsAPI, coursesAPI } from '../services/api';

const GRADE_TABLE = [
  { min: 90, grade: 'O', gp: 10, label: 'Outstanding', color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { min: 80, grade: 'A+', gp: 9, label: 'Excellent', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' },
  { min: 70, grade: 'A', gp: 8, label: 'Very Good', color: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400' },
  { min: 60, grade: 'B+', gp: 7, label: 'Good', color: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400' },
  { min: 50, grade: 'B', gp: 6, label: 'Above Average', color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400' },
  { min: 40, grade: 'C', gp: 5, label: 'Average / Pass', color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400' },
  { min: 0, grade: 'F', gp: 0, label: 'Fail', color: 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400' },
];

const getGradeInfo = (totalMarks) => {
  return GRADE_TABLE.find(g => totalMarks >= g.min) || GRADE_TABLE[GRADE_TABLE.length - 1];
};

const BRANCHES = [
  { code: 'CSE', name: 'Computer Science & Engineering', icon: '💻', badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { code: 'ECE', name: 'Electronics & Communication', icon: '⚡', badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { code: 'IT', name: 'Information Technology', icon: '🌐', badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { code: 'MECH', name: 'Mechanical Engineering', icon: '⚙️', badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
];

const BATCHES = [
  { year: 2021, label: 'Batch 2021 (4th Year)', currentSem: 7, maxSem: 8 },
  { year: 2022, label: 'Batch 2022 (3rd Year)', currentSem: 5, maxSem: 6 },
  { year: 2023, label: 'Batch 2023 (2nd Year)', currentSem: 3, maxSem: 4 },
  { year: 2024, label: 'Batch 2024 (2nd Year)', currentSem: 3, maxSem: 4 },
  { year: 2025, label: 'Batch 2025 (1st Year)', currentSem: 1, maxSem: 2 },
];

const COURSE_CATALOG = {
  CSE: {
    1: [
      { code: 'MAT101', name: 'Engineering Mathematics I', credits: 4 },
      { code: 'PHY101', name: 'Engineering Physics', credits: 4 },
      { code: 'CSE101', name: 'Programming in C', credits: 4 },
      { code: 'EEE101', name: 'Basic Electrical Engineering', credits: 3 },
      { code: 'ENG101', name: 'Technical English', credits: 2 },
    ],
    3: [
      { code: 'CSE301', name: 'Data Structures & Algorithms', credits: 4 },
      { code: 'CSE302', name: 'Object Oriented Programming (Java)', credits: 4 },
      { code: 'CSE303', name: 'Discrete Mathematical Structures', credits: 3 },
      { code: 'CSE304', name: 'Digital Logic & Computer Design', credits: 3 },
      { code: 'CSE305', name: 'Computer Organization', credits: 3 },
    ],
    5: [
      { code: 'CSE501', name: 'Operating Systems', credits: 4 },
      { code: 'CSE502', name: 'Database Management Systems', credits: 4 },
      { code: 'CSE503', name: 'Computer Networks', credits: 4 },
      { code: 'CSE504', name: 'Software Engineering', credits: 3 },
      { code: 'CSE505', name: 'Theory of Computation', credits: 3 },
    ],
    7: [
      { code: 'CSE701', name: 'Machine Learning', credits: 4 },
      { code: 'CSE702', name: 'Deep Learning & Neural Nets', credits: 4 },
      { code: 'CSE703', name: 'Algorithm Design & Analysis', credits: 3 },
      { code: 'CSE704', name: 'Database Systems Architecture', credits: 3 },
      { code: 'CSE705', name: 'Cloud Computing & DevOps', credits: 3 },
    ]
  },
  ECE: {
    1: [
      { code: 'MAT101', name: 'Engineering Mathematics I', credits: 4 },
      { code: 'PHY101', name: 'Engineering Physics', credits: 4 },
      { code: 'ECE101', name: 'Basic Electronics', credits: 4 },
      { code: 'MECH101', name: 'Engineering Graphics', credits: 3 },
    ],
    5: [
      { code: 'ECE501', name: 'Digital Signal Processing', credits: 4 },
      { code: 'ECE502', name: 'Microcontrollers & Embedded Systems', credits: 4 },
      { code: 'ECE503', name: 'Communication Systems', credits: 4 },
      { code: 'ECE504', name: 'VLSI Design', credits: 3 },
    ]
  },
  IT: {
    5: [
      { code: 'IT501', name: 'Web Technologies & Frameworks', credits: 4 },
      { code: 'IT502', name: 'Information Security & Cryptography', credits: 4 },
      { code: 'IT503', name: 'Cloud & Virtualization', credits: 4 },
      { code: 'IT504', name: 'Data Mining & Data Warehousing', credits: 3 },
    ]
  },
  MECH: {
    5: [
      { code: 'ME501', name: 'Thermodynamics & Heat Transfer', credits: 4 },
      { code: 'ME502', name: 'Fluid Mechanics & Machinery', credits: 4 },
      { code: 'ME503', name: 'Design of Machine Elements', credits: 4 },
      { code: 'ME504', name: 'Manufacturing Processes', credits: 3 },
    ]
  }
};

const defaultCoursesForSem = (branch, sem) => {
  const branchCatalog = COURSE_CATALOG[branch] || COURSE_CATALOG['CSE'];
  if (branchCatalog[sem]) return branchCatalog[sem];
  return [
    { code: `${branch}${sem}01`, name: `Advanced ${branch} Topic I`, credits: 4 },
    { code: `${branch}${sem}02`, name: `Core ${branch} Systems`, credits: 4 },
    { code: `${branch}${sem}03`, name: `${branch} Applied Laboratory`, credits: 3 },
    { code: `${branch}${sem}04`, name: `${branch} Elective Subject`, credits: 3 },
  ];
};

const STUDENT_NAMES = [
  { first: 'Ananya', last: 'Gupta', gender: 'F' },
  { first: 'Rohan', last: 'Kumar', gender: 'M' },
  { first: 'Aditya', last: 'Chowdhury', gender: 'M' },
  { first: 'Pooja', last: 'Agarwal', gender: 'F' },
  { first: 'Vikram', last: 'Das', gender: 'M' },
  { first: 'Priya', last: 'Singh', gender: 'F' },
  { first: 'Rahul', last: 'Verma', gender: 'M' },
  { first: 'Sneha', last: 'Patel', gender: 'F' },
];

export default function AcademicRecordsPage() {
  const { user, role } = useAuthStore();
  const facultyBranch = user?.department || 'CSE';
  const availableBranches = role === 'faculty'
    ? BRANCHES.filter(b => b.code === facultyBranch)
    : BRANCHES;

  const [selectedBranch, setSelectedBranch] = useState(role === 'faculty' ? facultyBranch : 'CSE');
  const [selectedBatch, setSelectedBatch] = useState(2024);
  const [selectedSem, setSelectedSem] = useState(3);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('records');
  const [studentsData, setStudentsData] = useState([]);
  const [selectedStudentForMarksCard, setSelectedStudentForMarksCard] = useState(null);
  const [editingStudentMarks, setEditingStudentMarks] = useState(null);

  const batchInfo = BATCHES.find(b => b.year === Number(selectedBatch)) || BATCHES[3];
  const maxAvailableSem = batchInfo.currentSem;

  useEffect(() => {
    if (selectedSem > maxAvailableSem) {
      setSelectedSem(maxAvailableSem);
    }
  }, [selectedBatch, maxAvailableSem, selectedSem]);

  // Generate realistic student academic records for selected Branch + Batch + Semester
  useEffect(() => {
    const courses = defaultCoursesForSem(selectedBranch, selectedSem);
    const newStudents = STUDENT_NAMES.map((st, idx) => {
      const usn = `${selectedBranch}${selectedBatch}${strPad(idx + 1, 3)}`;
      const seedVal = (selectedBatch * 17 + idx * 31 + selectedSem * 13) % 100;
      
      const subjectMarks = courses.map((c, cIdx) => {
        const baseInternal = 26 + ((seedVal + cIdx * 7) % 14);
        const baseExternal = 42 + ((seedVal + cIdx * 11) % 18);
        const internal = Math.min(40, Math.max(15, baseInternal));
        const external = Math.min(60, Math.max(20, baseExternal));
        const total = internal + external;
        const gradeInfo = getGradeInfo(total);

        return {
          course_code: c.code,
          course_name: c.name,
          credits: c.credits,
          internal_marks: internal,
          external_marks: external,
          total_marks: total,
          max_marks: 100,
          grade: gradeInfo.grade,
          grade_points: gradeInfo.gp,
          label: gradeInfo.label,
          color: gradeInfo.color,
          is_passed: gradeInfo.gp > 0
        };
      });

      const totalCreditsAttempted = subjectMarks.reduce((sum, s) => sum + s.credits, 0);
      const totalCreditsEarned = subjectMarks.reduce((sum, s) => sum + (s.is_passed ? s.credits : 0), 0);
      const totalWeightedGP = subjectMarks.reduce((sum, s) => sum + (s.grade_points * s.credits), 0);
      const sgpa = totalCreditsAttempted > 0 ? (totalWeightedGP / totalCreditsAttempted).toFixed(2) : '0.00';
      const backlogs = subjectMarks.filter(s => !s.is_passed).length;
      
      const cgpaEstimate = Math.min(10, Math.max(4, Number(sgpa) + (idx % 2 === 0 ? 0.15 : -0.1))).toFixed(2);

      return {
        id: `st_${selectedBranch}_${selectedBatch}_${idx}`,
        usn: usn,
        first_name: st.first,
        last_name: st.last,
        full_name: `${st.first} ${st.last}`,
        gender: st.gender,
        branch: selectedBranch,
        batch_year: selectedBatch,
        semester: selectedSem,
        academic_year: `${selectedBatch + Math.floor((selectedSem - 1) / 2)}-${selectedBatch + Math.floor((selectedSem - 1) / 2) + 1}`,
        subjects: subjectMarks,
        total_credits_attempted: totalCreditsAttempted,
        total_credits_earned: totalCreditsEarned,
        sgpa: sgpa,
        cgpa: cgpaEstimate,
        backlogs: backlogs,
        status: backlogs === 0 ? 'PASSED' : (backlogs <= 2 ? 'PROMOTED WITH BACKLOGS' : 'FAILED')
      };
    });

    setStudentsData(newStudents);
  }, [selectedBranch, selectedBatch, selectedSem]);

  function strPad(n, width) {
    let s = String(n);
    while (s.length < width) s = '0' + s;
    return s;
  }

  const filteredStudents = studentsData.filter(st =>
    !search || `${st.full_name} ${st.usn}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalStudents = studentsData.length;
  const passedStudents = studentsData.filter(s => s.backlogs === 0).length;
  const passPercentage = totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0;
  const avgClassSGPA = totalStudents > 0 ? (studentsData.reduce((acc, s) => acc + Number(s.sgpa), 0) / totalStudents).toFixed(2) : '0.00';

  const handleUpdateMarks = (updatedSubjectList) => {
    if (!editingStudentMarks) return;

    const totalCreditsAttempted = updatedSubjectList.reduce((sum, s) => sum + s.credits, 0);
    const totalCreditsEarned = updatedSubjectList.reduce((sum, s) => sum + (s.is_passed ? s.credits : 0), 0);
    const totalWeightedGP = updatedSubjectList.reduce((sum, s) => sum + (s.grade_points * s.credits), 0);
    const sgpa = totalCreditsAttempted > 0 ? (totalWeightedGP / totalCreditsAttempted).toFixed(2) : '0.00';
    const backlogs = updatedSubjectList.filter(s => !s.is_passed).length;

    const updatedStudent = {
      ...editingStudentMarks,
      subjects: updatedSubjectList,
      total_credits_attempted: totalCreditsAttempted,
      total_credits_earned: totalCreditsEarned,
      sgpa: sgpa,
      backlogs: backlogs,
      status: backlogs === 0 ? 'PASSED' : (backlogs <= 2 ? 'PROMOTED WITH BACKLOGS' : 'FAILED')
    };

    setStudentsData(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    setEditingStudentMarks(null);
    toast.success('Marks updated & SGPA re-calculated successfully!');
  };

  // Dedicated Student Portal View: Shows ONLY logged-in student's branch, batch, and personal grade card
  if (role === 'student') {
    const studentBranch = user?.department || user?.branch || 'CSE';
    const studentBatch = user?.batch_year || 2024;
    const studentFirst = user?.first_name || 'Ananya';
    const studentLast = user?.last_name || 'Gupta';
    const studentFullName = user?.full_name || `${studentFirst} ${studentLast}`.trim();
    const studentId = String(user?.student_profile?.Student_ID || user?.student_id || '1');
    const studentCgpa = user?.student_profile?.Prior_GPA ? String(user.student_profile.Prior_GPA) : (user?.cgpa ? String(user.cgpa) : '2.45');

    const matched = studentsData.find(s => 
      s.full_name?.toLowerCase() === studentFullName.toLowerCase() ||
      s.first_name?.toLowerCase() === studentFirst.toLowerCase() ||
      s.usn === studentId
    );

    const baseStudent = matched || studentsData[0];
    const myStudent = {
      ...(baseStudent || {}),
      id: 'st_me',
      first_name: studentFirst,
      last_name: studentLast,
      full_name: studentFullName,
      usn: studentId,
      branch: studentBranch,
      batch_year: studentBatch,
      semester: selectedSem,
      cgpa: studentCgpa,
      sgpa: baseStudent?.sgpa || '3.50',
      total_credits_earned: baseStudent?.total_credits_earned || 22,
      total_credits_attempted: baseStudent?.total_credits_attempted || 22,
      backlogs: baseStudent?.backlogs || 0,
      status: 'PASSED',
      subjects: baseStudent?.subjects || defaultCoursesForSem(studentBranch, selectedSem).map((c, idx) => ({
        course_code: c.code,
        course_name: c.name,
        credits: c.credits,
        internal_marks: 32 + (idx % 5),
        external_marks: 52 + (idx % 7),
        total_marks: 84 + (idx % 3),
        max_marks: 100,
        grade: 'A+',
        grade_points: 9,
        label: 'Outstanding',
        is_passed: true
      }))
    };

    return (
      <div className="space-y-6 animate-fade-in pb-12">
        {/* Student Personalized Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl font-bold">
              🎓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{myStudent.full_name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {myStudent.usn}
                </span>
              </div>
              <p className="text-blue-200 text-xs mt-1">
                Department of {studentBranch} • Batch {studentBatch} • Enrolled Student
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedStudentForMarksCard(myStudent)}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
          >
            🖨️ Print Official Grade Card (Sem {selectedSem})
          </button>
        </div>

        {/* Semester Selection Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">Semester:</span>
          {[1, 2, 3].map(sem => (
            <button
              key={sem}
              onClick={() => setSelectedSem(sem)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedSem === sem
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              Semester {sem}
            </button>
          ))}
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <span className="text-xs text-slate-400 font-medium">Semester SGPA</span>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{myStudent.sgpa}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <span className="text-xs text-slate-400 font-medium">Earned Credits</span>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{myStudent.total_credits_earned} / {myStudent.total_credits_attempted}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <span className="text-xs text-slate-400 font-medium">Active Backlogs</span>
            <p className={`text-2xl font-bold mt-1 ${myStudent.backlogs > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{myStudent.backlogs}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <span className="text-xs text-slate-400 font-medium">Semester Status</span>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{myStudent.status}</p>
          </div>
        </div>

        {/* Detailed Marks Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Subject Marks & Grade Sheet — Semester {selectedSem}</h3>
            <span className="text-xs text-slate-400 font-mono">{studentBranch} Curriculum</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Subject Code</th>
                  <th className="py-3.5 px-4">Subject Name</th>
                  <th className="py-3.5 px-4 text-center">Credits</th>
                  <th className="py-3.5 px-4 text-center">Internal (40)</th>
                  <th className="py-3.5 px-4 text-center">External (60)</th>
                  <th className="py-3.5 px-4 text-center">Total (100)</th>
                  <th className="py-3.5 px-4 text-center">Grade</th>
                  <th className="py-3.5 px-4 text-center">Grade Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {myStudent.subjects?.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{sub.course_code}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white text-sm">{sub.course_name}</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-600 dark:text-slate-400">{sub.credits}</td>
                    <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-400">{sub.internal_marks}</td>
                    <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-400">{sub.external_marks}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-white">{sub.total_marks}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${sub.is_passed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-700'}`}>
                        {sub.grade}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">{sub.grade_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Printable Marks Card Modal */}
        {selectedStudentForMarksCard && (
          <MarksCardModal
            student={selectedStudentForMarksCard}
            onClose={() => setSelectedStudentForMarksCard(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            🎓 Academic Records & Grade Cards
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse by Branch, Batch Year, and Semester to retrieve subject-wise marks cards and class academic analytics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.success(`Exported ${selectedBranch} Batch ${selectedBatch} Sem ${selectedSem} to Excel!`)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            📥 Export Class Sheet
          </button>
        </div>
      </div>

      {/* Step 1: Branch Selection */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Step 1: Select Branch</span>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{BRANCHES.find(b => b.code === selectedBranch)?.name}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {availableBranches.map(branch => {
            const isSelected = selectedBranch === branch.code;
            return (
              <button
                key={branch.code}
                onClick={() => setSelectedBranch(branch.code)}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/30 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <span className="text-2xl">{branch.icon}</span>
                <div>
                  <h4 className={`text-sm font-bold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-white'}`}>{branch.code}</h4>
                  <p className="text-xs text-slate-500 truncate max-w-[120px]">{branch.name}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Batch Year Selection */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Step 2: Select Academic Batch</span>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{batchInfo.label}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {BATCHES.map(batch => {
            const isSelected = Number(selectedBatch) === batch.year;
            return (
              <button
                key={batch.year}
                onClick={() => setSelectedBatch(batch.year)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-900/30 ring-2 ring-indigo-500/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <p className={`text-sm font-bold ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-white'}`}>
                  Batch {batch.year}
                </p>
                <span className="text-[11px] text-slate-500 block mt-0.5">{batch.label.split(' ')[1]} {batch.label.split(' ')[2]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3: Semester Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">Semester:</span>
          {Array.from({ length: maxAvailableSem }, (_, i) => i + 1).map(sem => {
            const isSelected = selectedSem === sem;
            return (
              <button
                key={sem}
                onClick={() => setSelectedSem(sem)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                Semester {sem}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600">
          Viewing: <span className="font-bold text-slate-800 dark:text-white">{selectedBranch}</span> | <span className="font-bold text-slate-800 dark:text-white">Batch {selectedBatch}</span> | <span className="font-bold text-blue-600 dark:text-blue-400">Sem {selectedSem}</span>
        </div>
      </div>

      {/* Class Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Enrolled', value: totalStudents, icon: '👨‍🎓', color: 'bg-blue-500' },
          { label: 'Pass Rate', value: `${passPercentage}%`, icon: '✅', color: 'bg-emerald-500' },
          { label: 'Class Avg SGPA', value: avgClassSGPA, icon: '📈', color: 'bg-indigo-500' },
          { label: 'Top Scorer', value: `${studentsData[0]?.full_name || 'N/A'} (${studentsData[0]?.sgpa || '0'})`, icon: '🏆', color: 'bg-amber-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-3">
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-sm`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white truncate max-w-[140px]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Actions Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search student by name or USN..."
            className="w-full pl-4 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Showing {filteredStudents.length} Students
        </span>
      </div>

      {/* Student Academic Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">USN / Roll No</th>
                <th className="py-3.5 px-4">Semester</th>
                <th className="py-3.5 px-4">SGPA</th>
                <th className="py-3.5 px-4">Earned Credits</th>
                <th className="py-3.5 px-4">Backlogs</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                        {student.first_name[0]}{student.last_name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white text-sm">{student.full_name}</p>
                        <p className="text-xs text-slate-400">{student.branch} - Batch {student.batch_year}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                    {student.usn}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Sem {student.semester}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {student.sgpa}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                    {student.total_credits_earned} / {student.total_credits_attempted}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold">
                    {student.backlogs > 0 ? (
                      <span className="text-rose-600 font-bold">⚠️ {student.backlogs} Backlog(s)</span>
                    ) : (
                      <span className="text-emerald-600 font-medium">Clear</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      student.status === 'PASSED'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : (student.status.includes('BACKLOGS') ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300')
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedStudentForMarksCard(student)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-all flex items-center gap-1.5"
                        title="View Official Marks Card"
                      >
                        📜 Marks Card
                      </button>
                      {role !== 'student' && (
                        <button
                          onClick={() => setEditingStudentMarks(student)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                          title="Edit Subject Marks"
                        >
                          ✏️ Edit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Marks Card Modal */}
      {selectedStudentForMarksCard && (
        <MarksCardModal
          student={selectedStudentForMarksCard}
          onClose={() => setSelectedStudentForMarksCard(null)}
        />
      )}

      {/* Edit Marks Modal */}
      {editingStudentMarks && (
        <EditMarksModal
          student={editingStudentMarks}
          onSave={handleUpdateMarks}
          onClose={() => setEditingStudentMarks(null)}
        />
      )}
    </div>
  );
}

// ---- Official Marks Card Modal Component ----
function MarksCardModal({ student, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl overflow-hidden animate-scale-up my-8">
        {/* Printable Area */}
        <div id="printable-marks-card" className="p-8 space-y-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-800 dark:border-slate-200 pb-4">
            <div className="flex items-center justify-center gap-3 mb-1">
              <span className="text-3xl">🎓</span>
              <h2 className="text-xl font-black uppercase tracking-wider">Smart Academic Performance System</h2>
            </div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Autonomous Institution of Academic Excellence</p>
            <h3 className="text-base font-bold mt-2 text-blue-700 dark:text-blue-400 uppercase tracking-wide">
              Official Grade Sheet / Semester Marks Card
            </h3>
          </div>

          {/* Student Profile Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-slate-400 block font-bold uppercase text-[10px]">Student Name</span>
              <span className="font-bold text-sm text-slate-800 dark:text-white">{student.full_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold uppercase text-[10px]">USN / Roll Number</span>
              <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">{student.usn}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold uppercase text-[10px]">Branch / Department</span>
              <span className="font-bold text-slate-800 dark:text-white">{student.branch}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold uppercase text-[10px]">Academic Batch / Sem</span>
              <span className="font-bold text-slate-800 dark:text-white">Batch {student.batch_year} (Sem {student.semester})</span>
            </div>
          </div>

          {/* Subject Grade Sheet Table */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2.5 px-3">Subject Code</th>
                  <th className="py-2.5 px-3">Course Title</th>
                  <th className="py-2.5 px-3 text-center">Credits</th>
                  <th className="py-2.5 px-3 text-center">Internal (40)</th>
                  <th className="py-2.5 px-3 text-center">External (60)</th>
                  <th className="py-2.5 px-3 text-center">Total (100)</th>
                  <th className="py-2.5 px-3 text-center">Grade</th>
                  <th className="py-2.5 px-3 text-center">GP</th>
                  <th className="py-2.5 px-3 text-center">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {student.subjects.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">{s.course_code}</td>
                    <td className="py-2.5 px-3 font-medium">{s.course_name}</td>
                    <td className="py-2.5 px-3 text-center font-semibold">{s.credits}</td>
                    <td className="py-2.5 px-3 text-center">{s.internal_marks}</td>
                    <td className="py-2.5 px-3 text-center">{s.external_marks}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white">{s.total_marks}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${s.color}`}>
                        {s.grade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">{s.grade_points}</td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      {s.is_passed ? (
                        <span className="text-emerald-600 dark:text-emerald-400">P</span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400">F</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Academic Result Footer */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <div>
              <span className="text-slate-400 block font-bold text-[10px] uppercase">Earned / Attempted Credits</span>
              <span className="font-bold text-sm text-slate-800 dark:text-white">{student.total_credits_earned} / {student.total_credits_attempted}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold text-[10px] uppercase">Semester SGPA</span>
              <span className="font-bold text-base text-blue-600 dark:text-blue-400">{student.sgpa} / 10.0</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold text-[10px] uppercase">Cumulative CGPA</span>
              <span className="font-bold text-base text-indigo-600 dark:text-indigo-400">{student.cgpa} / 10.0</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold text-[10px] uppercase">Overall Semester Result</span>
              <span className={`font-bold text-sm ${student.status === 'PASSED' ? 'text-emerald-600' : 'text-amber-600'}`}>{student.status}</span>
            </div>
          </div>

          {/* Signatures Footer */}
          <div className="pt-8 flex justify-between text-xs text-slate-400 border-t border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-bold text-slate-600 dark:text-slate-300">Controller of Examinations</p>
              <p className="text-[10px] mt-4">Verified & Authenticated Document</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-600 dark:text-slate-300">Dean of Academics</p>
              <p className="text-[10px] mt-4">Date of Issue: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="bg-slate-50 dark:bg-slate-800 p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-semibold transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/30 transition-all flex items-center gap-2"
          >
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Edit Marks Modal Component ----
function EditMarksModal({ student, onSave, onClose }) {
  const [subjectMarks, setSubjectMarks] = useState(student.subjects.map(s => ({ ...s })));

  const handleInternalChange = (idx, val) => {
    const internal = Math.min(40, Math.max(0, Number(val) || 0));
    setSubjectMarks(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      const total = internal + s.external_marks;
      const gradeInfo = getGradeInfo(total);
      return {
        ...s,
        internal_marks: internal,
        total_marks: total,
        grade: gradeInfo.grade,
        grade_points: gradeInfo.gp,
        color: gradeInfo.color,
        is_passed: gradeInfo.gp > 0
      };
    }));
  };

  const handleExternalChange = (idx, val) => {
    const external = Math.min(60, Math.max(0, Number(val) || 0));
    setSubjectMarks(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      const total = s.internal_marks + external;
      const gradeInfo = getGradeInfo(total);
      return {
        ...s,
        external_marks: external,
        total_marks: total,
        grade: gradeInfo.grade,
        grade_points: gradeInfo.gp,
        color: gradeInfo.color,
        is_passed: gradeInfo.gp > 0
      };
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl p-6 space-y-5 animate-scale-up">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Edit Subject Marks</h3>
            <p className="text-xs text-slate-500">{student.full_name} ({student.usn}) — Sem {student.semester}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
        </div>

        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {subjectMarks.map((s, idx) => (
            <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-bold text-xs text-slate-800 dark:text-white">{s.course_code} - {s.course_name}</p>
                <span className="text-[11px] text-slate-500">Credits: {s.credits}</span>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase">Internal (40)</label>
                  <input
                    type="number"
                    max="40"
                    min="0"
                    value={s.internal_marks}
                    onChange={e => handleInternalChange(idx, e.target.value)}
                    className="w-16 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-center font-bold text-xs text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase">External (60)</label>
                  <input
                    type="number"
                    max="60"
                    min="0"
                    value={s.external_marks}
                    onChange={e => handleExternalChange(idx, e.target.value)}
                    className="w-16 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-center font-bold text-xs text-slate-800 dark:text-white"
                  />
                </div>
                <div className="text-center w-16">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Total / Grade</span>
                  <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400">{s.total_marks} ({s.grade})</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(subjectMarks)}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/30"
          >
            Save Marks & Recalculate SGPA
          </button>
        </div>
      </div>
    </div>
  );
}
