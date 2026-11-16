import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart, Cell } from 'recharts';

const semesterData = [
  { sem: 'S1', avgGPA: 7.2, topGPA: 9.1, bottomGPA: 5.2, passRate: 94, avgAttendance: 82 },
  { sem: 'S2', avgGPA: 7.5, topGPA: 9.3, bottomGPA: 5.5, passRate: 91, avgAttendance: 80 },
  { sem: 'S3', avgGPA: 7.1, topGPA: 9.0, bottomGPA: 4.8, passRate: 88, avgAttendance: 76 },
  { sem: 'S4', avgGPA: 7.4, topGPA: 9.4, bottomGPA: 5.1, passRate: 90, avgAttendance: 78 },
  { sem: 'S5', avgGPA: 7.8, topGPA: 9.6, bottomGPA: 5.4, passRate: 92, avgAttendance: 81 },
  { sem: 'S6', avgGPA: 8.1, topGPA: 9.7, bottomGPA: 5.8, passRate: 94, avgAttendance: 84 },
  { sem: 'S7', avgGPA: 8.3, topGPA: 9.8, bottomGPA: 6.0, passRate: 95, avgAttendance: 85 },
];

const subjectData = [
  { subject: 'Machine Learning', avg: 78, pass: 88, color: '#3b82f6' },
  { subject: 'Deep Learning', avg: 72, pass: 82, color: '#8b5cf6' },
  { subject: 'Algorithms', avg: 65, pass: 78, color: '#ef4444' },
  { subject: 'Databases', avg: 80, pass: 92, color: '#10b981' },
  { subject: 'Cloud Computing', avg: 75, pass: 85, color: '#f59e0b' },
  { subject: 'Software Engg', avg: 82, pass: 94, color: '#06b6d4' },
];

const correlationData = Array.from({ length: 50 }, (_, i) => ({
  attendance: 50 + Math.random() * 50,
  gpa: 4 + Math.random() * 6 + (Math.random() > 0.3 ? 1 : 0),
})).sort((a, b) => a.attendance - b.attendance);

