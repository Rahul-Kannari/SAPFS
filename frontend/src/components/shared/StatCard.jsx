import React from 'react';

export default function StatCard({ icon, label, value, change, color='bg-blue-500', loading=false, subtitle }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className={`absolute top-0 right-0 w-28 h-28 rounded-full -translate-y-10 translate-x-10 ${color} opacity-10 group-hover:opacity-15 transition-opacity`}/>
      <div className="flex items-start justify-between relative">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
          {loading
            ? <div className="h-9 w-24 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse mt-2"/>
            : <p className="text-3xl font-black text-slate-800 dark:text-white mt-1 leading-none">{value}</p>
          }
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {change !== undefined && (
            <p className={`text-xs mt-2 font-semibold flex items-center gap-1 ${change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              <span>{change >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(change)}% vs last semester</span>
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-2xl text-white shadow-lg flex-shrink-0`}>{icon}</div>
      </div>
    </div>
  );
}
