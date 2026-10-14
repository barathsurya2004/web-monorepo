import React, { useEffect, useRef, useState } from 'react';
import { Camera, Clipboard, Upload, X, Sparkles, CheckCircle2, Plus } from 'lucide-react';
import { api } from '../services/api';
import { PendingMealJob } from '../types';

interface ClipboardPasteZoneProps {
  onJobStarted: (job: PendingMealJob) => void;
  onJobIdAssigned?: (tempJobId: string, realJobId: string) => void;
  onManualClick: () => void;
}

export const ClipboardPasteZone: React.FC<ClipboardPasteZoneProps> = ({
  onJobStarted,
  onJobIdAssigned,
  onManualClick,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mealType, setMealType] = useState<string>('lunch');
  const [notes, setNotes] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Global clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            handleImageSelected(file);
            showToast('📋 Photo captured from clipboard! Ready to queue.');
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getAutoMealType = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    if (hour >= 16 && hour < 22) return 'dinner';
    return 'snack';
  };

  const handleImageSelected = (file: File | Blob) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setMealType(getAutoMealType());
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (files.length === 1) {
      handleImageSelected(files[0]);
    } else {
      // Multiple photos selected: queue all of them immediately in parallel!
      Array.from(files).forEach((file, idx) => {
        if (!file.type.startsWith('image/')) return;
        queueFileAsync(file, getAutoMealType(), idx === 0 ? 'Batch snapshot 1' : `Batch snapshot ${idx + 1}`);
      });
      showToast(`⚡ Queued ${files.length} photos in Today's Meals!`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setNotes('');
  };

  // Completely async submission: moves immediately to Today's Meals without blocking further requests
  const queueFileAsync = (file: File | Blob, chosenMealType: string, customNotes?: string) => {
    const tempJobId = 'client-temp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const objectUrl = URL.createObjectURL(file);

    // 1. Immediately inform parent that a new job is processing in Today's Meals
    onJobStarted({
      job_id: tempJobId,
      meal_type: chosenMealType,
      notes: customNotes || undefined,
      preview_url: objectUrl,
      created_at: new Date().toISOString(),
      status: 'PENDING',
      stage: 'Uploading photo to AI engine...',
    });

    // 2. Dispatches network upload asynchronously in background
    api.uploadMealImage(file, chosenMealType, customNotes)
      .then((res) => {
        if (res && res.job_id && res.job_id !== tempJobId) {
          onJobIdAssigned?.(tempJobId, res.job_id);
        }
      })
      .catch((err) => {
        console.error('Async upload failed:', err);
      });
  };

  const handleQueueCurrent = () => {
    if (!selectedFile) return;

    const fileToQueue = selectedFile;
    const typeToQueue = mealType;
    const notesToQueue = notes;

    // Immediately reset UI so user can make more requests without waiting
    handleClear();

    // Send to background processing
    queueFileAsync(fileToQueue, typeToQueue, notesToQueue);
    showToast('⏳ Uploading photo to cloud... Please keep the app open!');
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-ink-850/95 backdrop-blur-xl border border-mint/40 text-mint text-xs font-semibold shadow-2xl shadow-mint/20 flex items-center gap-2 animate-rise max-w-sm sm:max-w-md w-[92%]">
          <CheckCircle2 className="w-4 h-4 text-mint shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Primary Action Buttons & Dropzone Card */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`velvet-card rounded-2xl p-4 sm:p-5 border transition-all w-full ${
          isDragging
            ? 'border-mint bg-mint/5 ring-2 ring-mint/20'
            : 'border-white/10 velvet-card-hover'
        }`}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-mint/20 to-lav/20 border border-mint/30 flex items-center justify-center mb-2.5 sm:mb-3 shadow-lg shadow-mint/5">
            <Clipboard className="w-5 h-5 sm:w-6 sm:h-6 text-mint animate-pulse" />
          </div>

          <h3 className="font-display font-bold text-base sm:text-lg text-fg mb-1">
            Snap, Upload, or Paste Meal Photo
          </h3>
          <p className="text-[11px] sm:text-xs text-muted max-w-sm mb-3.5 sm:mb-4">
            Press <kbd className="px-1.5 py-0.5 rounded bg-ink-800 border border-white/10 font-mono text-[10px] text-fg">Cmd+V</kbd> or paste from clipboard. Tasks process asynchronously in Today's Meals so you can add multiple meals anytime.
          </p>

          {/* Action Row: 2 columns on mobile, 3 columns on tablet/desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-md">
            {/* Camera Snap for Mobile */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="px-3 py-2.5 rounded-xl bg-mint/15 hover:bg-mint/25 border border-mint/30 text-mint text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-mint/5 min-w-0"
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span className="truncate">Take Photo</span>
            </button>

            {/* Gallery Upload (Supports multiple) */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2.5 rounded-xl bg-ink-800 hover:bg-ink-750 border border-white/10 text-fg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 min-w-0"
            >
              <Upload className="w-4 h-4 text-lav shrink-0" />
              <span className="truncate">Upload Photos</span>
            </button>

            {/* Manual Entry */}
            <button
              onClick={onManualClick}
              className="col-span-2 sm:col-span-1 px-3 py-2.5 rounded-xl bg-ink-850 hover:bg-ink-800 border border-white/5 text-muted hover:text-fg text-xs font-semibold transition-all flex items-center justify-center min-w-0"
            >
              <span className="truncate">Manual Log</span>
            </button>
          </div>

          {/* Hidden file inputs */}
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
        </div>
      </div>

      {/* Confirmation & Tagging Dialog (appears once an image is chosen, instantly dispatches and frees dropzone on submit) */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fade">
          <div className="bg-ink-900 border border-white/15 rounded-2xl w-full max-w-md p-5 shadow-2xl animate-pop">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-mint" />
                <h4 className="font-display font-bold text-base text-fg">
                  Ready to Parse Meal
                </h4>
              </div>
              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail Preview */}
            <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4 border border-white/10 bg-black/40 flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Meal Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-mint">
                Ready to queue
              </div>
            </div>

            {/* Meal Type selection */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Meal Category
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
                {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMealType(type)}
                    className={`py-2 rounded-xl capitalize transition-all ${
                      mealType === type
                        ? 'bg-mint text-ink-950 font-bold shadow-md shadow-mint/20'
                        : 'bg-ink-800 text-muted hover:text-fg border border-white/5'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Notes */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                Notes / Context (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Cooked with olive oil, had 2 glasses of water"
                className="w-full px-3 py-2 rounded-xl bg-ink-800 border border-white/10 text-fg text-xs placeholder:text-muted/60 focus:outline-none focus:border-mint"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 py-2.5 rounded-xl bg-ink-800 border border-white/10 text-xs font-semibold text-muted hover:text-fg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQueueCurrent}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-mint to-mint/90 text-ink-950 text-xs font-bold flex items-center justify-center gap-2 hover:opacity-95 active:scale-98 transition-all shadow-lg shadow-mint/20 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Extract with AI</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
