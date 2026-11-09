import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Sliders, Save, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    manual_model_selection_enabled: 'true',
    max_forecast_days: '15',
    images_per_scan: '1',
    review_confidence_threshold: '0.70',
    review_severity_threshold: '60.0',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [error, setError] = useState(null);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.getSettings();
      setSettings((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(err.message || 'Unable to retrieve system configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      const updated = await api.admin.updateSettings(settings);
      setSettings(updated);
      setStatusMsg({ type: 'success', text: 'Platform configuration settings updated successfully.' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  const isModelPickerEnabled = settings.manual_model_selection_enabled === 'true';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <span className="text-[11px] font-mono uppercase tracking-widest text-pine font-bold">
          System Control
        </span>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink tracking-tight">
          Platform Configuration & Pipeline Controls
        </h1>
        <p className="text-xs text-ink/70 mt-1">
          Adjust grower-facing UI controls, epidemiological forecasting horizons, and automatic triage triggers.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
            statusMsg.type === 'success'
              ? 'bg-moss/10 border border-moss/30 text-moss-dark'
              : 'bg-rust/10 border border-rust/30 text-rust-dark'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-moss" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rust" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rust/10 border border-rust/30 text-rust-dark flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rust" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadSettings}
            className="text-xs font-bold text-rust hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="leaf-card p-12 text-center text-xs font-mono text-ink/60 animate-pulse">
          Loading platform configuration parameters...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* User-Facing Feature Controls */}
          <div className="leaf-card p-6 sm:p-8 space-y-6">
            <h3 className="font-heading font-bold text-lg text-ink pb-2 border-b border-pine/15">
              Grower-Facing Interface Controls
            </h3>

            {/* Manual Model Selection Opt-In Toggle */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <strong className="text-xs font-mono uppercase text-ink block">
                  Manual Model Selection Link
                </strong>
                <p className="text-xs text-ink/70 mt-0.5 max-w-lg">
                  When enabled, displays the subtle link <em>"Want to choose the model yourself?"</em> beneath the Run Diagnosis button, revealing available model options to growers.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSettings({
                    ...settings,
                    manual_model_selection_enabled: isModelPickerEnabled ? 'false' : 'true',
                  })
                }
                className="flex-shrink-0 text-pine hover:text-pine-dark transition"
              >
                {isModelPickerEnabled ? (
                  <ToggleRight className="w-10 h-10 text-moss fill-current" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-ink/40" />
                )}
              </button>
            </div>

            {/* Max Forecast Days */}
            <div className="pt-4 border-t border-pine/10">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <strong className="text-xs font-mono uppercase text-ink block">
                    Maximum Forecast Projection Window
                  </strong>
                  <p className="text-xs text-ink/70 mt-0.5">
                    Upper boundary for the grower's epidemiological risk outlook slider (default 15 days).
                  </p>
                </div>
                <span className="font-mono font-bold text-pine text-sm bg-pine/10 px-2.5 py-1 rounded-lg">
                  {settings.max_forecast_days} Days Max
                </span>
              </div>

              <input
                type="range"
                min="3"
                max="30"
                value={settings.max_forecast_days}
                onChange={(e) =>
                  setSettings({ ...settings, max_forecast_days: e.target.value })
                }
                className="w-full h-2 bg-pine/20 rounded-lg appearance-none cursor-pointer accent-pine"
              />
            </div>

            {/* Images Per Scan */}
            <div className="pt-4 border-t border-pine/10">
              <label className="block text-xs font-mono uppercase text-ink font-bold mb-1">
                Accepted Images Per Diagnosis Scan
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={settings.images_per_scan}
                onChange={(e) =>
                  setSettings({ ...settings, images_per_scan: e.target.value })
                }
                className="input-field w-32 font-mono"
              />
              <span className="text-[11px] text-ink/60 mt-1 block">
                Standard baseline defaults to 1 image per diagnostic pipeline run.
              </span>
            </div>
          </div>

          {/* Quality Control & Review Queue Thresholds */}
          <div className="leaf-card p-6 sm:p-8 space-y-4">
            <h3 className="font-heading font-bold text-lg text-ink pb-2 border-b border-pine/15">
              Review Queue Quality Thresholds
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-ink font-semibold mb-1">
                  Confidence Threshold (Hold for Review)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min="0.4"
                    max="0.99"
                    value={settings.review_confidence_threshold}
                    onChange={(e) =>
                      setSettings({ ...settings, review_confidence_threshold: e.target.value })
                    }
                    className="input-field font-mono"
                  />
                  <span className="text-xs font-mono text-ink/70">
                    ({Math.round(parseFloat(settings.review_confidence_threshold || 0.7) * 100)}%)
                  </span>
                </div>
                <span className="text-[11px] text-ink/60 mt-1 block">
                  Scans with confidence below this value trigger manual review.
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-ink font-semibold mb-1">
                  Severity Threshold (% Diseased Area)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="20"
                    max="95"
                    value={settings.review_severity_threshold}
                    onChange={(e) =>
                      setSettings({ ...settings, review_severity_threshold: e.target.value })
                    }
                    className="input-field font-mono"
                  />
                  <span className="text-xs font-mono text-ink/70">%</span>
                </div>
                <span className="text-[11px] text-ink/60 mt-1 block">
                  Scans with diseased leaf area exceeding this value are held for triage.
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Configuration...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
