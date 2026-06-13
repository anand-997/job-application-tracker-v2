'use client';

import { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';
import type { JobApplication, StatusValue } from '@/types';
import { STATUS_LABELS } from '@/lib/constants';
import {
  computeKpis, statusDistribution, sourceDistribution, workModeDistribution,
  jobTypeDistribution, timelineSeries, salaryHistogram, activityHeatmap,
  funnelData, summaryStats,
} from '@/lib/analytics';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

export function AnalyticsDashboard({ apps }: { apps: JobApplication[] }) {
  const { t, lang } = useT();
  const [range, setRange] = useState<number | 'all'>(30);

  const statusLabel = (s: StatusValue) => (lang === 'hi' ? STATUS_LABELS[s].hi : STATUS_LABELS[s].en);
  const wmLabel = (k: string) => t(`workMode.${k}`);
  const jtLabel = (k: string) => t(`jobType.${k}`);

  const kpis = useMemo(() => computeKpis(apps), [apps]);
  const statusDist = useMemo(() => statusDistribution(apps, statusLabel), [apps, lang]);
  const sourceDist = useMemo(() => sourceDistribution(apps), [apps]);
  const wmDist = useMemo(() => workModeDistribution(apps, wmLabel), [apps, lang]);
  const jtDist = useMemo(() => jobTypeDistribution(apps, jtLabel), [apps, lang]);
  const timeline = useMemo(() => timelineSeries(apps, range), [apps, range]);
  const salary = useMemo(() => salaryHistogram(apps), [apps]);
  const heat = useMemo(() => activityHeatmap(apps), [apps]);
  const funnel = useMemo(() => funnelData(apps, statusLabel), [apps, lang]);
  const summary = useMemo(() => summaryStats(apps), [apps]);

  if (apps.length === 0) {
    return <div className="flex h-full items-center justify-center text-text-muted">{t('analytics.noData')}</div>;
  }

  return (
    <div className="scroll-thin h-full overflow-y-auto px-4 pb-8">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 py-2 sm:grid-cols-4 lg:grid-cols-7">
        <Kpi label={t('kpi.total')} value={kpis.total} />
        <Kpi label={t('kpi.active')} value={kpis.active} accent="#6366F1" />
        <Kpi label={t('kpi.interviewing')} value={kpis.interviewing} accent="#EC4899" />
        <Kpi label={t('kpi.offers')} value={kpis.offers} accent="#10B981" />
        <Kpi label={t('kpi.accepted')} value={kpis.accepted} accent="#22C55E" />
        <Kpi label={t('kpi.avgResponse')} value={`${kpis.avgResponseDays}d`} />
        <Kpi label={t('kpi.ghostRate')} value={`${kpis.ghostRatePct}%`} accent="#374151" />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Status donut */}
        <Card title={t('analytics.byStatus')}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {statusDist.map((d) => <Cell key={d.key} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <Legend items={statusDist} />
        </Card>

        {/* Timeline */}
        <Card
          title={t('analytics.overTime')}
          right={
            <div className="flex gap-1">
              {([7, 30, 60, 90, 'all'] as const).map((r) => (
                <button key={String(r)} onClick={() => setRange(r)}
                  className={cn('rounded-md px-2 py-0.5 text-[11px]', range === r ? 'bg-accent text-white' : 'text-text-muted hover:bg-bg-hover')}>
                  {r === 'all' ? t('analytics.rangeAll') : t(`analytics.range${r}` as 'analytics.range7')}
                </button>
              ))}
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="tl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(d) => d.slice(5)} minTickGap={24} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={24} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2} fill="url(#tl)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Source bar */}
        <Card title={t('analytics.sourceEffectiveness')}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sourceDist} layout="vertical" margin={{ left: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={80} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--bg-hover)' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {sourceDist.map((d) => <Cell key={d.key} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Funnel */}
        <Card title={t('analytics.funnel')}>
          <div className="space-y-2 py-2">
            {funnel.map((f, i) => {
              const pct = funnel[0].value ? Math.round((f.value / funnel[0].value) * 100) : 0;
              return (
                <div key={f.name}>
                  <div className="mb-0.5 flex justify-between text-xs">
                    <span className="text-text-secondary">{f.name}</span>
                    <span className="font-mono text-text-muted">{f.value} · {pct}%</span>
                  </div>
                  <div className="h-6 overflow-hidden rounded-md bg-bg-hover">
                    <div className="flex h-full items-center rounded-md px-2 text-[10px] font-semibold text-white transition-all"
                      style={{ width: `${Math.max(pct, 4)}%`, background: f.color }}>
                      {i === 0 ? '' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Work mode + job type pies */}
        <Card title={t('analytics.workModeSplit')}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={wmDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}>
                {wmDist.map((d) => <Cell key={d.key} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <Legend items={wmDist} />
        </Card>

        <Card title={t('analytics.jobTypeSplit')}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={jtDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}>
                {jtDist.map((d) => <Cell key={d.key} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <Legend items={jtDist} />
        </Card>

        {/* Salary histogram */}
        {salary.length > 0 && (
          <Card title={t('analytics.salaryDistribution')}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={salary}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={24} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--bg-hover)' }} />
                <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Summary */}
        <Card title={t('analytics.summary')}>
          <div className="grid grid-cols-2 gap-3 py-2">
            <Stat label={t('analytics.mostActiveDay')} value={summary.mostActiveDay} />
            <Stat label={t('analytics.mostUsedSource')} value={summary.mostUsedSource} />
            <Stat label={t('analytics.commonRejectionStage')} value={summary.commonRejectionStage === '—' ? '—' : statusLabel(summary.commonRejectionStage as StatusValue)} />
            <Stat label={t('analytics.longestActive')} value={t('analytics.days', { n: summary.longestActiveDays })} />
          </div>
        </Card>
      </div>

      {/* Activity heatmap (full width) */}
      <Card title={t('analytics.activityHeatmap')} className="mt-3">
        <Heatmap grid={heat} />
      </Card>
    </div>
  );
}

const tooltipStyle = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--text-primary)',
};

function Kpi({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-xl border border-border surface-card p-3">
      <div className="font-display text-2xl font-bold" style={{ color: accent ?? 'var(--text-primary)' }}>{value}</div>
      <div className="mt-0.5 text-[11px] text-text-muted">{label}</div>
    </div>
  );
}

function Card({ title, children, right, className }: { title: string; children: React.ReactNode; right?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border surface-card p-4', className)}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

function Legend({ items }: { items: { name: string; color: string; value: number; key: string }[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
      {items.map((d) => (
        <span key={d.key} className="inline-flex items-center gap-1.5 text-[11px] text-text-secondary">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />{d.name} ({d.value})
        </span>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-bg-hover px-3 py-2">
      <div className="text-[11px] text-text-muted">{label}</div>
      <div className="text-sm font-semibold text-text-primary">{value}</div>
    </div>
  );
}

function Heatmap({ grid }: { grid: { date: string; count: number }[][] }) {
  const max = Math.max(1, ...grid.flat().map((c) => c.count));
  const color = (count: number) => {
    if (count === 0) return 'var(--bg-hover)';
    const intensity = count / max;
    if (intensity > 0.66) return '#22C55E';
    if (intensity > 0.33) return '#16A34A';
    return '#15803D';
  };
  return (
    <div className="scroll-thin overflow-x-auto py-2">
      <div className="flex gap-1">
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date}: ${cell.count}`}
                className="h-3 w-3 rounded-[3px]"
                style={{ background: color(cell.count) }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
