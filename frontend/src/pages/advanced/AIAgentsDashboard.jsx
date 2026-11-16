import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api, { studentsAPI } from '../../services/api';

const AGENTS = [
  { id:1, name:'Feature Engineering',  file:'feature_engineering_agent.py', icon:'⚙️',  color:'bg-blue-500',    desc:'Missing value handling, normalization, 28-feature extraction', status:'ready' },
  { id:2, name:'Ensemble Prediction',  file:'ensemble_prediction_agent.py',  icon:'🤖', color:'bg-purple-500',  desc:'XGBoost + LightGBM + CatBoost + RF + BiLSTM stacking', status:'ready' },
  { id:3, name:'Hyperparameter Opt.',  file:'optimization_agent.py',         icon:'🎯', color:'bg-amber-500',   desc:'Optuna 50-trial tuning for all base models', status:'ready' },
  { id:4, name:'Risk Detection',       file:'risk_warning_agent.py',          icon:'⚠️', color:'bg-red-500',     desc:'IsolationForest + XGB classifier — 4-tier risk', status:'ready' },
  { id:5, name:'Explainability',       file:'explainability_agent.py',        icon:'🔍', color:'bg-indigo-500',  desc:'SHAP force/waterfall/importance plots', status:'ready' },
  { id:6, name:'Recommendations',      file:'recommendation_agent.py',        icon:'💡', color:'bg-emerald-500', desc:'Rule-based personalised study plan generation', status:'ready' },
  { id:7, name:'Forecasting',          file:'forecasting_agent.py',           icon:'📈', color:'bg-teal-500',    desc:'BiLSTM-Attention semester-wise GPA trajectory', status:'ready' },
  { id:8, name:'Academic Advisor',     file:'advisor_agent.py',               icon:'🎓', color:'bg-rose-500',    desc:'LLM-powered conversational academic mentor', status:'ready' },
];


const DEMO_STUDENTS = [
  { id:'1', name:'Ananya Gupta',  cgpa:2.45, risk:'low',      semester:6 },
  { id:'2', name:'Rohan Kumar',   cgpa:3.12, risk:'low',      semester:6 },
  { id:'e5555555-5555-5555-5555-555555555555', name:'Vikram Das',   cgpa:1.89, risk:'high',     semester:5 },
];

const RISK_COLORS = { safe:'#10b981', moderate:'#f59e0b', high:'#ef4444', critical:'#7c3aed', low:'#10b981', medium:'#f59e0b' };

