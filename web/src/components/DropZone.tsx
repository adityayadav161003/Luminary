/** DropZone — drag-and-drop PDF upload with real XHR progress. */
import { useState, useRef, useCallback } from 'react';
import { uploadDocument } from '../lib/api';
import { useStore } from '../store';
import type { DocumentInfo, UploadProgress } from '../types';

type State = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

export default function DropZone() {
  const [state, setState] = useState<State>('idle');
  const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percent: 0 });
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const addDocument = useStore((s) => s.addDocument);
  const selectSingleDoc = useStore((s) => s.selectSingleDoc);
  const setViewerDoc = useStore((s) => s.setViewerDoc);

  const handleFile = useCallback(async (file: File) => {
    setError('');
    if (!file.name.toLowerCase().endsWith('.pdf')) { setState('error'); setError('Only PDF files'); return; }
    if (file.size > 20 * 1024 * 1024) { setState('error'); setError('Max 20MB'); return; }

    setState('uploading');
    try {
      const result = await uploadDocument(file, setProgress);
      setState('success');
      const doc: DocumentInfo = {
        doc_id: result.doc_id, filename: result.filename, upload_time: new Date().toISOString(),
        page_count: result.page_count, chunk_count: result.chunk_count, file_size_bytes: file.size,
      };
      addDocument(doc);
      selectSingleDoc(result.doc_id);
      setViewerDoc(result.doc_id);
      setTimeout(() => setState('idle'), 2500);
    } catch (err) { setState('error'); setError(err instanceof Error ? err.message : 'Upload failed'); }
  }, [addDocument, selectSingleDoc, setViewerDoc]);

  return (
    <div
      onDrop={(e) => { e.preventDefault(); setState('idle'); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      onDragOver={(e) => { e.preventDefault(); setState('dragging'); }}
      onDragLeave={() => setState('idle')}
      onClick={() => state !== 'uploading' && fileRef.current?.click()}
      className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors duration-150 min-h-[100px] ${
        state === 'dragging' ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)]' :
        state === 'success' ? 'border-[var(--color-success)] bg-[var(--color-success-dim)]' :
        state === 'error' ? 'border-[var(--color-danger)] bg-[var(--color-danger-dim)]' :
        'border-[var(--color-border)] hover:border-[var(--color-ink-faint)]'
      }`}
    >
      <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); if (fileRef.current) fileRef.current.value = ''; }} />
      {state === 'idle' && <><span className="text-sm text-[var(--color-ink-muted)]">Drop PDF here or click</span><span className="text-xs text-[var(--color-ink-faint)]">Max 20MB</span></>}
      {state === 'dragging' && <span className="text-sm text-[var(--color-accent)]">Drop to upload</span>}
      {state === 'uploading' && (
        <div className="w-full space-y-1.5">
          <div className="flex justify-between text-xs text-[var(--color-ink-muted)]"><span>Uploading…</span><span>{progress.percent}%</span></div>
          <div className="w-full h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-yellow-500 transition-all duration-200" style={{ width: `${progress.percent}%` }} /></div>
        </div>
      )}
      {state === 'success' && <span className="text-sm text-[var(--color-success)]">✓ Uploaded</span>}
      {state === 'error' && <span className="text-sm text-[var(--color-danger)]">{error}</span>}
    </div>
  );
}
