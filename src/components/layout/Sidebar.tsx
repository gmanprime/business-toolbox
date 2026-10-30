'use client';

import React from 'react';
import {
  FileText,
  Database,
  Package,
  Download,
  Terminal,
  ChevronLeft,
  ChevronRight,
  HardDriveUpload,
} from 'lucide-react';

export type NavTab = 'overview' | 'explorer' | 'plu' | 'export' | 'tools';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const navItems: { id: NavTab; label: string; icon: React.ElementType; description: string }[] = [
    {
      id: 'overview',
      label: 'Batch Ingest',
      icon: HardDriveUpload,
      description: 'Ingest and deduplicate dumps',
    },
    {
      id: 'explorer',
      label: 'Receipt Explorer',
      icon: Database,
      description: '14-column ERCA sales grid',
    },
    {
      id: 'plu',
      label: 'PLU Inventory',
      icon: Package,
      description: 'Cumulative X-reports',
    },
    {
      id: 'export',
      label: 'Export Center',
      icon: Download,
      description: 'Excel & CSV generation',
    },
    {
      id: 'tools',
      label: 'Toolbox Registry',
      icon: Terminal,
      description: 'Active Rust engine tools',
    },
  ];

  return (
    <aside
      className={`hidden lg:flex flex-col flex-shrink-0 h-full border-r border-slate-800 bg-slate-950 transition-all duration-300 relative select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-left transition-all group ${
                isActive
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-400'
                    : 'text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate leading-tight">
                    {item.label}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate mt-0.5">
                    {item.description}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse/Expand Toggle Button */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium">
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
