import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Layout from './components/shared/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import FacultyPage from './pages/FacultyPage';
import CoursesPage from './pages/CoursesPage';
import AttendancePage from './pages/AttendancePage';
import AssignmentsPage from './pages/AssignmentsPage';
import AcademicRecordsPage from './pages/AcademicRecordsPage';
import PredictionsPage from './pages/PredictionsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ReportsPage from './pages/ReportsPage';
import RiskAnalytics from './pages/advanced/RiskAnalytics';
import RecommendationPage from './pages/advanced/RecommendationPage';
import AIAgentsDashboard from './pages/advanced/AIAgentsDashboard';
import AdvisorChat from './pages/advanced/AdvisorChat';
import EvaluationDashboard from './pages/advanced/EvaluationDashboard';

const NotificationsPage = () => {
  const { role } = useAuthStore();

  const adminNotifs = [
    { title:'🔴 Critical Risk Alert', msg:'Riya Sharma (IT2022001) has dropped to 4.8 CGPA with 48% attendance. Immediate academic counseling required.', time:'2 hours ago', type:'critical', read:false },
    { title:'⚠️ Attendance Warning Triggered', msg:'38 students are below 75% attendance. Automated warning letters have been queued for dispatch.', time:'5 hours ago', type:'warning', read:false },
    { title:'🤖 Batch Prediction Completed', msg:'AI batch prediction completed for 847 students. 43 flagged as high-risk, 8 critical. View the risk report for details.', time:'1 day ago', type:'info', read:false },
    { title:'📝 Assignment Due Tomorrow', msg:'ML Assignment 3 due date is tomorrow for CSE Semester 7. Current submission rate: 82% (18/22 students).', time:'1 day ago', type:'info', read:false },
    { title:'✅ Semester 6 Records Finalized', msg:'Semester 6 academic records have been verified and finalized by the examination cell.', time:'3 days ago', type:'success', read:true },
    { title:'📊 Weekly Analytics Ready', msg:'Your weekly department analytics report is ready. Overall performance improved by 3.2% this week.', time:'5 days ago', type:'info', read:true },
    { title:'🎯 Model Retrained Successfully', msg:'XGBoost + LSTM hybrid model retrained with latest data. New accuracy: 92.7% (+0.4% improvement).', time:'1 week ago', type:'success', read:true },
  ];

  const facultyNotifs = [
    { title:'⚠️ At-Risk Student Alert', msg:'Vikram Das (CSE2022002) attendance dropped to 55%. Attendance below exam eligibility threshold — please schedule a counseling session.', time:'1 hour ago', type:'warning', read:false },
    { title:'📝 Assignment Submissions Pending', msg:'ML Assignment 3 — 4 students have not submitted yet. Deadline is tomorrow at 11:59 PM.', time:'3 hours ago', type:'info', read:false },
    { title:'📊 Grading Reminder', msg:'Deep Learning Lab Report grading is pending for 8 students. Please complete grading before Friday.', time:'5 hours ago', type:'info', read:false },
    { title:'📅 Attendance Updated', msg:'Today\'s attendance for CSE301 Machine Learning has been recorded. 20/22 present (90.9%).', time:'1 day ago', type:'success', read:false },
    { title:'🤖 Risk Report Generated', msg:'Weekly risk report for your CSE Semester 7 class is ready. 2 students flagged as medium risk.', time:'2 days ago', type:'info', read:true },
    { title:'✅ Internal Marks Saved', msg:'Internal marks for CSE301 Semester 7 have been saved and verified successfully.', time:'4 days ago', type:'success', read:true },
  ];

  const studentNotifs = [
    { title:'📝 Assignment Due Tomorrow', msg:'ML Assignment 3: Neural Network Implementation is due tomorrow at 11:59 PM. You have already submitted (88/100).', time:'1 hour ago', type:'info', read:false },
    { title:'📅 Attendance Update', msg:'Your overall attendance is 91.2%. You are eligible for all end-semester examinations. Keep it up!', time:'3 hours ago', type:'success', read:false },
    { title:'🤖 GPA Forecast Updated', msg:'Your predicted SGPA for Semester 8 is 8.12 with 91.4% confidence. Risk level: LOW ✅', time:'1 day ago', type:'success', read:false },
    { title:'⭐ Assignment Graded', msg:'Deep Learning Lab Report has been graded. You scored 42/50 (Grade: A+). Great work!', time:'2 days ago', type:'success', read:true },
    { title:'📊 Semester 6 Result Published', msg:'Your Semester 6 results are available. SGPA: 8.47. View your detailed report card in Reports section.', time:'5 days ago', type:'info', read:true },
  ];

  const initialNotifs = role === 'student' ? studentNotifs : role === 'faculty' ? facultyNotifs : adminNotifs;

  const [notifications, setNotifications] = React.useState(initialNotifs);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (index) => {
    setNotifications(prev => prev.map((n, i) => i === index ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up! No unread notifications.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
            ✓ Mark all as read
          </button>
        )}
      </div>
      <div className="space-y-3">
        {notifications.map((n,i)=>(
          <div key={i} className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border-l-4 border-r border-t border-b transition-all hover:shadow-md ${
            n.type==='critical'?'border-l-purple-500':n.type==='warning'?'border-l-amber-500':n.type==='success'?'border-l-emerald-500':'border-l-blue-500'
          } border-slate-100 dark:border-r-slate-700 dark:border-t-slate-700 dark:border-b-slate-700 ${!n.read?'bg-blue-50/30 dark:bg-blue-900/10':''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="font-semibold text-slate-800 dark:text-white text-sm">{n.title}</h4>
                  {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse"/>}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{n.msg}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-slate-400">{n.time}</p>
                {!n.read && (
                  <button onClick={() => markAsRead(i)} className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1 transition-colors font-medium">
                    Mark read
                  </button>
                )}
                {n.read && (
                  <span className="text-xs text-emerald-500 mt-1 inline-block">✓ Read</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { borderRadius:'12px', background:'#fff', color:'#1e293b', boxShadow:'0 10px 40px rgba(0,0,0,0.12)' },
        duration: 4000,
      }}/>
      <Routes>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage/>}/>
                <Route path="/students" element={<StudentsPage/>}/>
                <Route path="/faculty" element={<FacultyPage/>}/>
                <Route path="/courses" element={<CoursesPage/>}/>
                <Route path="/attendance" element={<AttendancePage/>}/>
                <Route path="/my-attendance" element={<AttendancePage/>}/>
                <Route path="/assignments" element={<AssignmentsPage/>}/>
                <Route path="/my-assignments" element={<AssignmentsPage/>}/>
                <Route path="/academic-records" element={<AcademicRecordsPage/>}/>
                <Route path="/predictions" element={<PredictionsPage/>}/>
                <Route path="/analytics" element={<AnalyticsPage/>}/>
                <Route path="/my-performance" element={<AnalyticsPage/>}/>
                <Route path="/reports" element={<ReportsPage/>}/>
                <Route path="/notifications" element={<NotificationsPage/>}/>
                <Route path="/risk-analytics" element={<RiskAnalytics/>}/>
                <Route path="/recommendations" element={<RecommendationPage/>}/>
                <Route path="/ai-agents" element={<AIAgentsDashboard/>}/>
                <Route path="/advisor-chat" element={<AdvisorChat/>}/>
                <Route path="/evaluation" element={<EvaluationDashboard/>}/>
                <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
              </Routes>
            </Layout>
          </ProtectedRoute>
        }/>
      </Routes>
    </BrowserRouter>
  );
}
