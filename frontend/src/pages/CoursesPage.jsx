import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { coursesAPI, facultyAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

const BRANCHES = [
  { code: 'CSE', name: 'Computer Science & Engineering', icon: '💻', color: 'from-blue-500 to-indigo-600', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { code: 'ECE', name: 'Electronics & Communication', icon: '⚡', color: 'from-purple-500 to-pink-600', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { code: 'IT', name: 'Information Technology', icon: '🌐', color: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { code: 'MECH', name: 'Mechanical Engineering', icon: '⚙️', color: 'from-amber-500 to-orange-600', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
];

const INITIAL_COURSES = [
  // CSE Courses
  { id: 'c1', course_code: 'CSE101', name: 'Programming in C & Problem Solving', credits: 4, semester: 1, department: 'CSE', type: 'Core', faculty: 'Dr. Rajesh Sharma', enrolled: 60, avg_marks: 78.4, pass_rate: 88, description: 'Fundamentals of C programming, control structures, pointers, arrays, and memory management.' },
  { id: 'c2', course_code: 'CSE301', name: 'Data Structures & Algorithms', credits: 4, semester: 3, department: 'CSE', type: 'Core', faculty: 'Prof. Priya Mehta', enrolled: 55, avg_marks: 72.1, pass_rate: 82, description: 'Linear and non-linear data structures, trees, graphs, sorting, searching, and algorithmic complexity.' },
  { id: 'c3', course_code: 'CSE501', name: 'Operating Systems & System Programming', credits: 4, semester: 5, department: 'CSE', type: 'Core', faculty: 'Dr. Amit Patel', enrolled: 50, avg_marks: 75.9, pass_rate: 85, description: 'Process management, concurrency, deadlocks, memory management, and file systems.' },
  { id: 'c4', course_code: 'CSE701', name: 'Machine Learning & Predictive Modeling', credits: 4, semester: 7, department: 'CSE', type: 'Core', faculty: 'Dr. Rajesh Sharma', enrolled: 45, avg_marks: 80.2, pass_rate: 92, description: 'Supervised, unsupervised learning, regression, classification, decision trees, and neural networks.' },
  { id: 'c5', course_code: 'CSE702', name: 'Deep Learning & Neural Networks', credits: 4, semester: 7, department: 'CSE', type: 'Elective', faculty: 'Dr. Rajesh Sharma', enrolled: 40, avg_marks: 82.5, pass_rate: 90, description: 'CNNs, RNNs, Transformers, attention mechanisms, and deep generative architectures.' },
  { id: 'c6', course_code: 'CSE703', name: 'Algorithm Design & Analysis', credits: 3, semester: 7, department: 'CSE', type: 'Core', faculty: 'Prof. Priya Mehta', enrolled: 45, avg_marks: 68.5, pass_rate: 79, description: 'Greedy algorithms, dynamic programming, NP-completeness, and approximation algorithms.' },

  // ECE Courses
  { id: 'c7', course_code: 'ECE101', name: 'Basic Electronics & Circuit Theory', credits: 4, semester: 1, department: 'ECE', type: 'Core', faculty: 'Dr. Kavitha Iyer', enrolled: 50, avg_marks: 74.0, pass_rate: 84, description: 'Semiconductors, diodes, transistors, amplifiers, and AC/DC circuit dynamics.' },
  { id: 'c8', course_code: 'ECE501', name: 'Digital Signal Processing & Systems', credits: 4, semester: 5, department: 'ECE', type: 'Core', faculty: 'Dr. Kavitha Iyer', enrolled: 42, avg_marks: 71.5, pass_rate: 80, description: 'DFT, FFT, IIR/FIR filter design, z-transforms, and spectral signal analysis.' },

  // IT Courses
  { id: 'c9', course_code: 'IT501', name: 'Web Technologies & Modern Frameworks', credits: 4, semester: 5, department: 'IT', type: 'Core', faculty: 'Dr. Amit Patel', enrolled: 48, avg_marks: 79.2, pass_rate: 89, description: 'REST APIs, React, Node.js, asynchronous web programming, and full-stack deployment.' },

  // MECH Courses
  { id: 'c10', course_code: 'MECH501', name: 'Thermodynamics & Heat Transfer', credits: 4, semester: 5, department: 'MECH', type: 'Core', faculty: 'Suresh Nair', enrolled: 38, avg_marks: 67.8, pass_rate: 76, description: 'Laws of thermodynamics, heat exchangers, conduction, convection, and thermal radiation.' },
];

export default function CoursesPage() {
  const { user, role } = useAuthStore();
  const facultyBranch = user?.department || 'CSE';
  const availableBranches = role === 'faculty'
    ? BRANCHES.filter(b => b.code === facultyBranch)
    : BRANCHES;

  const [courses, setCourses] = useState(INITIAL_COURSES);
  const [selectedBranch, setSelectedBranch] = useState(role === 'faculty' ? facultyBranch : 'CSE');
  const [selectedSem, setSelectedSem] = useState(7);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('table');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [viewingCourse, setViewingCourse] = useState(null);

  const [facultyList, setFacultyList] = useState([
    'Dr. Rajesh Sharma', 'Prof. Priya Mehta', 'Dr. Amit Patel', 'Dr. Kavitha Iyer', 'Suresh Nair', 'Dr. Anita Roy'
  ]);

  // Filter courses by Branch and Semester
  const filteredCourses = courses.filter(c =>
    c.department === selectedBranch &&
    Number(c.semester) === Number(selectedSem) &&
    (!search || `${c.course_code} ${c.name} ${c.faculty}`.toLowerCase().includes(search.toLowerCase()))
  );

  // Stats for selected branch & semester
  const totalBranchCourses = courses.filter(c => c.department === selectedBranch).length;
  const totalSemCourses = filteredCourses.length;
  const totalSemCredits = filteredCourses.reduce((acc, c) => acc + Number(c.credits), 0);

  // CRUD Handlers
  const handleAddCourse = (newCourse) => {
    const courseObj = {
      id: `c_${Date.now()}`,
      ...newCourse,
      department: selectedBranch,
      semester: Number(selectedSem),
      enrolled: 45,
      avg_marks: 75.0,
      pass_rate: 85
    };
    setCourses(prev => [courseObj, ...prev]);
    setShowAddModal(false);
    toast.success(`Course ${newCourse.course_code} added to ${selectedBranch} Sem ${selectedSem}!`);
  };

  const handleUpdateCourse = (updatedCourse) => {
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
    setEditingCourse(null);
    toast.success(`Course ${updatedCourse.course_code} updated successfully!`);
  };

  const handleDeleteCourse = (id) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    setDeletingCourse(null);
    toast.success('Course deleted from curriculum!');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            📚 Course Curriculum Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse and manage subject catalogs by Branch and Semester with full CRUD capabilities.
          </p>
        </div>
        {role !== 'student' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
          >
            ➕ Add Course to {selectedBranch} (Sem {selectedSem})
          </button>
        )}
      </div>

      {/* Step 1: Branch Selection */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Step 1: Select Branch</span>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{totalBranchCourses} Total Courses in {selectedBranch}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {availableBranches.map(branch => {
            const isSelected = selectedBranch === branch.code;
            const branchCourseCount = courses.filter(c => c.department === branch.code).length;
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
                  <p className="text-xs text-slate-500 truncate max-w-[120px]">{branchCourseCount} Courses</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Semester Selection Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">Semester:</span>
          {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => {
            const isSelected = Number(selectedSem) === sem;
            const semCourseCount = courses.filter(c => c.department === selectedBranch && Number(c.semester) === sem).length;
            return (
              <button
                key={sem}
                onClick={() => setSelectedSem(sem)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <span>Sem {sem}</span>
                {semCourseCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'}`}>
                    {semCourseCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600">
          Curriculum: <span className="font-bold text-slate-800 dark:text-white">{selectedBranch}</span> | <span className="font-bold text-blue-600 dark:text-blue-400">Semester {selectedSem}</span> ({totalSemCourses} Subjects, {totalSemCredits} Credits)
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Subjects', value: totalSemCourses, icon: '📖', color: 'bg-blue-500' },
          { label: 'Total Credits', value: `${totalSemCredits} Credits`, icon: '🎓', color: 'bg-indigo-500' },
          { label: 'Core Courses', value: filteredCourses.filter(c => c.type === 'Core').length, icon: '⚡', color: 'bg-purple-500' },
          { label: 'Elective Courses', value: filteredCourses.filter(c => c.type === 'Elective').length, icon: '🌟', color: 'bg-emerald-500' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-3">
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-sm`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar & View Toggle */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search course code, title, or faculty..."
          className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
          <button
            onClick={() => setView('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === 'table' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'}`}
          >
            📋 Table
          </button>
          <button
            onClick={() => setView('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === 'grid' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'}`}
          >
            🔲 Grid
          </button>
        </div>
      </div>

      {/* Course List: Table View */}
      {view === 'table' ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Course Code</th>
                  <th className="py-3.5 px-4">Subject Title</th>
                  <th className="py-3.5 px-4">Credits</th>
                  <th className="py-3.5 px-4">Course Type</th>
                  <th className="py-3.5 px-4">Assigned Faculty</th>
                  <th className="py-3.5 px-4">Enrolled Students</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredCourses.length > 0 ? (
                  filteredCourses.map(course => (
                    <tr key={course.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        {course.course_code}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800 dark:text-white text-sm">{course.name}</p>
                        <p className="text-xs text-slate-400 truncate max-w-xs">{course.description}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {course.credits} Credits
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          course.type === 'Core'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        }`}>
                          {course.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                        👨‍🏫 {course.faculty || 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-semibold">
                        {course.enrolled || 45} Students
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setViewingCourse(course)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 transition-all"
                            title="View Syllabus & Details"
                          >
                            📖 Details
                          </button>
                          {role !== 'student' && (
                            <>
                              <button
                                onClick={() => setEditingCourse(course)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all"
                                title="Edit Course"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => setDeletingCourse(course)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300 hover:bg-rose-100 transition-all"
                                title="Delete Course"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400 text-sm">
                      No courses found for {selectedBranch} Semester {selectedSem}. Click <b>"+ Add Course"</b> to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Course List: Grid View */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map(course => (
            <div key={course.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                    {course.course_code}
                  </span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                    course.type === 'Core' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {course.type}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base mt-2">{course.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{course.description}</p>
              </div>

              <div className="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-3 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Credits:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{course.credits} Credits</span>
                </div>
                <div className="flex justify-between">
                  <span>Assigned Faculty:</span>
                  <span className="font-semibold text-slate-800 dark:text-white truncate max-w-[140px]">{course.faculty}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setViewingCourse(course)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 transition-colors"
                >
                  📖 View Details
                </button>
                {role !== 'student' && (
                  <>
                    <button
                      onClick={() => setEditingCourse(course)}
                      className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setDeletingCourse(course)}
                      className="py-2 px-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300 hover:bg-rose-100 transition-colors"
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Course Modal */}
      {showAddModal && (
        <CourseFormModal
          title={`Add New Course — ${selectedBranch} Sem ${selectedSem}`}
          branch={selectedBranch}
          semester={selectedSem}
          facultyList={facultyList}
          onSubmit={handleAddCourse}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Course Modal */}
      {editingCourse && (
        <CourseFormModal
          title={`Edit Course — ${editingCourse.course_code}`}
          initialData={editingCourse}
          branch={selectedBranch}
          semester={selectedSem}
          facultyList={facultyList}
          onSubmit={handleUpdateCourse}
          onClose={() => setEditingCourse(null)}
        />
      )}

      {/* View Course Details Modal */}
      {viewingCourse && (
        <CourseDetailsModal
          course={viewingCourse}
          onClose={() => setViewingCourse(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Delete Course?</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to delete course <b className="font-mono text-rose-600">{deletingCourse.course_code} - {deletingCourse.name}</b> from the {selectedBranch} Semester {selectedSem} curriculum?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingCourse(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCourse(deletingCourse.id)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-500/30"
              >
                Delete Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Add / Edit Course Form Modal ----
function CourseFormModal({ title, initialData, branch, semester, facultyList, onSubmit, onClose }) {
  const [form, setForm] = useState(initialData || {
    course_code: `${branch}${semester}0${Math.floor(Math.random() * 5) + 1}`,
    name: '',
    credits: 4,
    type: 'Core',
    faculty: facultyList[0] || 'Dr. Rajesh Sharma',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.course_code || !form.name) {
      toast.error('Please enter course code and course title!');
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-scale-up">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Course Code</label>
              <input
                type="text"
                value={form.course_code}
                onChange={e => setForm({ ...form, course_code: e.target.value })}
                required
                placeholder="e.g. CSE301"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 font-mono text-slate-800 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Credits</label>
              <select
                value={form.credits}
                onChange={e => setForm({ ...form, credits: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5, 6].map(c => <option key={c} value={c}>{c} Credits</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Course Title</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. Data Structures & Algorithms"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Course Type</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Core">Core Subject</option>
                <option value="Elective">Elective Subject</option>
                <option value="Lab">Laboratory / Practical</option>
                <option value="Project">Major / Minor Project</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Assigned Faculty</label>
              <select
                value={form.faculty}
                onChange={e => setForm({ ...form, faculty: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                {facultyList.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Syllabus Overview & Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Brief course objectives and syllabus modules..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/30"
            >
              {initialData ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Course Details Modal ----
function CourseDetailsModal({ course, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 animate-scale-up">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-xl border border-blue-200 dark:border-blue-800">
              {course.course_code}
            </span>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">{course.name}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Branch & Sem</span>
            <span className="font-bold text-slate-800 dark:text-white">{course.department} (Semester {course.semester})</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Credits & Type</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{course.credits} Credits ({course.type})</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Assigned Faculty</span>
            <span className="font-bold text-slate-800 dark:text-white">👨‍🏫 {course.faculty}</span>
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Enrolled Students</span>
            <span className="font-bold text-slate-800 dark:text-white">{course.enrolled || 45} Students</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Syllabus Overview</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 leading-relaxed">
            {course.description || 'No detailed syllabus description provided.'}
          </p>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/30"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
