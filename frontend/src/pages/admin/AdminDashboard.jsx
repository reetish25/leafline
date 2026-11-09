import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  AlertTriangle,
  FileCheck,
  Clock,
  Layers,
  Activity,
  RefreshCw,
} from 'lucide-react';

export default function AdminDashboard({ onNavigateToQueue }) {
  const [regionalData, setRegionalData] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [regions, status] = await Promise.all([
        api.admin.getRegionalSeverity(),
        api.admin.getSystemStatus(),
      ]);
      setRegionalData(regions);
      setSystemStatus(status);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Unable to aggregate operational intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return (
          <span className="flex items-center gap-1 text-rust-dark font-mono font-bold text-xs">
            <TrendingUp className="w-3.5 h-3.5 text-rust" /> Escalating
          </span>
        );
      case 'down':
        return (
          <span className="flex items-center gap-1 text-moss-dark font-mono font-bold text-xs">
            <TrendingDown className="w-3.5 h-3.5 text-moss" /> Subsiding
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-ink/60 font-mono font-medium text-xs">
            <Minus className="w-3.5 h-3.5" /> Stable
          </span>
        );
    }
  };

  const getSeverityBadge = (sev) => {
    if (sev >= 60.0) return 'bg-deeprust text-paper';
    if (sev >= 25.0) return 'bg-rust text-paper';
    return 'bg-moss text-paper';
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[11px] font-mono uppercase tracking-widest text-pine font-bold">
          Platform Overview
        </span>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink tracking-tight">
          Operational Intelligence & Regional Severity
        </h1>
        <p className="text-xs text-ink/70 mt-1">
          Real-time agricultural surveillance, foliar infection progression, and platform pipeline throughput.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rust/10 border border-rust/30 text-rust-dark flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rust" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="text-xs font-bold text-rust hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* KPI Highlight Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="leaf-card p-5 space-y-2">
          <div className="flex items-center justify-between text-ink/70">
            <span className="text-xs font-mono uppercase font-bold">Scans Today</span>
            <FileCheck className="w-4 h-4 text-pine" />
          </div>
          <p className="font-heading font-bold text-3xl text-pine">
            {systemStatus?.total_scans_today || 0}
          </p>
          <span className="text-[11px] text-ink/50 block font-mono">Field submissions</span>
        </div>

        <div
          onClick={onNavigateToQueue}
          className="leaf-card p-5 space-y-2 cursor-pointer border-pine/20 hover:border-amber group transition"
        >
          <div className="flex items-center justify-between text-ink/70">
            <span className="text-xs font-mono uppercase font-bold group-hover:text-amber transition-colors">
              Pending Review
            </span>
            <Clock className="w-4 h-4 text-amber" />
          </div>
          <p className="font-heading font-bold text-3xl text-amber">
            {systemStatus?.pending_reviews || 0}
          </p>
          <span className="text-[11px] text-amber-dark block font-mono">Requires agronomist sign-off →</span>
        </div>

        <div className="leaf-card p-5 space-y-2">
          <div className="flex items-center justify-between text-ink/70">
            <span className="text-xs font-mono uppercase font-bold">Production Checkpoint</span>
            <Layers className="w-4 h-4 text-moss" />
          </div>
          <p className="font-heading font-bold text-base text-ink truncate mt-1">
            {systemStatus?.active_model || 'MobileNetV2'}
          </p>
          <span className="text-[11px] text-moss-dark block font-mono">Active inference engine</span>
        </div>

        <div className="leaf-card p-5 space-y-2">
          <div className="flex items-center justify-between text-ink/70">
            <span className="text-xs font-mono uppercase font-bold">Climate Ingestion Latency</span>
            <Activity className="w-4 h-4 text-pine" />
          </div>
          <p className="font-heading font-bold text-3xl text-moss-dark">
            {systemStatus?.climate_api_latency_ms || 42}
            <span className="text-sm font-mono text-ink/50 ml-1">ms</span>
          </p>
          <span className="text-[11px] text-ink/50 block font-mono">Open-Meteo synchronous feed</span>
        </div>
      </div>

      {/* Regional Severity Table */}
      <div className="leaf-card p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-pine/15">
          <div>
            <h3 className="font-heading font-bold text-lg text-ink flex items-center gap-2">
              <MapPin className="w-5 h-5 text-pine" />
              Regional Foliar Severity Surveillance
            </h3>
            <p className="text-xs text-ink/70">
              Aggregated from field submissions over the past 7 days, prioritized by worst foliar necrosis rate.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-ink/60 animate-pulse">
            Aggregating regional scan data...
          </div>
        ) : regionalData.length === 0 ? (
          <div className="py-12 text-center text-xs text-ink/60 font-mono">
            No regional reports recorded in the past 7 days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-pine/5 text-ink uppercase font-mono border-b border-pine/20">
                <tr>
                  <th className="py-3 px-4 font-semibold">Location / Station</th>
                  <th className="py-3 px-4 font-semibold">Worst Severity (7d)</th>
                  <th className="py-3 px-4 font-semibold">Dominant Pathogen / Class</th>
                  <th className="py-3 px-4 font-semibold">Reports Count</th>
                  <th className="py-3 px-4 font-semibold">7-Day Trajectory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pine/10">
                {regionalData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-pine/5 transition">
                    <td className="py-3.5 px-4 font-medium text-ink flex items-center gap-2">
                      <span className="font-mono text-ink/50 text-[11px] w-4">{idx + 1}.</span>
                      <strong className="font-heading">{row.location}</strong>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-heading font-bold text-xs ${getSeverityBadge(
                          row.worst_severity
                        )}`}
                      >
                        {row.worst_severity.toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-ink">
                      {row.primary_condition}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-ink/80">
                      {row.report_count} scan{row.report_count !== 1 ? 's' : ''}
                    </td>

                    <td className="py-3.5 px-4">
                      {getTrendIcon(row.trend)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
