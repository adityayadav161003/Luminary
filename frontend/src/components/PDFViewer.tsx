import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useStore } from '../store';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PDFViewer() {
  const viewerDocId = useStore((s) => s.viewerDocId);
  const viewerPage = useStore((s) => s.viewerPage);
  const viewerTotalPages = useStore((s) => s.viewerTotalPages);
  const viewerScale = useStore((s) => s.viewerScale);
  const setViewerPage = useStore((s) => s.setViewerPage);
  const setViewerTotalPages = useStore((s) => s.setViewerTotalPages);
  const setViewerScale = useStore((s) => s.setViewerScale);
  const documents = useStore((s) => s.documents);
  const highlightedPage = useStore((s) => s.highlightedPage);
  const [pageInput, setPageInput] = useState('');
  const [docError, setDocError] = useState(false);
  const doc = documents.find((d) => d.doc_id === viewerDocId);

  const onDocLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => { setViewerTotalPages(numPages); setDocError(false); },
    [setViewerTotalPages],
  );

  const goToPage = (p: number) => setViewerPage(Math.max(1, Math.min(p, viewerTotalPages)));

  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { const n = parseInt(pageInput); if (!isNaN(n)) goToPage(n); setPageInput(''); }
  };

  if (!viewerDocId || !doc) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 animate-fade-in">
        <svg className="w-16 h-16 mb-4 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <h3 className="text-lg font-medium text-[var(--color-text-secondary)] mb-1">No document selected</h3>
        <p className="text-sm text-[var(--color-text-muted)]">Select a PDF from the sidebar to view it here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-[200px]">{doc.filename}</span>
          {highlightedPage && <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent-dim)] text-[var(--color-accent)]">Cited: Page {highlightedPage}</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => setViewerScale(viewerScale - 0.15)} disabled={viewerScale <= 0.5} className="p-1 rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-30 transition-colors duration-150" title="Zoom out">
              <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
            </button>
            <span className="text-xs text-[var(--color-text-muted)] w-10 text-center">{Math.round(viewerScale * 100)}%</span>
            <button onClick={() => setViewerScale(viewerScale + 0.15)} disabled={viewerScale >= 3} className="p-1 rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-30 transition-colors duration-150" title="Zoom in">
              <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => goToPage(viewerPage - 1)} disabled={viewerPage <= 1} className="p-1 rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-30 transition-colors duration-150">
              <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            <input type="text" value={pageInput} onChange={(e) => setPageInput(e.target.value)} onKeyDown={handlePageInput} placeholder={String(viewerPage)} className="w-8 text-center text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] border border-[var(--color-border-default)] rounded px-1 py-0.5 focus:outline-none focus:border-[var(--color-accent)]" />
            <span className="text-xs text-[var(--color-text-muted)]">/ {viewerTotalPages}</span>
            <button onClick={() => goToPage(viewerPage + 1)} disabled={viewerPage >= viewerTotalPages} className="p-1 rounded-lg hover:bg-[var(--color-surface-hover)] disabled:opacity-30 transition-colors duration-150">
              <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto flex justify-center p-4 bg-[var(--color-bg-primary)]">
        {docError ? (
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-sm text-[var(--color-text-muted)]">PDF preview unavailable — you can still chat about this document</p>
          </div>
        ) : (
          <Document file={`/sample.pdf`} onLoadSuccess={onDocLoadSuccess} onLoadError={() => setDocError(true)} loading={<div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />} noData={<p className="text-sm text-[var(--color-text-muted)]">PDF preview unavailable</p>}>
            <Page pageNumber={viewerPage} scale={viewerScale} loading={<div className="w-[595px] h-[842px] bg-[var(--color-bg-tertiary)] animate-pulse rounded-lg" />} className="shadow-2xl rounded-lg overflow-hidden" />
          </Document>
        )}
      </div>
    </div>
  );
}
