/**
 * Development & Browser Preview Mocks
 *
 * Isolated fixtures used strictly when running in standalone browser mode
 * during local development (`NODE_ENV !== 'production'`).
 * Gated and tree-shaken from production static exports.
 */

import {
  ToolDescriptor,
  DatabaseStats,
  StoredReceipt,
  PluItem,
  BatchImportResult,
  ExportResult,
  ReceiptFilter,
  PluFilter,
} from './tauri-bridge';

export const MOCK_TOOLS: ToolDescriptor[] = [
  {
    id: 'batch_receipt_parser',
    name: 'Fiscal Batch Log Parser',
    description: 'Ingest and parse raw fiscal cash register dumps containing multiple receipts with 512-bit collision-proof deduplication.',
    category: 'Ingestion & Parsing',
    version: '1.0.0',
  },
  {
    id: 'receipt_database_query',
    name: 'Receipt Database & Explorer',
    description: 'Search, filter, and inspect stored receipts across date ranges, FS sequential numbers, machine codes (MRC), and item names.',
    category: 'Data Management',
    version: '1.0.0',
  },
  {
    id: 'fiscal_exporter',
    name: 'Fiscal Report Exporter',
    description: 'Export stored or filtered receipts into styled multi-sheet Excel (.xlsx) workbooks and UTF-8 CSV files with full Ethiopian ERCA 14-column compliance.',
    category: 'Reporting & Export',
    version: '1.0.0',
  },
];

export const MOCK_STATS: DatabaseStats = {
  total_receipts: 426,
  fs_sales_receipts: 404,
  z_reports: 0,
  void_receipts: 22,
  total_items: 461,
  total_plu_items: 112,
};

export const MOCK_RECEIPTS: StoredReceipt[] = [
  {
    id: 1,
    category: 'Fs',
    mrc: 'HEK0105410',
    fs_no: '00000001',
    fs_number: 1,
    date: '19/03/2024',
    time: '08:30:15',
    date_iso: '2024-03-19',
    txbl1: 391.30,
    tax1: 58.70,
    total: 450.00,
    item_count: 2,
    is_void: false,
    hash_primary: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    hash_secondary: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
    imported_at: '2024-03-19T08:30:15Z',
    items: [
      {
        id: 1,
        receipt_id: 1,
        line_number: 1,
        item_name: 'Hook big Golden 144/',
        quantity: 2.0,
        unit_price: 150.0,
        total_price: 260.87,
        vat: 39.13,
        total_incl_tax: 300.0,
      },
      {
        id: 2,
        receipt_id: 1,
        line_number: 2,
        item_name: 'Electirc wire ilslc',
        quantity: 1.0,
        unit_price: 150.0,
        total_price: 130.43,
        vat: 19.57,
        total_incl_tax: 150.0,
      },
    ],
  },
  {
    id: 2,
    category: 'Fs',
    mrc: 'HEK0105410',
    fs_no: '00000002',
    fs_number: 2,
    date: '19/03/2024',
    time: '08:35:00',
    date_iso: '2024-03-19',
    txbl1: 0.0,
    tax1: 0.0,
    total: 0.0,
    item_count: 0,
    is_void: true,
    hash_primary: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    hash_secondary: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    imported_at: '2024-03-19T08:35:00Z',
    items: [],
  },
  {
    id: 3,
    category: 'Fs',
    mrc: 'HEK0105410',
    fs_no: '00000003',
    fs_number: 3,
    date: '19/03/2024',
    time: '09:12:44',
    date_iso: '2024-03-19',
    txbl1: 243.48,
    tax1: 36.52,
    total: 280.00,
    item_count: 1,
    is_void: false,
    hash_primary: '7902699be42c8a8e46fbbb4501726517e86b22c56a189f7625a6da49081b2451',
    hash_secondary: '8c98e2193b2a59f6350ad23ef7cfca8eb2f7166166e4313f8d3c52e42f9e71ec',
    imported_at: '2024-03-19T09:12:44Z',
    items: [
      {
        id: 3,
        receipt_id: 3,
        line_number: 1,
        item_name: 'Swich single gang',
        quantity: 2.0,
        unit_price: 140.0,
        total_price: 243.48,
        vat: 36.52,
        total_incl_tax: 280.0,
      },
    ],
  },
  {
    id: 4,
    category: 'Fs',
    mrc: 'HEK0105410',
    fs_no: '00000004',
    fs_number: 4,
    date: '20/03/2024',
    time: '10:05:12',
    date_iso: '2024-03-20',
    txbl1: 521.74,
    tax1: 78.26,
    total: 600.00,
    item_count: 3,
    is_void: false,
    hash_primary: '11a0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b822',
    hash_secondary: '22b78112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee4833',
    imported_at: '2024-03-20T10:05:12Z',
    items: [
      {
        id: 4,
        receipt_id: 4,
        line_number: 1,
        item_name: 'Pipe PVC 20mm',
        quantity: 5.0,
        unit_price: 60.0,
        total_price: 260.87,
        vat: 39.13,
        total_incl_tax: 300.0,
      },
      {
        id: 5,
        receipt_id: 4,
        line_number: 2,
        item_name: 'Tape insulation black',
        quantity: 3.0,
        unit_price: 50.0,
        total_price: 130.43,
        vat: 19.57,
        total_incl_tax: 150.0,
      },
      {
        id: 6,
        receipt_id: 4,
        line_number: 3,
        item_name: 'Junction box 4-way',
        quantity: 3.0,
        unit_price: 50.0,
        total_price: 130.43,
        vat: 19.57,
        total_incl_tax: 150.0,
      },
    ],
  },
  {
    id: 5,
    category: 'Fs',
    mrc: 'HEK0105410',
    fs_no: '00000005',
    fs_number: 5,
    date: '20/03/2024',
    time: '11:40:02',
    date_iso: '2024-03-20',
    txbl1: 0.0,
    tax1: 0.0,
    total: 0.0,
    item_count: 0,
    is_void: true,
    hash_primary: '33c0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b844',
    hash_secondary: '44d78112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee4855',
    imported_at: '2024-03-20T11:40:02Z',
    items: [],
  },
];

