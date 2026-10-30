'use client';

import React from 'react';
import {
  HardDriveUpload,
  Database,
  Package,
  Download,
  Terminal,
} from 'lucide-react';

export type NavTab = 'overview' | 'explorer' | 'plu' | 'export' | 'tools';

interface BottomDockProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export function BottomDock({ activeTab, onSelectTab }: BottomDockProps) {
  const tabs: { id: NavTab; label: string; icon: React.ElementType; shortcut?: string }[] = [
    { id: 'overview', label: 'Batch Ingest', icon: HardDriveUpload },
    { id: 'explorer', label: 'Receipt Explorer', icon: Database },
    { id: 'plu', label: 'PLU Inventory', icon: Package },
    { id: 'export', label: 'Export Center', icon: Download },
    { id: 'tools', label: 'Toolbox', icon: Terminal },
  ];

  return (
    <nav className="fixed z-40 transition-all select-none
      /* Mobile: Flush bottom edge full width */
      bottom-0 left-0 right-0 w-full md:w-auto
      /* Desktop: Floating centered pill dock */
      md:bottom-5 md:left-1/2 md:-translate-x-1/2 md:right-auto"
    >
      <div className="
        /* Mobile styling */
        flex items-center justify-around w-full px-2 py-1.5 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800
        /* Desktop styling: Floating glassmorphic dock */
        md:rounded-2xl md:border md:border-slate-700/80 md:bg-slate-900/90 md:p-1.5 md:gap-1.5 md:shadow-2xl md:shadow-black/60
      ">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center justify-center transition-all group relative
                /* Mobile: Vertical icon + tiny text */
                flex-col py-1 px-3 min-w-[56px] rounded-lg
                /* Desktop: Horizontal pill with icon + label */
                md:flex-row md:py-2 md:px-3.5 md:gap-2.5 md:rounded-xl md:min-w-0
                ${
                  isActive
                    ? 'text-sky-400 font-semibold bg-sky-500/15 md:border md:border-sky-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
              <span className="text-[10px] md:text-xs tracking-tight whitespace-nowrap">
                {tab.label}
              </span>

              {/* Active glow dot on desktop */}
              {isActive && (
                <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
