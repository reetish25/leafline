import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Clock, CheckCircle, AlertTriangle, Check, X, ShieldAlert, Layers, RefreshCw } from 'lucide-react';

export default function ReviewQueue() {
  const [queueItems, setQueueItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [activeItem, setActiveItem] = useState(null);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await api.admin.getReviewQueue(statusFilter);
      setQueueItems(items);
    } catch (err) {
      console.error('Failed to load review queue:', err);
      setError(err.message || 'Unable to retrieve review queue items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter]);

  const handleAction = async (queueId, actionType) => {
    setActionLoading(true);
    try {
      await api.admin.takeReviewAction(queueId, actionType, notes);
      setActiveItem(null);
      setNotes('');
      fetchQueue();
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-pine font-bold">
            Quality Assurance
          </span>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink tracking-tight">
            Agronomic Review & Triage Queue
          </h1>
          <p className="text-xs text-ink/70 mt-1">
            Diagnostic submissions quarantined for agronomist sign-off due to low model confidence or high disease severity.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="inline-flex rounded-xl p-1 bg-pine/10 text-xs font-semibold">
          {['pending', 'approved', 'escalated', 'all'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-lg capitalize transition font-heading font-bold ${
                statusFilter === st
                  ? 'bg-pine text-paper shadow-sm'
                  : 'text-ink/70 hover:text-ink'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rust/10 border border-rust/30 text-rust-dark flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rust" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchQueue}
            className="text-xs font-bold text-rust hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="leaf-card p-5 animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-5 w-24 bg-pine/15 rounded" />
                <div className="h-4 w-16 bg-pine/10 rounded" />
              </div>
              <div className="h-10 bg-rust/10 rounded-xl" />
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-square bg-pine/15 rounded-xl" />
                <div className="aspect-square bg-pine/15 rounded-xl" />
              </div>
              <div className="h-8 bg-pine/10 rounded-xl" />
            </div>
          ))}
        </div>
      ) : queueItems.length === 0 ? (
        <div className="leaf-card py-16 px-6 text-center border-2 border-dashed border-pine/25 space-y-3">
          <CheckCircle className="w-12 h-12 text-moss mx-auto" />
          <h3 className="font-heading font-bold text-lg text-ink">Review Queue Clear</h3>
          <p className="text-xs text-ink/70">No scan submissions currently awaiting triage matching "{statusFilter}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {queueItems.map((item) => (
            <div
              key={item.id}
              className="leaf-card p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-pine bg-pine/10 px-2 py-0.5 rounded">
                      Queue #{item.id}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-heading font-bold uppercase ${
                        item.status === 'pending'
                          ? 'bg-amber text-ink'
                          : item.status === 'approved'
                          ? 'bg-moss text-paper'
                          : 'bg-deeprust text-paper'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-ink/60">
                    Scan #{item.scan_id}
                  </span>
                </div>

                {/* Trigger reason alert */}
                <div className="mb-4 p-3 rounded-xl bg-rust/10 border border-rust/30 text-xs text-rust-dark font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rust" />
                  <span>{item.trigger_reason || 'Threshold breach'}</span>
                </div>

                {/* Side-by-side thumbnails */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="aspect-square bg-ink rounded-xl overflow-hidden border border-pine/20">
                    <img
                      src={item.scan.image_path}
                      alt="Original Leaf"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="aspect-square bg-ink rounded-xl overflow-hidden border border-pine/20">
                    <img
                      src={item.scan.overlay_image_path}
                      alt="Segmented Lesion Mask"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Scan details */}
                <div className="text-xs space-y-1 font-mono text-ink/80 mb-4 bg-pine/5 p-3 rounded-xl">
                  <p><strong>Predicted:</strong> {item.scan.predicted_class} ({(item.scan.confidence * 100).toFixed(1)}%)</p>
                  <p><strong>Foliar Severity:</strong> {item.scan.severity_pct.toFixed(1)}% necrosis</p>
                  <p><strong>Field Station:</strong> {item.scan.plant_label || 'Unlabeled'}</p>
                  {item.notes && (
                    <p className="text-pine-dark pt-1"><strong>Reviewer Rationale:</strong> {item.notes}</p>
                  )}
                </div>
              </div>

              {/* Action trigger button */}
              {item.status === 'pending' ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveItem(item);
                    setNotes('');
                  }}
                  className="btn-primary text-xs w-full py-2.5 justify-center"
                >
                  Triage / Review Submission
                </button>
              ) : (
                <div className="text-[11px] font-mono text-ink/50 text-right pt-2 border-t border-pine/10">
                  Reviewed by: {item.reviewer_email || 'Admin'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Triage / Review Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-ink/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="leaf-card text-ink w-full max-w-2xl p-6 sm:p-8 space-y-5 border-2 border-pine/40 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-pine/15">
              <h3 className="font-heading font-bold text-lg">
                Manual Agronomic Review — Queue #{activeItem.id}
              </h3>
              <button
                onClick={() => setActiveItem(null)}
                className="p-1 rounded-lg text-ink/60 hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Side-by-side inspection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-ink/60 block mb-1">
                  Raw Captured Evidence
                </span>
                <div className="aspect-square bg-ink rounded-xl overflow-hidden border border-pine/30">
                  <img
                    src={activeItem.scan.image_path}
                    alt="Original Leaf"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-ink/60 block mb-1">
                  Lesion Overlay Analysis
                </span>
                <div className="aspect-square bg-ink rounded-xl overflow-hidden border border-pine/30">
                  <img
                    src={activeItem.scan.overlay_image_path}
                    alt="Segmented Mask"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Notes input */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-ink/80 mb-1">
                Agronomist Review Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Enter notes on pustule distribution, lesion margins, confirmation rationale, or grower instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Approve / Escalate Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleAction(activeItem.id, 'escalate')}
                className="px-5 py-2.5 rounded-xl bg-deeprust hover:bg-deeprust-dark text-paper font-heading font-bold text-xs shadow flex items-center gap-1.5 transition"
              >
                <ShieldAlert className="w-4 h-4" />
                Escalate to Senior Pathologist
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleAction(activeItem.id, 'approve')}
                className="px-5 py-2.5 rounded-xl bg-moss hover:bg-moss-dark text-paper font-heading font-bold text-xs shadow flex items-center gap-1.5 transition"
              >
                <Check className="w-4 h-4" />
                Approve & Release to User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
