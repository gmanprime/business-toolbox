'use client';

import React from 'react';
import { PluItem } from '@/lib/tauri-bridge';
import { StatCard } from '@/components/common/StatCard';
import { Package, Hash, Coins, TrendingUp } from 'lucide-react';

interface PluSummaryCardsProps {
  items: PluItem[];
}

export function PluSummaryCards({ items }: PluSummaryCardsProps) {
  const totalUnits = items.reduce((acc, curr) => acc + (curr.qty || 0), 0);
  const totalRevenue = items.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const avgItemPrice =
    totalUnits > 0 ? (totalRevenue / totalUnits).toFixed(2) : '0.00';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        label="Cataloged PLU Items"
        value={items.length}
        subtitle="Unique catalog entries"
        icon={Package}
        variant="sky"
      />
      <StatCard
        label="Cumulative Units Sold"
        value={totalUnits.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        subtitle="Total sales across history"
        icon={Hash}
        variant="slate"
      />
      <StatCard
        label="Total Realized Revenue"
        value={`${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`}
        subtitle={`Effective Avg: ${avgItemPrice} ETB/unit`}
        icon={Coins}
        variant="emerald"
      />
    </div>
  );
}
