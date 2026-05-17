/**
 * DropZone — Drag-and-drop PDF upload with progress tracking.
 */

import { useState, useCallback, useRef } from 'react';
import { uploadDocument, type UploadProgress } from '../api';
import { useStore } from '../store';
import type { DocumentInfo } from '../types';

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

export default function DropZone() {
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percent: 0 });
  const [error, setError] = useState<string>('');
  const [successFile, setSuccessFile] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);
  const addDocument = useStore((s) => s.addDocument);
  const selectSingleDoc = useStore((s) => s.selectSingleDoc);
  const setViewerDoc = useStore((s) => s.setViewerDoc);

  const handleFile = useCallback(
    async (file: File) => {
      setError('');
      setSuccessFile('');

      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setState('error');
        setError('Only PDF files are accepted');
        return;
      }

      if (file.size > MAX_SIZE) {
        setState('error');
        setError(`File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max is 20MB.`);
        return;
      }

      setState('uploading');
      setProgress({ loaded: 0, total: file.size, percent: 0 });

      try {
        const result = await uploadDocument(file, setProgress);
        setState('success');
        setSuccessFile(result.filename);

        const doc: DocumentInfo = {
          doc_id: result.doc_id,
          filename: result.filename,
          upload_time: new Date().toISOString(),
          page_count: result.page_count,
          chunk_count: result.chunk_count,
          file_size: file.size,
        };
        addDocument(doc);
        selectSingleDoc(result.doc_id);
        setViewerDoc(result.doc_id, result.page_count);

        setTimeout(() => setState('idle'), 3000);
      } catch (err) {
        setState('error');
        setError(err instanceof Error ? err.message : 'Upload failed');
      }
    },
    [addDocument, selectSingleDoc, setViewerDoc],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setState('idle');
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setState('dragging');
  };

  const onDragLeave = () => setState('idle');

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div
      id="upload-dropzone"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => state !== 'uploading' && fileRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed
        cursor-pointer transition-all duration-150 min-h-[120px]
        ${state === 'dragging' ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)]' : ''}
        ${state === 'uploading' ? 'border-[var(--color-border-default)] cursor-wait' : ''}
        ${state === 'success' ? 'border-[var(--color-success)] bg-[var(--color-success-dim)]' : ''}
        ${state === 'error' ? 'border-[var(--color-danger)] bg-[var(--color-danger-dim)]' : ''}
        ${state === 'idle' ? 'border-[var(--color-border-default)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]' : ''}
      `}
    >
      <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={onFileSelect} />

      {state === 'idle' && (
        <>
          <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>
          <span className="text-sm text-[var(--color-text-secondary)]">Drop PDF or click to upload</span>
          <span className="text-xs text-[var(--color-text-muted)]">Max 20MB</span>
        </>
      )}

      {state === 'dragging' && (
        <span className="text-sm text-[var(--color-accent)] font-medium">Drop to upload</span>
      )}

      {state === 'uploading' && (
        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
            <span>Uploading…</span>
            <span>{progress.percent}%</span>
          </div>
          <div className="w-full h-1.5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
            <div className="upload-progress-bar h-full rounded-full" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
      )}

      {state === 'success' && (
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-sm text-[var(--color-success)]">{successFile} uploaded</span>
        </div>
      )}

      {state === 'error' && (
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--color-danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span className="text-sm text-[var(--color-danger)]">{error}</span>
        </div>
      )}
    </div>
  );
}
