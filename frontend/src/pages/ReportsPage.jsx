import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import {
  loadDatasetStudents,
  generateFallbackStudents,
  getInitialStudent,
} from '../utils/studentData';

const reportTypes = [
  { id:'student-report', title:'Student Report Card', desc:'Individual performance PDF with semester-wise grades, attendance, and AI predictions', icon:'📋', color:'from-blue-500 to-blue-700', category:'individual' },
  { id:'dept-analytics', title:'Department Performance Report', desc:'Comprehensive department-wide CGPA distribution, pass percentage, and subject breakdown', icon:'🏢', color:'from-emerald-500 to-emerald-700', category:'departmental' },
  { id:'course-completion', title:'Course Completion & Credit Audit', desc:'Subject-wise pass rate, internal marks distribution, and credit completion report', icon:'📚', color:'from-teal-600 to-teal-800', category:'departmental' },
  { id:'at-risk-summary', title:'At-Risk Students Summary', desc:'Detailed list of High & Critical risk students requiring immediate faculty counseling', icon:'⚠️', color:'from-rose-500 to-rose-700', category:'risk & alerts' },
  { id:'attendance-warning', title:'Attendance Defaulters List', desc:'List of students below 75% attendance threshold with branch-wise breakdown', icon:'⏰', color:'from-amber-500 to-amber-700', category:'risk & alerts' },
  { id:'student-roster-export', title:'Full Student Master Data (CSV)', desc:'Export all student demographics, CGPA, attendance, and risk scores as CSV', icon:'📊', color:'from-purple-600 to-purple-800', category:'system & exports' },
  { id:'ai-forecast-metrics', title:'AI Model Metrics & Audit Report', desc:'ML Model performance metrics, RMSE, MAE, R² score and prediction confidence audit', icon:'🤖', color:'from-cyan-600 to-blue-800', category:'system & exports' },
];

const riskBadgeColors = {
  LOW: 'text-emerald-600 bg-emerald-50',
  MEDIUM: 'text-amber-600 bg-amber-50',
  HIGH: 'text-orange-600 bg-orange-50',
  CRITICAL: 'text-rose-600 bg-rose-50',
};

