'use client';

import React, { useState } from 'react';
import { PluItem } from '@/lib/tauri-bridge';
import { Search, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

interface PluTableProps {
  items: PluItem[];
  isLoading?: boolean;
}

export function PluTable({ items, isLoading = false }: PluTableProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  const filteredItems = items.filter((item) =>
    item.item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col space-y-4 p-4">
      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search PLU item name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono">
          {filteredItems.length} items
        </span>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] sm:text-xs uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-3 w-16">No.</th>
              <th className="py-3 px-3">Item Description</th>
              <th className="py-3 px-3 text-right">Base Catalog Price</th>
              <th className="py-3 px-3 text-right">Cumulative Qty</th>
              <th className="py-3 px-3 text-right">Realized Revenue</th>
              <th className="py-3 px-3 text-right">Realized Unit Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                  Loading PLU inventory catalog...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                  No PLU items found.
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const effectivePrice =
                  item.qty > 0 ? (item.amount / item.qty).toFixed(2) : item.price.toFixed(2);
                return (
                  <tr key={item.no} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500">{item.no}</td>
                    <td className="py-2.5 px-3 text-slate-100 font-sans font-medium">
                      {item.item}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {item.price.toFixed(2)} ETB
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300 font-semibold">
                      {item.qty.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                      {item.amount.toFixed(2)} ETB
                    </td>
                    <td className="py-2.5 px-3 text-right text-sky-400/90 text-xs">
                      {effectivePrice} ETB
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
        <div>
          Showing{' '}
          <span className="font-mono text-slate-200">
            {filteredItems.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </span>{' '}
          to{' '}
          <span className="font-mono text-slate-200">
            {Math.min(currentPage * pageSize, filteredItems.length)}
          </span>{' '}
          of <span className="font-mono text-slate-200">{filteredItems.length}</span> items
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 transition-colors"
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
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
