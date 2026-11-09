import React, { useState } from 'react';
import { Eye, Layers, Maximize2, X, Info, BarChart3, CheckCircle2 } from 'lucide-react';

export default function SideBySideView({
  originalUrl,
  overlayUrl,
  predictedClass,
  confidence,
  probabilities = {},
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('side-by-side'); // 'side-by-side', 'original', 'overlay'

  // Severity Class metadata
  const classMetadata = {
    Immune: {
      label: 'Immune',
      desc: 'No Alternaria blight symptoms observed',
      badge: 'bg-moss text-white border-moss-dark',
      barColor: 'bg-moss',
    },
    Resistant: {
      label: 'Resistant',
      desc: 'Minor non-spreading hypersensitive lesions',
      badge: 'bg-moss-light text-white border-moss',
      barColor: 'bg-moss-light',
    },
    MR: {
      label: 'MR (Moderately Resistant)',
      desc: 'Restricted punctiform lesions, low sporulation',
      badge: 'bg-amber text-white border-amber-dark',
      barColor: 'bg-amber',
    },
    MS: {
      label: 'MS (Moderately Susceptible)',
      desc: 'Expanding lesions with chlorotic halos',
      badge: 'bg-amber-dark text-white border-amber-dark',
      barColor: 'bg-amber-dark',
    },
    S: {
      label: 'S (Susceptible)',
      desc: 'Significant tissue necrosis and target-spot blight',
      badge: 'bg-rust text-white border-rust-dark',
      barColor: 'bg-rust',
    },
    HS: {
      label: 'HS (Highly Susceptible)',
      desc: 'Severe coalescing blight, systemic defoliation risk',
      badge: 'bg-deeprust text-white border-deeprust-dark',
      barColor: 'bg-deeprust',
    },
  };

  const currentMeta = classMetadata[predictedClass] || {
    label: predictedClass,
    desc: 'Diagnosed foliar pathology class',
    badge: 'bg-pine text-white',
    barColor: 'bg-pine',
  };

  const orderedClasses = ['Immune', 'Resistant', 'MR', 'MS', 'S', 'HS'];

  return (
    <div className="leaf-card p-6 bg-white shadow-clean">
      {/* Result Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-5 border-b border-agri-border">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-pine font-bold">
            Step 2: Alternaria Blight Diagnosis
          </span>
          <div className="flex items-center gap-3 mt-1.5">
            <span className={`px-3.5 py-1 rounded-xl font-heading text-lg font-bold border shadow-xs ${currentMeta.badge}`}>
              {predictedClass}
            </span>
            <div>
              <span className="text-base font-heading font-bold text-ink block">
                {currentMeta.label}
              </span>
              <span className="text-xs text-ink-muted block font-body">
                {currentMeta.desc}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono uppercase tracking-wider text-ink-muted">
            Model Confidence
          </span>
          <p className="font-heading font-extrabold text-3xl text-pine">
            {(confidence * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Visual Mode Toggles */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-heading font-bold text-ink flex items-center gap-1.5 uppercase tracking-wide">
          <Layers className="w-4 h-4 text-pine" />
          Specimen Photo vs. Lesion Overlay
        </span>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl p-0.5 bg-agri-neutral border border-agri-border text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab('side-by-side')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeTab === 'side-by-side' ? 'bg-white text-pine font-bold shadow-xs' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Side-by-Side
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('original')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeTab === 'original' ? 'bg-white text-pine font-bold shadow-xs' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Original
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('overlay')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activeTab === 'overlay' ? 'bg-white text-pine font-bold shadow-xs' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Overlay
            </button>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="p-1.5 rounded-xl border border-agri-border hover:bg-agri-neutral text-pine transition"
            title="Expand Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Original Leaf Photo */}
        {(activeTab === 'side-by-side' || activeTab === 'original') && (
          <div className="rounded-xl overflow-hidden border border-agri-border bg-paper flex flex-col">
            <div className="px-3 py-2 bg-white border-b border-agri-border flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-ink">Original Leaf Specimen</span>
              <span className="text-ink-subtle">User Upload</span>
            </div>
            <div className="p-3 flex items-center justify-center min-h-[300px] max-h-[420px] bg-paper">
              <img
                src={originalUrl}
                alt="Original leaf specimen"
                className="max-h-[380px] w-auto max-w-full object-contain rounded-lg shadow-xs"
              />
            </div>
          </div>
        )}

        {/* Right: Real Overlay Mask */}
        {(activeTab === 'side-by-side' || activeTab === 'overlay') && (
          <div className="rounded-xl overflow-hidden border border-agri-border bg-paper flex flex-col">
            <div className="px-3 py-2 bg-white border-b border-agri-border flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-pine">Lesion Heatmap Overlay</span>
              <span className="text-amber-dark font-medium flex items-center gap-1">
                CAM Estimate
              </span>
            </div>
            <div className="p-3 flex items-center justify-center min-h-[300px] max-h-[420px] bg-paper">
              <img
                src={overlayUrl}
                alt="Lesion segmentation overlay"
                className="max-h-[380px] w-auto max-w-full object-contain rounded-lg shadow-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Probability Bars for ALL Classes */}
      <div className="mt-6 pt-5 border-t border-agri-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-heading font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-pine" />
            Class Probability Distribution (All 6 Severity Stages)
          </span>
          <span className="text-[11px] font-mono text-ink-subtle">
            MobileNetV2 Softmax Outputs
          </span>
        </div>

        <div className="space-y-2.5">
          {orderedClasses.map((cName) => {
            const prob = probabilities[cName] !== undefined ? probabilities[cName] : 0.0;
            const pct = (prob * 100).toFixed(1);
            const isWinner = cName === predictedClass;
            const meta = classMetadata[cName] || {};

            return (
              <div key={cName} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className={`flex items-center gap-1.5 ${isWinner ? 'font-bold text-pine' : 'text-ink-muted'}`}>
                    {isWinner && <CheckCircle2 className="w-3.5 h-3.5 text-moss" />}
                    <span>{cName}</span>
                    <span className="text-[10px] text-ink-subtle font-sans hidden sm:inline">
                      ({meta.desc?.slice(0, 36)}...)
                    </span>
                  </span>
                  <span className={`font-bold ${isWinner ? 'text-pine' : 'text-ink-muted'}`}>
                    {pct}%
                  </span>
                </div>
                <div className="w-full h-2 bg-agri-neutral rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isWinner ? meta.barColor || 'bg-pine' : 'bg-ink-subtle/40'
                    }`}
                    style={{ width: `${Math.max(1, parseFloat(pct))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fullscreen Zoom Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-clean-lg">
            <div className="px-5 py-3 border-b border-agri-border flex items-center justify-between bg-agri-neutral">
              <span className="font-heading font-bold text-sm text-ink">
                High-Resolution Diagnostic Inspection
              </span>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-agri-border text-ink-muted transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-ink">Uploaded Photo</span>
                <img src={originalUrl} alt="Original specimen" className="w-full rounded-lg object-contain bg-paper max-h-[600px]" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-pine">Lesion Activation Overlay</span>
                <img src={overlayUrl} alt="Overlay" className="w-full rounded-lg object-contain bg-paper max-h-[600px]" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
