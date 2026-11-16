import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import api, { studentsAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const STUDENT_QUESTIONS = [
  "How can I improve my GPA next semester?",
  "Which subjects should I focus on?",
  "Why is my performance decreasing?",
  "How do I clear my backlogs?",
  "What study plan should I follow?",
  "How to improve my attendance?",
  "Am I eligible for placements?",
  "What skills should I develop?",
];

const FACULTY_QUESTIONS = [
  "Which students in my class are at risk?",
  "How can I help Vikram improve his attendance?",
  "What is this student's performance trend?",
  "Generate a counseling summary for this student",
  "What intervention should I recommend?",
  "How does this student compare to class average?",
  "What are the common risk factors in my class?",
  "Suggest a study plan for this struggling student",
];

const DEMO_STUDENTS = [
  { id:'1', name:'Ananya Gupta',  cgpa:2.45, risk:'low',    semester:6, attendance:91.3 },
  { id:'2', name:'Rohan Kumar',   cgpa:3.12, risk:'low',    semester:6, attendance:85.4 },
  { id:'e5555555-5555-5555-5555-555555555555', name:'Vikram Das',   cgpa:1.89, risk:'high',   semester:5, attendance:55 },
];

const RULE_RESPONSES = {
  "improve my gpa": "To improve your GPA:\n• Focus on high-weightage subjects first\n• Maintain above 85% attendance — strong correlation with 1.2+ GPA points\n• Submit ALL assignments on time — late submissions cut internal marks by 30%\n• Solve previous year question papers 2 weeks before exams\n• Form study groups for difficult subjects\n• Visit faculty during office hours for clarification",
  "weak subjects": "To identify and improve weak subjects:\n• Check your subject-wise score breakdown in Academic Records\n• Focus extra time on subjects where you score below 60%\n• Request supplementary material from faculty\n• Use NPTEL/Coursera for free course material\n• Practice topic-wise quizzes every week\n• Pair up with toppers for peer learning",
  "performance decreasing": "If your performance is declining:\n• Review your last 3-semester SGPA trend in Analytics\n• Common causes: reduced study time, attendance drop, backlog accumulation\n• Book a counselling session with your advisor immediately\n• Track daily study hours — minimum 15 hours/week recommended\n• Address personal challenges through the student welfare cell\n• Create a structured weekly schedule and stick to it",
  "study plan": "Your recommended study plan:\n• 07:00 — Morning revision (1 hour)\n• 16:00 — Post-class self-study (2 hours)\n• 19:00 — LMS & online resources (1 hour)\n• 21:00 — Previous year paper practice\n• Weekends: cover weak topics + assignment work\n• Target minimum 20 study hours per week",
  "backlogs": "To clear backlogs:\n• Register for supplementary exams as soon as announced\n• Dedicate 1–2 hours daily per backlog subject\n• Solve last 5 years of question papers\n• Seek help from faculty or senior students\n• Join study groups for backlog subjects\n• Don't let backlogs accumulate — clear one at a time",
  "attendance": "Attendance improvement tips:\n• You need minimum 75% to appear for exams\n• Set daily attendance reminders on your phone\n• Never skip morning classes — lowest overall attendance period\n• Apply for medical leave within 7 days if medically absent\n• Track your attendance weekly on SAPFS\n• Missing 1 class in 10 = 90% (safe). Missing 3 in 10 = 70% (danger!)",
  "placement": "Placement readiness tips:\n• Maintain CGPA above 7.0 — most companies filter below this\n• Build projects and add to GitHub portfolio\n• Complete at least 2 internships or mini-projects\n• Practice DSA on LeetCode — target 200+ problems\n• Participate in hackathons for hands-on experience\n• Get certifications in your specialisation area",
  "skills": "Essential skills to develop:\n• Technical: DSA, System Design, Cloud Computing\n• Programming: Python, Java, or JavaScript\n• Soft skills: Communication, Teamwork, Presentation\n• Certifications: AWS, Google Cloud, or Azure\n• Domain: AI/ML, Web Dev, Cybersecurity — pick one\n• Tools: Git, Docker, REST APIs",
  "at risk": "At-risk student analysis for your class:\n• Vikram Das — CGPA 1.89, Attendance 55% — CRITICAL: Below 60% attendance and 5 backlogs. Recommend immediate counseling and reduced course load.\n• Rahul Verma — CGPA 2.10, Attendance 69% — MEDIUM: Attendance trending down. Schedule a check-in meeting.\n• Neha Gupta — CGPA 2.23, Attendance 74.5% — WARNING: Approaching minimum threshold. Send attendance alert.",
  "intervention": "Recommended intervention strategies:\n• For low attendance: Schedule weekly check-in meetings, send automated SMS alerts\n• For declining CGPA: Assign peer mentors from top performers, arrange extra tutoring\n• For assignment issues: Set intermediate deadlines, provide rubric guides\n• For backlogs: Recommend supplementary coaching, connect with previous year toppers\n• For personal issues: Refer to student counselor, coordinate with HOD",
  "counseling": "Counseling session summary template:\n• Student: {name} (Sem {semester})\n• Current CGPA: {cgpa} | Attendance: {attendance}%\n• Risk Level: {risk}\n• Key concerns identified during session\n• Action items agreed upon\n• Follow-up date scheduled\n• Referrals made (if any)\n\nRecommend scheduling follow-up within 2 weeks.",
  "compare": "Student vs Class Average comparison:\n• Class Average CGPA: 2.85 — Student CGPA: varies per selection\n• Class Average Attendance: 78.4%\n• Class Assignment Submission Rate: 82%\n• Students above class average: 55%\n• Students below 75% attendance: 38 students (4.5% of total)",
  "trend": "Performance trend analysis:\n• Ananya Gupta: Consistent upward trend — High academic performance with 91.3% attendance and 96.7% assignment completion\n• Rohan Kumar: Strong consistency — CGPA 3.12 with regular participation\n• Vikram Das: Critical decline — CGPA 1.89, attendance 55%, backlogs accumulated",
};

const getRuleResponse = (query, isFaculty = false) => {
  const q = query.toLowerCase();
  for (const [key, response] of Object.entries(RULE_RESPONSES)) {
    if (key.split(' ').some(word => q.includes(word))) return response;
  }
  if (isFaculty) {
    return "Based on your class data, here are my recommendations:\n• Review the Class Risk Warnings page for flagged students\n• Schedule 1-on-1 sessions with students below 70% attendance\n• Check assignment submission rates — follow up with non-submitters\n• Use the Risk Analytics page to identify trending concerns\n• Consider sending batch counseling emails via the Reports section";
  }
  return "I understand your question. Based on your current profile, I recommend:\n• Maintain consistent attendance above 85%\n• Submit assignments before the deadline\n• Visit the SAPFS Analytics page for detailed insights\n• Book a session with your faculty advisor for personalised guidance";
};

const Message = ({ msg }) => (
  <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gradient-to-br from-purple-500 to-indigo-600'} text-white`}>
      {msg.role === 'user' ? '👤' : '🎓'}
    </div>
    <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tl-none shadow-sm'}`}>
      {msg.content.split('\n').map((line, i) => (
        <p key={i} className={`${line.startsWith('•') ? 'ml-2' : ''} ${i > 0 ? 'mt-1' : ''} leading-relaxed`}>{line}</p>
      ))}
      <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>{msg.time}</p>
    </div>
  </div>
);

export default function AdvisorChat() {
  const { user, role } = useAuthStore();
  const isFaculty = role === 'faculty';
  const isStudent = role === 'student';

  const studentProfile = user?.student_profile;
  const currentStudent = isStudent && user ? {
    id: String(studentProfile?.Student_ID || user?.student_id || '1'),
    name: user?.full_name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Ananya Gupta'),
    cgpa: studentProfile?.Prior_GPA || user?.cgpa || 2.45,
    risk: 'low',
    semester: 6,
    attendance: studentProfile?.Attendance_Rate || 91.3
  } : DEMO_STUDENTS[0];

  const availableStudents = isStudent
    ? [currentStudent]
    : [currentStudent, ...DEMO_STUDENTS.slice(1)];

  const suggestedQuestions = isFaculty ? FACULTY_QUESTIONS : STUDENT_QUESTIONS;

  const getWelcomeMsg = (student) => {
    if (isFaculty) {
      return `Hello Dr. Sharma! 👨‍🏫 I'm your AI Student Counseling Assistant.\n\nCurrently viewing: ${student.name} (CGPA: ${student.cgpa}, Attendance: ${student.attendance}%, Risk: ${student.risk.toUpperCase()})\n\n${student.risk === 'high' ? '🚨 This student is HIGH RISK — I recommend scheduling an immediate counseling session.' : student.risk === 'medium' ? '⚠️ This student needs attention — consider a check-in meeting.' : '✅ This student is performing well.'}\n\nAsk me about their performance, intervention strategies, or generate a counseling summary.`;
    }
    return `Hello ${student.name}! I'm your AI Academic Advisor powered by SAPFS. I can help you understand your academic performance, suggest improvements, and answer questions about your progress.\n\nYour CGPA is ${student.cgpa} and you're in Semester ${student.semester}. ${student.risk === 'high' ? '⚠️ Your risk level is HIGH — let\'s work on improving your performance together!' : '✅ You\'re doing well! How can I help you further?'}`;
  };

  const [selectedStudent, setSelectedStudent] = useState(availableStudents[0]);
  const [liveStudents, setLiveStudents] = useState(null); // null = not yet loaded
  const [messages, setMessages] = useState([
    { id:1, role:'assistant', content: getWelcomeMsg(availableStudents[0]), time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Load real students for faculty/admin
  useEffect(() => {
    if (isStudent) return;
    studentsAPI.list({ page_size: 200 }).then(res => {
      const raw = res.data?.items || res.data || [];
      if (Array.isArray(raw) && raw.length > 0) {
        const mapped = raw.slice(0, 50).map(s => ({
          id: s.id,
          name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.student_id,
          cgpa: s.cgpa ? parseFloat(s.cgpa) : 2.5,
          risk: s.risk_level || 'low',
          semester: s.current_semester || 6,
          attendance: s.attendance_pct ? parseFloat(s.attendance_pct) : 80,
        }));
        setLiveStudents(mapped);
        setSelectedStudent(mapped[0]);
        setMessages([{ id: Date.now(), role: 'assistant',
          content: getWelcomeMsg(mapped[0]),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      }
    }).catch(err => {
      console.warn('AdvisorChat: could not load students from API, using demo list', err?.message);
    });
  }, [isStudent]);

  const displayStudents = liveStudents || availableStudents;

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior:'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async (query = input) => {
    if (!query.trim() || loading) return;
    const userMsg = { id: Date.now(), role:'user', content: query, time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/agents/advisor/chat', {
        student_id: selectedStudent.id, query, history: messages.slice(-6)
      });
      const data = res.data;
      setMessages(prev => [...prev, {
        id: Date.now()+1, role:'assistant',
        content: data.response || getRuleResponse(query, isFaculty),
        time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),
        suggested: data.suggested_questions || []
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now()+1, role:'assistant',
        content: getRuleResponse(query, isFaculty),
        time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),
        suggested: suggestedQuestions.slice(0, 3)
      }]);
    } finally { setLoading(false); }
  };

  const riskColors = { low:'text-emerald-600 bg-emerald-100', medium:'text-amber-600 bg-amber-100', high:'text-red-600 bg-red-100' };

  return (
    <div className="h-full flex flex-col gap-4 animate-fade-in" style={{minHeight:'600px'}}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            {isFaculty ? 'Student Counseling Assistant' : 'AI Academic Advisor'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isFaculty ? 'AI-powered mentee counseling — select a student and get intervention recommendations' : 'Powered by Agent 8 — Conversational AI Mentor with LLM support'}
          </p>
        </div>
        {isStudent ? (
          <div className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">🎓 {selectedStudent.name}</p>
            <p className="text-xs text-blue-500">CGPA: {selectedStudent.cgpa} • Sem {selectedStudent.semester}</p>
          </div>
        ) : (
          <select value={selectedStudent.id} onChange={e => {
            const s = displayStudents.find(d => d.id === e.target.value);
            setSelectedStudent(s);
            setMessages([{ id:Date.now(), role:'assistant',
              content: getWelcomeMsg(s),
              time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) }]);
          }} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            {displayStudents.map(s => <option key={s.id} value={s.id}>{isFaculty ? '🎓 ' : ''}{s.name} (CGPA: {s.cgpa})</option>)}
          </select>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-4 flex-1">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Student Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {selectedStudent.name.split(' ').map(n=>n[0]).join('')}
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-white text-sm">{selectedStudent.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskColors[selectedStudent.risk]}`}>{selectedStudent.risk.toUpperCase()}</span>
              </div>
            </div>
            {[['CGPA',selectedStudent.cgpa],['Semester',`Sem ${selectedStudent.semester}`],['Attendance',`${selectedStudent.attendance}%`]].map(([k,v]) => (
              <div key={k} className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-700 last:border-0">
                <span className="text-xs text-slate-500">{k}</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{v}</span>
              </div>
            ))}
          </div>

          {/* Suggested Questions */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-3">
              {isFaculty ? 'Counseling Prompts' : 'Quick Questions'}
            </p>
            <div className="space-y-2">
              {suggestedQuestions.map((q, i) => (
                <button key={i} onClick={() => handleSend(q)}
                  className="w-full text-left text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Provider badge */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-4 border border-purple-100 dark:border-purple-800">
            <p className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-1">{isFaculty ? '💬 Counseling Mode' : '🤖 AI Provider'}</p>
            <p className="text-xs text-purple-600 dark:text-purple-400">{isFaculty ? 'AI-assisted student counseling active. Ask about risk analysis, intervention plans, or generate counseling summaries.' : 'Rule-based engine active. Connect Gemini or OpenAI API key in settings for advanced responses.'}</p>
          </div>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
          {/* Chat header */}
          <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-700">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-lg">🎓</div>
            <div>
              <p className="font-bold text-slate-800 dark:text-white text-sm">SAPFS Academic Advisor</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
                <span className="text-xs text-emerald-600">Online — Agent 8 Active</span>
              </div>
            </div>
            <div className="ml-auto">
              <button onClick={() => setMessages([messages[0]])} className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">Clear</button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{minHeight:'350px',maxHeight:'400px'}}>
            {messages.map(msg => <Message key={msg.id} msg={msg}/>)}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-sm text-white">🎓</div>
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    {[0,1,2].map(i => <span key={i} className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex gap-3">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={isFaculty ? 'Ask about this student\'s performance, risk factors, or intervention strategies...' : 'Ask your academic advisor anything...'}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
              <button onClick={() => handleSend()} disabled={loading || !input.trim()}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                Send →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
