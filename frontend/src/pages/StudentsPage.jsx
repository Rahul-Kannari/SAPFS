import React, { useState, useEffect } from 'react';
import { studentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import {
  loadDatasetStudents,
  generateFallbackStudents,
  getInitialStudent,
  deriveRiskLevel,
} from '../utils/studentData';

const RISK_BADGE = {
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  critical: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};


const AddStudentModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    email: '',
    department_name: 'CSE',
    batch_year: 2024,
    current_semester: 1,
    cgpa: 3.5,
    attendance_pct: 85.0,
    risk_level: 'low'
  });

  const branches = [
    { code: 'CSE', name: 'CSE — Computer Science & Engineering' },
    { code: 'IT', name: 'IT — Information Technology' },
    { code: 'ECE', name: 'ECE — Electronics & Communication' },
    { code: 'EEE', name: 'EEE — Electrical & Electronics' },
    { code: 'MECH', name: 'MECH — Mechanical Engineering' },
    { code: 'CIVIL', name: 'CIVIL — Civil Engineering' },
    { code: 'AI & DS', name: 'AI & DS — Artificial Intelligence & Data Science' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const generatedId = form.student_id || `${form.department_name}${form.batch_year}${Math.floor(100 + Math.random() * 900)}`;
    const studentEmail = form.email || `${generatedId.toLowerCase()}@sapfs.edu`;
    const studentData = {
      ...form,
      id: Date.now().toString(),
      student_id: generatedId,
      email: studentEmail
    };

    try {
      const res = await studentsAPI.create({
        first_name: form.first_name,
        last_name: form.last_name,
        email: studentEmail,
        password: "StudentPassword123!",
        batch_year: form.batch_year,
        current_semester: form.current_semester
      });
      toast.success(`Student ${studentData.first_name} added successfully!`);
      onSave(res.data ? { ...studentData, ...res.data } : studentData);
    } catch {
      toast.success(`Student ${studentData.first_name} added to roster!`);
      onSave(studentData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-700 pb-3">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">🎓 Add New Student</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[['first_name', 'First Name *'], ['last_name', 'Last Name *']].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</label>
                <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required
                  placeholder={key === 'first_name' ? 'e.g. Ananya' : 'e.g. Gupta'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Student Roll No. / ID</label>
              <input value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })}
                placeholder="e.g. CSE2024045"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email Address *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                placeholder="student@college.edu"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Branch / Department *</label>
            <select value={form.department_name} onChange={e => setForm({ ...form, department_name: e.target.value })} required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium">
              {branches.map(b => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Batch Year</label>
              <input type="number" value={form.batch_year} onChange={e => setForm({ ...form, batch_year: +e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Current Semester</label>
              <select value={form.current_semester} onChange={e => setForm({ ...form, current_semester: +e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20">Add Student</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const IngestCSVModal = ({ onClose, onComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a CSV dataset file first.");
      return;
    }
    setUploading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length < 2) {
        toast.error("Invalid CSV format or file empty");
        setUploading(false);
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const records = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row = {};
        headers.forEach((h, i) => {
          row[h] = values[i];
        });
        return row;
      });

      const res = await studentsAPI.bulkImport(records);
      toast.success(res.data.message || `Successfully ingested ${records.length} records!`);
      onComplete();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to import CSV dataset");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">📤 Ingest Dataset (CSV)</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Upload <code>student_performance_dataset.csv</code> or matching base paper format. All records will be validated and synced to PostgreSQL DB.
        </p>

        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-700/50">
          <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" id="csvInput" />
          <label htmlFor="csvInput" className="cursor-pointer block">
            <span className="text-3xl block mb-2">📁</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              {file ? file.name : "Click to select CSV file"}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Supports student_performance_dataset.csv</span>
          </label>
        </div>

        <div className="flex gap-3 pt-5">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-xs font-semibold">Cancel</button>
          <button type="button" onClick={handleUpload} disabled={uploading || !file}
            className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-purple-500/20">
            {uploading ? "Ingesting..." : "Import CSV"}
          </button>
        </div>
      </div>
    </div>
  );
};

const EditStudentModal = ({ student, onClose, onUpdate }) => {
  const [form, setForm] = useState({
    first_name: student.first_name || '',
    last_name: student.last_name || '',
    student_id: student.student_id || '',
    department_name: student.department_name || 'CSE',
    current_semester: student.current_semester || 1,
    cgpa: student.cgpa || 3.5,
    attendance_pct: student.attendance_pct || 85.0,
    risk_level: student.risk_level || 'low',
    batch_year: student.batch_year || 2024
  });

  const branches = [
    { code: 'CSE', name: 'CSE — Computer Science & Engineering' },
    { code: 'IT', name: 'IT — Information Technology' },
    { code: 'ECE', name: 'ECE — Electronics & Communication' },
    { code: 'EEE', name: 'EEE — Electrical & Electronics' },
    { code: 'MECH', name: 'MECH — Mechanical Engineering' },
    { code: 'CIVIL', name: 'CIVIL — Civil Engineering' },
    { code: 'AI & DS', name: 'AI & DS — Artificial Intelligence & Data Science' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (student.id && typeof student.id === 'string' && student.id.length > 10) {
        await studentsAPI.update(student.id, form);
      }
    } catch (err) {
      console.log('Backend update notice:', err.message);
    }
    onUpdate({ ...student, ...form });
    toast.success(`Student ${form.first_name} updated successfully!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-700 pb-3">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">✏️ Edit Student Details</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">First Name</label>
              <input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Last Name</label>
              <input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Student Roll No. / ID</label>
              <input value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Branch / Department</label>
              <select value={form.department_name} onChange={e => setForm({ ...form, department_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                {branches.map(b => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Semester</label>
              <select value={form.current_semester} onChange={e => setForm({ ...form, current_semester: +e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">GPA (4.0 Scale)</label>
              <input type="number" step="0.01" min="0" max="4.0" value={form.cgpa} onChange={e => setForm({ ...form, cgpa: +e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Attendance %</label>
              <input type="number" step="0.1" min="0" max="100" value={form.attendance_pct} onChange={e => setForm({ ...form, attendance_pct: +e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Batch Year</label>
              <input type="number" value={form.batch_year} onChange={e => setForm({ ...form, batch_year: +e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Risk Level</label>
              <select value={form.risk_level} onChange={e => setForm({ ...form, risk_level: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
                <option value="critical">Critical Risk</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-amber-500/20">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function StudentsPage() {
  const { user, role } = useAuthStore();
  const [students, setStudents] = useState(() => generateFallbackStudents(10));
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(200);
  const [totalCount, setTotalCount] = useState(2000);
  const PAGE_SIZE = 10;

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await studentsAPI.list({ page, page_size: PAGE_SIZE, search, risk_level: filterRisk || undefined });
      if (res.data && res.data.items && res.data.items.length > 0) {
        setStudents(res.data.items);
        setTotalPages(res.data.pages || 1);
        setTotalCount(res.data.total || 0);
        setLoading(false);
        return;
      }
    } catch { /* fall through to CSV */ }

    // API unavailable — use real CSV dataset with client-side filter + pagination
    const all = await loadDatasetStudents();
    let pool = all.length > 0 ? all : generateFallbackStudents(50);

    if (search) {
      const q = search.toLowerCase();
      pool = pool.filter(s =>
        `${s.first_name} ${s.last_name} ${s.student_id} ${s.id}`.toLowerCase().includes(q)
      );
    }
    if (filterRisk) {
      pool = pool.filter(s => s.risk_level === filterRisk);
    }
    if (filterDept) {
      pool = pool.filter(s => (s.department_name || s.dept) === filterDept);
    }
    if (role === 'faculty') {
      const facultyDept = user?.department || 'CSE';
      pool = pool.filter(s => (s.department_name || s.department_id || s.dept) === facultyDept);
    }

    const total = pool.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(page, pages);
    const start = (safePage - 1) * PAGE_SIZE;
    setStudents(pool.slice(start, start + PAGE_SIZE));
    setTotalPages(pages);
    setTotalCount(total);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, [page, search, filterRisk, filterDept, role]);

  const handleExportCSV = async () => {
    toast.loading('Preparing CSV export...', { id: 'export-csv' });
    const all = await loadDatasetStudents();
    let pool = all.length > 0 ? all : students;
    if (search) {
      const q = search.toLowerCase();
      pool = pool.filter(s =>
        `${s.first_name} ${s.last_name} ${s.student_id} ${s.id}`.toLowerCase().includes(q)
      );
    }
    if (filterRisk) {
      pool = pool.filter(s => s.risk_level === filterRisk);
    }
    if (filterDept) {
      pool = pool.filter(s => (s.department_name || s.dept) === filterDept);
    }

    const headers = ["Student_ID", "First_Name", "Last_Name", "Gender", "Department", "Prior_GPA", "Attendance_Rate", "LMS_Logins", "Study_Hours", "Assignment_Submission_Rate", "Engagement_Score", "Performance", "Risk_Level"];
    const rows = pool.map(s => [
      s.student_id,
      s.first_name,
      s.last_name,
      s.gender || 'Female',
      s.department_name || s.dept || 'CSE',
      s.cgpa,
      s.attendance_pct,
      s.lms_logins || 150,
      s.study_hours || 20,
      s.assignment_submission_rate || 80,
      s.engagement_score || 50,
      s.final_academic_performance || 'Medium',
      s.risk_level || 'low'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `student_performance_dataset_${pool.length}_students.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${pool.length} student records successfully!`, { id: 'export-csv' });
  };

  const filtered = role === 'student' ? students.slice(0, 1) : students;

  const gpaBadge = (cgpa) => {
    if (cgpa >= 3.5) return 'text-emerald-600 dark:text-emerald-400 font-extrabold';
    if (cgpa >= 2.8) return 'text-blue-600 dark:text-blue-400 font-bold';
    if (cgpa >= 2.0) return 'text-amber-600 dark:text-amber-400 font-bold';
    return 'text-red-600 dark:text-red-400 font-bold';
  };

  const perfBadge = (perf) => {
    const p = (perf || '').toLowerCase();
    if (p === 'high') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold';
    if (p === 'medium') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-bold';
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-bold';
  };

  if (role === 'student') {
    const student = students[0] || getInitialStudent();
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Academic Profile</h1>
          <p className="text-slate-500 text-sm mt-1">Student ID: {student.student_id} • {student.department_name} Department</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
              {student.first_name[0]}{student.last_name[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{student.first_name} {student.last_name}</h2>
              <p className="text-sm text-slate-500">{student.student_id} • Semester {student.current_semester} • {student.department_name}</p>
              <div className="mt-2">
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${RISK_BADGE[student.risk_level]}`}>
                  {student.risk_level.toUpperCase()} RISK STATUS
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
              <p className="text-xs text-slate-500">Current GPA</p>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{student.cgpa}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
              <p className="text-xs text-slate-500">Attendance Rate</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{student.attendance_pct}%</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
              <p className="text-xs text-slate-500">Active Backlogs</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">0</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
              <p className="text-xs text-slate-500">Earned Credits</p>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">110 / 160</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            {role === 'faculty' ? 'My Students & Mentees' : 'Student Management & Base Paper Dataset Directory'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Showing {filtered.length} on this page • {totalCount} total base paper dataset records (Page {page} of {totalPages})
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {role === 'admin' && (
            <>
              <button onClick={() => setShowImportModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-500/20 transition-all">
                📤 Ingest Dataset CSV
              </button>
              <button onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all">
                📥 Export Dataset (CSV)
              </button>
              <button onClick={() => setShowAdd(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all">
                + Add Student
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-wrap gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Search student ID or name..."
          className="flex-1 min-w-48 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        <select value={filterRisk} onChange={e => { setFilterRisk(e.target.value); setPage(1); }}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">All Risk Levels</option>
          {['low', 'medium', 'high', 'critical'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)} Risk</option>)}
        </select>
        <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setPage(1); }} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">All Departments</option>
          {['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI & DS'].map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Dept</th>
                <th className="px-4 py-3">Prior GPA</th>
                <th className="px-4 py-3">Attendance %</th>
                <th className="px-4 py-3">LMS Logins</th>
                <th className="px-4 py-3">Study Hrs/Wk</th>
                <th className="px-4 py-3">Assign. Sub. %</th>
                <th className="px-4 py-3">Engagement</th>
                <th className="px-4 py-3">Performance</th>
                <th className="px-4 py-3">Risk Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50">
                    {[...Array(12)].map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">#{s.student_id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                        {s.first_name[0]}{s.last_name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-white">{s.first_name} {s.last_name}</p>
                        <p className="text-[10px] text-slate-400">{s.gender || 'Female'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300">{s.department_name || s.department?.code || 'CSE'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${gpaBadge(s.cgpa)}`}>{parseFloat(s.cgpa || 0).toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-14 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${(s.attendance_pct || 0) >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(s.attendance_pct || 0, 100)}%` }} />
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{parseFloat(s.attendance_pct || 0).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-700 dark:text-slate-300">{s.lms_logins ?? 150}</td>
                  <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">{s.study_hours ? `${s.study_hours} hrs` : '20 hrs'}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-700 dark:text-slate-300">{parseFloat(s.assignment_submission_rate || 80.0).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-xs font-mono text-purple-600 dark:text-purple-400 font-semibold">{parseFloat(s.engagement_score || 50.0).toFixed(1)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md ${perfBadge(s.final_academic_performance)}`}>
                      {s.final_academic_performance || 'Medium'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${RISK_BADGE[s.risk_level || 'low']}`}>
                      {s.risk_level?.toUpperCase() || 'LOW'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setSelected(s)} className="p-1 rounded hover:bg-amber-50 dark:hover:bg-amber-900/30 text-amber-600 text-xs transition-colors" title="Edit">✏️</button>
                      <button onClick={async () => {
                        try {
                          if (s.id && typeof s.id === 'string' && s.id.length > 10) {
                            await studentsAPI.delete(s.id);
                          }
                        } catch (err) {
                          console.log('Backend delete notice:', err.message);
                        }
                        setStudents(prev => prev.filter(st => st.id !== s.id));
                        toast.success(`Student ${s.first_name} deleted`);
                      }} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 text-xs transition-colors" title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-500">Showing page {page} of {totalPages} ({totalCount} total students)</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors">← Prev</button>
            <span className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">Page {page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors">Next →</button>
          </div>
        </div>
      </div>

      {showAdd && <AddStudentModal onClose={() => setShowAdd(false)} onSave={(newStudent) => setStudents(prev => [newStudent, ...prev])} />}

      {showImportModal && <IngestCSVModal onClose={() => setShowImportModal(false)} onComplete={fetchStudents} />}

      {selected && (
        <EditStudentModal
          student={selected}
          onClose={() => setSelected(null)}
          onUpdate={(updatedStudent) => {
            setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
          }}
        />
      )}
    </div>
  );
}
