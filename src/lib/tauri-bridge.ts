/**
 * Tauri 2.0 TypeScript IPC Middleware & Bridge Layer
 *
 * Provides strongly-typed RPC wrappers around Rust backend commands with
 * full fallback support for standalone browser development and mobile viewports.
 * Dev fixtures are decoupled into `./mocks.ts`.
 */

import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import * as mocks from './mocks';

// ---------------------------------------------------------------------------
// Type Contracts & Data Models
// ---------------------------------------------------------------------------

export interface ToolDescriptor {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
}

export interface BatchImportResult {
  files_processed: number;
  total_blocks: number;
  fs_receipts_inserted: number;
  fs_receipts_duplicates_skipped: number;
  z_reports_inserted: number;
  z_reports_duplicates_skipped?: number;
  other_blocks_inserted?: number;
  other_blocks_duplicates_skipped?: number;
  plu_items_inserted: number;
  plu_items_duplicates_skipped?: number;
  errors: string[];
}

export interface StoredReceiptItem {
  id: number;
  receipt_id: number;
  line_number: number;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  vat: number;
  total_incl_tax: number;
}

export interface StoredReceipt {
  id: number;
  category: string;
  mrc: string;
  fs_no: string | null;
  fs_number: number | null;
  date: string;
  time: string;
  date_iso: string;
  txbl1: number;
  tax1: number;
  total: number;
  item_count: number;
  is_void: boolean;
  hash_primary: string;
  hash_secondary: string;
  imported_at: string;
  items: StoredReceiptItem[];
}

export interface ExportColumnDefinition {
  id: string;
  amharic: string;
  english: string;
  isStandardErca: boolean;
  defaultChecked: boolean;
}

export const EXPORT_COLUMNS: ExportColumnDefinition[] = [
  { id: 'serial', amharic: 'ተ. ቁ.', english: 'Row Serial No.', isStandardErca: true, defaultChecked: true },
  { id: 'item_name', amharic: 'የተሸጠው የእቃ መጠሪያ', english: 'Item Description', isStandardErca: true, defaultChecked: true },
  { id: 'country_of_origin', amharic: 'የሥሪት ሃገር', english: 'Country of Origin', isStandardErca: true, defaultChecked: true },
  { id: 'brand_name', amharic: 'Brand Name', english: 'Brand Name', isStandardErca: true, defaultChecked: true },
  { id: 'unit_of_measure', amharic: 'መለኪያ', english: 'Unit of Measure', isStandardErca: true, defaultChecked: true },
  { id: 'quantity', amharic: 'ብዛት', english: 'Quantity', isStandardErca: true, defaultChecked: true },
  { id: 'avg_purchase_price', amharic: 'የአንዱ አማካይ ግዢ ዋጋ UNIT', english: 'Avg Purchase Price', isStandardErca: true, defaultChecked: true },
  { id: 'unit_price_before_vat', amharic: 'የአንዱ ሽያጭ ዋጋ ከተእታ በፊት', english: 'Unit Selling Price (excl. VAT)', isStandardErca: true, defaultChecked: true },
  { id: 'total_price_before_vat', amharic: 'ጠቅላላ ሽያጭ ዋጋ ከተእታ በፊት', english: 'Total Sales (excl. VAT)', isStandardErca: true, defaultChecked: true },
  { id: 'vat', amharic: 'ተ እ ታ', english: 'VAT (15%)', isStandardErca: true, defaultChecked: true },
  { id: 'total_price_incl_tax', amharic: 'ጠቅላላ ዋጋ ታክስ ጨምሮ', english: 'Grand Total (incl. VAT)', isStandardErca: true, defaultChecked: true },
  { id: 'fs_no', amharic: 'የሽያጭ ደረሰኝ ቁጥር (FS No.)', english: 'Fiscal Receipt Number', isStandardErca: true, defaultChecked: true },
  { id: 'date', amharic: 'ሽያጭ የተከናወነበት ቀን /ወር/', english: 'Date of Sale', isStandardErca: true, defaultChecked: true },
  { id: 'mrc', amharic: 'የሽያጭ መመዝገቢያ መለያ ኮድ /MRC/', english: 'Machine Code (MRC)', isStandardErca: true, defaultChecked: true },
];

export interface ReceiptFilter {
  category?: string | null;
  mrc?: string | null;
  is_void?: boolean | null;
  date_from?: string | null;
  date_to?: string | null;
  fs_min?: number | null;
  fs_max?: number | null;
  search_term?: string | null;
  limit?: number | null;
  offset?: number | null;
}

export interface PluFilter {
  date_from?: string | null;
  date_to?: string | null;
  search_term?: string | null;
  limit?: number | null;
  offset?: number | null;
}

export interface PluItem {
  no: number;
  date: string;
  item: string;
  price: number;
  qty: number;
  amount: number;
  // Raw serde compatibility aliases if serialized as POC keys
  'No.'?: number;
  'Item'?: string;
  'Price'?: number;
  'Qty'?: number;
  'Amount'?: number;
}

export interface DatabaseStats {
  total_receipts: number;
  fs_sales_receipts: number;
  z_reports: number;
  void_receipts: number;
  total_items: number;
  total_plu_items: number;
}

export interface ExportResult {
  fs_rows_exported: number;
  plu_items_exported: number;
  excel_file?: string | null;
  fs_csv_file?: string | null;
  plu_csv_file?: string | null;
}

