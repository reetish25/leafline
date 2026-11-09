import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  ShieldCheck,
  Calendar,
  User,
  Sliders,
  FlaskConical,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
} from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.getAuditLogs(actionFilter || null);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError(err.message || 'Unable to retrieve system audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'settings_update':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-pine/15 text-pine">
            <Sliders className="w-3 h-3" /> Settings Update
          </span>
        );
      case 'pesticide_create':
      case 'pesticide_version_update':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-moss/20 text-moss-dark">
            <FlaskConical className="w-3 h-3" /> Protocol Revision
          </span>
        );
      case 'user_created':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-moss text-paper">
            <User className="w-3 h-3" /> User Provisioned
          </span>
        );
      case 'user_status_update':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber/20 text-amber-dark">
            <User className="w-3 h-3" /> Status Toggled
          </span>
        );
      case 'user_role_update':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-deeprust text-paper">
            <ShieldCheck className="w-3 h-3" /> Role Escalation
          </span>
        );
      case 'review_triage':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-pine text-paper">
            <Clock className="w-3 h-3" /> Triage Action
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-ink/10 text-ink/75">
            <FileText className="w-3 h-3" /> {action}
          </span>
        );
    }
  };

  const renderDetails = (detailsStr) => {
    if (!detailsStr) return <span className="text-ink/40 font-mono text-[11px]">No metadata</span>;
    try {
      const parsed = JSON.parse(detailsStr);
      return (
        <div className="space-y-1 font-mono text-[11px] text-ink/80 max-w-sm">
          {Object.entries(parsed).map(([k, v]) => (
            <div key={k} className="truncate">
              <strong className="text-pine font-semibold">{k}:</strong>{' '}
              <span>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return <span className="font-mono text-[11px] text-ink/80">{detailsStr}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-pine font-bold">
            Compliance & Security
          </span>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink tracking-tight">
            System Audit & Governance Log
          </h1>
          <p className="text-xs text-ink/70 mt-1">
            Immutable tracking of administrative actions: settings modifications, pesticide protocol revisions, account provisioning, and triage.
          </p>
        </div>

        {/* Action Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-pine" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input-field text-xs py-1.5 px-3 w-48"
          >
            <option value="">All Action Types</option>
            <option value="settings_update">Settings Modifications</option>
            <option value="pesticide_create">Pesticide Created</option>
            <option value="pesticide_version_update">Pesticide Version Updated</option>
            <option value="user_created">User Provisioned</option>
            <option value="user_status_update">User Active/Deactivated</option>
            <option value="user_role_update">User Role Changed</option>
            <option value="review_triage">Review Triage</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rust/10 border border-rust/30 text-rust-dark flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rust" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchLogs}
            className="text-xs font-bold text-rust hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="leaf-card p-12 text-center text-xs font-mono text-ink/60 animate-pulse">
          Loading audit trail records...
        </div>
      ) : logs.length === 0 ? (
        <div className="leaf-card py-16 px-6 text-center border-2 border-dashed border-pine/25 space-y-3">
          <ShieldCheck className="w-12 h-12 text-pine/30 mx-auto" />
          <h3 className="font-heading font-bold text-lg text-ink">No Audit Records</h3>
          <p className="text-xs text-ink/70">
            {actionFilter
              ? `No actions matching "${actionFilter}" have been recorded.`
              : 'Audit log is currently empty. Administrative actions will automatically log here.'}
          </p>
        </div>
      ) : (
        <div className="leaf-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-pine/5 text-ink uppercase font-mono border-b border-pine/20">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold">Action Triggered</th>
                  <th className="py-3.5 px-4 font-semibold">Target Entity</th>
                  <th className="py-3.5 px-4 font-semibold">Initiating Admin</th>
                  <th className="py-3.5 px-4 font-semibold">Action Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pine/10">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-pine/5 transition">
                    <td className="py-3.5 px-4 font-mono text-ink/75 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-pine" />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-ink whitespace-nowrap">
                      <span className="font-bold text-pine uppercase">{log.entity_type}</span>
                      {log.entity_id && <span className="text-ink/60"> #{log.entity_id}</span>}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-ink font-semibold">
                      {log.user_email || `User #${log.user_id}`}
                    </td>

                    <td className="py-3.5 px-4">
                      {renderDetails(log.details)}
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
