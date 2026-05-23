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

      if (file.type !== 'application/pdf') {
        setState('error');
        setError('Only PDF files are supported');
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setState('error');
        setError('File too large. Max 50MB');
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
            } catch {
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

  const truncate = (name: string, max: number) => {
    if (name.length <= max) return name;
    return name.slice(0, max) + '...';
  };

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => state !== 'uploading' && fileRef.current?.click()}
      className={`
        group relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer text-center
        ${state === 'idle' ? 'border-outline-variant/30 bg-surface-container-lowest/50 hover:bg-primary/5 hover:border-primary/40' : ''}
        ${state === 'dragging' ? 'border-primary/50 bg-primary/10' : ''}
        ${state === 'uploading' ? 'border-outline-variant/30 bg-[#161B24]' : ''}
        ${state === 'success' ? 'border-primary-fixed-dim/40 bg-primary-fixed-dim/5' : ''}
        ${state === 'error' ? 'border-error/40 bg-error/5' : ''}
      `}
    >
      <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={onFileSelect} />

      {state === 'idle' && (
        <>
          <span className="material-symbols-outlined text-primary-fixed-dim mb-2 group-hover:scale-110 transition-transform text-[28px]" style={{ fontVariationSettings: "'FILL' 0" }}>cloud_upload</span>
          <p className="text-sm font-semibold text-primary-container">Upload Document</p>
          <p className="text-[11px] text-on-surface-variant mt-1 font-semibold">PDF up to 50MB</p>
        </>
      )}

      {state === 'dragging' && (
        <>
          <span className="material-symbols-outlined text-primary animate-bounce mb-2 text-[28px]">cloud_upload</span>
          <p className="text-sm font-semibold text-primary">Release to drop file</p>
        </>
      )}

      {state === 'uploading' && (
        <div className="w-full space-y-2 py-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#e3e2e5] font-semibold truncate max-w-[180px]">{truncate(uploadingFile, 24)}</span>
            <span className="text-primary-fixed-dim font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
            <div className="bg-primary-fixed-dim h-full rounded-full transition-all duration-150" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      )}

      {state === 'success' && (
        <div className="flex flex-col items-center gap-1 text-center py-2">
          <span className="material-symbols-outlined text-primary-fixed-dim text-[28px]">check_circle</span>
          <span className="text-sm text-primary font-semibold">Uploaded Successfully</span>
          <span className="text-[10px] text-on-surface-variant font-mono truncate max-w-[180px]">{truncate(successFile, 24)}</span>
        </div>
      )}

      {state === 'error' && (
        <div className="flex flex-col items-center gap-1 text-center py-2">
          <span className="material-symbols-outlined text-error text-[28px]">error</span>
          <span className="text-sm text-error font-semibold">Upload Failed</span>
          <span className="text-[10px] text-error font-mono max-w-full truncate">{error}</span>
        </div>
      )}
    </div>
  );
}
