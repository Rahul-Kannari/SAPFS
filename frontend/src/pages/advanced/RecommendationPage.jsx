import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api, { studentsAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const DEMO_STUDENTS = [
  { id: '1', name: 'Ananya Gupta', cgpa: 2.45, risk: 'safe', att: 91.3, backlogs: 0, study: 26.6, assign: 0.97, lms: 194 },
  { id: '2', name: 'Rohan Kumar', cgpa: 3.12, risk: 'safe', att: 85.4, backlogs: 0, study: 21.0, assign: 0.88, lms: 145 },
  { id: '4', name: 'Aditya Chowdhury', cgpa: 2.80, risk: 'safe', att: 88.1, backlogs: 0, study: 24.0, assign: 0.91, lms: 160 },
  { id: 'e5555555', name: 'Vikram Das', cgpa: 1.89, risk: 'high', att: 55.0, backlogs: 5, study: 6.0, assign: 0.45, lms: 40 },
];

const RULE_ENGINE = (student) => {
  const { att, assign, backlogs, study, cgpa, risk, lms } = student;
  const recs = { attendance: [], assignments: [], academics: [], study_habits: [], engagement: [], excellence: [] };

  if (att < 60) recs.attendance.push({ priority: 1, text: '🚨 URGENT: Attend ALL remaining classes — debarment risk below 60%', type: 'danger' });
  else if (att < 75) recs.attendance.push({ priority: 1, text: '⚠️ Boost attendance above 75% — exam eligibility at risk', type: 'warning' });
  else if (att < 85) recs.attendance.push({ priority: 2, text: 'Aim for 90%+ attendance to strengthen your academic profile', type: 'info' });
  else recs.attendance.push({ priority: 3, text: '✅ Excellent attendance! Keep maintaining this consistency', type: 'success' });

  if (assign < 0.5) recs.assignments.push({ priority: 1, text: '🚨 Submit all overdue assignments immediately — partial credit beats zero', type: 'danger' });
  else if (assign < 0.75) recs.assignments.push({ priority: 2, text: 'Improve submission rate above 80% — use a weekly deadline tracker', type: 'warning' });
  else recs.assignments.push({ priority: 3, text: '✅ Good assignment discipline — maintain submission before deadlines', type: 'success' });

  if (backlogs >= 3) recs.academics.push({ priority: 1, text: `🚨 Clear ${backlogs} backlogs — register for supplementary exam immediately`, type: 'danger' });
  else if (backlogs > 0) recs.academics.push({ priority: 2, text: `Clear ${backlogs} pending backlog(s) — dedicate 1h/day per subject`, type: 'warning' });
  else recs.academics.push({ priority: 3, text: '✅ No backlogs — strong academic health', type: 'success' });

  if (study < 8) recs.study_habits.push({ priority: 1, text: '🚨 Study time critically low — increase to minimum 20 hours/week', type: 'danger' });
  else if (study < 15) recs.study_habits.push({ priority: 2, text: 'Increase weekly study to 20h — use Pomodoro (25min on/5min off)', type: 'warning' });
  else recs.study_habits.push({ priority: 3, text: '✅ Good study hours — maintain consistency throughout semester', type: 'success' });

  if (lms < 5) recs.engagement.push({ priority: 2, text: 'Log into LMS daily — access materials, videos, and quizzes', type: 'warning' });
  else recs.engagement.push({ priority: 3, text: 'Explore online certifications on Coursera or NPTEL', type: 'info' });

  if (cgpa >= 8.5) recs.excellence.push({ priority: 3, text: '🏆 Consider research projects, internships, or competitive certifications', type: 'success' });

  return recs;
};

const STUDY_PLAN = (student) => ({
  daily_hours: Math.max(2, Math.round((20 - (student.cgpa - 5) * 2) / 7 * 10) / 10),
  weekly_hours: Math.max(15, Math.round(20 - (student.cgpa - 5) * 2)),
  routine: [
    { time: '07:00–08:00', activity: 'Morning revision of previous day topics', icon: '🌅' },
    { time: '09:00–16:00', activity: 'Attend all classes and labs', icon: '🏫' },
    { time: '16:00–18:00', activity: 'Self-study & assignment work', icon: '📚' },
    { time: '19:00–20:00', activity: 'LMS / online courses / video lectures', icon: '💻' },
    { time: '21:00–22:00', activity: 'Previous year paper practice', icon: '📝' },
  ],
  weekly_goals: [
    'Complete all pending assignments',
    `Achieve ${Math.min(100, student.att + 5).toFixed(0)}% attendance this week`,
    'Solve 5 practice problems per weak subject',
    'Log into LMS at least 5 times',
    'Review notes from all lectures',
  ],
});

const RecCard = ({ rec, category }) => {
  const colors = {
    danger: 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20',
    warning: 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20',
    success: 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20',
    info: 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20',
  };
  const textColors = {
    danger: 'text-red-800 dark:text-red-300', warning: 'text-amber-800 dark:text-amber-300',
    success: 'text-emerald-800 dark:text-emerald-300', info: 'text-blue-800 dark:text-blue-300',
  };
  const badges = {
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  };
  return (
    <div className={`p-3 rounded-xl border ${colors[rec.type]} flex items-start gap-3`}>
      <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${badges[rec.type]}`}>P{rec.priority}</span>
      <p className={`text-xs leading-relaxed ${textColors[rec.type]}`}>{rec.text}</p>
    </div>
  );
};

export default function RecommendationPage() {
  const { user, role } = useAuthStore();
  const currentStudent = role === 'student' && user ? {
    id: String(user?.student_profile?.id || user?.student_profile?.Student_ID || user?.student_id || '1'),
    name: user?.full_name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Ananya Gupta'),
    cgpa: user?.student_profile?.cgpa || user?.student_profile?.Prior_GPA || user?.cgpa || 2.45,
    risk: user?.student_profile?.risk_level || 'safe',
    att: user?.student_profile?.attendance_pct || user?.student_profile?.Attendance_Rate || 91.3,
    backlogs: 0,
    study: user?.student_profile?.study_hours || user?.student_profile?.Study_Hours_Per_Week || 26.6,
    assign: user?.student_profile?.assignment_submission_rate ? (user.student_profile.assignment_submission_rate / 100) : (user?.student_profile?.Assignment_Submission_Rate ? (user.student_profile.Assignment_Submission_Rate / 100) : 0.97),
    lms: user?.student_profile?.lms_logins || user?.student_profile?.LMS_Logins || 194
  } : DEMO_STUDENTS[0];

  const [studentsList, setStudentsList] = useState(DEMO_STUDENTS);
  const [selected, setSelected] = useState(currentStudent);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [shownRecs, setShownRecs] = useState(null);

  useEffect(() => {
    if (role !== 'student') {
      studentsAPI.list({ page_size: 50 }).then(res => {
        const raw = res.data?.items || res.data || [];
        if (Array.isArray(raw) && raw.length > 0) {
          const mapped = raw.map(s => ({
            id: s.id,
            name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.student_id,
            cgpa: s.cgpa ? parseFloat(s.cgpa) : 2.5,
            risk: s.risk_level || 'safe',
            att: s.attendance_pct ? parseFloat(s.attendance_pct) : 85.0,
            backlogs: s.backlogs || 0,
            study: s.study_hours ? parseFloat(s.study_hours) : 20.0,
            assign: s.assignment_submission_rate ? (parseFloat(s.assignment_submission_rate) / 100) : 0.9,
            lms: s.lms_logins ? parseInt(s.lms_logins) : 100
          }));
          setStudentsList(mapped);
          setSelected(mapped[0]);
        }
      }).catch(err => {
        console.error('Failed to load students for recommendations:', err);
      });
    }
  }, [role]);

  const handleGenerate = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selected.id);
      if (isUUID) {
        await api.post('/agents/predict-v2', {
          student_id: selected.id,
          use_ensemble: true
        });
      }
    } catch (e) {
      console.warn('Predict-v2 API call note:', e);
    }
    setShownRecs(RULE_ENGINE(selected));
    setGenerated(true);
    setLoading(false);
    toast.success('Personalised recommendations generated!');
  };

  const handleDownloadStudyPlan = () => {
    const planObj = STUDY_PLAN(selected);
    const content = `=====================================================
SAPFS — PERSONALISED ACADEMIC STUDY PLAN
=====================================================
Student Name: ${selected.name}
Current CGPA: ${selected.cgpa}
Attendance: ${selected.att}%
Risk Status: ${selected.risk.toUpperCase()}

RECOMMENDED HOURS:
- Target Daily Hours: ${planObj.daily_hours} hrs/day
- Target Weekly Hours: ${planObj.weekly_hours} hrs/week

DAILY ROUTINE:
${planObj.routine.map(r => `[${r.time}] ${r.activity}`).join('\n')}

WEEKLY GOALS:
${planObj.weekly_goals.map(g => `- ${g}`).join('\n')}

=====================================================
Generated by Smart Academic Forecasting System (SAPFS)
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Study_Plan_${selected.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Study Plan for ${selected.name} downloaded!`);
  };

  const plan = STUDY_PLAN(selected);
  const recs = shownRecs || RULE_ENGINE(selected);
  const totalRecs = Object.values(recs).flat().length;
  const priorityCount = Object.values(recs).flat().filter(r => r.priority === 1).length;

  const catLabels = { attendance: '📅 Attendance', assignments: '📝 Assignments', academics: '📚 Academics', study_habits: '⏱ Study Habits', engagement: '💻 Engagement', excellence: '🏆 Excellence' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            {role === 'student' ? 'My Personal Action Plan' : 'AI Recommendation Engine'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {role === 'student' ? 'Personalised academic improvement plan & study routine' : 'Agent 6 — Rule-based personalised academic improvement plan'}
          </p>
        </div>
        <div className="flex gap-3">
          {role !== 'student' && (
            <select value={selected.id} onChange={e => { setSelected(studentsList.find(s => s.id === e.target.value) || selected); setGenerated(false); setShownRecs(null); }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              {studentsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button onClick={handleGenerate} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/30 transition-all">
            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating…</> : '💡 Generate Recommendations'}
          </button>
        </div>
      </div>

      {/* Student snapshot */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-black">
            {selected.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">{selected.name}</h3>
            <p className="text-sm text-slate-500">Personalised Recommendations • {totalRecs} suggestions • {priorityCount} priority actions</p>
          </div>
          <div className="ml-auto flex gap-6">
            {[['CGPA', selected.cgpa, (selected.cgpa >= 7 || (selected.cgpa >= 2.2 && selected.cgpa <= 4.0)) ? '#10b981' : selected.cgpa >= 5 ? '#f59e0b' : '#ef4444'],
            ['Attendance', `${selected.att}%`, selected.att >= 75 ? '#10b981' : '#ef4444'],
            ['Backlogs', selected.backlogs, selected.backlogs === 0 ? '#10b981' : '#ef4444'],
            ['Study/wk', `${selected.study}h`, selected.study >= 15 ? '#10b981' : '#ef4444']].map(([k, v, c]) => (
              <div key={k} className="text-center">
                <p className="text-xl font-black" style={{ color: c }}>{v}</p>
                <p className="text-xs text-slate-400">{k}</p>
              </div>
            ))}
          </div>
        </div>
        {generated && (
          <div className={`p-3 rounded-xl text-sm font-medium ${priorityCount > 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300'}`}>
            {priorityCount > 0 ? `⚠️ ${priorityCount} PRIORITY action(s) require immediate attention` : '✅ No critical issues — maintain current performance'}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recommendations by category */}
        <div className="lg:col-span-2 space-y-4">
          {Object.entries(recs).map(([cat, catRecs]) => catRecs.length > 0 && (
            <div key={cat} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-3 text-sm">{catLabels[cat]}</h3>
              <div className="space-y-2">
                {catRecs.map((rec, i) => <RecCard key={i} rec={rec} category={cat} />)}
              </div>
            </div>
          ))}
        </div>

        {/* Study plan sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-sm">📅 Personalised Study Plan</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-blue-600">{plan.daily_hours}</p>
                <p className="text-xs text-slate-500">Hrs / Day</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-purple-600">{plan.weekly_hours}</p>
                <p className="text-xs text-slate-500">Hrs / Week</p>
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Daily Routine</p>
            <div className="space-y-2">
              {plan.routine.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span>{r.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{r.time}</p>
                    <p className="text-xs text-slate-500">{r.activity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white mb-3 text-sm">🎯 Weekly Goals</h3>
            <div className="space-y-2">
              {plan.weekly_goals.map((g, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span className="w-4 h-4 rounded-full border-2 border-blue-400 flex-shrink-0 mt-0.5" />
                  <span>{g}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleDownloadStudyPlan}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-md shadow-blue-500/20">
            📄 Download Study Plan Document
          </button>
        </div>
      </div>
    </div>
  );
}
