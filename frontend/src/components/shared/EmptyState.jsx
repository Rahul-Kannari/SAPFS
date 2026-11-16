import React from 'react';

export default function EmptyState({ icon = '📭', title = 'No data found', desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-2">{title}</h3>
      {desc && <p className="text-sm text-slate-500 mb-4 max-w-sm">{desc}</p>}
      {action}
    </div>
  );
}
