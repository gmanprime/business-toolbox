'use client';

import React from 'react';
import { ReceiptFilter } from '@/lib/tauri-bridge';
import { Search, Filter, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  filter: ReceiptFilter;
  onChangeFilter: (filter: ReceiptFilter) => void;
  onReset: () => void;
}

export function FilterBar({ filter, onChangeFilter, onReset }: FilterBarProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items, MRC, FS..."
            value={filter.search_term || ''}
            onChange={(e) =>
              onChangeFilter({ ...filter, search_term: e.target.value || null })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors font-mono"
          />
        </div>

        {/* Date From */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <label className="text-slate-400 font-medium">From:</label>
          <input
            type="date"
            value={filter.date_from || ''}
            onChange={(e) =>
              onChangeFilter({ ...filter, date_from: e.target.value || null })
            }
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
          />
        </div>

        {/* Date To */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <label className="text-slate-400 font-medium">To:</label>
          <input
            type="date"
            value={filter.date_to || ''}
            onChange={(e) =>
              onChangeFilter({ ...filter, date_to: e.target.value || null })
            }
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
          />
        </div>

        {/* FS Interval Filter */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <label className="text-slate-400 font-medium">FS:</label>
          <input
            type="number"
            placeholder="Min"
            value={filter.fs_min ?? ''}
            onChange={(e) =>
              onChangeFilter({
                ...filter,
                fs_min: e.target.value ? parseInt(e.target.value, 10) : null,
              })
            }
            className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
          />
          <span>–</span>
          <input
            type="number"
            placeholder="Max"
            value={filter.fs_max ?? ''}
            onChange={(e) =>
              onChangeFilter({
                ...filter,
                fs_max: e.target.value ? parseInt(e.target.value, 10) : null,
              })
            }
            className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
          />
        </div>

        {/* Status Toggle */}
        <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => onChangeFilter({ ...filter, is_void: null })}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filter.is_void === null || filter.is_void === undefined
                ? 'bg-slate-800 text-slate-100 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onChangeFilter({ ...filter, is_void: false })}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filter.is_void === false
                ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Valid
          </button>
          <button
            type="button"
            onClick={() => onChangeFilter({ ...filter, is_void: true })}
            className={`px-3 py-1 rounded-lg transition-colors ${
              filter.is_void === true
                ? 'bg-rose-500/20 text-rose-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Void
          </button>
        </div>

        {/* Reset */}
        <button
          type="button"
          onClick={onReset}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors ml-auto"
          title="Reset Filters"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
