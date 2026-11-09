import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Upload, Check, AlertCircle, FileImage, X, Image as ImageIcon } from 'lucide-react';

export default function CameraCapture({ onImageSelected, maxImages = 1 }) {
  const [mode, setMode] = useState('upload'); // Default to upload drop zone
  const [streamActive, setStreamActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Initialize camera stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported by your browser environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreamActive(true);
    } catch (err) {
      setCameraError(err.message || 'Camera permission denied or camera hardware unavailable.');
      setStreamActive(false);
      setMode('upload');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setStreamActive(false);
  };

  useEffect(() => {
    if (mode === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, capturedImage]);

  // Shutter action
  const handleShutter = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsProcessing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `sunflower_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);
        setCapturedImage({ file, previewUrl, name: file.name, size: (file.size / 1024).toFixed(0) + ' KB' });
        onImageSelected(file);
        stopCamera();
      }
      setIsProcessing(false);
    }, 'image/jpeg', 0.92);
  };

  const handleRetake = () => {
    if (capturedImage?.previewUrl) {
      URL.revokeObjectURL(capturedImage.previewUrl);
    }
    setCapturedImage(null);
    setFileError(null);
    onImageSelected(null);
    if (mode === 'camera') {
      startCamera();
    }
  };

  const processSelectedFile = (file) => {
    setFileError(null);
    if (!file) return;

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase()) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      setFileError('Invalid file type. Please upload a JPEG, PNG, or WebP leaf photograph.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const sizeStr = file.size > 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' 
      : (file.size / 1024).toFixed(0) + ' KB';

    setCapturedImage({ file, previewUrl, name: file.name, size: sizeStr });
    onImageSelected(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  return (
    <div className="leaf-card p-6 bg-white shadow-clean">
      {/* Header controls & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-agri-border">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-pine font-bold">
            Step 1: Leaf Image Acquisition
          </span>
          <h3 className="font-heading font-bold text-xl text-ink flex items-center gap-2 mt-0.5">
            <Camera className="w-5 h-5 text-pine" />
            Upload or Capture Sunflower Specimen
          </h3>
          <p className="text-xs text-ink-muted mt-0.5 font-body">
            Position a single sunflower leaf clearly in frame under natural or even lighting.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="inline-flex rounded-xl p-1 bg-agri-neutral border border-agri-border text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              setMode('upload');
              setCameraError(null);
            }}
            className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
              mode === 'upload' ? 'bg-white text-pine font-bold shadow-clean' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Photo
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('camera');
              setCameraError(null);
            }}
            className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
              mode === 'camera' ? 'bg-white text-pine font-bold shadow-clean' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Live Camera
          </button>
        </div>
      </div>

      {/* Errors */}
      {fileError && (
        <div className="mb-4 p-3 rounded-xl bg-rust/10 border border-rust/30 text-rust-dark text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rust" />
          <span>{fileError}</span>
        </div>
      )}

      {cameraError && (
        <div className="mb-4 p-3 rounded-xl bg-amber/10 border border-amber/30 text-amber-dark text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber" />
          <span>{cameraError} (Switched to upload mode)</span>
        </div>
      )}

      {/* Main Viewport Container */}
      <div className="relative rounded-2xl overflow-hidden border border-agri-border bg-paper min-h-[340px] flex items-center justify-center">
        {capturedImage ? (
          /* Captured/Uploaded Preview */
          <div className="relative w-full h-[360px] flex items-center justify-center bg-ink/5 p-4">
            <img
              src={capturedImage.previewUrl}
              alt="Leaf specimen"
              className="max-h-full max-w-full object-contain rounded-xl shadow-clean"
            />
            {/* File info overlay tag */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-xs border border-agri-border text-xs text-ink font-mono shadow-xs">
              <span className="truncate max-w-[220px] font-semibold">{capturedImage.name}</span>
              <span className="text-ink-muted">{capturedImage.size}</span>
            </div>
          </div>
        ) : mode === 'camera' ? (
          /* Live Viewfinder */
          <div className="relative w-full h-[360px] bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Target Reticle Overlay */}
            <div className="absolute inset-8 border-2 border-dashed border-white/60 rounded-2xl pointer-events-none flex items-center justify-center">
              <span className="text-xs font-mono text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                Center leaf inside reticle
              </span>
            </div>
          </div>
        ) : (
          /* Large Drag & Drop Upload Zone */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full h-[340px] flex flex-col items-center justify-center p-8 text-center cursor-pointer transition border-2 border-dashed rounded-2xl ${
              isDragging
                ? 'border-pine bg-pine/5 scale-[0.99]'
                : 'border-agri-border-strong hover:border-pine/60 hover:bg-white/80'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-pine/10 border border-pine/20 flex items-center justify-center text-pine mb-4 transition transform group-hover:scale-105">
              <Upload className="w-7 h-7" />
            </div>

            <h4 className="font-heading font-bold text-base sm:text-lg text-ink">
              Drop sunflower leaf photo here, or <span className="text-pine underline decoration-pine/40">browse files</span>
            </h4>
            <p className="text-xs text-ink-muted max-w-sm mt-1.5 font-body leading-relaxed">
              Upload standard digital camera or smartphone leaf photos (JPEG, PNG, WebP up to 25MB).
            </p>

            <div className="mt-4 flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-agri-neutral text-[11px] font-mono font-medium text-ink-muted">
                JPG · PNG · WEBP
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-agri-neutral text-[11px] font-mono font-medium text-ink-muted">
                Max 1 Specimen
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Control Actions */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {capturedImage ? (
          <div className="w-full flex items-center justify-between">
            <span className="text-xs text-moss font-semibold flex items-center gap-1.5 font-mono">
              <Check className="w-4 h-4 text-moss" /> Leaf Image Staged & Ready
            </span>
            <button
              type="button"
              onClick={handleRetake}
              className="btn-secondary text-xs text-rust border-rust/40 hover:bg-rust/10"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Replace Photo
            </button>
          </div>
        ) : mode === 'camera' ? (
          <div className="w-full flex justify-center py-1">
            <button
              type="button"
              onClick={handleShutter}
              disabled={isProcessing || !streamActive}
              className="w-16 h-16 rounded-full bg-white border-4 border-pine shadow-clean-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
              title="Capture Leaf Photo"
            >
              <div className="w-11 h-11 rounded-full bg-pine flex items-center justify-center text-white">
                <Camera className="w-5 h-5" />
              </div>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
