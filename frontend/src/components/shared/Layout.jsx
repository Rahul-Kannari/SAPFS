import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const navItems = [
  { path:'/dashboard', label:'Dashboard', icon:'🏠' },
  { path:'/students', label:'Students', icon:'🎓' },
  { path:'/faculty', label:'Faculty', icon:'👨‍🏫' },
  { path:'/courses', label:'Courses', icon:'📚' },
  { path:'/academic-records', label:'Academic Records', icon:'📝' },
  { path:'/attendance', label:'Attendance', icon:'📅' },
  { path:'/assignments', label:'Assignments', icon:'✏️' },
  { path:'/predictions', label:'Predictions', icon:'🤖' },
  { path:'/analytics', label:'Analytics', icon:'📊' },
  { path:'/reports', label:'Reports', icon:'📄' },
  { path:'/notifications', label:'Notifications', icon:'🔔' },
];

const roleNav = {
  admin: [
    { path:'/dashboard', label:'Campus Dashboard', icon:'🏠' },
    { path:'/students', label:'Student Directory', icon:'🎓' },
    { path:'/faculty', label:'Faculty Management', icon:'👨‍🏫' },
    { path:'/courses', label:'Course Curriculum', icon:'📚' },
    { path:'/academic-records', label:'Academic Records', icon:'📝' },
    { path:'/predictions', label:'ML Forecast Pipeline', icon:'🤖' },
    { path:'/analytics', label:'Deep Analytics', icon:'📊' },
    { path:'/risk-analytics', label:'Risk Heatmap Analytics', icon:'🚨' },
    { path:'/ai-agents', label:'AI Multi-Agent Monitor', icon:'🧠' },
    { path:'/advisor-chat', label:'AI Academic Counselor', icon:'💬' },
    { path:'/evaluation', label:'Research Model Evaluation', icon:'🔬' },
    { path:'/reports', label:'Reports & Exports', icon:'📄' },
  ],
  faculty: [
    { path:'/dashboard', label:'Faculty Dashboard', icon:'🏠' },
    { path:'/students', label:'My Students & Mentees', icon:'🎓' },
    { path:'/courses', label:'My Assigned Courses', icon:'📚' },
    { path:'/academic-records', label:'Academic & Internal Marks', icon:'📝' },
    { path:'/predictions', label:'Class GPA Forecast & Risk', icon:'🤖' },
    { path:'/analytics', label:'Class Analytics', icon:'📊' },
    { path:'/risk-analytics', label:'Class Risk Heatmap', icon:'🚨' },
    { path:'/advisor-chat', label:'AI Mentees Advisor', icon:'💬' },
    { path:'/reports', label:'Class Reports', icon:'📄' },
  ],
  student: [
    { path:'/dashboard', label:'My Dashboard', icon:'🏠' },
    { path:'/predictions', label:'My GPA Forecast', icon:'🤖' },
    { path:'/advisor-chat', label:'AI Academic Advisor', icon:'💬' },
    { path:'/recommendations', label:'My Action Plan', icon:'🎯' },
    { path:'/my-attendance', label:'My Attendance', icon:'📅' },
    { path:'/my-assignments', label:'My Assignments', icon:'✏️' },
    { path:'/academic-records', label:'My Marks & Grades', icon:'📝' },
    { path:'/reports', label:'My Progress Report', icon:'📄' },
    { path:'/notifications', label:'Notifications', icon:'🔔' },
  ],
};

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/login'); };
  const toggleDark = () => { setDarkMode(!darkMode); document.documentElement.classList.toggle('dark'); };
  const nav = roleNav[role] || navItems;
  const currentPage = nav.find(n => n.path === location.pathname);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen?'w-58':'w-16'} flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 shadow-sm`} style={{width: sidebarOpen ? '230px' : '64px'}}>
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm flex-shrink-0">S</div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="font-black text-slate-800 dark:text-white text-sm leading-tight">SAPFS</p>
              <p className="text-xs text-slate-400 leading-tight">Academic Forecasting</p>
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {sidebarOpen && <p className="text-xs font-semibold text-slate-400 uppercase px-3 mb-2 tracking-wider">Menu</p>}
          {nav.map(item=>{
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all text-sm group ${active?'bg-blue-600 text-white shadow-md shadow-blue-500/30':'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-800 dark:hover:text-white'}`}>
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="font-medium truncate text-xs">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-100 dark:border-slate-700">
          <div className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!sidebarOpen&&'justify-center'}`}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            {sidebarOpen && <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                {user?.full_name || user?.first_name || user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-slate-400 capitalize">
                {role === 'student' ? `Student (ID: ${user?.student_id || '1'})` : role}
              </p>
            </div>}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-4 flex-shrink-0">
          <button onClick={()=>setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm">☰</button>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{currentPage?.label || 'SAPFS'}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleDark} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">{darkMode?'☀️':'🌙'}</button>
            <Link to="/notifications" className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">🔔<span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"/></Link>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors text-sm">🚪 Logout</button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
