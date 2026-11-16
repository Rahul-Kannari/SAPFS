import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const initialAssignments = [
  { id: 'a1', title: 'ML Assignment 3: Neural Network Implementation', course: 'Machine Learning', code: 'CSE301', due: '2024-12-20', maxMarks: 100, submitted: 18, total: 22, type: 'coding', description: 'Implement a Multi-Layer Perceptron (MLP) from scratch in Python using NumPy.' },
  { id: 'a2', title: 'Deep Learning Lab Report', course: 'Deep Learning', code: 'CSE302', due: '2024-12-18', maxMarks: 50, submitted: 20, total: 22, type: 'report', description: 'Submit experimental results for CNN hyperparameter tuning on CIFAR-10.' },
  { id: 'a3', title: 'Algorithm Analysis Case Study', course: 'Algorithm Design', code: 'CSE303', due: '2024-12-25', maxMarks: 75, submitted: 15, total: 22, type: 'analysis', description: 'Comparative analysis of Dijkstra vs A* search algorithm efficiency.' },
  { id: 'a4', title: 'Database Design Project', course: 'Database Systems', code: 'CSE304', due: '2024-12-22', maxMarks: 100, submitted: 22, total: 22, type: 'project', description: 'Design normalized ER diagrams and PostgreSQL schema for hospital management.' },
];

const allSubmissions = [
  { student: 'Ananya Gupta', id: '1', submittedAt: '2024-12-15 10:30', marks: 88, status: 'graded', late: false, content: 'Neural Network Implementation using NumPy with backpropagation and SGD optimizer.\nValidation Accuracy: 94.2%' },
  { student: 'Priya Singh', id: 'CSE2021002', submittedAt: '2024-12-14 14:20', marks: 95, status: 'graded', late: false, content: 'Deep Neural Network Architecture with Adam Optimizer and Dropout regularization.\nTest Accuracy: 96.8%' },
  { student: 'Rahul Verma', id: 'CSE2021003', submittedAt: '2024-12-19 22:45', marks: null, status: 'submitted', late: true, content: 'Basic 2-layer neural net code draft. Submission includes vectorised gradient descent.' },
  { student: 'Neha Gupta', id: 'CSE2022001', submittedAt: null, marks: null, status: 'missing', late: false, content: 'No submission recorded yet.' },
  { student: 'Vikram Das', id: 'CSE2022002', submittedAt: null, marks: null, status: 'missing', late: false, content: 'No submission recorded yet.' },
];

const TYPE_COLORS = {
  coding: 'bg-blue-100 text-blue-700',
  report: 'bg-purple-100 text-purple-700',
  analysis: 'bg-amber-100 text-amber-700',
  project: 'bg-emerald-100 text-emerald-700',
};

const STATUS_COLORS = {
  graded: 'bg-emerald-100 text-emerald-700',
  submitted: 'bg-blue-100 text-blue-700',
  missing: 'bg-red-100 text-red-700',
  pending: 'bg-slate-100 text-slate-700',
};

const EditAssignmentModal = ({ assignment, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: assignment.title || '',
    course: assignment.course || 'Machine Learning',
    code: assignment.code || 'CSE301',
    due: assignment.due || '2024-12-20',
    maxMarks: assignment.maxMarks || 100,
    type: assignment.type || 'coding',
    description: assignment.description || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...assignment, ...form });
    toast.success(`Assignment "${form.title}" updated successfully!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">✏️ Edit Assignment</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Title</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Course</label>
              <input value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                {['coding','report','analysis','project'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Due Date</label>
              <input type="date" value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Max Marks</label>
              <input type="number" value={form.maxMarks} onChange={e => setForm({ ...form, maxMarks: Number(e.target.value) })} required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ViewSubmissionModal = ({ submission, assignmentTitle, onClose }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">📄 Student Submission Details</h3>
          <p className="text-xs text-slate-500">{assignmentTitle}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl">
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">{submission.student}</p>
            <p className="text-xs text-slate-500">Roll No: {submission.id}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${STATUS_COLORS[submission.status]}`}>
            {submission.status.toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1">Submitted At</p>
          <p className="text-xs text-slate-800 dark:text-white font-mono">{submission.submittedAt || 'Not submitted'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1">Submission Notes & Content Preview</p>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
            {submission.content || 'No text preview available for this submission.'}
          </div>
        </div>
        {submission.marks !== null && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">Grade Assigned</span>
            <span className="text-lg font-black text-emerald-600">{submission.marks} marks</span>
          </div>
        )}
      </div>
      <div className="mt-5 text-right">
        <button onClick={onClose} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">Close Preview</button>
      </div>
    </div>
  </div>
);

