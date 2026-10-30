'use client';

import React, { useState } from 'react';
import { StoredReceipt } from '@/lib/tauri-bridge';
import { Badge } from '@/components/common/Badge';
import { ReceiptDrawer } from './ReceiptDrawer';
import {
  ChevronDown,
  ChevronRight,
  Database,
  ChevronsLeft,
  ChevronLeft,
  ChevronsRight,
} from 'lucide-react';

interface ReceiptTableProps {
  receipts: StoredReceipt[];
  isLoading?: boolean;
}

export function ReceiptTable({ receipts, isLoading = false }: ReceiptTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const totalPages = Math.max(1, Math.ceil(receipts.length / pageSize));
  const paginatedReceipts = receipts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {/* Table Container */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] sm:text-xs uppercase tracking-wider border-b border-slate-800 sticky top-0 z-10">
            <tr>
              <th className="py-3 px-3 w-10 text-center"></th>
              <th className="py-3 px-3">FS No.</th>
              <th className="py-3 px-3">Date & Time</th>
              <th className="py-3 px-3 text-center">Items</th>
              <th className="py-3 px-3 text-right">Taxable (excl. VAT)</th>
              <th className="py-3 px-3 text-right">VAT (15%)</th>
              <th className="py-3 px-3 text-right">Total (ETB)</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3 hidden md:table-cell">Machine (MRC)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                  Loading receipts from database...
                </td>
              </tr>
            ) : receipts.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                  No receipts match the current filter criteria.
                </td>
              </tr>
            ) : (
              paginatedReceipts.map((receipt) => {
                const isExpanded = expandedId === receipt.id;
                return (
                  <React.Fragment key={receipt.id}>
                    <tr
                      onClick={() => toggleExpand(receipt.id)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                        isExpanded ? 'bg-slate-800/30' : ''
                      } ${receipt.is_void ? 'opacity-70 bg-rose-950/10' : ''}`}
                    >
                      <td className="py-3 px-3 text-center text-slate-500">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-sky-400 mx-auto" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-100">
                        {receipt.fs_no ? (
                          <span className="text-sky-400">FS {receipt.fs_no}</span>
                        ) : (
                          <span className="text-slate-500">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {receipt.date} <span className="text-slate-500">{receipt.time}</span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-300">
                        {receipt.item_count}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        {receipt.txbl1.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-400/90">
                        {receipt.tax1.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-100">
                        {receipt.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        {receipt.is_void ? (
                          <Badge variant="danger" size="sm">
                            VOID
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            VALID
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400 hidden md:table-cell text-xs">
                        {receipt.mrc}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="p-0">
                          <ReceiptDrawer receipt={receipt} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
        <div>
          Showing{' '}
          <span className="font-mono text-slate-200">
            {receipts.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </span>{' '}
          to{' '}
          <span className="font-mono text-slate-200">
            {Math.min(currentPage * pageSize, receipts.length)}
          </span>{' '}
          of <span className="font-mono text-slate-200">{receipts.length}</span> receipts
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 transition-colors"
            title="First Page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 font-mono text-slate-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 transition-colors"
            title="Last Page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
