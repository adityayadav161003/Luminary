/** DocumentList — user's uploaded PDFs with multi-select and delete. */
import { useEffect, useState, useCallback } from 'react';
import { listDocuments, deleteDocument } from '../lib/api';
import { useStore } from '../store';

function fmt(bytes: number): string { return bytes < 1048576 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1048576).toFixed(1)} MB`; }

export default function DocumentList() {
  const docs = useStore((s) => s.documents);
  const setDocs = useStore((s) => s.setDocuments);
  const selected = useStore((s) => s.selectedDocIds);
  const toggle = useStore((s) => s.toggleDocSelection);
  const selectSingle = useStore((s) => s.selectSingleDoc);
  const removeDoc = useStore((s) => s.removeDocument);
  const setViewerDoc = useStore((s) => s.setViewerDoc);
  const setTab = useStore((s) => s.setActiveTab);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const fetch = useCallback(async () => { try { setLoading(true); const r = await listDocuments(); setDocs(r.documents); } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); } finally { setLoading(false); } }, [setDocs]);
  useEffect(() => { fetch(); }, [fetch]);

  const handleDel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try { await deleteDocument(id); removeDoc(id); } catch (e2) { setErr(e2 instanceof Error ? e2.message : 'Delete failed'); }
  };

  if (loading) return <div className="p-2 space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded-lg bg-[var(--color-surface-2)] animate-pulse" />)}</div>;
  if (err) return <div className="p-4 text-center text-sm text-[var(--color-danger)]">{err} <button onClick={fetch} className="text-[var(--color-accent)] underline ml-1">Retry</button></div>;
  if (!docs.length) return <div className="p-6 text-center text-sm text-[var(--color-ink-faint)]">No documents yet.<br/>Upload your first PDF.</div>;

  return (
    <div className="flex flex-col gap-0.5 p-1">
      {docs.map((d) => {
        const sel = selected.includes(d.doc_id);
        return (
          <div key={d.doc_id} onClick={(e) => { e.metaKey || e.ctrlKey ? toggle(d.doc_id) : (selectSingle(d.doc_id), setViewerDoc(d.doc_id), setTab('viewer')); }}
            className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 ${sel ? 'bg-[var(--color-accent-dim)] border-l-2 border-[var(--color-accent)]' : 'hover:bg-[rgba(255,255,255,0.04)]'}`}>
            <svg className="w-4 h-4 flex-shrink-0 text-[var(--color-ink-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--color-ink)] truncate" title={d.filename}>{d.filename.length > 28 ? d.filename.slice(0, 28) + '…' : d.filename}</p>
              <span className="text-xs text-[var(--color-ink-faint)]">{d.page_count} pg · {fmt(d.file_size_bytes)}</span>
            </div>
            <button onClick={(e) => handleDel(d.doc_id, e)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--color-danger-dim)] transition-opacity duration-150">
              <svg className="w-3.5 h-3.5 text-[var(--color-danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
