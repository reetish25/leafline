import React from 'react';
import { Printer, X, Leaf, Shield, CheckCircle, AlertTriangle, Calendar, MapPin, Tag } from 'lucide-react';

export default function PrintableReport({ scanDetail, onClose }) {
  if (!scanDetail || !scanDetail.scan) return null;

  const { scan, risk_projection, recommendation, trend_note } = scanDetail;

  const handlePrint = () => {
    window.print();
  };

  const orderedClasses = ['Immune', 'Resistant', 'MR', 'MS', 'S', 'HS'];
  const probs = scan.probabilities || {};

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex justify-center p-4 sm:p-6">
      <div className="bg-white text-ink w-full max-w-4xl rounded-2xl shadow-clean-lg overflow-hidden flex flex-col my-auto border border-agri-border">
        {/* Modal Controls (Hidden in print) */}
        <div className="bg-pine text-white p-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-moss flex items-center justify-center text-white">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <span className="font-heading font-bold text-base block leading-tight">
                Official Diagnostic Report #{scan.id}
              </span>
              <span className="text-[10px] font-mono text-moss-light uppercase tracking-wider">
                Helianthus Foliar Pathology Verification
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary py-2 px-4 text-xs bg-moss hover:bg-moss-dark text-white shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-pine-dark text-white/80 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-12 space-y-6 printable-document bg-white">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between border-b-2 border-pine pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2.5 text-pine font-heading font-extrabold text-3xl">
                <Leaf className="w-8 h-8 text-moss transform -rotate-12" />
                <span>Leafline Agronomics</span>
              </div>
              <p className="text-xs text-ink-muted font-mono mt-1">
                Sunflower Foliar Pathology &amp; Crop Protection Diagnostic Center
              </p>
            </div>
            <div className="text-right text-xs font-mono text-ink space-y-1">
              <p><strong>Report Reference:</strong> LL-SCAN-{scan.id}</p>
              <p><strong>Date Generated:</strong> {new Date(scan.created_at).toLocaleDateString()}</p>
              <p><strong>Field Identifier:</strong> {scan.plant_label || 'Unlabeled Plot'}</p>
              <p><strong>Location:</strong> {scan.location || 'Salina, KS'}</p>
            </div>
          </div>

          {/* Diagnosis Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-paper border border-agri-border p-5 rounded-2xl shadow-clean">
            <div>
              <span className="text-[11px] font-mono uppercase text-pine font-bold block">
                Primary Diagnosis
              </span>
              <p className="font-heading font-extrabold text-3xl text-pine mt-0.5">
                {scan.predicted_class}
              </p>
              <span className="text-xs text-ink-muted font-body">Sunflower Foliar Class</span>
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase text-pine font-bold block">
                Model Confidence
              </span>
              <p className="font-heading font-extrabold text-3xl text-ink mt-0.5">
                {(scan.confidence * 100).toFixed(1)}%
              </p>
              <span className="text-xs text-ink-muted font-mono">Engine: {scan.model_used}</span>
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase text-rust-dark font-bold block">
                Tissue Severity (Est.)
              </span>
              <p className="font-heading font-extrabold text-3xl text-rust-dark mt-0.5">
                {scan.severity_pct.toFixed(1)}%
              </p>
              <span className="text-xs text-moss-dark font-mono">Healthy: {scan.healthy_pct.toFixed(1)}%</span>
            </div>
          </div>

          {/* Probability Distribution if present */}
          {probs && Object.keys(probs).length > 0 && (
            <div className="p-4 rounded-xl border border-agri-border bg-paper space-y-2">
              <span className="text-xs font-mono uppercase font-bold text-ink">
                Class Probability Distribution
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs font-mono">
                {orderedClasses.map((c) => {
                  const val = probs[c] !== undefined ? (probs[c] * 100).toFixed(1) : '0.0';
                  const isWin = c === scan.predicted_class;
                  return (
                    <div
                      key={c}
                      className={`p-2 rounded-lg border ${
                        isWin ? 'bg-pine text-white border-pine font-bold' : 'bg-white border-agri-border text-ink-muted'
                      }`}
                    >
                      <span className="block text-[10px]">{c}</span>
                      <span className="text-sm">{val}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Two-Tone Visual Severity Bar */}
          <div className="space-y-1.5 bg-paper border border-agri-border p-4 rounded-xl">
            <span className="text-[11px] font-mono uppercase text-ink-muted font-bold block">
              Canopy Tissue Health Ratio (CAM Model Estimate)
            </span>
            <div className="h-5 w-full bg-agri-neutral border border-agri-border-strong rounded-full overflow-hidden flex p-0.5 shadow-inner">
              <div
                style={{ width: `${scan.healthy_pct}%` }}
                className="h-full bg-moss rounded-l-full flex items-center justify-center"
              >
                <span className="text-[10px] font-mono font-bold text-white drop-shadow-xs">
                  {scan.healthy_pct.toFixed(1)}%
                </span>
              </div>
              <div
                style={{ width: `${scan.severity_pct}%` }}
                className="h-full bg-rust rounded-r-full flex items-center justify-center"
              >
                <span className="text-[10px] font-mono font-bold text-white drop-shadow-xs">
                  {scan.severity_pct.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Side-by-side Images for Print (Actual photo vs actual overlay) */}
          <div>
            <h5 className="font-heading font-bold text-sm text-ink mb-2.5 pb-1 border-b border-agri-border uppercase tracking-wide">
              Foliar Evidence &amp; Pathogen Segmentation Overlay
            </h5>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-agri-border rounded-xl p-2.5 bg-paper text-center">
                <img
                  src={scan.image_path}
                  alt="Original Capture"
                  className="max-h-56 mx-auto object-contain rounded-lg"
                />
                <span className="block text-xs font-mono text-ink mt-2 font-bold">
                  Actual Submitted Leaf Photo
                </span>
              </div>
              <div className="border border-agri-border rounded-xl p-2.5 bg-paper text-center">
                <img
                  src={scan.overlay_image_path}
                  alt="Segmentation Overlay"
                  className="max-h-56 mx-auto object-contain rounded-lg"
                />
                <span className="block text-xs font-mono text-rust-dark mt-2 font-bold">
                  Pathogen Segmentation Overlay (Est.)
                </span>
              </div>
            </div>
          </div>

          {/* Historical Trend Note if Available */}
          {trend_note && (
            <div className="p-3.5 rounded-xl bg-paper border border-agri-border text-xs text-ink">
              <strong className="text-pine font-heading font-bold uppercase text-[11px] block mb-0.5">
                Historical Field Comparison:
              </strong>
              <p className="font-body text-ink-muted">{trend_note}</p>
            </div>
          )}

          {/* Pesticide Recommendation */}
          {recommendation && (
            <div className="border border-agri-border rounded-2xl p-5 bg-paper space-y-3 shadow-clean">
              <h5 className="font-heading font-bold text-base text-pine">
                Agronomic Treatment Guidance
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-body">
                <div>
                  <span className="font-mono text-pine font-bold uppercase text-[11px]">
                    Active Ingredient:
                  </span>
                  <p className="font-heading font-bold text-sm text-ink mt-0.5">
                    {recommendation.active_ingredient}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-pine font-bold uppercase text-[11px]">
                    Prescribed Dosage Rate:
                  </span>
                  <p className="font-heading font-bold text-sm text-rust-dark mt-0.5">
                    {recommendation.dosage}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-ink-muted font-mono">
                Source Citation: {recommendation.source}
              </p>

              {/* Disclaimer */}
              <div className="p-3.5 rounded-xl bg-amber-surface border border-amber/30 text-ink text-xs font-medium font-body">
                <strong className="text-amber-dark font-heading block mb-0.5">Disclaimer:</strong>
                {recommendation.disclaimer}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-6 border-t border-agri-border text-center text-xs text-ink-subtle font-mono">
            Leafline Diagnostic System • Helianthus Agronomic Pathology Division • Official Verification Record
          </div>
        </div>
      </div>
    </div>
  );
}
