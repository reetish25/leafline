import React from 'react';
import { Activity, CloudSun, Cpu, AlertCircle, ShieldCheck } from 'lucide-react';

export default function StatusStrip({ systemStatus }) {
  if (!systemStatus) return null;

  return (
    <div className="bg-pine-dark border-b border-pine text-paper py-2 px-4 sm:px-8 text-xs font-mono">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Services Status Badges */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Climate API Health */}
          <div className="flex items-center gap-1.5">
            <CloudSun className="w-3.5 h-3.5 text-moss-light" />
            <span className="text-paper/70">Climate Weather API:</span>
            <span className="flex items-center gap-1 text-moss-light font-semibold">
              <span className="w-2 h-2 rounded-full bg-moss-light animate-pulse"></span>
              {systemStatus.climate_api_status.toUpperCase()} ({systemStatus.climate_api_latency_ms}ms)
            </span>
          </div>

          <span className="text-pine-light">|</span>

          {/* Inference Service Health */}
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-moss-light" />
            <span className="text-paper/70">Inference Core:</span>
            <span className="flex items-center gap-1 text-moss-light font-semibold">
              <span className="w-2 h-2 rounded-full bg-moss-light"></span>
              {systemStatus.inference_service_status.toUpperCase()} ({systemStatus.inference_service_latency_ms}ms)
            </span>
          </div>
        </div>

        {/* Operational Highlights */}
        <div className="flex items-center gap-4">
          <div className="text-paper/80">
            Active Default Model: <span className="text-paper font-semibold">{systemStatus.active_model}</span>
          </div>

          {systemStatus.pending_reviews > 0 && (
            <div className="bg-amber text-ink px-2 py-0.5 rounded font-bold flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-ink" />
              {systemStatus.pending_reviews} Pending Review
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
