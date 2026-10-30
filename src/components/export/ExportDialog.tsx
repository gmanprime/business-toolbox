'use client';

import React, { useState } from 'react';
import {
  pickExportDirectory,
  exportData,
  ExportResult,
  ReceiptFilter,
  PluFilter,
  EXPORT_COLUMNS,
  ExportColumnDefinition,
} from '@/lib/tauri-bridge';
import {
  FolderOpen,
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDrive,
  ChevronDown,
  ChevronUp,
  Settings2,
  RotateCcw,
  CheckSquare,
} from 'lucide-react';
import { Badge } from '@/components/common/Badge';

interface ExportDialogProps {
  currentFilter?: ReceiptFilter;
  currentPluFilter?: PluFilter;
  totalReceiptsCount: number;
  totalPluCount: number;
}

export function ExportDialog({
  currentFilter,
  currentPluFilter,
  totalReceiptsCount,
  totalPluCount,
}: ExportDialogProps) {
  const [outDir, setOutDir] = useState<string>('');
  const [exportExcel, setExportExcel] = useState<boolean>(true);
  const [exportCsv, setExportCsv] = useState<boolean>(true);
  const [useFilter, setUseFilter] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Advanced Column Selection State:
  // Default is all standard ERCA columns checked, and business_date unchecked!
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>(() =>
    EXPORT_COLUMNS.filter((col) => col.defaultChecked).map((col) => col.id)
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);

  const handlePickDirectory = async () => {
    try {
      const selected = await pickExportDirectory();
      if (selected) {
        setOutDir(selected);
      }
    } catch (err: unknown) {
      console.error('Pick directory error:', err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleToggleColumn = (colId: string) => {
    setSelectedColumnIds((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  };

  const handleSelectStandardErca = () => {
    setSelectedColumnIds(
      EXPORT_COLUMNS.filter((col) => col.isStandardErca).map((col) => col.id)
    );
  };

  const handleSelectAll = () => {
    setSelectedColumnIds(EXPORT_COLUMNS.map((col) => col.id));
  };

  const handleClearAll = () => {
    setSelectedColumnIds([]);
  };

  const handleRunExport = async () => {
    if (!outDir.trim()) {
      setErrorMsg('Please specify an export destination directory first.');
      return;
    }
    if (!exportExcel && !exportCsv) {
      setErrorMsg('Please select at least one export format (Excel or CSV).');
      return;
    }
    if (selectedColumnIds.length === 0) {
      setErrorMsg('Please select at least one column to export.');
      return;
    }

    setIsExporting(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const filterToUse = useFilter ? currentFilter : undefined;
      const pluFilterToUse = useFilter ? currentPluFilter : undefined;
      const res = await exportData(
        outDir,
        filterToUse,
        pluFilterToUse,
        exportExcel,
        exportCsv,
        selectedColumnIds
      );
      setResult(res);
    } catch (err: unknown) {
      console.error('Export error:', err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm max-w-3xl mx-auto">
      {/* Title */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
          <Download className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">
            Fiscal Report Export Center
          </h2>
          <p className="text-xs text-slate-400">
            Generate Ethiopian ERCA standard multi-sheet Excel (.xlsx) and UTF-8 CSV exports.
          </p>
        </div>
      </div>

      {/* Directory Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <HardDrive className="w-4 h-4 text-sky-400" />
          <span>Output Destination Directory</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. C:/Users/Admin/Documents/Fiscal_Exports"
            value={outDir}
            onChange={(e) => setOutDir(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
          />
          <button
            type="button"
            onClick={handlePickDirectory}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium transition-colors border border-slate-700"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Browse...</span>
          </button>
        </div>
      </div>

      {/* Format Selection */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-300">
          Export File Formats
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={exportExcel}
              onChange={(e) => setExportExcel(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-sky-500 focus:ring-sky-500 bg-slate-900"
            />
            <div className="space-y-1">
              <span className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Multi-Sheet Excel (.xlsx)</span>
              </span>
              <p className="text-[11px] text-slate-500">
                Sheet 1: Sales Receipts (FS), Sheet 2: X Reports (PLU) with formatting & formulas.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={exportCsv}
              onChange={(e) => setExportCsv(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-sky-500 focus:ring-sky-500 bg-slate-900"
            />
            <div className="space-y-1">
              <span className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Standalone UTF-8 BOM CSVs</span>
              </span>
              <p className="text-[11px] text-slate-500">
                Generates <code className="text-sky-400 font-mono">sales_receipts_fs.csv</code> and{' '}
                <code className="text-sky-400 font-mono">plu_report_x.csv</code>.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Scope Selection */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-300">
          Export Scope & Records
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex-1 flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
            <input
              type="radio"
              name="scope"
              checked={!useFilter}
              onChange={() => setUseFilter(false)}
              className="text-sky-500 focus:ring-sky-500 bg-slate-900 border-slate-700"
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-200 block">
                All Database Records
              </span>
              <span className="text-slate-500 text-[11px]">
                {totalReceiptsCount} receipts, {totalPluCount} PLU inventory items
              </span>
            </div>
          </label>

          <label className="flex-1 flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
            <input
              type="radio"
              name="scope"
              checked={useFilter}
              onChange={() => setUseFilter(true)}
              className="text-sky-500 focus:ring-sky-500 bg-slate-900 border-slate-700"
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-200 block">
                Active Filtered Subset
              </span>
              <span className="text-slate-500 text-[11px]">
                Export currently matched date range & search results
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Advanced Dropdown: Column Customization (Amharic & English) */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="w-full flex items-center justify-between p-3.5 text-left hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-sky-400" />
            <span className="text-xs sm:text-sm font-semibold text-slate-200">
              Advanced Column Selection (Bilingual Amharic / English)
            </span>
            <Badge variant="info" size="sm">
              {selectedColumnIds.length} of {EXPORT_COLUMNS.length} Fields
            </Badge>
          </div>
          {isAdvancedOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isAdvancedOpen && (
          <div className="p-4 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-150">
            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/60 text-xs">
              <span className="text-slate-400">
                Choose fields to export. Defaults to the official 14 ERCA columns.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectStandardErca}
                  className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Standard ERCA Default (14)</span>
                </button>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-slate-100 transition-colors"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Checkboxes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {EXPORT_COLUMNS.map((col) => {
                const isChecked = selectedColumnIds.includes(col.id);
                return (
                  <label
                    key={col.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      isChecked
                        ? 'bg-slate-900 border-sky-500/30'
                        : 'bg-slate-950/60 border-slate-800/80 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleColumn(col.id)}
                      className="mt-1 rounded border-slate-700 text-sky-500 focus:ring-sky-500 bg-slate-900"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-100 truncate">
                          {col.amharic}
                        </span>
                        {col.isStandardErca ? (
                          <span className="text-[10px] text-slate-500 uppercase font-mono">
                            ERCA
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400 uppercase font-mono font-semibold">
                            Internal
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {col.english}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Fiscal Export Successfully Generated</span>
          </div>
          <div className="text-xs text-slate-300 space-y-1 font-mono">
            <p>
              • Exported {result.fs_rows_exported} itemized sales rows ({selectedColumnIds.length} columns) and{' '}
              {result.plu_items_exported} PLU inventory rows.
            </p>
            {result.excel_file && <p>• Excel: {result.excel_file}</p>}
            {result.fs_csv_file && <p>• Sales CSV: {result.fs_csv_file}</p>}
            {result.plu_csv_file && <p>• PLU CSV: {result.plu_csv_file}</p>}
          </div>
        </div>
      )}

      {/* Action Trigger */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleRunExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-md active:scale-95"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Fiscal Reports...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Generate Export Files</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
