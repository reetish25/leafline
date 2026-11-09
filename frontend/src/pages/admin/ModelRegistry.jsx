import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Cpu, CheckCircle2, Star, Zap, HardDrive, Shield, AlertCircle, RefreshCw } from 'lucide-react';

export default function ModelRegistry() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.getModels();
      setModels(data);
    } catch (err) {
      console.error('Failed to load models:', err);
      setError(err.message || 'Unable to retrieve inference model registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleSetDefault = async (modelId) => {
    setActionLoading(true);
    try {
      const updated = await api.admin.setDefaultModel(modelId);
      setModels(updated);
    } catch (err) {
      alert(`Failed to set default: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[11px] font-mono uppercase tracking-widest text-pine font-bold">
          Machine Learning Ops
        </span>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink tracking-tight">
          Inference Model Registry & Benchmarks
        </h1>
        <p className="text-xs text-ink/70 mt-1">
          Catalog of validated neural architecture checkpoints with inference latency, model footprint, and default dispatch settings.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rust/10 border border-rust/30 text-rust-dark flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rust" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchModels}
            className="text-xs font-bold text-rust hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="leaf-card p-12 text-center text-xs font-mono text-ink/60 animate-pulse">
          Loading model benchmarks and registry...
        </div>
      ) : (
        <div className="leaf-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-pine/5 text-ink uppercase font-mono border-b border-pine/20">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Model Identifier</th>
                  <th className="py-3.5 px-4 font-semibold">Version</th>
                  <th className="py-3.5 px-4 font-semibold">Validation Accuracy</th>
                  <th className="py-3.5 px-4 font-semibold">Inference Latency</th>
                  <th className="py-3.5 px-4 font-semibold">Checkpoint Size</th>
                  <th className="py-3.5 px-4 font-semibold">Platform Default</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pine/10">
                {models.map((m) => (
                  <tr key={m.id} className="hover:bg-pine/5 transition">
                    <td className="py-4 px-4 font-bold font-heading text-ink">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-pine/10 text-pine flex items-center justify-center flex-shrink-0">
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-heading font-bold text-sm">{m.name}</span>
                          {m.description && (
                            <p className="text-[11px] font-normal text-ink/70 font-sans mt-0.5">
                              {m.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono font-medium text-ink">
                      v{m.version}
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-moss-dark text-sm">
                      {m.accuracy != null ? `${(m.accuracy * 100).toFixed(1)}%` : 'Not recorded'}
                    </td>

                    <td className="py-4 px-4 font-mono text-ink/80">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber" />
                        {m.latency_ms} ms
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono text-ink/80">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5 text-pine" />
                        {m.size_mb} MB
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {m.is_default ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase font-bold bg-moss text-paper">
                          <CheckCircle2 className="w-3 h-3" /> Default Active
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-ink/50">Secondary Checkpoint</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      {!m.is_default && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleSetDefault(m.id)}
                          className="btn-secondary text-xs py-1.5 px-3"
                        >
                          Set Default
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
