import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CameraCapture from '../components/CameraCapture';
import SideBySideView from '../components/SideBySideView';
import SeverityBar from '../components/SeverityBar';
import RiskSlider from '../components/RiskSlider';
import TreatmentCard from '../components/TreatmentCard';
import PrintableReport from '../components/PrintableReport';
import { Play, Sparkles, MapPin, Tag, Cpu, RotateCcw, AlertCircle, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';

const DEFAULT_8_ARCHITECTURES = [
  { name: 'MobileNetV2', status: 'available' },
  { name: 'EfficientNetB0', status: 'available' },
  { name: 'ResNet50', status: 'not_deployed' },
  { name: 'DenseNet121', status: 'not_deployed' },
  { name: 'InceptionV3', status: 'not_deployed' },
  { name: 'VGG16', status: 'not_deployed' },
  { name: 'ViT-B16', status: 'not_deployed' },
  { name: 'Xception', status: 'available' },
];

export default function UserPipeline() {
  const { user } = useAuth();

  // Staged input state
  const [selectedFile, setSelectedFile] = useState(null);
  const [plantLabel, setPlantLabel] = useState('');
  const [locationInput, setLocationInput] = useState(user?.location || 'Salina, KS');
  const [selectedModel, setSelectedModel] = useState('MobileNetV2');
  const [forecastDays, setForecastDays] = useState(7);

  // Dynamic admin config controls
  const [manualModelAllowed, setManualModelAllowed] = useState(true);
  const [maxForecastDays, setMaxForecastDays] = useState(15);
  const [imagesPerScan, setImagesPerScan] = useState(1);
  const [availableModels, setAvailableModels] = useState([]);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [backendError, setBackendError] = useState(null);

  // Execution & result state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inferenceStep, setInferenceStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Load platform models and settings on mount
  useEffect(() => {
    async function fetchPlatformSettings() {
      try {
        setBackendError(null);
        // Load available registered models via grower-accessible route
        const models = await api.getModelsList().catch(() => []);
        if (models && models.length > 0) {
          setAvailableModels(models);
          const defaultMod = models.find((m) => m.is_default && m.status === 'available') || models.find((m) => m.status === 'available');
          if (defaultMod) setSelectedModel(defaultMod.name);
        } else {
          setAvailableModels(DEFAULT_8_ARCHITECTURES);
          setSelectedModel('MobileNetV2');
        }
      } catch (err) {
        console.warn('Could not load models/settings:', err);
        setBackendError('Backend service unreachable or model registry not loaded.');
      }
    }
    fetchPlatformSettings();
  }, []);

  // Submit scan pipeline
  const handleRunDiagnosis = async () => {
    if (!selectedFile) {
      setErrorMsg('Please capture or select a leaf photo first.');
      return;
    }
    const currentList = availableModels.length > 0 ? availableModels : DEFAULT_8_ARCHITECTURES;
    const currentMod = currentList.find((m) => m.name === selectedModel);
    if (currentMod && currentMod.status !== 'available') {
      setErrorMsg(`Model "${selectedModel}" is not deployed yet. Please choose an available model.`);
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    setInferenceStep(1);

    // Simulate animated progress steps for visual feedback
    const stepTimer = setInterval(() => {
      setInferenceStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 450);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      if (plantLabel.trim()) formData.append('plant_label', plantLabel.trim());
      if (locationInput.trim()) formData.append('location', locationInput.trim());
      if (selectedModel) formData.append('model_requested', selectedModel);
      formData.append('forecast_days', forecastDays.toString());

      const result = await api.createScan(formData);
      setDiagnosticResult(result);
    } catch (err) {
      console.error('Scan submission error:', err);
      setErrorMsg(err.message || 'Diagnosis failed. Check connection to backend.');
    } finally {
      clearInterval(stepTimer);
      setIsSubmitting(false);
      setInferenceStep(0);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setDiagnosticResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 sm:space-y-8">
      {/* Title & Diagnostic Seam Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pine/10 border border-pine/20 text-pine text-xs font-mono font-bold tracking-wider uppercase">
          Alternaria Blight Intelligence
        </div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-ink tracking-tight">
          Sunflower Leaf Diagnosis
        </h1>
        <p className="text-sm text-ink-muted font-body leading-relaxed">
          Upload a field leaf specimen to run real-time MobileNetV2 classification,
          CAM lesion segmentation, and 15-day Open-Meteo epidemiological forecasting.
        </p>
      </div>

      {/* Backend connection warning */}
      {backendError && (
        <div className="p-4 rounded-xl bg-amber-surface border border-amber/30 text-amber-dark text-xs sm:text-sm flex items-center gap-3 font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber" />
          <span>{backendError}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rust-surface border border-rust/30 text-rust-dark text-xs sm:text-sm flex items-center gap-3 font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rust" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Review Queue Notice if flagged */}
      {diagnosticResult?.scan?.status === 'pending_review' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-surface border border-amber/40 text-ink flex items-start gap-3.5 shadow-clean">
          <Clock className="w-5 h-5 text-amber flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-heading font-bold text-sm text-ink">
              Quality Assurance Notice: Dispatched to Agronomist Review Queue
            </h4>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed font-body">
              This specimen triggered an automated quality threshold (confidence &lt; 70% or lesion severity &gt; 60%).
              Estimated results are rendered below while the scan is triaged by agricultural specialists.
            </p>
          </div>
        </div>
      )}

      {/* Step 1: Specimen Acquisition Drop Zone */}
      {!diagnosticResult && (
        <CameraCapture
          onImageSelected={(file) => {
            setSelectedFile(file);
            setErrorMsg(null);
          }}
          maxImages={imagesPerScan}
        />
      )}

      {/* Progress State During Inference */}
      {isSubmitting && (
        <div className="leaf-card p-8 bg-white text-center space-y-4 shadow-clean animate-fadeIn">
          <div className="w-12 h-12 mx-auto rounded-full bg-pine/10 border border-pine/20 flex items-center justify-center text-pine">
            <div className="w-6 h-6 border-3 border-pine border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-ink">
              Analyzing Leaf Specimen...
            </h3>
            <p className="text-xs text-ink-muted font-mono mt-1">
              {inferenceStep === 1 && 'Step 1/3: Normalizing image tensor to PyTorch input...'}
              {inferenceStep === 2 && `Step 2/3: Executing ${selectedModel || 'model'} forward pass & class activation...`}
              {inferenceStep >= 3 && 'Step 3/3: Querying Open-Meteo live weather & computing spread risk...'}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-surface border border-amber/30 text-amber-dark text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-amber" />
              <span>Loading model, first scan is slower</span>
            </div>
          </div>
          <div className="max-w-xs mx-auto w-full bg-agri-neutral h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-pine transition-all duration-300"
              style={{ width: `${(inferenceStep / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Step 1B: Metadata & Diagnosis Action */}
      {!diagnosticResult && !isSubmitting && (
        <div className="leaf-card p-6 bg-white shadow-clean space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Field Label */}
            <div>
              <label className="block text-xs font-mono font-bold text-ink uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-pine" />
                Plot / Field Label (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Plot A - North Field, Row 8"
                value={plantLabel}
                onChange={(e) => setPlantLabel(e.target.value)}
                className="input-field"
              />
              <span className="text-[11px] text-ink-subtle mt-1 block font-body">
                Tracking repeated plot tags unlocks automated progression trend analysis.
              </span>
            </div>

            {/* Location Input */}
            <div>
              <label className="block text-xs font-mono font-bold text-ink uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-pine" />
                Field Location (For Weather Models)
              </label>
              <input
                type="text"
                placeholder="e.g. Salina, KS or Fargo, ND"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="input-field"
              />
              <span className="text-[11px] text-ink-subtle mt-1 block font-body">
                Queries Open-Meteo live forecasts to calculate localized disease pressure.
              </span>
            </div>
          </div>

          {/* Forecast Days Initial Preference */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-xs font-mono text-ink mb-2">
              <span className="font-semibold">Risk Forecast Horizon (Rule-Based Estimate):</span>
              <strong className="text-pine font-bold bg-agri-neutral px-2.5 py-0.5 rounded-full border border-agri-border">
                {forecastDays} Days
              </strong>
            </div>
            <input
              type="range"
              min="1"
              max={maxForecastDays}
              value={forecastDays}
              onChange={(e) => setForecastDays(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-agri-border-strong rounded-lg appearance-none cursor-pointer accent-pine"
            />
          </div>

          {/* Model selection & Run CTA */}
          <div className="pt-2 border-t border-agri-border space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Cpu className="w-4 h-4 text-pine flex-shrink-0" />
                  <span className="text-xs font-mono font-bold text-ink">Active Model:</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-pine/10 text-pine font-semibold">
                    {selectedModel || 'MobileNetV2'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowModelPicker(!showModelPicker)}
                    className="text-xs text-pine underline ml-1 font-medium hover:text-pine-dark"
                  >
                    {showModelPicker ? 'Hide models' : 'Change model'}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunDiagnosis}
                disabled={isSubmitting || !selectedFile}
                className="btn-primary w-full sm:w-auto py-3 px-8 text-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                Run Alternaria Diagnosis
              </button>
            </div>

            {/* Always List All 8 Architectures */}
            {showModelPicker && (
              <div className="p-4 rounded-xl bg-agri-neutral/30 border border-agri-border space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-ink uppercase tracking-wider">
                    Select Neural Architecture (All 8 Architectures)
                  </span>
                  <span className="text-[11px] font-mono text-ink-muted">
                    Lazy-loaded & cached on first scan
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {(availableModels.length > 0 ? availableModels : DEFAULT_8_ARCHITECTURES).map((m) => {
                    const isAvail = m.status === 'available';
                    const isSelected = selectedModel === m.name;
                    return (
                      <button
                        key={m.name}
                        type="button"
                        disabled={!isAvail}
                        onClick={() => {
                          if (isAvail) setSelectedModel(m.name);
                        }}
                        className={`text-left p-3 rounded-lg border text-xs transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-pine/10 border-pine ring-1 ring-pine text-ink shadow-xs'
                            : isAvail
                            ? 'bg-white border-agri-border hover:border-pine/50 text-ink cursor-pointer'
                            : 'bg-paper/40 border-dashed border-agri-border-strong text-ink-muted opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-heading font-bold text-sm text-ink truncate">
                            {m.name}
                          </span>
                          {m.is_default && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-moss text-paper rounded font-bold">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-agri-border/40">
                          {isAvail ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-moss-dark font-semibold">
                              <CheckCircle2 className="w-3 h-3 text-moss" />
                              {m.accuracy != null ? `${(m.accuracy * 100).toFixed(1)}% acc` : 'Verified'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-agri-neutral text-ink-muted font-medium">
                              Not deployed yet
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sequential Pipeline Results Section */}
      {diagnosticResult && (
        <div className="space-y-6 sm:space-y-8 animate-fadeIn">
          {/* Action Header */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-agri-border shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-moss" />
              <span className="text-xs font-mono font-bold text-ink">Diagnosis Complete</span>
              <span className="text-xs text-ink-muted hidden sm:inline">
                · Model: {diagnosticResult.scan.model_used}
              </span>
            </div>
            <button
              onClick={handleReset}
              className="btn-secondary text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Scan Another Specimen
            </button>
          </div>

          {/* Step 2: Side-by-Side Visual Result with Probability Bars */}
          <SideBySideView
            originalUrl={diagnosticResult.scan.image_path}
            overlayUrl={diagnosticResult.scan.overlay_image_path}
            predictedClass={diagnosticResult.scan.predicted_class}
            confidence={diagnosticResult.scan.confidence}
            probabilities={diagnosticResult.scan.probabilities || {}}
          />

          {/* Step 3: Severity Breakdown & Trend */}
          <SeverityBar
            healthyPct={diagnosticResult.scan.healthy_pct}
            diseasedPct={diagnosticResult.scan.severity_pct}
            trendNote={diagnosticResult.trend_note}
            plantLabel={diagnosticResult.scan.plant_label}
          />

          {/* Step 4: Risk Outlook with Slider */}
          <RiskSlider
            riskProjection={diagnosticResult.risk_projection}
            selectedDays={forecastDays}
            onDaysChange={(days) => setForecastDays(days)}
            maxAllowedDays={maxForecastDays}
          />

          {/* Step 5: Treatment Protocol & Download Report */}
          <TreatmentCard
            recommendation={diagnosticResult.recommendation}
            onDownloadReport={() => setShowPrintModal(true)}
          />
        </div>
      )}

      {/* Printable Report Modal */}
      {showPrintModal && (
        <PrintableReport
          scanDetail={diagnosticResult}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
