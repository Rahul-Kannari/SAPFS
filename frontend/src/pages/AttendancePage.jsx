import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const courses = [
  { id: 'c1', code: 'CSE301', name: 'Machine Learning', faculty: 'Dr. Sharma' },
  { id: 'c2', code: 'CSE302', name: 'Deep Learning', faculty: 'Dr. Sharma' },
  { id: 'c3', code: 'CSE303', name: 'Algorithm Design', faculty: 'Prof. Mehta' },
  { id: 'c4', code: 'CSE304', name: 'Database Systems', faculty: 'Dr. Patel' },
];

const students = [
  { id: '1', name: 'Ananya Gupta', rollNo: '1' },
  { id: '2', name: 'Rohan Kumar', rollNo: '2' },
  { id: '3', name: 'Priya Rao', rollNo: '3' },
  { id: '4', name: 'Aditya Chowdhury', rollNo: '4' },
  { id: '7', name: 'Pooja Agarwal', rollNo: '7' },
];

const monthlyData = [
  { month: 'Jun', present: 88, absent: 12 },
  { month: 'Jul', present: 82, absent: 18 },
  { month: 'Aug', present: 91, absent: 9 },
  { month: 'Sep', present: 78, absent: 22 },
  { month: 'Oct', present: 74, absent: 26 },
  { month: 'Nov', present: 80, absent: 20 },
];

const allStudentAttendance = [
  { name: 'Ananya Gupta', pct: 91.3, classes: 82, present: 75, below75: false },
  { name: 'Rohan Kumar', pct: 96.2, classes: 82, present: 79, below75: false },
  { name: 'Priya Rao', pct: 96.8, classes: 82, present: 79, below75: false },
  { name: 'Aditya Chowdhury', pct: 51.7, classes: 82, present: 42, below75: true },
  { name: 'Pooja Agarwal', pct: 98.0, classes: 82, present: 80, below75: false },
];

// Helper to get/set attendance from localStorage
const STORAGE_KEY = 'sapfs_attendance_records';

const getStoredAttendance = (courseId, date) => {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return all[`${courseId}_${date}`] || null;
  } catch { return null; }
};

const setStoredAttendance = (courseId, date, records) => {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    all[`${courseId}_${date}`] = records;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
};

const defaultAttendance = () => Object.fromEntries(students.map(s => [s.id, 'present']));

