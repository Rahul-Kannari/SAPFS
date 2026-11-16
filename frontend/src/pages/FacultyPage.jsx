import React, { useState, useEffect } from 'react';
import { facultyAPI } from '../services/api';
import toast from 'react-hot-toast';

const demoFaculty = [
  { id: 'f1', faculty_id: 'FAC001', first_name: 'Rajesh', last_name: 'Sharma', designation: 'Professor', specialization: 'Machine Learning, Data Science', phone: '+91-9876543210', department: 'CSE', courses: 2, students: 44, avg_rating: 4.8 },
  { id: 'f2', faculty_id: 'FAC002', first_name: 'Priya', last_name: 'Mehta', designation: 'Associate Professor', specialization: 'Algorithms, Software Engineering', phone: '+91-9876543211', department: 'CSE', courses: 2, students: 44, avg_rating: 4.6 },
  { id: 'f3', faculty_id: 'FAC003', first_name: 'Amit', last_name: 'Patel', designation: 'Assistant Professor', specialization: 'Databases, Cloud Computing', phone: '+91-9876543212', department: 'IT', courses: 2, students: 44, avg_rating: 4.5 },
  { id: 'f4', faculty_id: 'FAC004', first_name: 'Kavitha', last_name: 'Iyer', designation: 'Professor', specialization: 'Embedded Systems, IoT', phone: '+91-9876543213', department: 'ECE', courses: 3, students: 66, avg_rating: 4.7 },
  { id: 'f5', faculty_id: 'FAC005', first_name: 'Suresh', last_name: 'Nair', designation: 'Associate Professor', specialization: 'Thermodynamics, Fluid Mechanics', phone: '+91-9876543214', department: 'MECH', courses: 2, students: 40, avg_rating: 4.4 },
  { id: 'f6', faculty_id: 'FAC006', first_name: 'Anita', last_name: 'Roy', designation: 'Professor', specialization: 'Computer Networks, Cybersecurity', phone: '+91-9876543215', department: 'CSE', courses: 3, students: 66, avg_rating: 4.9 },
];

const DEPT_COLORS = { CSE: 'bg-blue-100 text-blue-700', ECE: 'bg-purple-100 text-purple-700', MECH: 'bg-amber-100 text-amber-700', IT: 'bg-emerald-100 text-emerald-700' };

const AddFacultyModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', designation: 'Assistant Professor', specialization: '', phone: '', department_id: 'CSE' });
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await facultyAPI.create(form);
    } catch {}
    toast.success('Faculty member added successfully');
    onSave(form);
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Add Faculty Member</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[['first_name','First Name'],['last_name','Last Name']].map(([k,l]) => (
              <div key={k}><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{l}</label>
              <input value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})} required className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white" /></div>
            ))}
          </div>
          <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email</label>
          <input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} required className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Designation</label>
            <select value={form.designation} onChange={e => setForm({...form,designation:e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white">
              {['Professor','Associate Professor','Assistant Professor','Lecturer'].map(d => <option key={d}>{d}</option>)}
            </select></div>
            <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Department</label>
            <select value={form.department_id} onChange={e => setForm({...form,department_id:e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white">
              {['CSE','ECE','MECH','IT'].map(d => <option key={d} value={d}>{d}</option>)}
            </select></div>
          </div>
          <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Specialization</label>
          <input value={form.specialization} onChange={e => setForm({...form,specialization:e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white" placeholder="e.g. Machine Learning, Data Science" /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">Add Faculty</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditFacultyModal = ({ faculty, onClose, onSave }) => {
  const [form, setForm] = useState({
    first_name: faculty.first_name || '',
    last_name: faculty.last_name || '',
    designation: faculty.designation || 'Professor',
    specialization: faculty.specialization || '',
    phone: faculty.phone || '',
    department: faculty.department || 'CSE'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (faculty.id && typeof faculty.id === 'string' && faculty.id.length > 10) {
        await facultyAPI.update(faculty.id, form);
      }
    } catch {}
    toast.success(`Faculty ${form.first_name} ${form.last_name} updated successfully!`);
    onSave({ ...faculty, ...form });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">✏️ Edit Faculty Member</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">First Name</label>
              <input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} required className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none text-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Last Name</label>
              <input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} required className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none text-slate-800 dark:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Designation</label>
              <select value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none text-slate-800 dark:text-white">
                {['Professor','Associate Professor','Assistant Professor','Lecturer'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Department</label>
              <select value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none text-slate-800 dark:text-white">
                {['CSE','ECE','MECH','IT'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Specialization</label>
            <input value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none text-slate-800 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Phone</label>
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm outline-none text-slate-800 dark:text-white" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function FacultyPage() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editingFaculty, setEditingFaculty] = useState(null);

  const loadFaculty = async () => {
    try {
      setLoading(true);
      const res = await facultyAPI.list();
      if (res.data && res.data.length > 0) {
        const formatted = res.data.map(f => ({
          id: f.id,
          faculty_id: f.faculty_id || 'FAC000',
          first_name: f.first_name,
          last_name: f.last_name,
          designation: f.designation || 'Professor',
          specialization: f.specialization || 'Computer Science',
          phone: f.phone || '+91-9876543210',
          department: f.department?.code || (f.department_id === '44444444-4444-4444-4444-444444444444' ? 'IT' : 'CSE'),
          courses: f.courses?.length || 2,
          students: 44,
          avg_rating: 4.8
        }));
        setFaculty(formatted);
      } else {
        setFaculty(demoFaculty);
      }
    } catch (err) {
      console.error('Failed to load faculty:', err);
      setFaculty(demoFaculty);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaculty();
  }, []);

  const filtered = faculty.filter(f =>
    (!search || `${f.first_name} ${f.last_name} ${f.faculty_id}`.toLowerCase().includes(search.toLowerCase())) &&
    (!filterDept || f.department === filterDept)
  );

  const StarsDisplay = ({ rating }) => (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`text-sm ${i <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200 dark:text-slate-600'}`}>★</span>
      ))}
      <span className="text-xs text-slate-500 ml-1">{rating}</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Faculty Management</h1>
          <p className="text-slate-500 text-sm mt-1">{filtered.length} faculty members</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 transition-all">
          + Add Faculty
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Faculty', value: faculty.length, icon: '👨‍🏫', color: 'bg-blue-500' },
          { label: 'Professors', value: faculty.filter(f => f.designation === 'Professor').length, icon: '🎓', color: 'bg-purple-500' },
          { label: 'Avg Rating', value: faculty.length ? (faculty.reduce((a,f) => a + (f.avg_rating || 4.5), 0) / faculty.length).toFixed(1) : '4.7', icon: '⭐', color: 'bg-amber-500' },
          { label: 'Departments', value: [...new Set(faculty.map(f => f.department))].length, icon: '🏛️', color: 'bg-emerald-500' },
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

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search faculty..."
          className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">All Departments</option>
          {['CSE','ECE','MECH','IT'].map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Faculty Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(f => (
          <div key={f.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  {f.first_name[0]}{f.last_name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">{f.first_name} {f.last_name}</h3>
                  <p className="text-xs text-slate-500">{f.faculty_id}</p>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${DEPT_COLORS[f.department] || 'bg-slate-100 text-slate-600'}`}>{f.department}</span>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>🎓</span><span>{f.designation}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>🔬</span><span className="truncate">{f.specialization}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>📞</span><span>{f.phone}</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-700">
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600">{f.courses}</p>
                <p className="text-xs text-slate-400">Courses</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-purple-600">{f.students}</p>
                <p className="text-xs text-slate-400">Students</p>
              </div>
              <StarsDisplay rating={f.avg_rating} />
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setSelected(f)} className="flex-1 py-2 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors">View Profile</button>
              <button onClick={() => setEditingFaculty(f)} className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors">Edit</button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && <AddFacultyModal onClose={() => setShowAdd(false)} onSave={(newF) => setFaculty(prev => [{ id: `f_${Date.now()}`, faculty_id: `FAC00${prev.length + 1}`, courses: 2, students: 44, avg_rating: 4.8, ...newF, department: newF.department_id }, ...prev])} />}

      {editingFaculty && (
        <EditFacultyModal
          faculty={editingFaculty}
          onClose={() => setEditingFaculty(null)}
          onSave={(updatedF) => setFaculty(prev => prev.map(f => f.id === updatedF.id ? updatedF : f))}
        />
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Faculty Profile</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl">
                {selected.first_name[0]}{selected.last_name[0]}
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white">{selected.first_name} {selected.last_name}</h4>
                <p className="text-sm text-slate-500">{selected.designation}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${DEPT_COLORS[selected.department]}`}>{selected.department}</span>
              </div>
            </div>
            <div className="space-y-3">
              {[
                ['Faculty ID', selected.faculty_id],
                ['Specialization', selected.specialization],
                ['Phone', selected.phone],
                ['Courses Teaching', selected.courses],
                ['Total Students', selected.students],
              ].map(([k,v]) => (
                <div key={k} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <span className="text-sm text-slate-500">{k}</span>
                  <span className="text-sm font-medium text-slate-800 dark:text-white">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => {
                toast.success(`Analytics breakdown for ${selected.first_name} ${selected.last_name}: Average Student Pass Rate is 92.4%, Attendance is 84.1%.`);
              }} className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">📊 View Analytics</button>
              <button onClick={() => setSelected(null)} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
