import React from 'react';
import { getRiskColor } from '../../utils/formatters';

export default function RiskBadge({ risk, size = 'sm' }) {
  const { bg, text } = getRiskColor(risk);
  const icons = { low: '✅', medium: '⚠️', high: '🚨', critical: '🔴' };
  const sizeClass = size === 'lg' ? 'text-sm px-3 py-1.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`${bg} ${text} ${sizeClass} rounded-full font-bold inline-flex items-center gap-1`}>
      <span>{icons[risk] || '•'}</span>
      <span>{risk?.toUpperCase()}</span>
    </span>
  );
}
