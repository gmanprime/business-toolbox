'use client';

import React from 'react';
import { FileText, Trash2, ArrowRight, Loader2, X } from 'lucide-react';

interface FileQueueListProps {
  files: string[];
  onRemoveFile: (index: number) => void;
  onClearAll: () => void;
  onProcessBatch: () => void;
  isProcessing: boolean;
}

export function FileQueueList({
  files,
  onRemoveFile,
  onClearAll,
  onProcessBatch,
  isProcessing,
}: FileQueueListProps) {
  if (files.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200 text-sm">
            Staged Dump Files
          </span>
          <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 text-xs font-mono font-medium">
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </span>
        </div>
        <button
          onClick={onClearAll}
          disabled={isProcessing}
          className="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {files.map((file, index) => {
          const fileName = file.split(/[/\\]/).pop() || file;
          return (
            <div
              key={`${file}-${index}`}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
                  <FileText className="w-4 h-4 text-sky-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-mono text-slate-200 truncate font-medium">
                    {fileName}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{file}</p>
                </div>
              </div>
              <button
                onClick={() => onRemoveFile(index)}
                disabled={isProcessing}
                className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                title="Remove from queue"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={onProcessBatch}
          disabled={isProcessing}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-md active:scale-95"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Deduplicating & Ingesting...</span>
            </>
          ) : (
            <>
              <span>Process Batch & Ingest to Database</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
