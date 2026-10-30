'use client';

import React from 'react';
import { BatchImportResult } from '@/lib/tauri-bridge';
import {
  CheckCircle2,
  AlertTriangle,
  Database,
  Layers,
  Package,
  ShieldCheck,
  X,
  ArrowRight,
} from 'lucide-react';

interface IngestSummaryModalProps {
  result: BatchImportResult | null;
  onClose: () => void;
  onViewExplorer: () => void;
}

export function IngestSummaryModal({
  result,
  onClose,
  onViewExplorer,
}: IngestSummaryModalProps) {
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                Batch Ingestion Complete
              </h3>
              <p className="text-xs text-slate-400">
                Processed {result.files_processed} file{result.files_processed === 1 ? '' : 's'} with 512-bit collision-proof deduplication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Breakdown Metric Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>FS Receipts Inserted</span>
            </span>
            <p className="text-2xl font-bold font-mono text-emerald-400">
              {result.fs_receipts_inserted}
            </p>
            <p className="text-[11px] text-slate-500">Stored in internal database</p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Duplicates Skipped</span>
            </span>
            <p className="text-2xl font-bold font-mono text-amber-400">
              {result.fs_receipts_duplicates_skipped}
            </p>
            <p className="text-[11px] text-slate-500">Already in database</p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-sky-400" />
              <span>PLU Items Extracted</span>
            </span>
            <p className="text-2xl font-bold font-mono text-sky-400">
              {result.plu_items_inserted}
            </p>
            <p className="text-[11px] text-slate-500">Inventory items indexed</p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Total Raw Blocks</span>
            </span>
            <p className="text-2xl font-bold font-mono text-slate-200">
              {result.total_blocks}
            </p>
            <p className="text-[11px] text-slate-500">Segmented from stream</p>
          </div>
        </div>

        {/* Deduplication Guarantee Note */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs">
          <ShieldCheck className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <span>
            Duplicate Protection: All transactions are verified against existing records to prevent double-counting.
          </span>
        </div>

        {/* Errors if any */}
        {result.errors && result.errors.length > 0 && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-1">
            <p className="font-semibold">Processing Warnings:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {result.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-300 hover:text-slate-100 hover:bg-slate-800 text-sm font-medium transition-colors"
          >
            Close
          </button>
          <button
            onClick={onViewExplorer}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-all shadow-md active:scale-95"
          >
            <span>View in Explorer</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