const gpaDistribution = [
  { range: '4.0-5.0', count: 42, color: '#ef4444' },
  { range: '5.0-6.0', count: 78, color: '#f97316' },
  { range: '6.0-7.0', count: 156, color: '#f59e0b' },
  { range: '7.0-8.0', count: 289, color: '#10b981' },
  { range: '8.0-9.0', count: 198, color: '#3b82f6' },
  { range: '9.0-10.0', count: 84, color: '#8b5cf6' },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('performance');

  const tabs = [
    { id: 'performance', label: '📈 Performance', },
    { id: 'attendance', label: '📅 Attendance' },
    { id: 'subjects', label: '📚 Subjects' },
    { id: 'correlation', label: '🔗 Correlations' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Analytics & Insights</h1>
        <p className="text-slate-500 text-sm mt-1">Deep-dive into academic performance data and patterns</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 bg-white dark:bg-slate-800 rounded-2xl p-1.5 shadow-sm border border-slate-100 dark:border-slate-700 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === t.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white mb-1">GPA Band Analysis</h3>
              <p className="text-xs text-slate-500 mb-5">Top, Average, and Bottom performer GPA by semester</p>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={semesterData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="sem" tick={{ fontSize: 11 }} />
                  <YAxis domain={[4, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="topGPA" fill="#dbeafe" stroke="#3b82f6" name="Top GPA" strokeWidth={2} fillOpacity={0.4} />
                  <Line type="monotone" dataKey="avgGPA" stroke="#10b981" name="Avg GPA" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="bottomGPA" stroke="#ef4444" name="Bottom GPA" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white mb-1">GPA Distribution</h3>
              <p className="text-xs text-slate-500 mb-5">Number of students in each GPA range</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={gpaDistribution} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Students">
                    {gpaDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white mb-1">Pass Rate & Attendance Trend</h3>
            <p className="text-xs text-slate-500 mb-5">Semester-wise pass percentage and attendance correlation</p>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={semesterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="sem" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" domain={[60, 100]} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" domain={[60, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="passRate" fill="#3b82f6" name="Pass Rate %" radius={[4, 4, 0, 0]} opacity={0.8} />
                <Line yAxisId="right" type="monotone" dataKey="avgAttendance" stroke="#f59e0b" name="Avg Attendance %" strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white mb-1">Subject-wise Average Marks</h3>
              <p className="text-xs text-slate-500 mb-5">Performance comparison across courses</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={subjectData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="subject" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Bar dataKey="avg" name="Avg Marks" radius={[0, 6, 6, 0]}>
                    {subjectData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white mb-1">Subject Pass Rates</h3>
              <p className="text-xs text-slate-500 mb-5">Percentage of students passing each subject</p>
              <div className="space-y-4 mt-6">
                {subjectData.map(s => (
                  <div key={s.subject}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{s.subject}</span>
                      <span className="text-sm font-bold" style={{ color: s.color }}>{s.pass}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s.pass}%`, background: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">⚠️ Weak Subject Identification</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectData.filter(s => s.avg < 75).map(s => (
                <div key={s.subject} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-500">⚠️</span>
                    <p className="text-sm font-semibold text-red-800 dark:text-red-300">{s.subject}</p>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400">Avg: {s.avg}/100 • Pass Rate: {s.pass}%</p>
                  <p className="text-xs text-red-500 mt-1">Needs faculty attention & extra sessions</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'correlation' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white mb-1">Attendance vs GPA Correlation</h3>
            <p className="text-xs text-slate-500 mb-5">Scatter plot showing relationship between attendance and academic performance (r = 0.74)</p>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="attendance" name="Attendance %" unit="%" tick={{ fontSize: 11 }} label={{ value: 'Attendance %', position: 'insideBottom', offset: -5, fontSize: 12 }} />
                <YAxis dataKey="gpa" name="GPA" domain={[4, 10]} tick={{ fontSize: 11 }} label={{ value: 'GPA', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Scatter data={correlationData} fill="#3b82f6" opacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Insight:</strong> Strong positive correlation (r = 0.74) between attendance and GPA.
                Students with attendance above 85% show 1.2 GPA points higher on average.
                This is the <strong>2nd most important feature</strong> in our ML model.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Overall Attendance', value: '78.4%', icon: '📊', color: 'bg-blue-500' },
              { label: 'Below 75%', value: '143 students', icon: '⚠️', color: 'bg-amber-500' },
              { label: 'Below 60%', value: '38 students', icon: '🚨', color: 'bg-red-500' },
              { label: 'Perfect (100%)', value: '67 students', icon: '🏆', color: 'bg-emerald-500' },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-lg text-white`}>{s.icon}</div>
                <div>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="text-base font-bold text-slate-800 dark:text-white">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">⚠️ Students Below 75% Attendance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    {['Student', 'Department', 'Attendance', 'Classes Missed', 'Action Needed'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Vikram Das', dept: 'CSE', att: 55.0, missed: 45 },
                    { name: 'Riya Sharma', dept: 'IT', att: 48.0, missed: 52 },
                    { name: 'Kavya Reddy', dept: 'ECE', att: 62.5, missed: 37 },
                    { name: 'Rahul Verma', dept: 'CSE', att: 69.0, missed: 31 },
                    { name: 'Neha Gupta', dept: 'CSE', att: 74.5, missed: 25 },
                  ].map(s => (
                    <tr key={s.name} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-3 py-3 text-sm font-medium text-slate-800 dark:text-white">{s.name}</td>
                      <td className="px-3 py-3 text-sm text-slate-500">{s.dept}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-red-500" style={{ width: `${s.att}%` }} />
                          </div>
                          <span className="text-sm font-bold text-red-600">{s.att}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-red-600 font-medium">{s.missed} classes</td>
                      <td className="px-3 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.att < 60 ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'}`}>
                          {s.att < 60 ? 'Debarment Risk' : 'Warning Letter'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
