'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion, DURATION, EASE, useMotionSafe } from '@/app/components/motion';
import { cn } from '@/lib/utils';

const ACCEPTED_TYPES = ['image/png', 'image/svg+xml', 'image/webp', 'image/jpeg'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

type UploadState = 'idle' | 'dragging' | 'uploading' | 'done' | 'error';

interface LogoUploadProps {
  currentUrl?: string | null;
  barName: string;
  onUploaded: (url: string) => void;
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export function LogoUpload({ currentUrl, barName, onUploaded }: LogoUploadProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl ?? null);
  const inputRef = useRef<HTMLInputElement>(null);
  const safe = useMotionSafe();

  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    return (
      <div className="rounded-xl border border-border/[var(--border-alpha,0.5)] bg-background/60 p-4 text-xs text-muted-foreground">
        Add <code className="rounded bg-muted px-1 py-0.5">NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> and{' '}
        <code className="rounded bg-muted px-1 py-0.5">NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET</code> to your{' '}
        <code className="rounded bg-muted px-1 py-0.5">.env</code> to enable logo uploads.
      </div>
    );
  }

  async function upload(file: File) {
    // Validate type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrorMsg('Unsupported file type. Use PNG, SVG, WebP, or JPEG.');
      setState('error');
      return;
    }
    // Validate size
    if (file.size > MAX_BYTES) {
      setErrorMsg(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`);
      setState('error');
      return;
    }

    setState('uploading');
    setErrorMsg(null);

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('upload_preset', UPLOAD_PRESET!);
      form.append('folder', 'bar-logos');

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: form }
      );

      if (!res.ok) {
        throw new Error(`Upload failed (${res.status})`);
      }

      const data = (await res.json()) as { secure_url: string };
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(data.secure_url);
      onUploaded(data.secure_url);
      setState('done');
    } catch (err) {
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(currentUrl ?? null);
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setState('error');
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    void upload(files[0]);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (state !== 'uploading') setState('dragging');
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setState(previewUrl ? 'done' : 'idle');
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  const isDragging = state === 'dragging';
  const isUploading = state === 'uploading';

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload logo — drag and drop or click to browse"
        onClick={() => !isUploading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !isUploading && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          isDragging
            ? 'border-primary/60 bg-primary/5 ring-2 ring-primary/20'
            : isUploading
            ? 'cursor-not-allowed border-border/40 bg-background/40'
            : 'border-border/[var(--border-alpha,0.5)] bg-background/60 hover:border-primary/40 hover:bg-primary/5',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/svg+xml,image/webp,image/jpeg"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={isUploading}
        />

        {/* Current / preview image */}
        <AnimatePresence mode="wait">
          {previewUrl && !isDragging ? (
            <motion.div
              key="preview"
              initial={safe ? { opacity: 0, scale: 0.95 } : undefined}
              animate={{ opacity: 1, scale: 1 }}
              exit={safe ? { opacity: 0, scale: 0.95 } : undefined}
              transition={{ duration: DURATION.fast, ease: EASE.out }}
              className="flex flex-col items-center gap-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={barName}
                className="max-h-16 max-w-[160px] object-contain"
              />
              {!isUploading && (
                <p className="text-xs text-muted-foreground">
                  {state === 'done' ? 'Uploaded — drop a new file to replace' : 'Drop a file or click to replace'}
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="prompt"
              initial={safe ? { opacity: 0 } : undefined}
              animate={{ opacity: 1 }}
              exit={safe ? { opacity: 0 } : undefined}
              transition={{ duration: DURATION.fast, ease: EASE.out }}
              className="flex flex-col items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="text-sm font-medium text-foreground">
                {isDragging ? 'Drop to upload' : 'Drag & drop your logo'}
              </p>
              <p className="text-xs text-muted-foreground">PNG, SVG, WebP or JPEG · max 5 MB</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        {isUploading && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden rounded-b-xl bg-border">
            <motion.div
              className="h-full bg-primary/70"
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        )}
      </div>

      {/* Error message */}
      <AnimatePresence>
        {errorMsg && (
          <motion.p
            key="error"
            initial={safe ? { opacity: 0, height: 0 } : undefined}
            animate={{ opacity: 1, height: 'auto' }}
            exit={safe ? { opacity: 0, height: 0 } : undefined}
            transition={{ duration: DURATION.micro, ease: EASE.out }}
            className="text-xs text-destructive"
          >
            {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
