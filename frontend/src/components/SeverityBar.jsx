import React from 'react';
import { Activity, TrendingUp, TrendingDown, Minus, Sprout, AlertOctagon, HelpCircle } from 'lucide-react';

export default function SeverityBar({ healthyPct, diseasedPct, trendNote, plantLabel }) {
  // Determine severity tier
  let severityTier = 'Mild / Controlled';
  let tierBadge = 'bg-moss text-white';
  if (diseasedPct >= 60.0) {
    severityTier = 'Severe Defoliation Risk';
    tierBadge = 'bg-deeprust text-white';
  } else if (diseasedPct >= 25.0) {
    severityTier = 'Moderate / Expanding Lesions';
    tierBadge = 'bg-rust text-white';
  } else if (diseasedPct >= 10.0) {
    severityTier = 'Restricted Lesion Activity';
    tierBadge = 'bg-amber text-white';
  }

  // Trend icon parsing
  let TrendIcon = Minus;
  let trendColor = 'text-ink-muted';
  let trendBg = 'bg-agri-neutral text-ink';
  if (trendNote?.toLowerCase().includes('increased')) {
    TrendIcon = TrendingUp;
    trendColor = 'text-rust';
    trendBg = 'bg-rust-surface text-rust-dark';
  } else if (trendNote?.toLowerCase().includes('decreased')) {
    TrendIcon = TrendingDown;
    trendColor = 'text-moss';
    trendBg = 'bg-moss-surface text-moss-dark';
  }

  return (
    <div className="leaf-card p-6 bg-white shadow-clean">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-agri-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-pine font-bold">
              Step 3: Tissue Severity Breakdown
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-agri-neutral text-ink-muted border border-agri-border">
              Model CAM Estimate
            </span>
          </div>
          <h4 className="font-heading font-bold text-xl text-ink flex items-center gap-2 mt-1">
            <Activity className="w-5 h-5 text-pine" />
            Canopy Tissue Health Ratio
          </h4>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono uppercase tracking-wider text-ink-muted block">
            Severity Rating (Estimated)
          </span>
          <div className="flex items-center justify-end gap-2 mt-0.5">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${tierBadge}`}>
              {severityTier}
            </span>
            <span className="font-mono text-rust-dark font-extrabold text-2xl">{diseasedPct.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Two-Tone Progress Bar */}
      <div className="space-y-3">
        <div className="h-7 w-full bg-agri-neutral border border-agri-border-strong rounded-full overflow-hidden flex p-0.5 shadow-inner">
          {/* Healthy segment: Moss */}
          <div
            style={{ width: `${healthyPct}%` }}
            className="h-full bg-moss rounded-l-full transition-all duration-700 flex items-center justify-center relative group"
            title={`Healthy tissue: ${healthyPct}%`}
          >
            {healthyPct > 15 && (
              <span className="text-xs font-mono font-bold text-white drop-shadow-xs">
                {healthyPct.toFixed(1)}% Healthy
              </span>
            )}
          </div>

          {/* Diseased segment: Rust / Deep Rust */}
          <div
            style={{ width: `${diseasedPct}%` }}
            className="h-full bg-rust rounded-r-full transition-all duration-700 flex items-center justify-center relative group"
            title={`Diseased tissue: ${diseasedPct}%`}
          >
            {diseasedPct > 15 && (
              <span className="text-xs font-mono font-bold text-white drop-shadow-xs">
                {diseasedPct.toFixed(1)}% Diseased
              </span>
            )}
          </div>
        </div>

        {/* Legend labels */}
        <div className="flex items-center justify-between text-xs font-mono px-1">
          <div className="flex items-center gap-1.5 text-moss-dark font-medium">
            <Sprout className="w-4 h-4 text-moss" />
            <span>Healthy Foliage: <strong>{healthyPct.toFixed(1)}%</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-rust-dark font-medium">
            <AlertOctagon className="w-4 h-4 text-rust" />
            <span>Diseased Lesion Area (Est.): <strong>{diseasedPct.toFixed(1)}%</strong></span>
          </div>
        </div>
      </div>

      {/* Comparative Plant / Field Trend Note */}
      {trendNote && (
        <div className="mt-5 p-4 rounded-xl bg-paper border border-agri-border flex items-start gap-3">
          <div className={`p-2 rounded-xl ${trendBg} mt-0.5 flex-shrink-0`}>
            <TrendIcon className={`w-5 h-5 ${trendColor}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase font-bold text-pine">
                Field Progression Trend
              </span>
              {plantLabel && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-pine/10 font-mono text-pine font-semibold">
                  {plantLabel}
                </span>
              )}
            </div>
            <p className="text-xs text-ink mt-1 font-body leading-relaxed">
              {trendNote}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
