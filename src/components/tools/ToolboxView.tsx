'use client';

import React from 'react';
import { ToolDescriptor } from '@/lib/tauri-bridge';
import { Terminal, Shield, Cpu, Layers } from 'lucide-react';
import { Badge } from '@/components/common/Badge';

interface ToolboxViewProps {
  tools: ToolDescriptor[];
}

export function ToolboxView({ tools }: ToolboxViewProps) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-lg font-bold text-slate-100">
          Modular Toolbox Architecture
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Native Rust services registered in <code className="text-sky-400 font-mono">tools::registry</code> with 512-bit dual-hash collision safety.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Terminal className="w-5 h-5" />
              </div>
              <Badge variant="info" size="sm">
                v{tool.version}
              </Badge>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">{tool.name}</h3>
              <span className="text-[11px] text-sky-400 font-mono font-medium">
                {tool.category}
              </span>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {tool.description}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>ID: {tool.id}</span>
              <span className="text-emerald-400">Status: Registered</span>
            </div>
          </div>
        ))}
      </div>

      {/* Architectural Guarantee Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
          <Cpu className="w-4 h-4 text-sky-400" />
          <span>Extensibility & Storage Guarantee</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          The Mama Receipts processing engine utilizes an embedded SQLite engine operating in
          high-performance WAL mode. All transaction ingestion includes automated duplicate detection
          to ensure historical tax records and fiscal sales can be re-imported safely without duplication.
        </p>
      </div>
    </div>
  );
}