export const MOCK_PLU_ITEMS: PluItem[] = [
  {
    no: 1,
    date: '19/03/2024',
    item: 'Electirc wire ilslc',
    price: 90.0,
    qty: 65.86,
    amount: 1239.28,
  },
  {
    no: 2,
    date: '19/03/2024',
    item: 'Hook big Golden 144/',
    price: 58.0,
    qty: 120.0,
    amount: 6960.0,
  },
  {
    no: 3,
    date: '19/03/2024',
    item: 'Swich single gang',
    price: 140.0,
    qty: 45.0,
    amount: 6300.0,
  },
  {
    no: 4,
    date: '19/03/2024',
    item: 'Pipe PVC 20mm',
    price: 60.0,
    qty: 210.0,
    amount: 12600.0,
  },
  {
    no: 5,
    date: '19/03/2024',
    item: 'Tape insulation black',
    price: 50.0,
    qty: 85.0,
    amount: 4250.0,
  },
  {
    no: 6,
    date: '19/03/2024',
    item: 'Socket double 13A',
    price: 220.0,
    qty: 32.0,
    amount: 7040.0,
  },
];

export function getMockReceipts(filter: ReceiptFilter = {}): StoredReceipt[] {
  let result = [...MOCK_RECEIPTS];
  if (filter.search_term) {
    const term = filter.search_term.toLowerCase();
    result = result.filter(
      (r) =>
        r.mrc.toLowerCase().includes(term) ||
        (r.fs_no && r.fs_no.includes(term)) ||
        r.items.some((i) => i.item_name.toLowerCase().includes(term))
    );
  }
  if (filter.is_void !== undefined && filter.is_void !== null) {
    result = result.filter((r) => r.is_void === filter.is_void);
  }
  if (filter.fs_min !== undefined && filter.fs_min !== null) {
    result = result.filter((r) => (r.fs_number ?? 0) >= filter.fs_min!);
  }
  if (filter.fs_max !== undefined && filter.fs_max !== null) {
    result = result.filter((r) => (r.fs_number ?? 0) <= filter.fs_max!);
  }
  if (filter.date_from) {
    result = result.filter((r) => r.date_iso >= filter.date_from!);
  }
  if (filter.date_to) {
    result = result.filter((r) => r.date_iso <= filter.date_to!);
  }
  if (filter.limit) {
    result = result.slice(0, filter.limit);
  }
  return result;
}

export function getMockPluItems(filter: PluFilter = {}): PluItem[] {
  let result = [...MOCK_PLU_ITEMS];
  if (filter.search_term) {
    const term = filter.search_term.toLowerCase();
    result = result.filter((p) => p.item.toLowerCase().includes(term));
  }
  if (filter.limit) {
    result = result.slice(0, filter.limit);
  }
  return result;
}

export function getMockImportResult(fileCount: number): BatchImportResult {
  return {
    files_processed: fileCount,
    total_blocks: 1150,
    fs_receipts_inserted: 426,
    fs_receipts_duplicates_skipped: 724,
    z_reports_inserted: 0,
    z_reports_duplicates_skipped: 0,
    other_blocks_inserted: 0,
    other_blocks_duplicates_skipped: 0,
    plu_items_inserted: 112,
    plu_items_duplicates_skipped: 0,
    errors: [],
  };
}

export function getMockExportResult(outDir: string): ExportResult {
  return {
    fs_rows_exported: 457,
    plu_items_exported: 112,
    excel_file: `${outDir}/fiscal_sales_output.xlsx`,
    fs_csv_file: `${outDir}/fiscal_sales_output.csv`,
    plu_csv_file: `${outDir}/fiscal_plu_output.csv`,
  };
}