export default function AssignmentsPage() {
  const { user, role } = useAuthStore();
  const [assignmentList, setAssignmentList] = useState(initialAssignments);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [viewingSubmission, setViewingSubmission] = useState(null);
  const [grades, setGrades] = useState({});

  const [createForm, setCreateForm] = useState({
    title: '',
    course: 'Machine Learning',
    type: 'coding',
    due: '',
    maxMarks: 100,
    description: ''
  });

  const studentName = user?.full_name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Ananya Gupta');
  const studentId = String(user?.student_profile?.Student_ID || user?.student_id || '1');

  const submissions = role === 'student'
    ? allSubmissions.map(s => (s.id === '1' || s.student === 'Ananya Gupta') ? { ...s, student: studentName, id: studentId } : s)
        .filter(s => s.student === studentName || s.id === studentId)
    : allSubmissions;

  const handleGrade = (studentId, marks) => {
    setGrades(prev => ({ ...prev, [studentId]: marks }));
  };

  const saveGrades = () => {
    toast.success(`Grades saved for ${Object.keys(grades).length} student(s)`);
    setGrades({});
  };

  const handleCreateAssignment = (e) => {
    e.preventDefault();
    const newAss = {
      id: `a_${Date.now()}`,
      title: createForm.title || 'New Assignment',
      course: createForm.course,
      code: 'CSE301',
      due: createForm.due || new Date().toISOString().split('T')[0],
      maxMarks: Number(createForm.maxMarks) || 100,
      submitted: 0,
      total: 22,
      type: createForm.type,
      description: createForm.description
    };
    setAssignmentList(prev => [newAss, ...prev]);
    setShowCreate(false);
    toast.success(`Assignment "${newAss.title}" created successfully!`);
    setCreateForm({ title: '', course: 'Machine Learning', type: 'coding', due: '', maxMarks: 100, description: '' });
  };

  const getDaysUntilDue = (due) => {
    const diff = Math.ceil((new Date(due) - new Date()) / (1000*60*60*24));
    return diff;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            {role === 'student' ? 'My Assignments' : 'Assignment Management'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {role === 'student' ? 'View deadlines, submit work, and check marks' : 'Create, track, and grade assignments'}
          </p>
        </div>
        {role !== 'student' && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 transition-all">
            + New Assignment
          </button>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Assignments', value: assignmentList.length, icon: '📝' },
          { label: role === 'student' ? 'My Submissions' : 'Pending Grading', value: role === 'student' ? '4 / 4' : 8, icon: '⏳' },
          { label: 'Submission Rate', value: role === 'student' ? '100%' : '82%', icon: '✅' },
          { label: role === 'student' ? 'Average Marks' : 'Overdue', value: role === 'student' ? '88/100' : 3, icon: role === 'student' ? '⭐' : '⚠️' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Assignment Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {assignmentList.map(a => {
          const days = getDaysUntilDue(a.due);
          const subRate = Math.round(a.submitted / a.total * 100);
          return (
            <div key={a.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_COLORS[a.type] || 'bg-slate-100 text-slate-600'}`}>
                    {a.type.toUpperCase()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    days < 0 ? 'bg-red-100 text-red-700' : days <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{a.code}</span>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm mb-1 line-clamp-2">{a.title}</h3>
              <p className="text-xs text-slate-500 mb-4">{a.course} • Max: {a.maxMarks} marks • Due: {new Date(a.due).toLocaleDateString('en-IN')}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{role === 'student' ? 'Status' : 'Submissions'}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {role === 'student' ? 'Submitted (88/100)' : `${a.submitted}/${a.total} (${subRate}%)`}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${subRate >= 80 ? 'bg-emerald-500' : subRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${subRate}%` }} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setSelected(a)}
                  className="flex-1 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 transition-colors">
                  {role === 'student' ? 'View My Status' : 'View Submissions'}
                </button>
                {role !== 'student' && (
                  <button onClick={() => setEditingAssignment(a)} className="flex-1 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100 transition-colors">
                    Edit
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submissions Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">{selected.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{selected.course} • {selected.submitted}/{selected.total} submitted</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    {['Student', 'Roll No', 'Submitted', 'Status', 'Marks', 'Action'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {submissions.map(sub => (
                    <tr key={sub.student} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-3 py-3 text-sm font-medium text-slate-800 dark:text-white">{sub.student}</td>
                      <td className="px-3 py-3 text-xs text-slate-500">{sub.id}</td>
                      <td className="px-3 py-3 text-xs text-slate-500">
                        {sub.submittedAt || '—'}
                        {sub.late && <span className="ml-1 text-xs text-red-500">late</span>}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[sub.status]}`}>{sub.status}</span>
                      </td>
                      <td className="px-3 py-3">
                        {sub.status === 'graded'
                          ? <span className="text-sm font-bold text-emerald-600">{sub.marks}</span>
                          : sub.status === 'submitted'
                          ? <input type="number" min="0" max={selected.maxMarks} value={grades[sub.id] || ''}
                              onChange={e => handleGrade(sub.id, e.target.value)}
                              placeholder="0"
                              className="w-16 px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
                          : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        {(sub.status === 'submitted' || sub.status === 'graded') && (
                          <button onClick={() => setViewingSubmission(sub)} className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">View</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
              <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm">Cancel</button>
              {Object.keys(grades).length > 0 && (
                <button onClick={saveGrades} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">
                  Save Grades ({Object.keys(grades).length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {editingAssignment && (
        <EditAssignmentModal
          assignment={editingAssignment}
          onClose={() => setEditingAssignment(null)}
          onSave={(updatedAss) => setAssignmentList(prev => prev.map(a => a.id === updatedAss.id ? updatedAss : a))}
        />
      )}

      {/* View Submission Modal */}
      {viewingSubmission && (
        <ViewSubmissionModal
          submission={viewingSubmission}
          assignmentTitle={selected?.title || 'Assignment Details'}
          onClose={() => setViewingSubmission(null)}
        />
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Create Assignment</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Title</label>
                <input value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })} required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Assignment title..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Course</label>
                  <select value={createForm.course} onChange={e => setCreateForm({ ...createForm, course: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    {['Machine Learning', 'Deep Learning', 'Algorithm Design', 'Database Systems'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Type</label>
                  <select value={createForm.type} onChange={e => setCreateForm({ ...createForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    {['coding','report','analysis','project'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Due Date</label>
                  <input type="date" value={createForm.due} onChange={e => setCreateForm({ ...createForm, due: e.target.value })} required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Max Marks</label>
                  <input type="number" value={createForm.maxMarks} onChange={e => setCreateForm({ ...createForm, maxMarks: Number(e.target.value) })} required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
                <textarea rows={3} value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Assignment instructions..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">Create Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
