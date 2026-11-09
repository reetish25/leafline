import React from 'react';
import { ShieldAlert, AlertTriangle, FileText } from 'lucide-react';

export default function TreatmentCard({ recommendation, onDownloadReport }) {
  if (!recommendation) {
    return (
      <div className="leaf-card p-6 bg-white shadow-clean">
        <p className="text-sm font-heading text-ink-muted">
          No chemical intervention required for this classification stage. Maintain standard agronomic scouting and crop rotation protocols.
        </p>
      </div>
    );
  }

  return (
    <div className="leaf-card p-6 bg-white shadow-clean">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-agri-border">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-pine font-bold">
            Step 5: Agronomic Treatment Protocol
          </span>
          <h4 className="font-heading font-bold text-xl text-ink flex items-center gap-2 mt-0.5">
            <ShieldAlert className="w-5 h-5 text-pine" />
            Prescribed Intervention Protocol
          </h4>
        </div>

        {onDownloadReport && (
          <button
            type="button"
            onClick={onDownloadReport}
            className="btn-primary py-2 px-4 text-xs no-print"
          >
            <FileText className="w-4 h-4" />
            Download Diagnostic Report
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Active Ingredient & Product */}
        <div className="p-4 rounded-xl bg-paper border border-agri-border">
          <span className="text-[11px] font-mono uppercase text-pine font-bold block mb-1">
            Target Active Ingredient / Chemical Compound
          </span>
          <p className="font-heading font-bold text-base text-ink leading-snug">
            {recommendation.active_ingredient}
          </p>
          <div className="mt-2.5 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-pine/10 text-pine border border-pine/20">
            Severity Band: {recommendation.severity_band}
          </div>
        </div>

        {/* Application Dosage Guidelines */}
        <div className="p-4 rounded-xl bg-paper border border-agri-border">
          <span className="text-[11px] font-mono uppercase text-pine font-bold block mb-1">
            Application Dosage Guidelines
          </span>
          <p className="font-heading font-bold text-base text-rust-dark leading-snug">
            {recommendation.dosage}
          </p>
          <p className="text-xs text-ink-muted mt-1.5 font-mono">
            Source: {recommendation.source}
          </p>
        </div>
      </div>

      {/* Mandatory Extension Office Disclaimer */}
      <div className="p-4 rounded-xl bg-amber-surface border border-amber/30 text-xs text-ink flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-dark flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-heading font-bold text-ink uppercase tracking-wide text-xs block mb-0.5">
            Mandatory Agronomic Disclaimer
          </span>
          <p className="font-body leading-relaxed text-ink-muted">
            {recommendation.disclaimer ||
              'Confirm application rates and timing with your local agricultural extension service for regional crop resistance compliance.'}
          </p>
        </div>
      </div>
    </div>
  );
}
