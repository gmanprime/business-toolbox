'use client';

import React from 'react';
import { StoredReceipt } from '@/lib/tauri-bridge';
import { Badge } from '@/components/common/Badge';

interface ReceiptDrawerProps {
  receipt: StoredReceipt;
}

export function ReceiptDrawer({ receipt }: ReceiptDrawerProps) {
  return (
    <div className="bg-slate-950/80 p-4 border-y border-slate-800/80 space-y-3 animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200">
            Receipt Items ({receipt.items.length})
          </span>
          <span className="font-mono text-slate-500">
            Machine: {receipt.mrc}
          </span>
          <span className="font-mono text-slate-500">
            Imported: {new Date(receipt.imported_at).toLocaleString()}
          </span>
        </div>
        <div className="font-mono text-[11px] text-slate-500 truncate max-w-xs">
          Hash: {receipt.hash_primary.substring(0, 16)}...
        </div>
      </div>

      {receipt.items.length === 0 ? (
        <div className="py-4 text-center text-xs text-slate-500 italic">
          {receipt.is_void
            ? 'No line items recorded (Void transaction ITEM# 0 preserved with zeroed balances).'
            : 'No line items associated with this record.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2 px-3 w-10">#</th>
                <th className="py-2 px-3">Item Description</th>
                <th className="py-2 px-3 text-right">Qty</th>
                <th className="py-2 px-3 text-right">Unit Price (excl. VAT)</th>
                <th className="py-2 px-3 text-right">Total (excl. VAT)</th>
                <th className="py-2 px-3 text-right">VAT (15%)</th>
                <th className="py-2 px-3 text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {receipt.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/50">
                  <td className="py-2 px-3 text-slate-500">{item.line_number}</td>
                  <td className="py-2 px-3 text-slate-100 font-sans font-medium">
                    {item.item_name}
                  </td>
                  <td className="py-2 px-3 text-right">{item.quantity.toFixed(1)}</td>
                  <td className="py-2 px-3 text-right">{item.unit_price.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right">{item.total_price.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right text-emerald-400/90">
                    {item.vat.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-100">
                    {item.total_incl_tax.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 font-mono text-xs border-t border-slate-800 font-semibold text-slate-200">
              <tr>
                <td colSpan={4} className="py-2 px-3 text-right text-slate-400">
                  Receipt Aggregates:
                </td>
                <td className="py-2 px-3 text-right">{receipt.txbl1.toFixed(2)}</td>
                <td className="py-2 px-3 text-right text-emerald-400">
                  {receipt.tax1.toFixed(2)}
                </td>
                <td className="py-2 px-3 text-right text-emerald-400 font-bold">
                  {receipt.total.toFixed(2)} ETB
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
