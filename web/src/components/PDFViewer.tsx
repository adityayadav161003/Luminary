/** PDFViewer — react-pdf with zoom, page nav, citation jump. Lazy-loaded for perf. */
import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useStore } from '../store';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PDFViewer() {
  const docId = useStore((s) => s.viewerDocId);
  const page = useStore((s) => s.currentPage);
  const total = useStore((s) => s.totalPages);
  const scale = useStore((s) => s.viewerScale);
  const jump = useStore((s) => s.jumpToPage);
  const setTotal = useStore((s) => s.setTotalPages);
  const setScale = useStore((s) => s.setViewerScale);
  const docs = useStore((s) => s.documents);
  const [pageInput, setPageInput] = useState('');
  const [err, setErr] = useState(false);

  const doc = docs.find((d) => d.doc_id === docId);

  const onLoad = useCallback(({ numPages }: { numPages: number }) => { setTotal(numPages); setErr(false); }, [setTotal]);
  const go = (p: number) => jump(Math.max(1, Math.min(p, total)));

  if (!docId || !doc) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 animate-fade-in">
        <div className="w-24 h-32 rounded-xl border-2 border-dashed border-[var(--color-border)] flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[var(--color-ink-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
        </div>
        <p className="text-sm text-[var(--color-ink-muted)]">Select a document</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Controls bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface-1)]">
        <span className="text-sm font-medium text-[var(--color-ink)] truncate max-w-[180px]">{doc.filename}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => setScale(scale - 0.15)} disabled={scale <= 0.5} className="p-1 rounded hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-30 transition-colors duration-150">
              <svg className="w-4 h-4 text-[var(--color-ink-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19.5 12h-15" /></svg>
            </button>
            <span className="text-xs text-[var(--color-ink-faint)] w-9 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(scale + 0.15)} disabled={scale >= 3} className="p-1 rounded hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-30 transition-colors duration-150">
              <svg className="w-4 h-4 text-[var(--color-ink-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => go(page - 1)} disabled={page <= 1} className="p-1 rounded hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-30">
              <svg className="w-4 h-4 text-[var(--color-ink-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            <input type="text" value={pageInput} onChange={(e) => setPageInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { const n = parseInt(pageInput); if (!isNaN(n)) go(n); setPageInput(''); }}} placeholder={String(page)} className="w-7 text-center text-xs bg-[var(--color-surface-2)] text-[var(--color-ink)] border border-[var(--color-border)] rounded px-1 py-0.5 focus:outline-none focus:border-[var(--color-accent)]" />
            <span className="text-xs text-[var(--color-ink-faint)]">/ {total}</span>
            <button onClick={() => go(page + 1)} disabled={page >= total} className="p-1 rounded hover:bg-[rgba(255,255,255,0.05)] disabled:opacity-30">
              <svg className="w-4 h-4 text-[var(--color-ink-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto flex justify-center p-4">
        {err ? <p className="text-sm text-[var(--color-ink-faint)] self-center">PDF preview unavailable — you can still chat about this document</p> : (
          <Document file="/sample.pdf" onLoadSuccess={onLoad} onLoadError={() => setErr(true)} loading={<div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />} noData={<p className="text-sm text-[var(--color-ink-faint)]">No preview</p>}>
            <Page pageNumber={page} scale={scale} loading={<div className="w-[595px] h-[842px] bg-[var(--color-surface-2)] rounded-lg relative overflow-hidden"><div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.03)] to-transparent animate-[shimmer_1.5s_infinite]" /></div>} className="shadow-2xl rounded-lg overflow-hidden" />
          </Document>
        )}
      </div>
    </div>
  );
}
