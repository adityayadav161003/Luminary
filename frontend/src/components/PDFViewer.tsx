import { useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useStore } from '../store';

// Set up the PDF.js worker using Vite's local asset resolution
// This avoids CDN fetch failures and module type mismatches
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function PDFViewer() {
  const selectedDocId = useStore((s) => s.selectedDocIds[0]);
  const pdfUrl = useStore((state) => state.pdfUrls[state.selectedDocIds[0]]);
  const currentPage = useStore((s) => s.currentPage);
  const viewerTotalPages = useStore((s) => s.viewerTotalPages);
  const jumpToPage = useStore((s) => s.jumpToPage);
  const setViewerTotalPages = useStore((s) => s.setViewerTotalPages);
  const documents = useStore((s) => s.documents);


  const [pageInput, setPageInput] = useState('1');
  const [loadError, setLoadError] = useState(false);
  const [scale, setScale] = useState(1.0);
  const [reloadKey, setReloadKey] = useState(0);

  const doc = documents.find((d) => d.doc_id === selectedDocId);

  // Sync internal page input when store page changes
  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const onDocLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setViewerTotalPages(numPages);
      setLoadError(false);
    },
    [setViewerTotalPages],
  );

  const goToPage = (p: number) => {
    const target = Math.max(1, Math.min(p, viewerTotalPages));
    jumpToPage(target);
  };

  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const n = parseInt(pageInput);
      if (!isNaN(n) && n >= 1 && n <= viewerTotalPages) {
        goToPage(n);
      } else {
        setPageInput(String(currentPage));
      }
    }
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(2.5, prev + 0.2));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.2));
  };

  const handleRetry = () => {
    setLoadError(false);
    setReloadKey((prev) => prev + 1);
  };

  if (!pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 bg-gradient-to-b from-[#0A0B0F] to-[#0D0E12] animate-fade-in">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center text-[var(--color-text-muted)] shadow-inner">
          <svg className="w-8 h-8 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">No Document Selected</h3>
        <p className="text-xs text-[var(--color-text-muted)] max-w-xs">Select a document to preview it here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#080A0F] animate-fade-in">
      {/* Top controls bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-[#0F1218] flex-shrink-0 z-10">
        {/* Left: Document Name */}
        <span className="text-[13px] font-medium text-[#F0EDE8] truncate max-w-[300px]" title={doc?.filename}>
          {doc?.filename || 'Document'}
        </span>

        {/* Center: Page Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="w-6 h-6 rounded-md hover:bg-white/[0.06] disabled:opacity-30 flex items-center justify-center cursor-pointer transition-colors duration-150"
            title="Previous Page"
          >
            {/* Chevron Left icon */}
            <svg className="w-3.5 h-3.5 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          
          <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
            <input
              type="number"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={handlePageInput}
              onBlur={() => setPageInput(String(currentPage))}
              className="w-8 text-center text-[12px] font-semibold bg-white/[0.02] text-[#F0EDE8] border border-white/[0.08] rounded focus:outline-none focus:border-[#C8A84B]/40 transition-colors py-0.5"
            />
            <span>/</span>
            <span>{viewerTotalPages || 1}</span>
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= (viewerTotalPages || 1)}
            className="w-6 h-6 rounded-md hover:bg-white/[0.06] disabled:opacity-30 flex items-center justify-center cursor-pointer transition-colors duration-150"
            title="Next Page"
          >
            {/* Chevron Right icon */}
            <svg className="w-3.5 h-3.5 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Right: Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="w-6 h-6 rounded-md hover:bg-white/[0.06] flex items-center justify-center cursor-pointer transition-colors duration-150 disabled:opacity-20"
            title="Zoom Out"
          >
            <svg className="w-3.5 h-3.5 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
            </svg>
          </button>
          <span className="text-[11px] text-[#6B7280] w-10 text-center font-mono font-semibold">{Math.round(scale * 100)}%</span>
          <button
            onClick={zoomIn}
            disabled={scale >= 2.5}
            className="w-6 h-6 rounded-md hover:bg-white/[0.06] flex items-center justify-center cursor-pointer transition-colors duration-150 disabled:opacity-20"
            title="Zoom In"
          >
            <svg className="w-3.5 h-3.5 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </div>

      {/* PDF canvas area */}
      <div className="flex-1 overflow-auto bg-[#080A0F] flex items-start justify-center pt-6 pb-6 custom-scrollbar relative">
        {loadError ? (
          <div className="flex flex-col items-center justify-center text-center max-w-sm m-auto p-6 rounded-2xl bg-white/[0.01] border border-white/[0.03] animate-fade-in">
            <svg className="w-12 h-12 text-[var(--color-text-muted)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-sm font-semibold text-[var(--color-text-secondary)] mb-1">Could not load PDF</p>
            <button
              onClick={handleRetry}
              className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-accent)] text-[#080A0F] hover:shadow-[0_4px_12px_rgba(200,168,75,0.3)] transition-all duration-150 cursor-pointer"
            >
              Retry Load
            </button>
          </div>
        ) : (
          <div className="relative group max-w-full">
            {/* Soft backdrop glow behind document */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-[var(--color-accent)]/10 to-[var(--color-accent)]/5 rounded-xl blur-lg opacity-30 transition duration-1000 group-hover:opacity-40" />
            
            <Document
              key={reloadKey}
              file={pdfUrl}
              onLoadSuccess={onDocLoadSuccess}
              onLoadError={(err) => {
                console.error('PDF error:', err);
                setLoadError(true);
              }}
              loading={
                <div className="flex flex-col items-center justify-center h-[500px] w-[500px] max-w-full bg-white/[0.01] border border-white/[0.03] rounded-xl backdrop-blur-sm">
                  <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mb-3" />
                  <span className="text-xs text-[var(--color-text-muted)] font-mono">Loading PDF pages…</span>
                </div>
              }
              noData={
                <div className="flex items-center justify-center h-[300px] text-xs text-[var(--color-text-muted)]">
                  Preview unavailable.
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                loading={
                  <div className="w-[595px] h-[842px] max-w-full shimmer-skeleton rounded-lg border border-white/[0.02]" />
                }
                className="shadow-2xl shadow-black/50 rounded-lg overflow-hidden border border-white/[0.04]"
                renderAnnotationLayer={true}
                renderTextLayer={true}
              />
            </Document>
          </div>
        )}
      </div>
    </div>
  );
}
