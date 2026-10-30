'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'rose' | 'amber' | 'sky' | 'slate';
}

export function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  variant = 'slate',
}: StatCardProps) {
  const iconVariants = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    slate: 'text-slate-400 bg-slate-800 border-slate-700',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex items-start justify-between shadow-sm">
      <div className="space-y-1">
        <p className="text-xs sm:text-sm font-medium text-slate-400">{label}</p>
        <p className="text-xl sm:text-2xl font-bold font-mono text-slate-100">{value}</p>
        {subtitle && <p className="text-[11px] sm:text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className={`p-2.5 sm:p-3 rounded-lg border ${iconVariants[variant]}`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
    </div>
  );
}
