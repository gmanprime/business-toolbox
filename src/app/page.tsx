'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  fetchTools,
  getStats,
  pickDumpFiles,
  importFiles,
  queryReceipts,
  queryPluItems,
  isTauri,
  ToolDescriptor,
  DatabaseStats,
  StoredReceipt,
  PluItem,
  BatchImportResult,
  ReceiptFilter,
  PluFilter,
} from '@/lib/tauri-bridge';
import { checkDistributionSafeguard, SafeguardStatus } from '@/lib/safeguard';

// Layout Components
import { Header } from '@/components/layout/Header';
import { Sidebar, NavTab } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

// Feature Components
import { StatCard } from '@/components/common/StatCard';
import { BatchDropzone } from '@/components/ingest/BatchDropzone';
import { FileQueueList } from '@/components/ingest/FileQueueList';
import { IngestSummaryModal } from '@/components/ingest/IngestSummaryModal';
import { FilterBar } from '@/components/explorer/FilterBar';
import { ReceiptTable } from '@/components/explorer/ReceiptTable';
import { PluSummaryCards } from '@/components/plu/PluSummaryCards';
import { PluTable } from '@/components/plu/PluTable';
import { ExportDialog } from '@/components/export/ExportDialog';
import { ToolboxView } from '@/components/tools/ToolboxView';

// Icons
import {
  Database,
  Package,
  Ban,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  FileText,
  TrendingUp,
} from 'lucide-react';

