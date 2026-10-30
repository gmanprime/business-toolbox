'use client';

import React, { useState } from 'react';
import { UploadCloud, FolderOpen, FileCheck } from 'lucide-react';

interface BatchDropzoneProps {
  onFilesSelected: (files: string[]) => void;
  onPickLocal: () => void;
  isProcessing?: boolean;
}

export function BatchDropzone({
  onFilesSelected,
  onPickLocal,
  isProcessing = false,
}: BatchDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const paths: string[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        // In webview or browser, fallback to file name or path
        const path = (file as unknown as { path?: string }).path || file.name;
        paths.push(path);
      }
      onFilesSelected(paths);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
        isDragOver
          ? 'border-sky-500 bg-sky-500/10 scale-[0.99]'
          : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
      }`}
    >
      <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-4">
        <div
          className={`p-4 rounded-2xl border transition-transform ${
            isDragOver
              ? 'bg-sky-500/20 border-sky-500/40 text-sky-400 scale-110'
              : 'bg-slate-800/80 border-slate-700 text-slate-300'
          }`}
        >
          <UploadCloud className="w-10 h-10" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-semibold text-slate-100">
            Ingest Fiscal Cash Register Dump Files
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Drag and drop serial dump files (<code className="text-sky-400 font-mono">*.txt</code>,{' '}
            <code className="text-sky-400 font-mono">*.log</code>,{' '}
            <code className="text-sky-400 font-mono">*.dat</code>) directly here, or select files
            from your machine.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onPickLocal}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-md active:scale-95"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Browse Files</span>
          </button>
        </div>

        <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5 font-sans">
          <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Automatic duplicate detection enabled</span>
        </div>
      </div>
    </div>
  );
}
