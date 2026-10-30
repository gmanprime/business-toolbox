'use client';

import React from 'react';
import { NavTab } from './Sidebar';
import {
  HardDriveUpload,
  Database,
  Package,
  Download,
  Terminal,
} from 'lucide-react';

interface MobileNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export function MobileNav({ activeTab, onSelectTab }: MobileNavProps) {
  const tabs: { id: NavTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Ingest', icon: HardDriveUpload },
    { id: 'explorer', label: 'Explorer', icon: Database },
    { id: 'plu', label: 'PLU', icon: Package },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'tools', label: 'Toolbox', icon: Terminal },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-slate-800 bg-slate-950/95 backdrop-blur-lg px-2 py-1 safe-area-bottom">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg min-w-[60px] min-h-[44px] transition-colors ${
                isActive ? 'text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
