import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import PrintableReport from '../../components/PrintableReport';
import {
  Images,
  Search,
  Tag,
  MapPin,
  FileText,
  Calendar,
  Filter,
  Download,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function Submissions() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [filterPlant, setFilterPlant] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [selectedScanDetail, setSelectedScanDetail] = useState(null);

  const fetchScans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.admin.getScans({
        plantLabel: filterPlant,
        location: filterLocation,
      });
      setScans(data);
    } catch (err) {
      console.error('Failed to load raw submissions:', err);
      setError(err.message || 'Unable to retrieve submissions gallery.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [filterPlant, filterLocation]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      await api.admin.exportScans();
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleOpenReport = async (scanId) => {
    try {
      const detail = await api.getScanDetails(scanId);
      setSelectedScanDetail(detail);
    } catch (err) {
      alert(`Could not load report: ${err.message}`);
    }
  };

  const classBadges = {
    Immune: 'bg-moss text-paper',
    Resistant: 'bg-moss-light text-paper',
    MR: 'bg-amber text-ink',
    MS: 'bg-rust-light text-paper',
    S: 'bg-rust text-paper',
    HS: 'bg-deeprust text-paper',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-pine font-bold">
            Audit Gallery
          </span>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink tracking-tight">
            Raw User Submissions Gallery
          </h1>
          <p className="text-xs text-ink/70 mt-1">
            Audit every raw leaf image submitted across all customer accounts with full diagnostic reports and metadata.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-pine absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter plant/field..."
              value={filterPlant}
              onChange={(e) => setFilterPlant(e.target.value)}
              className="input-field pl-8 pr-3 py-1.5 text-xs w-40 sm:w-48"
            />
          </div>

          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-pine absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter location..."
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="input-field pl-8 pr-3 py-1.5 text-xs w-36 sm:w-44"
            />
          </div>

          <button
            type="button"
            disabled={exporting}
            onClick={handleExportCSV}
            className="btn-secondary text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? 'Exporting...' : 'Export Scans CSV'}
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
            onClick={fetchScans}
            className="text-xs font-bold text-rust hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="leaf-card p-4 animate-pulse space-y-3">
              <div className="aspect-square bg-pine/15 rounded-xl w-full" />
              <div className="h-4 bg-pine/15 rounded w-2/3" />
              <div className="h-3 bg-pine/10 rounded w-1/2" />
              <div className="h-8 bg-pine/10 rounded-lg w-full mt-2" />
            </div>
          ))}
        </div>
      ) : scans.length === 0 ? (
        <div className="leaf-card py-16 px-6 text-center border-2 border-dashed border-pine/25 space-y-3">
          <Images className="w-12 h-12 text-pine/30 mx-auto" />
          <h3 className="font-heading font-bold text-lg text-ink">No Submissions Found</h3>
          <p className="text-xs text-ink/70">
            {filterPlant || filterLocation
              ? 'No historical submissions match the selected filters. Try broadening your search.'
              : 'No leaf diagnostic scans have been uploaded yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {scans.map((scan) => (
            <div
              key={scan.id}
              className="leaf-card overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Raw image thumbnail */}
                <div className="relative aspect-square w-full bg-ink/90 overflow-hidden group">
                  <img
                    src={scan.image_path}
                    alt={`Scan ${scan.id}`}
                    className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-ink/80 text-paper text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-sm">
                    #{scan.id} • User #{scan.user_id}
                  </div>
                  <div
                    className={`absolute top-2 right-2 text-[10px] font-heading font-bold px-2 py-0.5 rounded shadow ${
                      classBadges[scan.predicted_class] || 'bg-pine text-paper'
                    }`}
                  >
                    {scan.predicted_class}
                  </div>
                </div>

                {/* Metadata */}
                <div className="p-3.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-mono text-[11px] text-ink/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-pine" />
                      {new Date(scan.created_at).toLocaleDateString()}
                    </span>
                    <span>{(scan.confidence * 100).toFixed(0)}% conf</span>
                  </div>

                  <p className="font-heading font-bold text-ink flex items-center gap-1 truncate">
                    <Tag className="w-3.5 h-3.5 text-pine flex-shrink-0" />
                    <span>{scan.plant_label || 'Unlabeled Plant'}</span>
                  </p>

                  <p className="text-ink/70 flex items-center gap-1 truncate text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-pine flex-shrink-0" />
                    <span>{scan.location || 'Unknown Location'}</span>
                  </p>

                  <div className="pt-1.5 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-ink/60">Tissue Severity:</span>
                    <strong className="text-rust-dark font-heading font-bold">{scan.severity_pct.toFixed(1)}%</strong>
                  </div>
                </div>
              </div>

              {/* Action Button: Link to full generated report */}
              <div className="p-3 pt-0">
                <button
                  type="button"
                  onClick={() => handleOpenReport(scan.id)}
                  className="w-full py-1.5 rounded-xl bg-pine/10 hover:bg-pine hover:text-paper text-pine font-heading font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View Full Report
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