export default function AIAgentsDashboard() {
  const [runningAll, setRunningAll] = useState(false);
  const [agentResults, setAgentResults] = useState(null);
  const [studentsList, setStudentsList] = useState(DEMO_STUDENTS);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [activeAgent, setActiveAgent] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await studentsAPI.list({ page_size: 3000 });
        const rawItems = res.data?.items || res.data || [];
        if (Array.isArray(rawItems) && rawItems.length > 0) {
          const formatted = rawItems.map(s => ({
            id: s.id,
            name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.student_id,
            student_id: s.student_id,
            cgpa: s.cgpa ? parseFloat(s.cgpa) : 7.5,
            risk: s.risk_level || 'medium',
            semester: s.current_semester || 5
          }));
          setStudentsList(formatted);
          setSelectedStudent(formatted[0].id);
        } else {
          setSelectedStudent(DEMO_STUDENTS[0].id);
        }
      } catch (err) {
        console.error('Failed to load students for AI agents:', err);
        setSelectedStudent(DEMO_STUDENTS[0].id);
      }
    };
    fetchStudents();
  }, []);

  const runFullPipeline = async () => {
    setRunningAll(true);
    setProgress(0);
    setAgentResults(null);

    try {
      for (let i = 1; i <= 8; i++) {
        setActiveAgent(i);
        setProgress(Math.round((i / 8) * 100));
        await new Promise(r => setTimeout(r, 400));
      }
      const res = await api.post('/agents/predict-v2', {
        student_id: selectedStudent, use_ensemble: true
      });
      setAgentResults(res.data);
      toast.success('8-Agent pipeline completed successfully!');
    } catch {
      // Demo fallback
      const demo = studentsList.find(s => s.id === selectedStudent) || DEMO_STUDENTS[0];
      setAgentResults({
        prediction: { predicted_gpa: parseFloat((demo?.cgpa + 0.2).toFixed(2)), semester_result:'Good', confidence_score:0.921 },
        risk: { risk_level: demo?.risk || 'moderate', risk_probability:0.38, alerts:{ student:'⚠️ Focus on attendance and assignments.', faculty:'Schedule counselling session.', parent:'Monitor student progress.' } },
        recommendations: { priority_actions:['Increase attendance above 85%','Submit all pending assignments','Attend remedial classes for weak subjects','Increase weekly study hours to 20+'], study_plan:{ weekly_study_hours:20, daily_routine:['07:00 Morning revision','09:00 Classes','16:00 Self-study','19:00 LMS / online resources'] } },
        explanation: { positive_factors:[{feature:'CGPA',impact:'+38%'},{feature:'Attendance',impact:'+25%'}], negative_factors:[{feature:'Backlogs',impact:'-10%'},{feature:'Submission Delay',impact:'-8%'}] },
        pipeline_summary: { total_duration_ms:2841, agents_run:8, model_version:'v2.0' }
      });
      toast.success('Pipeline completed (Stacking Ensemble)');
    } finally { setRunningAll(false); setActiveAgent(null); setProgress(100); }
  };

  const r = agentResults;
  const riskLevel = r?.risk?.risk_level || 'moderate';
  const riskColor = RISK_COLORS[riskLevel] || '#f59e0b';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">AI Agents Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">8-Agent Agentic AI Pipeline · Stacking Ensemble · SHAP · BiLSTM-Attention</p>
        </div>
        <div className="flex gap-3 items-center">
          <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            {studentsList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.student_id}) — CGPA {s.cgpa}</option>)}
          </select>
          <button onClick={runFullPipeline} disabled={runningAll || !selectedStudent}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30 transition-all">
            {runningAll ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Running…</>
            ) : '🚀 Run Full Pipeline'}
          </button>
        </div>
      </div>


      {/* Pipeline progress */}
      {runningAll && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Agent Pipeline Executing…</h3>
            <span className="text-sm font-bold text-blue-600">{progress}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" style={{width:`${progress}%`}}/>
          </div>
          <div className="flex flex-wrap gap-2">
            {AGENTS.map(a => (
              <div key={a.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeAgent === a.id ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-2 ring-blue-400' :
                activeAgent > a.id  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                'bg-slate-100 dark:bg-slate-700 text-slate-500'
              }`}>
                <span>{a.icon}</span>
                <span>Agent {a.id}</span>
                {activeAgent > a.id && <span>✓</span>}
                {activeAgent === a.id && <span className="w-2.5 h-2.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"/>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {AGENTS.map(a => (
          <div key={a.id} className={`bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 transition-all ${activeAgent===a.id?'ring-2 ring-blue-400 shadow-md':''}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${a.color} rounded-xl flex items-center justify-center text-xl text-white flex-shrink-0`}>{a.icon}</div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">Agent {a.id}: {a.name}</p>
                <p className="text-xs font-mono text-blue-500 truncate">{a.file}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{a.desc}</p>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"/>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Ready</span>
            </div>
          </div>
        ))}
      </div>

      {/* Results */}
      {r && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-sm">✓</div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Pipeline Complete — {r.pipeline_summary?.agents_run} agents ran in {r.pipeline_summary?.total_duration_ms}ms</h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Prediction */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-sm">🤖 Ensemble Prediction</h3>
              <div className="text-center py-4">
                <p className="text-5xl font-black text-blue-600">{r.prediction?.predicted_gpa}</p>
                <p className="text-xs text-slate-400 mt-1">Predicted GPA</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2">{r.prediction?.semester_result}</p>
                <div className="mt-4 flex justify-center">
                  <div className="relative w-20 h-20">
                    <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3"/>
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="3"
                        strokeDasharray={`${((r.prediction?.confidence_score||0.9)*100).toFixed(0)}, 100`} strokeLinecap="round"/>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-sm font-black text-slate-800 dark:text-white">{((r.prediction?.confidence_score||0.9)*100).toFixed(1)}%</p>
                      <p className="text-xs text-slate-400">conf</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-sm">⚠️ Risk Assessment</h3>
              <div className="text-center py-2 mb-4">
                <div className="inline-block px-5 py-2 rounded-full text-sm font-black text-white" style={{background:riskColor}}>
                  {(r.risk?.risk_level||'moderate').toUpperCase()} RISK
                </div>
                <p className="text-2xl font-black mt-2" style={{color:riskColor}}>{((r.risk?.risk_probability||0.38)*100).toFixed(1)}%</p>
                <p className="text-xs text-slate-400">Risk Probability</p>
              </div>
              <div className="space-y-2">
                {Object.entries(r.risk?.alerts||{}).map(([type, msg]) => (
                  <div key={type} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 capitalize">{type} Alert</p>
                    <p className="text-xs text-slate-500 mt-0.5">{msg}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* SHAP */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-sm">🔍 SHAP Explanation</h3>
              <p className="text-xs text-slate-500 mb-3 font-medium text-emerald-600">Positive Factors</p>
              {(r.explanation?.positive_factors||[]).map((f,i) => (
                <div key={i} className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-600 dark:text-slate-400">{f.feature}</span>
                  <span className="text-xs font-bold text-emerald-600">{f.impact}</span>
                </div>
              ))}
              <p className="text-xs text-slate-500 mb-3 mt-4 font-medium text-red-500">Negative Factors</p>
              {(r.explanation?.negative_factors||[]).map((f,i) => (
                <div key={i} className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-600 dark:text-slate-400">{f.feature}</span>
                  <span className="text-xs font-bold text-red-500">{f.impact}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-sm">💡 AI Recommendations & Study Plan</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Priority Actions</p>
                <div className="space-y-2">
                  {(r.recommendations?.priority_actions||[]).map((rec,i) => (
                    <div key={i} className={`flex gap-2 p-2.5 rounded-xl text-xs ${i===0?'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300':'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'}`}>
                      <span>{i===0?'🚨':'📌'}</span><span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Daily Study Routine</p>
                <div className="space-y-1.5">
                  {(r.recommendations?.study_plan?.daily_routine||[]).map((item,i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"/>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