// ---------------------------------------------------------------------------
// Environment Guard: Tauri vs Standalone Browser
// ---------------------------------------------------------------------------

/**
 * Checks whether the current code is running inside a Tauri webview window.
 * Returns false during SSG build, SSR, or standalone browser preview.
 */
export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ ||
    (window as unknown as { __TAURI__?: unknown }).__TAURI__
  );
}

// ---------------------------------------------------------------------------
// Native File & Folder Dialogs
// ---------------------------------------------------------------------------

/**
 * Opens the native file picker dialog for raw fiscal dump text files.
 * Multi-select is enabled.
 */
export async function pickDumpFiles(): Promise<string[]> {
  if (!isTauri()) {
    console.info('[TauriBridge] Running in browser mode: Simulating native file picker');
    return ['HEK0105410_ET_131224_0624_a.txt'];
  }

  try {
    const selected = await open({
      multiple: true,
      directory: false,
      title: 'Select Fiscal Cash Register Dump Files (*.txt, *.log)',
      filters: [
        {
          name: 'Fiscal Cash Register Dumps',
          extensions: ['txt', 'log', 'dat', '*'],
        },
      ],
    });

    if (!selected) return [];
    if (Array.isArray(selected)) return selected;
    return [selected];
  } catch (err) {
    console.error('[TauriBridge] Native file picker error:', err);
    throw err;
  }
}

/**
 * Opens the native folder picker dialog for export destinations.
 */
export async function pickExportDirectory(): Promise<string | null> {
  if (!isTauri()) {
    console.info('[TauriBridge] Running in browser mode: Simulating folder picker');
    return 'C:/Users/Mama/Documents/Fiscal_Exports';
  }

  try {
    const selected = await open({
      multiple: false,
      directory: true,
      title: 'Select Destination Folder for Fiscal Exports',
    });

    if (!selected) return null;
    return typeof selected === 'string' ? selected : selected[0] ?? null;
  } catch (err) {
    console.error('[TauriBridge] Native folder picker error:', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// IPC Invocation Service Layer
// ---------------------------------------------------------------------------

/**
 * Tool 0: List all modular capabilities registered in the Mama Receipts Toolbox.
 */
export async function fetchTools(): Promise<ToolDescriptor[]> {
  if (!isTauri()) {
    return mocks.MOCK_TOOLS;
  }
  return await invoke<ToolDescriptor[]>('list_tools');
}

/**
 * Tool 1: Batch import multiple raw fiscal dump files into the database.
 * Computes dual 256-bit hashes to strictly prevent duplicates.
 */
export async function importFiles(
  filePaths: string[],
  dbPath?: string
): Promise<BatchImportResult> {
  if (!isTauri()) {
    return mocks.getMockImportResult(filePaths.length);
  }

  return await invoke<BatchImportResult>('parse_and_store_receipts', {
    filePaths,
    dbPath: dbPath || null,
  });
}

/**
 * Tool 2: Query stored receipts with flexible criteria (date, FS range, MRC, search).
 */
export async function queryReceipts(
  filter: ReceiptFilter = {},
  dbPath?: string
): Promise<StoredReceipt[]> {
  if (!isTauri()) {
    return mocks.getMockReceipts(filter);
  }

  return await invoke<StoredReceipt[]>('query_stored_receipts', {
    filter,
    dbPath: dbPath || null,
  });
}

/**
 * Tool 2b: Query stored PLU inventory items.
 */
export async function queryPluItems(
  filter: PluFilter = {},
  dbPath?: string
): Promise<PluItem[]> {
  if (!isTauri()) {
    return mocks.getMockPluItems(filter);
  }

  const raw = await invoke<PluItem[]>('query_stored_plu_items', {
    filter,
    dbPath: dbPath || null,
  });

  return raw.map((item) => ({
    no: item.no ?? (item as unknown as { 'No.': number })['No.'] ?? 0,
    date: item.date ?? '',
    item: item.item ?? (item as unknown as { 'Item': string })['Item'] ?? '',
    price: item.price ?? (item as unknown as { 'Price': number })['Price'] ?? 0,
    qty: item.qty ?? (item as unknown as { 'Qty': number })['Qty'] ?? 0,
    amount: item.amount ?? (item as unknown as { 'Amount': number })['Amount'] ?? 0,
  }));
}

/**
 * Tool 2c: Retrieve database counts and statistics.
 */
export async function getStats(dbPath?: string): Promise<DatabaseStats> {
  if (!isTauri()) {
    return mocks.MOCK_STATS;
  }

  return await invoke<DatabaseStats>('get_database_stats', {
    dbPath: dbPath || null,
  });
}

/**
 * Tool 3: Export stored receipts and PLU items into Excel and CSV.
 */
export async function exportData(
  outDir: string,
  filter?: ReceiptFilter,
  pluFilter?: PluFilter,
  exportExcel = true,
  exportCsv = true,
  selectedColumns?: string[],
  dbPath?: string
): Promise<ExportResult> {
  if (!isTauri()) {
    return mocks.getMockExportResult(outDir);
  }

  return await invoke<ExportResult>('export_stored_receipts', {
    outputDir: outDir,
    receiptFilter: filter || null,
    pluFilter: pluFilter || null,
    exportExcelFormat: exportExcel,
    exportCsvFormat: exportCsv,
    selectedColumns: selectedColumns || null,
    dbPath: dbPath || null,
  });
}
