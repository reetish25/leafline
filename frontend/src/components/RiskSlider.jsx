import React from 'react';
import { Calendar, Sun, Droplets, TrendingUp, CloudSun } from 'lucide-react';

export default function RiskSlider({
  riskProjection = [],
  selectedDays,
  onDaysChange,
  maxAllowedDays = 15,
}) {
  const visibleProjections = riskProjection.slice(0, selectedDays);

  const getRiskBadge = (level) => {
    switch (level) {
      case 'Severe':
        return 'bg-deeprust text-white';
      case 'High':
        return 'bg-rust text-white';
      case 'Moderate':
        return 'bg-amber text-white';
      default:
        return 'bg-moss text-white';
    }
  };

  return (
    <div className="leaf-card p-6 bg-white shadow-clean">
      {/* Step Header & Slider Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-agri-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-pine font-bold">
              Step 4: 15-Day Pathogen Risk Outlook
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-agri-neutral text-ink-muted border border-agri-border">
              Rule-Based Climate Estimate
            </span>
          </div>
          <h4 className="font-heading font-bold text-xl text-ink flex items-center gap-2 mt-1">
            <Calendar className="w-5 h-5 text-pine" />
            Epidemiological Weather Spread Projection
          </h4>
        </div>

        {/* Selected Days Display */}
        <div className="text-right">
          <span className="text-xs font-mono uppercase tracking-wider text-ink-muted block">
            Forecast Horizon (Estimated)
          </span>
          <p className="font-heading font-extrabold text-2xl text-pine">
            {selectedDays} {selectedDays === 1 ? 'Day' : 'Days'} Outlook
          </p>
        </div>
      </div>

      {/* Slider Control */}
      <div className="bg-paper p-4 rounded-xl border border-agri-border mb-6">
        <div className="flex items-center justify-between text-xs font-mono font-semibold text-ink mb-2">
          <span>0 Days</span>
          <span className="text-pine font-bold bg-white px-3 py-1 rounded-full border border-agri-border shadow-2xs">
            Window: {selectedDays} / {maxAllowedDays} Days (Open-Meteo Model)
          </span>
          <span>{maxAllowedDays} Days</span>
        </div>

        <input
          type="range"
          min="1"
          max={maxAllowedDays}
          value={selectedDays}
          onChange={(e) => onDaysChange(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-agri-border-strong rounded-lg appearance-none cursor-pointer accent-pine focus:outline-none"
        />

        <div className="flex justify-between text-[11px] text-ink-subtle mt-1.5 font-mono">
          <span>Day +1</span>
          <span>+5d</span>
          <span>+10d</span>
          <span>+{maxAllowedDays}d</span>
        </div>
      </div>

      {/* Days Projections Cards */}
      {selectedDays === 0 ? (
        <div className="py-8 text-center bg-paper border border-dashed border-agri-border-strong rounded-xl">
          <p className="text-sm font-heading font-medium text-ink-muted">
            Forecast horizon set to 0 days. Adjust the slider above to model climate-driven pathogen spread.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
          {visibleProjections.map((item) => (
            <div
              key={item.day_offset}
              className="bg-paper border border-agri-border rounded-xl p-3.5 shadow-2xs hover:border-pine/40 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-150 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-ink">
                    Day +{item.day_offset} ({item.date})
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold ${getRiskBadge(
                      item.risk_level
                    )}`}
                  >
                    {item.risk_level}
                  </span>
                </div>

                {/* Score & Weather metrics */}
                <div className="flex items-center justify-between text-xs py-1.5 border-y border-agri-border my-2">
                  <div className="flex items-center gap-1 text-ink" title="Mean Daily Temp">
                    <Sun className="w-3.5 h-3.5 text-amber" />
                    <span className="font-mono">{item.temperature_c}°C</span>
                  </div>
                  <div className="flex items-center gap-1 text-ink" title="Relative Humidity">
                    <Droplets className="w-3.5 h-3.5 text-pine" />
                    <span className="font-mono">{item.relative_humidity_pct}%</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-ink font-semibold" title="Spread Risk Score">
                    <TrendingUp className="w-3.5 h-3.5 text-rust" />
                    <span>{item.risk_score}</span>
                  </div>
                </div>

                <p className="text-[11px] text-ink-muted leading-snug font-body">
                  {item.favorable_conditions}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-agri-border flex items-center justify-between text-[11px] font-mono text-ink-muted">
                <span>Est. Severity:</span>
                <span className="font-bold text-rust-dark">{item.projected_severity}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
