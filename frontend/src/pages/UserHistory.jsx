import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import PrintableReport from '../components/PrintableReport';
import { Search, History, Calendar, Tag, ArrowRight, FileText, Activity, AlertCircle, RefreshCw, Sprout } from 'lucide-react';

export default function UserHistory() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPlant, setFilterPlant] = useState('');
  const [selectedScanDetail, setSelectedScanDetail] = useState(null);

  const fetchScans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyScans(filterPlant);
      setScans(data);
    } catch (err) {
      console.error('Failed to load history:', err);
      setError(err.message || 'Unable to retrieve scan archive.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [filterPlant]);

  const handleOpenDetail = async (scanId) => {
    try {
      const detail = await api.getScanDetails(scanId);
      setSelectedScanDetail(detail);
    } catch (err) {
      console.error('Failed to load scan detail:', err);
    }
  };

  const classBadges = {
    Immune: 'bg-moss text-white',
    Resistant: 'bg-moss-light text-white',
    MR: 'bg-amber text-white',
    MS: 'bg-amber-dark text-white',
    S: 'bg-rust text-white',
    HS: 'bg-deeprust text-white',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-pine font-bold">
            Agronomic Field Archive
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-ink tracking-tight mt-0.5">
            Diagnostic Scan History
          </h1>
          <p className="text-xs text-ink-muted mt-1 font-body">
            Access past foliar evaluations, lesion severity progression, and verified chemical interventions.
          </p>
        </div>

        {/* Plant / Field Filter Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter by plot or field..."
            value={filterPlant}
            onChange={(e) => setFilterPlant(e.target.value)}
            className="input-field pl-9 pr-4 py-2 text-xs"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rust-surface border border-rust/30 text-rust-dark flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rust" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchScans}
            className="text-xs font-bold text-rust hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {loading ? (
        /* Skeleton Loading State */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="leaf-card p-5 bg-white animate-pulse flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-24 bg-agri-neutral rounded-md" />
                <div className="h-4 w-20 bg-agri-neutral rounded-md" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-agri-neutral rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-agri-neutral rounded" />
                  <div className="h-3 w-1/2 bg-agri-neutral rounded" />
                  <div className="h-3 w-2/3 bg-agri-neutral rounded" />
                </div>
              </div>
              <div className="pt-3 border-t border-agri-border flex justify-end">
                <div className="h-4 w-32 bg-agri-neutral rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : scans.length === 0 ? (
        /* Calm Empty State */
        <div className="leaf-card py-16 px-6 text-center bg-white border border-dashed border-agri-border-strong space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-pine/10 text-pine flex items-center justify-center">
            <History className="w-7 h-7" />
          </div>
          <h3 className="font-heading font-bold text-lg text-ink">No Diagnostic Scans Recorded</h3>
          <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
            {filterPlant
              ? `No historical evaluations match your filter "${filterPlant}". Reset the search query to see all records.`
              : 'You have not uploaded or analyzed any sunflower leaves yet. Visit the Diagnosis page to run your first evaluation.'}
          </p>
          {filterPlant && (
            <button
              onClick={() => setFilterPlant('')}
              className="btn-secondary text-xs px-3 py-1.5 mt-2"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scans.map((scan) => (
            <div
              key={scan.id}
              className="leaf-card p-5 bg-white shadow-clean hover:shadow-clean-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-pine bg-pine/10 px-2 py-0.5 rounded">
                      #{scan.id}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-heading font-bold ${
                        classBadges[scan.predicted_class] || 'bg-pine text-white'
                      }`}
                    >
                      {scan.predicted_class}
                    </span>
                    <span className="text-xs font-mono text-ink-muted">
                      {(scan.confidence * 100).toFixed(0)}% conf
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-pine/10 text-pine font-medium">
                      {scan.model_used}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-ink-subtle flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-pine" />
                    {new Date(scan.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Thumbnail & Plant Info */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-paper border border-agri-border flex-shrink-0 flex items-center justify-center p-1">
                    <img
                      src={scan.overlay_image_path || scan.image_path}
                      alt="Diagnosis visual"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-ink font-heading">
                      <Tag className="w-3.5 h-3.5 text-pine flex-shrink-0" />
                      <span className="truncate">{scan.plant_label || 'Unlabeled Plant'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                      <Activity className="w-3.5 h-3.5 text-rust flex-shrink-0" />
                      <span>
                        Severity (Est.): <strong className="font-heading font-bold text-rust-dark">{scan.severity_pct.toFixed(1)}%</strong>
                      </span>
                    </div>

                    <p className="text-[11px] text-ink-subtle font-mono">
                      Location: {scan.location || 'Salina, KS'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-agri-border flex justify-end">
                <button
                  type="button"
                  onClick={() => handleOpenDetail(scan.id)}
                  className="flex items-center gap-1.5 text-xs font-heading font-bold text-pine hover:text-pine-dark transition group"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View Full Report & Treatment
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Diagnostic Report Modal */}
      {selectedScanDetail && (
        <PrintableReport
          scanDetail={selectedScanDetail}
          onClose={() => setSelectedScanDetail(null)}
        />
      )}
    </div>
  );
}
