/**
 * DropZone — Drag-and-drop PDF upload with progress tracking.
 * Features a premium dark-glass design with state transitions (idle, dragging, uploading, success, error).
 */

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useStore } from '../store';
import type { DocumentInfo } from '../types';

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

export default function DropZone() {
  const { getToken } = useAuth();
  const [state, setState] = useState<UploadState>('idle');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [successFile, setSuccessFile] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const addDocument = useStore((s) => s.addDocument);
  const addPdfUrl = useStore((s) => s.addPdfUrl);
  const selectSingleDoc = useStore((s) => s.selectSingleDoc);
  const setViewerDoc = useStore((s) => s.setViewerDoc);
  const documents = useStore((s) => s.documents);

  const handleFile = useCallback(
    async (file: File) => {
      setError('');
      setSuccessFile('');
      setUploadingFile(file.name);

      // File validation BEFORE upload
      if (file.type !== 'application/pdf') {
        setState('error');
        setError('Only PDF files are supported');
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        setState('error');
        setError('File too large. Max 20MB');
        return;
      }

      setState('uploading');
      setProgressPercent(0);

      try {
        const token = await getToken();
        if (!token) throw new Error("Not authenticated");

        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('file', file);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgressPercent(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 429) {
            try {
              const body = JSON.parse(xhr.responseText);
              const resetAt = body.reset_at || '';
              window.dispatchEvent(new CustomEvent('rate-limit', { detail: { resetAt } }));
            } catch {
              window.dispatchEvent(new CustomEvent('rate-limit', { detail: { resetAt: '' } }));
            }
            setState('error');
            setError("Rate limit exceeded");
            return;
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              setState('success');
              setSuccessFile(result.filename);

              // Generate a local object URL to render in PDFViewer
              const localUrl = URL.createObjectURL(file);
              addPdfUrl(result.doc_id, localUrl);

              const doc: DocumentInfo = {
                doc_id: result.doc_id,
                filename: result.filename,
                upload_time: new Date().toISOString(),
                page_count: result.page_count,
                chunk_count: result.chunk_count,
                file_size_bytes: file.size,
              };

              const exists = documents.some((d) => d.filename === result.filename);
              if (!exists) {
                addDocument(doc);
              }
              selectSingleDoc(result.doc_id);
              setViewerDoc(result.doc_id, result.page_count);

              setTimeout(() => setState('idle'), 2500);
            } catch (err) {
              setState('error');
              setError('Invalid response from server');
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              setState('error');
              setError(err.detail || `Upload failed (${xhr.status})`);
            } catch {
              setState('error');
              setError(`Upload failed (${xhr.status})`);
            }
          }
        };

        xhr.onerror = () => {
          setState('error');
          setError('Network error during upload');
        };

        xhr.onabort = () => {
          setState('error');
          setError('Upload cancelled');
        };

        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        xhr.open('POST', `${API_BASE}/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);

      } catch (err) {
        setState('error');
        setError(err instanceof Error ? err.message : 'Upload failed');
      }
    },
    [addDocument, addPdfUrl, selectSingleDoc, setViewerDoc, getToken, documents],
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

  // Truncate helper
  const truncate = (name: string, max: number) => {
    if (name.length <= max) return name;
    return name.slice(0, max) + '...';
  };

  return (
    <div
      id="upload-dropzone"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => state !== 'uploading' && fileRef.current?.click()}
      className={`
        rounded-xl border border-dashed p-5 mx-3 mt-3 
        transition-all duration-150 cursor-pointer flex flex-col items-center justify-center gap-2
        ${state === 'idle' ? 'border-white/[0.08] hover:border-[#C8A84B]/40 hover:bg-[#C8A84B]/[0.03]' : ''}
        ${state === 'dragging' ? 'border-[#C8A84B]/60 bg-[#C8A84B]/[0.06]' : ''}
        ${state === 'uploading' ? 'border-white/[0.08] bg-[#161B24]' : ''}
        ${state === 'success' ? 'border-[#10B981]/40 bg-[#10B981]/[0.03]' : ''}
        ${state === 'error' ? 'border-[#EF4444]/40 bg-[#EF4444]/[0.03]' : ''}
      `}
    >
      <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={onFileSelect} />

      {state === 'idle' && (
        <>
          {/* arrow-up-from-bracket icon */}
          <svg className="w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span className="text-xs text-[#6B7280]">Drop PDF here or click to browse</span>
          <span className="text-[10px] text-[#374151]">Max 20MB</span>
        </>
      )}

      {state === 'dragging' && (
        <>
          <svg className="w-5 h-5 text-[#C8A84B] animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span className="text-xs text-[#C8A84B] font-medium">Release to upload</span>
        </>
      )}

      {state === 'uploading' && (
        <div className="w-full space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#F0EDE8] font-medium">{truncate(uploadingFile, 24)}</span>
            <span className="text-[#C8A84B] font-mono font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="bg-[#C8A84B] h-full rounded-full transition-all duration-150" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      )}

      {state === 'success' && (
        <div className="flex flex-col items-center gap-1.5 text-center">
          <svg className="w-5 h-5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-xs text-[#10B981] font-semibold">Uploaded</span>
          <span className="text-[10px] text-[#6B7280] truncate max-w-[200px]">{truncate(successFile, 24)}</span>
        </div>
      )}

      {state === 'error' && (
        <div className="flex flex-col items-center gap-1.5 text-center">
          <svg className="w-5 h-5 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-xs text-[#EF4444] font-semibold">Upload Failed</span>
          <span className="text-[10px] text-[#EF4444] max-w-full truncate">{error}</span>
        </div>
      )}
    </div>
  );
}