export default function AttendancePage() {
  const { user, role } = useAuthStore();
  const [activeTab, setActiveTab] = useState(role === 'student' ? 'view' : 'mark');
  const [selectedCourse, setSelectedCourse] = useState('c1');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState(defaultAttendance);
  const [saving, setSaving] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);

  // Load saved attendance when course or date changes
  useEffect(() => {
    const saved = getStoredAttendance(selectedCourse, selectedDate);
    if (saved) {
      setAttendance(saved);
      setSavedIndicator(true);
    } else {
      setAttendance(defaultAttendance());
      setSavedIndicator(false);
    }
  }, [selectedCourse, selectedDate]);

  const currentStudentName = user?.full_name || user?.first_name || 'Ananya Gupta';
  const studentAttendance = role === 'student' 
    ? allStudentAttendance.filter(s => s.name === currentStudentName || s.name === 'Ananya Gupta').slice(0, 1)
    : allStudentAttendance;

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
    setSavedIndicator(false);
  };

  const markAll = (status) => {
    setAttendance(Object.fromEntries(students.map(s => [s.id, status])));
    setSavedIndicator(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      setStoredAttendance(selectedCourse, selectedDate, attendance);
      setSavedIndicator(true);
      toast.success(`Attendance saved for ${students.length} students — ${courses.find(c => c.id === selectedCourse)?.code} on ${selectedDate}`);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const presentCount = Object.values(attendance).filter(v => v === 'present').length;
  const absentCount = Object.values(attendance).filter(v => v === 'absent').length;

  const tabs = role === 'student' 
    ? [['view', '📋 My Attendance Summary'], ['analytics', '📊 Attendance Analytics']]
    : [['mark', '✏️ Mark Attendance'], ['view', '📋 View Report'], ['analytics', '📊 Analytics']];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            {role === 'student' ? 'My Attendance' : 'Attendance Management'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {role === 'student' ? 'Track your class attendance and eligibility status' : 'Mark, track, and analyze attendance records'}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Overall Rate', value: role === 'student' ? '91.2%' : '78.4%', icon: '📊', color: 'bg-blue-500' },
          { label: 'Classes Attended', value: role === 'student' ? '75 / 82' : '143 Below 75%', icon: '🏆', color: 'bg-emerald-500' },
          { label: 'Classes Missed', value: role === 'student' ? '7' : '67 Perfect', icon: '📅', color: 'bg-purple-500' },
          { label: 'Exam Debarment Risk', value: role === 'student' ? 'Safe (Eligible)' : '38 At-Risk', icon: '🚨', color: 'bg-teal-500' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-3">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-lg text-white`}>{s.icon}</div>
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white dark:bg-slate-800 rounded-2xl p-1.5 w-fit shadow-sm border border-slate-100 dark:border-slate-700">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === id ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'mark' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          {/* Controls */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Course</label>
              <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => markAll('present')} className="px-3 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-200 transition-colors">✅ All Present</button>
              <button onClick={() => markAll('absent')} className="px-3 py-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium hover:bg-red-200 transition-colors">❌ All Absent</button>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="text-sm text-slate-500">
                <span className="text-emerald-600 font-bold">{presentCount}</span> present /
                <span className="text-red-500 font-bold ml-1">{absentCount}</span> absent
              </div>
              {savedIndicator && (
                <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-lg font-medium">✓ Saved</span>
              )}
              {!savedIndicator && !saving && (
                <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-lg font-medium">● Unsaved</span>
              )}
              <button onClick={handleSave} disabled={saving || savedIndicator}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${savedIndicator ? 'bg-emerald-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                {saving ? '⏳ Saving...' : savedIndicator ? '✓ Saved' : '💾 Save Attendance'}
              </button>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {students.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <span className="text-sm text-slate-400 w-6">{idx + 1}</span>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                  {s.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.rollNo}</p>
                </div>
                <div className="flex gap-2">
                  {[
                    { val: 'present', label: 'P', color: 'bg-emerald-500 text-white', inactive: 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-emerald-50' },
                    { val: 'absent', label: 'A', color: 'bg-red-500 text-white', inactive: 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-red-50' },
                    { val: 'late', label: 'L', color: 'bg-amber-500 text-white', inactive: 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-amber-50' },
                    { val: 'excused', label: 'E', color: 'bg-blue-500 text-white', inactive: 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-blue-50' },
                  ].map(btn => (
                    <button key={btn.val} onClick={() => handleStatusChange(s.id, btn.val)}
                      className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${attendance[s.id] === btn.val ? btn.color + ' shadow-md' : btn.inactive}`}>
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'view' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white">Student Attendance Summary</h3>
            <p className="text-xs text-slate-500 mt-1">Current semester cumulative attendance</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50">
                  {['Student', 'Total Classes', 'Present', 'Absent', 'Attendance %', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {studentAttendance.map(s => (
                  <tr key={s.name} className="border-t border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-white">{s.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{s.classes}</td>
                    <td className="px-4 py-3 text-sm text-emerald-600 font-semibold">{s.present}</td>
                    <td className="px-4 py-3 text-sm text-red-600 font-semibold">{s.classes - s.present}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${s.pct >= 75 ? 'bg-emerald-500' : s.pct >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${s.pct}%` }} />
                        </div>
                        <span className={`text-sm font-bold ${s.pct >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>{s.pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        !s.below75 ? 'bg-emerald-100 text-emerald-700' :
                        s.pct >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {!s.below75 ? '✅ OK' : s.pct >= 60 ? '⚠️ Warning' : '🚨 Debarment Risk'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Monthly Attendance Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} name="Present %" />
                <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} name="Absent %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Individual Attendance Rates</h3>
            <div className="space-y-4">
              {studentAttendance.map(s => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{s.name}</span>
                    <span className={`text-sm font-bold ${s.pct >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>{s.pct}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${s.pct >= 75 ? 'bg-emerald-500' : s.pct >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" /> ≥75% (Safe)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500" /> 60-75% (Warning)</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> &lt;60% (Critical)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
