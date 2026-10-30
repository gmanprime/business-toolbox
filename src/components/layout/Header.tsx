'use client';

import React from 'react';
import { DatabaseStats } from '@/lib/tauri-bridge';
import { SafeguardStatus } from '@/lib/safeguard';
import { Badge } from '@/components/common/Badge';
import {
  Cpu,
  Database,
  Layers,
  ShieldCheck,
  Smartphone,
  Monitor,
  Ban,
  Package,
} from 'lucide-react';

interface HeaderProps {
  stats: DatabaseStats | null;
  safeguard: SafeguardStatus | null;
  isTauriEnv: boolean;
  onRefresh?: () => void;
}

export function Header({ stats, safeguard, isTauriEnv, onRefresh }: HeaderProps) {
  return (
    <header className="flex-shrink-0 z-30 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Hardware Identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm tracking-wide">MAMA RECEIPTS</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                v0.1.0-beta
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold">
                HEK0105410
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Ethiopian ERCA Fiscal Cash Register Processing Engine
            </p>
          </div>
        </div>

        {/* Live System & DB Statistics */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {stats && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono font-semibold text-emerald-400">
                  {stats.fs_sales_receipts}
                </span>
                <span className="text-slate-500">FS</span>
              </div>
              <span className="text-slate-700">|</span>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Package className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-mono font-semibold text-sky-400">
                  {stats.total_plu_items}
                </span>
                <span className="text-slate-500">PLU</span>
              </div>
              <span className="text-slate-700">|</span>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Ban className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-mono font-semibold text-rose-400">
                  {stats.void_receipts}
                </span>
                <span className="text-slate-500">VOID</span>
              </div>
            </div>
          )}

          {/* Environment Indicator */}
          <Badge variant={isTauriEnv ? 'info' : 'warning'} size="sm">
            {isTauriEnv ? (
              <span className="flex items-center gap-1">
                <Monitor className="w-3 h-3" /> Tauri Native
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Smartphone className="w-3 h-3" /> Browser Preview
              </span>
            )}
          </Badge>

          {/* Safeguard Status */}
          {safeguard && (
            <Badge variant={safeguard.isVerified ? 'success' : 'warning'} size="sm">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="capitalize">{safeguard.tier} License</span>
              </span>
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}