export default function Home() {
  const [runningInTauri, setRunningInTauri] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Core Data State
  const [tools, setTools] = useState<ToolDescriptor[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [safeguard, setSafeguard] = useState<SafeguardStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Ingestion Queue State
  const [stagedFiles, setStagedFiles] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<BatchImportResult | null>(null);

  // Receipt Explorer State
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);
  const [receiptFilter, setReceiptFilter] = useState<ReceiptFilter>({});
  const [receiptsLoading, setReceiptsLoading] = useState<boolean>(false);

  // PLU Catalog State
  const [pluItems, setPluItems] = useState<PluItem[]>([]);
  const [pluLoading, setPluLoading] = useState<boolean>(false);

  // Initial Load
  useEffect(() => {
    setRunningInTauri(isTauri());
    loadAllData();
  }, []);

  // Fetch receipts when filter changes or on refresh
  const loadReceipts = useCallback(async (filter: ReceiptFilter) => {
    setReceiptsLoading(true);
    try {
      const data = await queryReceipts(filter);
      setReceipts(data);
    } catch (err) {
      console.error('Error fetching receipts:', err);
    } finally {
      setReceiptsLoading(false);
    }
  }, []);

  // Load all dashboard state
  async function loadAllData() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [fetchedTools, fetchedStats, safeguardInfo, initialReceipts, initialPlu] =
        await Promise.all([
          fetchTools(),
          getStats(),
          checkDistributionSafeguard(),
          queryReceipts({ limit: 50 }),
          queryPluItems(),
        ]);

      setTools(fetchedTools);
      setStats(fetchedStats);
      setSafeguard(safeguardInfo);
      setReceipts(initialReceipts);
      setPluItems(initialPlu);
    } catch (err: unknown) {
      console.error('Dashboard initialization error:', err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  // Handle local dump file picking via native dialog
  async function handlePickLocalFiles() {
    try {
      const files = await pickDumpFiles();
      if (files && files.length > 0) {
        setStagedFiles((prev) => {
          const combined = [...prev];
          for (const f of files) {
            if (!combined.includes(f)) combined.push(f);
          }
          return combined;
        });
      }
    } catch (err: unknown) {
      console.error('Error selecting dump files:', err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  }

  // Add files dropped into dropzone
  function handleFilesDropped(files: string[]) {
    setStagedFiles((prev) => {
      const combined = [...prev];
      for (const f of files) {
        if (!combined.includes(f)) combined.push(f);
      }
      return combined;
    });
  }

  // Remove single file from queue
  function handleRemoveFile(index: number) {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // Clear staged queue
  function handleClearQueue() {
    setStagedFiles([]);
  }

  // Execute batch ingestion with 512-bit deduplication
  async function handleProcessBatch() {
    if (stagedFiles.length === 0) return;
    setIsImporting(true);
    setErrorMsg(null);
    try {
      const res = await importFiles(stagedFiles);
      setImportResult(res);
      setStagedFiles([]);

      // Refresh stats & receipts
      const [newStats, newReceipts, newPlu] = await Promise.all([
        getStats(),
        queryReceipts(receiptFilter),
        queryPluItems(),
      ]);
      setStats(newStats);
      setReceipts(newReceipts);
      setPluItems(newPlu);
    } catch (err: unknown) {
      console.error('Batch import failed:', err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsImporting(false);
    }
  }

  // Update receipt filter and re-fetch
  function handleFilterChange(newFilter: ReceiptFilter) {
    setReceiptFilter(newFilter);
    loadReceipts(newFilter);
  }

  // Reset receipt filters
  function handleResetFilters() {
    const emptyFilter = {};
    setReceiptFilter(emptyFilter);
    loadReceipts(emptyFilter);
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Application Header */}
      <Header
        stats={stats}
        safeguard={safeguard}
        isTauriEnv={runningInTauri}
        onRefresh={loadAllData}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Desktop Collapsible Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Dynamic Content Body */}
        <main className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 space-y-6">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-rose-400 hover:text-rose-200 text-xs font-semibold px-2 py-1 rounded hover:bg-rose-500/20"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* TAB 1: BATCH INGEST & OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Fiscal Sales (FS)"
                  value={stats ? stats.fs_sales_receipts : '—'}
                  subtitle="Consecutive sales receipts"
                  icon={Database}
                  variant="emerald"
                />
                <StatCard
                  label="PLU Inventory Items"
                  value={stats ? stats.total_plu_items : '—'}
                  subtitle="X-Report items tracked"
                  icon={Package}
                  variant="sky"
                />
                <StatCard
                  label="Preserved Voids"
                  value={stats ? stats.void_receipts : '—'}
                  subtitle="Audited cancelled transactions"
                  icon={Ban}
                  variant="rose"
                />
                <StatCard
                  label="Duplicate Protection"
                  value="Active"
                  subtitle="Prevents repeated transactions"
                  icon={ShieldCheck}
                  variant="amber"
                />
              </div>

              {/* Ingestion Zone */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-100">
                    Serial Dump Ingestion
                  </h2>
                  <p className="text-xs text-slate-400">
                    Extract, reconstruct multi-item receipts, and index cumulative inventory from HEK0105410 cash registers.
                  </p>
                </div>

                <BatchDropzone
                  onFilesSelected={handleFilesDropped}
                  onPickLocal={handlePickLocalFiles}
                  isProcessing={isImporting}
                />

                <FileQueueList
                  files={stagedFiles}
                  onRemoveFile={handleRemoveFile}
                  onClearAll={handleClearQueue}
                  onProcessBatch={handleProcessBatch}
                  isProcessing={isImporting}
                />
              </div>

              {/* Quick Preview of Recent Receipts */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200">
                    Recent Ingested Transactions
                  </h3>
                  <button
                    onClick={() => setActiveTab('explorer')}
                    className="text-xs text-sky-400 hover:text-sky-300 font-medium"
                  >
                    View All in Explorer &rarr;
                  </button>
                </div>
                <ReceiptTable receipts={receipts.slice(0, 5)} isLoading={loading} />
              </div>
            </div>
          )}

          {/* TAB 2: RECEIPT EXPLORER */}
          {activeTab === 'explorer' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  Fiscal Sales Receipts Explorer
                </h2>
                <p className="text-xs text-slate-400">
                  14-column ERCA compliant fiscal sales records with expandable multi-item drawers.
                </p>
              </div>

              <FilterBar
                filter={receiptFilter}
                onChangeFilter={handleFilterChange}
                onReset={handleResetFilters}
              />

              <ReceiptTable receipts={receipts} isLoading={receiptsLoading} />
            </div>
          )}

          {/* TAB 3: PLU INVENTORY */}
          {activeTab === 'plu' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  Cumulative PLU Inventory Catalog
                </h2>
                <p className="text-xs text-slate-400">
                  Extracted from <code className="text-sky-400 font-mono">*** PLU REPORT X ***</code> with decoupled price/tax groups.
                </p>
              </div>

              <PluSummaryCards items={pluItems} />

              <PluTable items={pluItems} isLoading={pluLoading} />
            </div>
          )}

          {/* TAB 4: EXPORT CENTER */}
          {activeTab === 'export' && (
            <div className="py-4">
              <ExportDialog
                currentFilter={receiptFilter}
                currentPluFilter={{}}
                totalReceiptsCount={stats?.total_receipts || receipts.length}
                totalPluCount={stats?.total_plu_items || pluItems.length}
              />
            </div>
          )}

          {/* TAB 5: TOOLBOX REGISTRY */}
          {activeTab === 'tools' && (
            <div className="py-2">
              <ToolboxView tools={tools} />
            </div>
          )}
        </main>
      </div>

      {/* Mobile Navigation Bar */}
      <MobileNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Post-Ingest Deduplication Feedback Modal */}
      {importResult && (
        <IngestSummaryModal
          result={importResult}
          onClose={() => setImportResult(null)}
          onViewExplorer={() => {
            setImportResult(null);
            setActiveTab('explorer');
          }}
        />
      )}
    </div>
  );
}
