import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Plus,
  Edit2,
  History,
  Check,
  X,
  FlaskConical,
  AlertCircle,
  Save,
  Download,
  RefreshCw,
} from 'lucide-react';

export default function PesticideTable() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const [formData, setFormData] = useState({
    severity_band: 'MR/MS',
    active_ingredient: '',
    dosage: '',
    source: '',
  });

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.getPesticides(includeArchived);
      setEntries(data);
    } catch (err) {
      console.error('Failed to load pesticide table:', err);
      setError(err.message || 'Unable to load reference protocols.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [includeArchived]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      await api.admin.exportPesticides();
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.admin.createPesticide(formData);
      setShowAddModal(false);
      setFormData({ severity_band: 'MR/MS', active_ingredient: '', dosage: '', source: '' });
      fetchEntries();
    } catch (err) {
      alert(`Create failed: ${err.message}`);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingEntry) return;
    try {
      // Versioned update: marks old as inactive and creates version + 1
      await api.admin.updatePesticide(editingEntry.id, formData);
      setEditingEntry(null);
      setFormData({ severity_band: 'MR/MS', active_ingredient: '', dosage: '', source: '' });
      fetchEntries();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const openEditModal = (entry) => {
    setEditingEntry(entry);
    setFormData({
      severity_band: entry.severity_band,
      active_ingredient: entry.active_ingredient,
      dosage: entry.dosage,
      source: entry.source,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-pine font-bold">
            Agronomic Guidelines
          </span>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink tracking-tight">
            Pesticide & Dosage Reference Table
          </h1>
          <p className="text-xs text-ink/70 mt-1">
            Authoritative treatment guidelines indexed by disease severity band. Revisions are strictly version-tracked.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-mono text-ink/80 cursor-pointer">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="w-4 h-4 text-pine rounded border-pine/40 focus:ring-pine cursor-pointer"
            />
            <span>Show Superseded Versions</span>
          </label>

          <button
            type="button"
            disabled={exporting}
            onClick={handleExportCSV}
            className="btn-secondary text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? 'Exporting...' : 'Export Pesticides CSV'}
          </button>

          <button
            type="button"
            onClick={() => {
              setFormData({ severity_band: 'MR/MS', active_ingredient: '', dosage: '', source: '' });
              setShowAddModal(true);
            }}
            className="btn-primary text-xs"
          >
            <Plus className="w-4 h-4" />
            Add New Protocol
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rust/10 border border-rust/30 text-rust-dark flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rust" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchEntries}
            className="text-xs font-bold text-rust hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="leaf-card p-12 text-center text-xs font-mono text-ink/60 animate-pulse">
          Loading pesticide reference table...
        </div>
      ) : entries.length === 0 ? (
        <div className="leaf-card py-16 px-6 text-center border-2 border-dashed border-pine/25 space-y-3">
          <FlaskConical className="w-12 h-12 text-pine/30 mx-auto" />
          <h3 className="font-heading font-bold text-lg text-ink">No Treatment Protocols</h3>
          <p className="text-xs text-ink/70">
            {includeArchived
              ? 'No protocol entries found in database.'
              : 'No active protocol entries found. Enable "Show Superseded Versions" or add a new entry.'}
          </p>
        </div>
      ) : (
        <div className="leaf-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-pine/5 text-ink uppercase font-mono border-b border-pine/20">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Severity Band</th>
                  <th className="py-3.5 px-4 font-semibold">Active Ingredient / Commercial Product</th>
                  <th className="py-3.5 px-4 font-semibold">Dosage Rate</th>
                  <th className="py-3.5 px-4 font-semibold">Source Citation</th>
                  <th className="py-3.5 px-4 font-semibold">Version</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pine/10">
                {entries.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition ${!item.is_active ? 'bg-ink/5 opacity-60' : 'hover:bg-pine/5'}`}
                  >
                    <td className="py-3.5 px-4 font-heading font-bold text-ink">
                      {item.severity_band}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-ink max-w-xs">
                      {item.active_ingredient}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-rust-dark font-bold">
                      {item.dosage}
                    </td>

                    <td className="py-3.5 px-4 text-ink/75 max-w-xs truncate">
                      {item.source}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-pine">
                      v{item.version}
                    </td>

                    <td className="py-3.5 px-4">
                      {item.is_active ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-moss text-paper">
                          Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-ink/20 text-ink/70">
                          Archived
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {item.is_active && (
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg border border-pine/30 hover:bg-pine hover:text-paper text-pine transition"
                          title="Create Versioned Revision"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Modal */}
      {(showAddModal || editingEntry) && (
        <div className="fixed inset-0 z-50 bg-ink/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <form
            onSubmit={editingEntry ? handleUpdate : handleCreate}
            className="leaf-card text-ink w-full max-w-lg p-6 sm:p-8 space-y-4 border-2 border-pine/40 shadow-2xl animate-fadeIn"
          >
            <div className="flex items-center justify-between pb-3 border-b border-pine/15">
              <h3 className="font-heading font-bold text-lg">
                {editingEntry ? `Versioned Revision (from v${editingEntry.version})` : 'New Pesticide Entry'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingEntry(null);
                }}
                className="p-1 rounded-lg text-ink/60 hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingEntry && (
              <div className="p-3 rounded-xl bg-pine/10 text-xs text-pine-dark font-medium">
                Note: Submitting this edit will preserve v{editingEntry.version} in the audit log and create v{editingEntry.version + 1} as the active guideline.
              </div>
            )}

            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-ink/80 mb-1">
                Severity Band
              </label>
              <select
                value={formData.severity_band}
                onChange={(e) => setFormData({ ...formData, severity_band: e.target.value })}
                className="input-field"
              >
                <option value="Immune/Resistant">Immune / Resistant (Preventative)</option>
                <option value="MR/MS">MR / MS (Curative / Early Intervention)</option>
                <option value="S/HS">S / HS (Systemic / High Efficacy)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-ink/80 mb-1">
                Active Ingredient & Commercial Product Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Azoxystrobin 22.9% (Quadris Flowable)"
                value={formData.active_ingredient}
                onChange={(e) => setFormData({ ...formData, active_ingredient: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-ink/80 mb-1">
                Prescribed Application Dosage
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 6.0 - 9.0 fl oz / acre in 15 gal water"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase text-ink/80 mb-1">
                Ag Extension Citation / Scientific Source
              </label>
              <input
                type="text"
                required
                placeholder="e.g. NDSU Extension Sunflower Guide PP-1785 (2026)"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingEntry(null);
                }}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-xs"
              >
                <Save className="w-4 h-4" />
                {editingEntry ? 'Save New Version' : 'Add Entry'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
