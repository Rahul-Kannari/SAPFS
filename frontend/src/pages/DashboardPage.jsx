import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
         XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { dashboardAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const RISK_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#7c3aed' };

const StatCard = ({ icon, label, value, change, color, loading }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden`}>
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-8 translate-x-8 ${color} opacity-10`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">
          {loading ? <span className="animate-pulse bg-slate-200 dark:bg-slate-700 rounded w-20 h-8 block" /> : value}
        </p>
        {change && <p className={`text-xs mt-2 font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% from last month
        </p>}
      </div>
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-xl text-white`}>{icon}</div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user, role } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');

  // Demo data for offline mode
  const demoStats = {
    total_students: 2000, total_faculty: 52, total_courses: 134,
    avg_cgpa: 2.49, high_risk_students: 340, avg_attendance: 68.4, predictions_made: 1250
  };

  const demoTrends = [
    { semester: 1, avg_sgpa: 2.35, avg_attendance: 68.2, avg_backlogs: 0.8 },
    { semester: 2, avg_sgpa: 2.42, avg_attendance: 69.1, avg_backlogs: 0.7 },
    { semester: 3, avg_sgpa: 2.48, avg_attendance: 67.8, avg_backlogs: 0.9 },
    { semester: 4, avg_sgpa: 2.51, avg_attendance: 68.9, avg_backlogs: 0.6 },
    { semester: 5, avg_sgpa: 2.55, avg_attendance: 70.1, avg_backlogs: 0.5 },
    { semester: 6, avg_sgpa: 2.60, avg_attendance: 71.4, avg_backlogs: 0.4 },
    { semester: 7, avg_sgpa: 2.65, avg_attendance: 72.0, avg_backlogs: 0.3 },
  ];

  const demoAttendance = [
    { month: 'Jun', percentage: 82 }, { month: 'Jul', percentage: 78 },
    { month: 'Aug', percentage: 85 }, { month: 'Sep', percentage: 80 },
    { month: 'Oct', percentage: 76 }, { month: 'Nov', percentage: 79 },
    { month: 'Dec', percentage: 74 }, { month: 'Jan', percentage: 83 },
  ];

  const [riskDist, setRiskDist] = useState([
    { name: 'Low Risk', value: 423, color: '#10b981' },
    { name: 'Medium', value: 251, color: '#f59e0b' },
    { name: 'High Risk', value: 132, color: '#ef4444' },
    { name: 'Critical', value: 41, color: '#7c3aed' },
  ]);

  const radarData = [
    { subject: 'Attendance', A: 78, B: 72, fullMark: 100 },
    { subject: 'Assignments', A: 82, B: 65, fullMark: 100 },
    { subject: 'Internal', A: 75, B: 68, fullMark: 100 },
    { subject: 'External', A: 70, B: 62, fullMark: 100 },
    { subject: 'Credits', A: 88, B: 75, fullMark: 100 },
    { subject: 'Projects', A: 80, B: 70, fullMark: 100 },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, trendsRes, attRes, heatmapRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getPerformanceTrends(),
          dashboardAPI.getAttendanceAnalytics(),
          dashboardAPI.getRiskHeatmap(),
        ]);
        setStats(statsRes.data);
        if (Array.isArray(trendsRes.data) && trendsRes.data.length > 0) setTrends(trendsRes.data);
        if (Array.isArray(attRes.data) && attRes.data.length > 0) setAttendance(attRes.data);

        if (heatmapRes.data && typeof heatmapRes.data === 'object') {
          let low = 0, med = 0, high = 0, crit = 0;
          Object.values(heatmapRes.data).forEach(deptObj => {
            low += deptObj.low || deptObj.safe || 0;
            med += deptObj.medium || deptObj.moderate || 0;
            high += deptObj.high || 0;
            crit += deptObj.critical || 0;
          });
          if (low + med + high + crit > 0) {
            setRiskDist([
              { name: 'Low Risk', value: low, color: '#10b981' },
              { name: 'Medium', value: med, color: '#f59e0b' },
              { name: 'High Risk', value: high, color: '#ef4444' },
              { name: 'Critical', value: crit, color: '#7c3aed' },
            ]);
          }
        }
      } catch {
        setStats(demoStats);
        setTrends(demoTrends);
        setAttendance(demoAttendance);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const s = stats || demoStats;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Welcome back, {user?.full_name || user?.first_name || user?.email?.split('@')[0] || 'User'} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {role === 'admin' 
              ? 'Campus Operations • Institution Risk Overview • ML Model Management' 
              : role === 'faculty' 
              ? 'Faculty Roster • Class Attendance & Grading • Mentee Counseling' 
              : 'Personal Academic Performance • Next-Semester SGPA Forecast • AI Advisor'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold uppercase tracking-wider">
            {role === 'admin' ? '🛡️ Admin Portal' : role === 'faculty' ? '👨‍🏫 Faculty Portal' : '🎓 Student Portal'}
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-medium">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            System Online
          </div>
        </div>
      </div>

      {/* Student Profile Banner from Real Dataset */}
      {role === 'student' && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl font-bold shadow-inner">
              🎓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black">{user?.full_name || 'Ananya Gupta'}</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-blue-500/30 border border-blue-400/40 text-blue-200">
                  Student ID: {user?.student_id || '1'}
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-1">
                {user?.department || 'Computer Science & Engineering'} • Semester {user?.current_semester || 1} • Batch 2021-2025
              </p>
              <p className="text-xs text-slate-300 mt-0.5 font-mono">
                {user?.email || 'ananya.gupta@student.sapfs.edu'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/10 text-center">
              <p className="text-xs text-blue-300">Dataset Profile</p>
              <p className="text-sm font-bold text-emerald-400">Verified Original</p>
            </div>
            <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/10 text-center">
              <p className="text-xs text-blue-300">Performance Status</p>
              <p className="text-sm font-bold text-blue-200">{user?.final_academic_performance || 'High'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Role-tailored Stats Grid */}
      {role === 'student' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="⭐" label="Current CGPA" value={user?.cgpa ? Number(user.cgpa).toFixed(2) : "2.45"} change={1.2} color="bg-blue-500" loading={loading} />
          <StatCard icon="🔮" label="Forecasted SGPA" value={user?.cgpa ? (Math.min(4.0, Number(user.cgpa) * 1.08)).toFixed(2) : "2.75"} change={3.4} color="bg-emerald-500" loading={loading} />
          <StatCard icon="📅" label="Overall Attendance" value={`${user?.attendance_pct || 91.27}%`} change={2.1} color="bg-purple-500" loading={loading} />
          <StatCard icon="🛡️" label="Academic Risk Status" value={user?.risk_level ? `${String(user.risk_level).toUpperCase()} RISK` : "LOW RISK"} change={0} color="bg-teal-500" loading={loading} />
          <StatCard icon="📚" label="Weekly Study Volume" value={`${user?.study_hours || 26.6} hrs/wk`} change={5.0} color="bg-amber-500" loading={loading} />
          <StatCard icon="✏️" label="Assignment Submissions" value={`${user?.assignment_submission_rate || 96.7}%`} change={10.0} color="bg-indigo-500" loading={loading} />
          <StatCard icon="💻" label="LMS Portal Logins" value={`${user?.lms_logins || 194} Logins`} change={0} color="bg-green-500" loading={loading} />
          <StatCard icon="🏆" label="Engagement Score" value={`${user?.engagement_score || 43.33}`} change={15.0} color="bg-blue-600" loading={loading} />
        </div>
      ) : role === 'faculty' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="📚" label="My Assigned Courses" value="4 Courses" change={0} color="bg-purple-500" loading={loading} />
          <StatCard icon="🎓" label="Enrolled Students" value="180 Students" change={2.5} color="bg-blue-500" loading={loading} />
          <StatCard icon="📅" label="Class Avg Attendance" value="82.5%" change={1.8} color="bg-teal-500" loading={loading} />
          <StatCard icon="⚠️" label="At-Risk Mentees" value="7 Students" change={-12.5} color="bg-red-500" loading={loading} />
          <StatCard icon="✏️" label="Submissions Graded" value="94.2%" change={4.1} color="bg-emerald-500" loading={loading} />
          <StatCard icon="⭐" label="Class Avg CGPA" value="7.62" change={0.8} color="bg-amber-500" loading={loading} />
          <StatCard icon="📝" label="Internal Marks Posted" value="Semester 7" change={0} color="bg-indigo-500" loading={loading} />
          <StatCard icon="✅" label="Course Pass Rate" value="91.4%" change={2.0} color="bg-green-500" loading={loading} />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="🎓" label="Total Students" value={s.total_students?.toLocaleString()} change={3.2} color="bg-blue-500" loading={loading} />
          <StatCard icon="👨‍🏫" label="Faculty Members" value={s.total_faculty} change={1.5} color="bg-purple-500" loading={loading} />
          <StatCard icon="📚" label="Active Courses" value={s.total_courses} change={-0.8} color="bg-emerald-500" loading={loading} />
          <StatCard icon="⭐" label="Average CGPA" value={s.avg_cgpa?.toFixed(2)} change={1.1} color="bg-amber-500" loading={loading} />
          <StatCard icon="⚠️" label="High Risk Students" value={s.high_risk_students} change={-5.3} color="bg-red-500" loading={loading} />
          <StatCard icon="📋" label="Avg Attendance" value={`${s.avg_attendance?.toFixed(1)}%`} change={2.4} color="bg-teal-500" loading={loading} />
          <StatCard icon="🤖" label="Predictions Made" value={s.predictions_made} change={12.5} color="bg-indigo-500" loading={loading} />
          <StatCard icon="✅" label="Pass Rate" value="87.3%" change={3.1} color="bg-green-500" loading={loading} />
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Performance Trends</h3>
              <p className="text-xs text-slate-500 mt-1">Avg SGPA & Attendance by Semester</p>
            </div>
            <span className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">Semester-wise</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trends.length ? trends : demoTrends}>
              <defs>
                <linearGradient id="colorSgpa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="semester" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Area type="monotone" dataKey="avg_sgpa" stroke="#3b82f6" fill="url(#colorSgpa)" name="Avg SGPA" strokeWidth={2} />
              <Area type="monotone" dataKey="avg_attendance" stroke="#10b981" fill="url(#colorAtt)" name="Avg Attendance %" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Risk Distribution</h3>
              <p className="text-xs text-slate-500 mt-1">Student risk levels across all departments</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={riskDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {riskDist.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {riskDist.map((r) => (
                <div key={r.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: r.color }} />
                    <span className="text-xs text-slate-600 dark:text-slate-400">{r.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${s.total_students ? (r.value/s.total_students*100) : 25}%`, background: r.color }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-8 text-right">{r.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Attendance Analytics */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Monthly Attendance Analytics</h3>
              <p className="text-xs text-slate-500 mt-1">Overall attendance percentage by month</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={attendance.length ? attendance : demoAttendance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(v) => [`${v}%`, 'Attendance']} />
              <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                {(attendance.length ? attendance : demoAttendance).map((entry, i) => (
                  <Cell key={i} fill={entry.percentage >= 75 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Skill Radar */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-white mb-2">Performance Radar</h3>
          <p className="text-xs text-slate-500 mb-4">Top vs At-risk students</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
              <Radar name="Top Students" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              <Radar name="At-Risk" dataKey="B" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">
          {role === 'student' ? 'My Academic Alerts & Updates' : 'Recent Risk Alerts'}
        </h3>
        <div className="space-y-3">
          {(role === 'student' ? [
            { name: 'Machine Learning Assignment 3', risk: 'low', issue: 'Due tomorrow at 11:59 PM — 88/100 scored on previous', time: '1 hr ago', avatar: '✏️' },
            { name: 'Semester 7 Attendance', risk: 'low', issue: 'Overall attendance is 91.2% — Fully eligible for exams', time: '5 hrs ago', avatar: '📅' },
            { name: 'GPA Forecast Updated', risk: 'low', issue: 'Predicted SGPA: 8.12 for Semester 8 (Confidence: 91.4%)', time: '1 day ago', avatar: '🤖' },
          ] : [
            { name: 'Vikram Das', risk: 'high', issue: 'Attendance 55% — Below minimum threshold', time: '2 hrs ago', avatar: '👤' },
            { name: 'Riya Sharma', risk: 'critical', issue: 'CGPA dropped to 4.8 — 5 backlogs pending', time: '4 hrs ago', avatar: '👤' },
            { name: 'Arun Patel', risk: 'medium', issue: '3 assignments missing — deadline passed', time: '6 hrs ago', avatar: '👤' },
            { name: 'Kavya Reddy', risk: 'high', issue: 'Performance declining for 3 consecutive semesters', time: '1 day ago', avatar: '👤' },
          ]).map((alert, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg">{alert.avatar}</div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white text-sm">{alert.name}</p>
                  <p className="text-xs text-slate-500">{alert.issue}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="text-xs text-slate-400">{alert.time}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  alert.risk === 'critical' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                  alert.risk === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  alert.risk === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}>{alert.risk.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