const exportToCSV = (filename, rows) => {
  const processRow = (row) => row.map(val => `"${val}"`).join(',');
  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(processRow).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ─── Student Picker Modal (for admin/faculty) ────────────────────────────────
const StudentPickerModal = ({ students, onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');

  const depts = ['All', 'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI & DS'];

  const filtered = (students || []).filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.student_id && s.student_id.toLowerCase().includes(q)) ||
      (s.id && String(s.id).includes(q));
    const matchDept = deptFilter === 'All' || s.dept === deptFilter || s.department_name === deptFilter;
    const sRisk = (s.risk_level || s.risk || '').toUpperCase();
    const matchRisk = riskFilter === 'All' || sRisk === riskFilter.toUpperCase();
    return matchSearch && matchDept && matchRisk;
  });

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="font-black text-lg">Select Student from Base Paper Dataset</h2>
            <p className="text-blue-300 text-xs mt-0.5">Showing {filtered.length} of {students?.length || 2000} total dataset records</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">✕</button>
        </div>

        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by student name, roll number, or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {depts.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
          </select>
          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="CRITICAL">Critical Risk</option>
          </select>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-12">No matching students found in dataset</p>
          ) : filtered.slice(0, 100).map(s => (
            <button
              key={s.id || s.student_id}
              onClick={() => onSelect(s)}
              className="w-full flex items-center gap-4 px-5 py-3 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                {s.name ? s.name.charAt(0) : 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{s.name}</p>
                <p className="text-xs text-slate-400">
                  Roll: {s.student_id || s.id} • {s.dept || s.department_name} • Sem {s.semester || s.current_semester || 6} • CGPA: {typeof s.cgpa === 'number' ? s.cgpa.toFixed(2) : s.cgpa} • Att: {s.attendance_pct ? `${s.attendance_pct.toFixed(1)}%` : s.attendance}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${riskBadgeColors[(s.risk_level || s.risk || 'LOW').toUpperCase()] || 'text-slate-600 bg-slate-100'}`}>
                {(s.risk_level || s.risk || 'LOW').toUpperCase()}
              </span>
            </button>
          ))}
          {filtered.length > 100 && (
            <p className="text-center text-xs text-slate-400 py-3 bg-slate-50 dark:bg-slate-800/50">
              Showing top 100 of {filtered.length} matching students. Refine your search to find specific students.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Printable Report Card ────────────────────────────────────────────────────
const PrintableReport = ({ data, onClose }) => {
  const handlePrintPDF = () => {
    toast.success('Opening print / PDF download dialog...');
    window.print();
  };

  const riskEmoji   = { low: '✅', medium: '⚠️', high: '🔴', critical: '🚨' };
  const riskLabel   = { low: 'LOW', medium: 'MEDIUM', high: 'HIGH', critical: 'CRITICAL' };
  const riskColor   = { low: 'text-emerald-600', medium: 'text-amber-600', high: 'text-orange-600', critical: 'text-rose-600' };
  const riskRec     = {
    low:      'Maintain current performance trajectory. Consider participating in research projects or internships.',
    medium:   'Moderate risk detected. Focus on improving assignment scores and attendance regularity.',
    high:     'Academic counseling recommended. Improve attendance and prioritize internal assessments.',
    critical: 'Immediate academic intervention required. Mandatory remedial classes and parent notification advised.',
  };
  const risk = data.prediction?.risk || 'low';

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-white">
        {/* Report Header */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">🎓</div>
              <div>
                <h1 className="text-lg font-black">SAPFS — Academic Report Card</h1>
                <p className="text-blue-300 text-xs">Smart Academic Performance Forecasting System</p>
              </div>
            </div>
            <div className="text-right text-xs text-blue-200">
              <p>Academic Year: 2024-25</p>
              <p>Generated: {new Date().toLocaleDateString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-4 gap-4">
            {[
              ['Student Name', data.name],
              ['Roll Number', data.student_id || data.id],
              ['Department', data.dept || data.department_name],
              ['CGPA', typeof data.cgpa === 'number' ? data.cgpa.toFixed(2) : data.cgpa],
              ['Current Semester', `Semester ${data.semester || data.current_semester || 6}`],
              ['Risk Level', riskLabel[risk] || 'LOW'],
              ['Predicted GPA', typeof data.prediction?.gpa === 'number' ? data.prediction.gpa.toFixed(2) : data.prediction?.gpa],
              ['Confidence', `${data.prediction?.confidence}%`],
            ].map(([k, v]) => (
              <div key={k} className="bg-white dark:bg-slate-700 rounded-xl p-3 border border-slate-200 dark:border-slate-600">
                <p className="text-xs text-slate-500 dark:text-slate-400">{k}</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Marks Table */}
        <div className="p-5">
          <h3 className="font-bold text-slate-800 dark:text-white mb-3 text-sm">📚 Semester {data.semester} Academic Performance</h3>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                {['Code','Course Name','Internal (40)','External (60)','Total','Grade','Credits','Status'].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.courses.map((c, i) => (
                <tr key={c.code} className={i%2===0?'bg-white dark:bg-slate-800':'bg-slate-50 dark:bg-slate-700/50'}>
                  <td className="px-3 py-2 font-mono text-blue-700 dark:text-blue-400 font-bold">{c.code}</td>
                  <td className="px-3 py-2">{c.name}</td>
                  <td className="px-3 py-2 text-center">{c.internal}</td>
                  <td className="px-3 py-2 text-center">{c.external}</td>
                  <td className="px-3 py-2 text-center font-bold">{c.total}</td>
                  <td className="px-3 py-2 text-center"><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">{c.grade}</span></td>
                  <td className="px-3 py-2 text-center">{c.credits}</td>
                  <td className="px-3 py-2 text-center">
                    {c.passed
                      ? <span className="text-emerald-600 font-bold">✓</span>
                      : <span className="text-rose-600 font-bold">✗</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50 dark:bg-slate-700 font-bold">
                <td colSpan={5} className="px-3 py-2 text-right text-blue-800 dark:text-blue-300">Semester SGPA:</td>
                <td colSpan={3} className="px-3 py-2 text-blue-800 dark:text-blue-300 text-lg">{data.sgpa}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* AI Prediction */}
        <div className="mx-5 mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
          <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2 text-sm">🤖 AI Forecast — Next Semester</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-500">Predicted GPA</p>
              <p className="text-lg font-black text-emerald-600">{data.prediction?.gpa}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-500">Risk Level</p>
              <p className={`text-sm font-bold ${riskColor[risk] || 'text-emerald-600'}`}>
                {riskEmoji[risk] || '✅'} {riskLabel[risk] || 'LOW'}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-500">Confidence</p>
              <p className="text-lg font-black text-blue-600">{data.prediction?.confidence}%</p>
            </div>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">💡 {riskRec[risk]}</p>
        </div>

        <div className="flex gap-3 p-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={handlePrintPDF} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">📥 Download / Print PDF</button>
          <button onClick={() => toast.success('Report sent via email to student address')} className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 transition-colors">📧 Email Report</button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm hover:bg-slate-50 transition-colors">✕</button>
        </div>
      </div>
    </div>
  );
};

export default function ReportsPage() {
  const { user, role } = useAuthStore();
  const [activeCat, setActiveCat] = useState('All');
  const [showReport, setShowReport] = useState(false);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [studentsList, setStudentsList] = useState(() => generateFallbackStudents(50));
  const [selectedStudentData, setSelectedStudentData] = useState(() => getInitialStudent());
  const [generating, setGenerating] = useState(null);

  useEffect(() => {
    loadDatasetStudents().then(data => {
      if (data && data.length > 0) {
        setStudentsList(data);
        if (!selectedStudentData || selectedStudentData.id === '1') {
          setSelectedStudentData(data[0]);
        }
      }
    });
  }, []);

  const [recentReports, setRecentReports] = useState([
    { id: 'r1', title: 'CSE Department Risk Analysis Report.pdf', date: '2024-12-15', size: '1.4 MB' },
    { id: 'r2', title: 'Semester 7 Attendance Defaulters List.csv', date: '2024-12-14', size: '240 KB' },
    { id: 'r3', title: 'ML Model Stacking Ensemble Evaluation.pdf', date: '2024-12-10', size: '3.1 MB' },
  ]);

  const availableCategories = role === 'student'
    ? ['All', 'individual']
    : ['All', 'individual', 'departmental', 'risk & alerts', 'system & exports'];

  const availableReports = role === 'student'
    ? reportTypes.filter(r => r.category === 'individual')
    : reportTypes;

  const filtered = activeCat === 'All' 
    ? availableReports 
    : availableReports.filter(r => r.category === activeCat);

  // Live Risk Counts from the real dataset
  const totalStudents = studentsList.length || 2000;
  const riskCounts = studentsList.reduce((acc, s) => {
    const r = (s.risk_level || s.risk || 'low').toLowerCase();
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, { low: 0, medium: 0, high: 0, critical: 0 });

  const handleDownloadRiskSnapshot = () => {
    const headers = ['Risk_Level', 'Student_Count', 'Percentage', 'Status_Description'];
    const rows = [
      ['Low Risk', String(riskCounts.low), `${((riskCounts.low / totalStudents) * 100).toFixed(1)}%`, 'On track for good academic performance'],
      ['Medium Risk', String(riskCounts.medium), `${((riskCounts.medium / totalStudents) * 100).toFixed(1)}%`, 'Needs continuous academic monitoring'],
      ['High Risk', String(riskCounts.high), `${((riskCounts.high / totalStudents) * 100).toFixed(1)}%`, 'Requires active faculty counseling and tutoring'],
      ['Critical', String(riskCounts.critical), `${((riskCounts.critical / totalStudents) * 100).toFixed(1)}%`, 'Immediate remediation and guardian alert required'],
    ];
    exportToCSV('quick_risk_snapshot_2000_dataset.csv', [headers, ...rows]);
    toast.success('Quick Risk Snapshot CSV exported successfully!');
  };

  const handleDeleteRecentReport = (id, title) => {
    setRecentReports(prev => prev.filter(r => r.id !== id));
    toast.success(`Removed "${title}" from recent reports.`);
  };

  const handleGenerate = async (report) => {
    setGenerating(report.id);
    await new Promise(r => setTimeout(r, 600));
    setGenerating(null);

    if (report.id === 'student-report') {
      if (role === 'student') {
        const studentData = selectedStudentData || studentsList[0];
        setSelectedStudentData(studentData);
        setShowReport(true);
      } else {
        // Admin/Faculty: show report for currently chosen student
        if (selectedStudentData) {
          setShowReport(true);
        } else {
          setShowStudentPicker(true);
        }
      }
    } else if (report.id === 'student-roster-export') {
      toast.loading('Preparing Full Student Master Data CSV...', { id: 'roster-exp' });
      const students = await loadDatasetStudents();
      const headers = ['Student_ID', 'Roll_Number', 'Name', 'Gender', 'Department', 'Current_Semester', 'CGPA', 'Attendance_Pct', 'LMS_Logins', 'Study_Hours_Wk', 'Assignment_Submission_Rate', 'Engagement_Score', 'Final_Academic_Performance', 'Risk_Level'];
      const data = students.map(s => [
        s.id,
        s.student_id,
        s.name,
        s.gender || 'Female',
        s.dept || s.department_name,
        String(s.semester || s.current_semester || 6),
        typeof s.cgpa === 'number' ? s.cgpa.toFixed(2) : s.cgpa,
        s.attendance_pct ? `${s.attendance_pct.toFixed(1)}%` : s.attendance,
        s.lms_logins || 150,
        s.study_hours || 20,
        s.assignment_submission_rate || 80,
        s.engagement_score || 50,
        s.final_academic_performance || 'Medium',
        s.risk_level || s.risk
      ]);
      exportToCSV(`student_master_data_${students.length}_records.csv`, [headers, ...data]);
      toast.success(`Exported ${students.length} student records successfully!`, { id: 'roster-exp' });
    } else if (report.id === 'at-risk-summary') {
      toast.loading('Generating At-Risk Students Summary...', { id: 'at-risk-exp' });
      const students = await loadDatasetStudents();
      const atRisk = students.filter(s => {
        const r = (s.risk_level || s.risk || '').toLowerCase();
        return r === 'high' || r === 'critical';
      });
      const headers = ['Student_ID', 'Roll_Number', 'Name', 'Department', 'CGPA', 'Attendance_Pct', 'Risk_Level', 'Recommended_Intervention'];
      const data = atRisk.map(s => [
        s.id,
        s.student_id,
        s.name,
        s.dept || s.department_name,
        typeof s.cgpa === 'number' ? s.cgpa.toFixed(2) : s.cgpa,
        s.attendance_pct ? `${s.attendance_pct.toFixed(1)}%` : s.attendance,
        (s.risk_level || s.risk).toUpperCase(),
        (s.risk_level || s.risk).toLowerCase() === 'critical' ? 'Mandatory 1-on-1 Academic Counseling & Parent Alert' : 'Remedial Classes & Assignment Tutoring'
      ]);
      exportToCSV(`at_risk_students_summary_${atRisk.length}_students.csv`, [headers, ...data]);
      toast.success(`Exported ${atRisk.length} High & Critical Risk Students!`, { id: 'at-risk-exp' });
    } else if (report.id === 'attendance-warning') {
      toast.loading('Exporting Attendance Defaulters List...', { id: 'att-def-exp' });
      const students = await loadDatasetStudents();
      const defaulters = students.filter(s => (s.attendance_pct || 0) < 75);
      const headers = ['Student_ID', 'Roll_Number', 'Name', 'Department', 'Attendance_Pct', 'Threshold', 'Status'];
      const data = defaulters.map(s => [
        s.id,
        s.student_id,
        s.name,
        s.dept || s.department_name,
        `${(s.attendance_pct || 0).toFixed(1)}%`,
        '75%',
        (s.attendance_pct || 0) < 50 ? 'CRITICAL DEFICIT' : 'BELOW 75% REQUIREMENT'
      ]);
      exportToCSV(`attendance_defaulters_${defaulters.length}_students.csv`, [headers, ...data]);
      toast.success(`Exported ${defaulters.length} Attendance Defaulters!`, { id: 'att-def-exp' });
    } else if (report.id === 'dept-analytics') {
      const students = await loadDatasetStudents();
      const depts = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI & DS'];
      const headers = ['Department', 'Total_Students', 'Average_CGPA', 'Average_Attendance', 'High_Critical_Risk_Count', 'Risk_Percentage'];
      const data = depts.map(d => {
        const dStudents = students.filter(s => (s.dept || s.department_name) === d);
        const count = dStudents.length || 1;
        const avgGpa = (dStudents.reduce((acc, s) => acc + (s.cgpa || 0), 0) / count).toFixed(2);
        const avgAtt = (dStudents.reduce((acc, s) => acc + (s.attendance_pct || 0), 0) / count).toFixed(1);
        const riskCount = dStudents.filter(s => {
          const r = (s.risk_level || s.risk || '').toLowerCase();
          return r === 'high' || r === 'critical';
        }).length;
        const riskRate = `${((riskCount / count) * 100).toFixed(1)}%`;
        return [d, String(dStudents.length), avgGpa, `${avgAtt}%`, String(riskCount), riskRate];
      });
      exportToCSV('department_performance_analytics.csv', [headers, ...data]);
      toast.success('Department Performance Analytics CSV exported!');
    } else {
      toast.success(`${report.title} generated and ready to download!`);
    }
  };

  const handleStudentSelect = (student) => {
    setShowStudentPicker(false);
    setSelectedStudentData(student);
    setShowReport(true);
    toast.success(`Selected ${student.name} (${student.student_id || student.id})!`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          {role === 'student' ? 'My Academic Documents & Reports' : 'Reports & Documents'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {role === 'student' ? 'Download your official report cards and academic transcript' : `Generate PDF reports, export data, and download academic documents across ${totalStudents} students`}
        </p>
      </div>

      {/* Quick Risk Summary (Only visible to Faculty and Admin) */}
      {role !== 'student' && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg">📊 Quick Risk Snapshot</h3>
              <p className="text-blue-300 text-xs mt-1">Real-time academic risk distribution across {totalStudents} base paper dataset students</p>
            </div>
            <button onClick={handleDownloadRiskSnapshot} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors">Download CSV →</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Low Risk', count: riskCounts.low, pct: `${((riskCounts.low / totalStudents) * 100).toFixed(0)}%`, color: '#10b981' },
              { label: 'Medium Risk', count: riskCounts.medium, pct: `${((riskCounts.medium / totalStudents) * 100).toFixed(0)}%`, color: '#f59e0b' },
              { label: 'High Risk', count: riskCounts.high, pct: `${((riskCounts.high / totalStudents) * 100).toFixed(0)}%`, color: '#ef4444' },
              { label: 'Critical Risk', count: riskCounts.critical, pct: `${((riskCounts.critical / totalStudents) * 100).toFixed(0)}%`, color: '#7c3aed' },
            ].map(r => (
              <div key={r.label} className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-black" style={{ color: r.color }}>{r.count}</p>
                <p className="text-xs text-blue-200 mt-1">{r.label}</p>
                <p className="text-xs font-bold text-white">{r.pct}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {availableCategories.map(c => (
          <button key={c} onClick={() => setActiveCat(c)} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all capitalize ${activeCat === c ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 hover:border-blue-300'}`}>{c}</button>
        ))}
      </div>

      {/* Report Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map(r => (
          <div key={r.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group flex flex-col">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${r.color} flex items-center justify-center text-2xl text-white mb-4 group-hover:scale-110 transition-transform`}>{r.icon}</div>
            <h3 className="font-bold text-slate-800 dark:text-white mb-1 text-sm">{r.title}</h3>
            <p className="text-xs text-slate-500 mb-4 flex-1 leading-relaxed">{r.desc}</p>
            
            {role !== 'student' && r.id === 'student-report' && (
              <div className="mb-3 p-2.5 bg-blue-50/70 dark:bg-slate-700/50 rounded-xl border border-blue-100 dark:border-slate-600">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Target Student:</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowStudentPicker(true); }}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    🔍 Change
                  </button>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                  {selectedStudentData ? `${selectedStudentData.name} (${selectedStudentData.student_id || selectedStudentData.id})` : 'Select student...'}
                </p>
                {selectedStudentData && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {selectedStudentData.dept || selectedStudentData.department_name} • Sem {selectedStudentData.semester || 6} • CGPA {typeof selectedStudentData.cgpa === 'number' ? selectedStudentData.cgpa.toFixed(2) : selectedStudentData.cgpa}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => handleGenerate(r)} disabled={generating === r.id} className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors">
                {generating === r.id ? (
                  <span className="flex items-center justify-center gap-1"><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Generating</span>
                ) : '📄 Generate'}
              </button>
              <button onClick={() => toast.success('Scheduled for email delivery')} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs hover:bg-slate-200 transition-colors">📧</button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Reports */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Recent Reports</h3>
        <div className="space-y-3">
          {recentReports.map(rr => (
            <div key={rr.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-lg">📄</span>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">{rr.title}</p>
                  <p className="text-[10px] text-slate-400">Generated on {rr.date} • {rr.size}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toast.success(`Downloading ${rr.title}...`)} className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">↓ Download</button>
                <button onClick={() => handleDeleteRecentReport(rr.id, rr.title)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Delete Report">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Picker Modal */}
      {showStudentPicker && (
        <StudentPickerModal
          students={studentsList}
          onSelect={handleStudentSelect}
          onClose={() => setShowStudentPicker(false)}
        />
      )}

      {/* Report Preview Modal */}
      {showReport && selectedStudentData && (
        <PrintableReport
          data={selectedStudentData}
          onClose={() => { setShowReport(false); }}
        />
      )}
    </div>
  );
}
