import { useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useStore } from '../store';

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
      <div className="flex flex-col items-center justify-center h-full text-center px-8 bg-[#0A0B0D] animate-fade-in">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex items-center justify-center text-on-surface-variant shadow-inner">
          <span className="material-symbols-outlined text-[32px] text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 0" }}>find_in_page</span>
        </div>
        <h3 className="text-base font-bold text-on-surface mb-1">No Document Selected</h3>
        <p className="text-xs text-on-surface-variant max-w-xs opacity-75">Click a document title in the repository to preview pages.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0B0D] animate-fade-in">
      {/* Top controls bar */}
      <div className="flex items-center justify-between px-lg py-2 border-b border-outline-variant/10 bg-[#0A0B0D] flex-shrink-0 z-10">
        {/* Left: Document Name */}
        <span className="text-[13px] font-semibold text-on-surface truncate max-w-[280px] text-left" title={doc?.filename}>
          {doc?.filename || 'Document'}
        </span>

        {/* Center: Page Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="w-7 h-7 rounded hover:bg-surface-container disabled:opacity-20 flex items-center justify-center cursor-pointer transition-colors duration-150 border border-transparent hover:border-outline-variant/30"
            title="Previous Page"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_left</span>
          </button>
          
          <div className="flex items-center gap-1 text-[12px] text-on-surface-variant font-semibold">
            <input
              type="number"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={handlePageInput}
              onBlur={() => setPageInput(String(currentPage))}
              className="w-8 text-center text-[12px] font-bold bg-surface-container text-on-surface border border-outline-variant/30 rounded focus:outline-none focus:border-primary-fixed-dim/50 py-0.5"
            />
            <span className="opacity-50">/</span>
            <span>{viewerTotalPages || 1}</span>
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= (viewerTotalPages || 1)}
            className="w-7 h-7 rounded hover:bg-surface-container disabled:opacity-20 flex items-center justify-center cursor-pointer transition-colors duration-150 border border-transparent hover:border-outline-variant/30"
            title="Next Page"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_right</span>
          </button>
        </div>

        {/* Right: Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="w-7 h-7 rounded hover:bg-surface-container flex items-center justify-center cursor-pointer transition-colors duration-150 disabled:opacity-20 border border-transparent hover:border-outline-variant/30"
            title="Zoom Out"
          >
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">remove</span>
          </button>
          <span className="text-[11px] text-on-surface-variant w-10 text-center font-mono font-bold">{Math.round(scale * 100)}%</span>
          <button
            onClick={zoomIn}
            disabled={scale >= 2.5}
            className="w-7 h-7 rounded hover:bg-surface-container flex items-center justify-center cursor-pointer transition-colors duration-150 disabled:opacity-20 border border-transparent hover:border-outline-variant/30"
            title="Zoom In"
          >
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">add</span>
          </button>
        </div>
      </div>

      {/* PDF canvas area */}
      <div className="flex-1 overflow-auto bg-[#0d0e10] flex items-start justify-center pt-6 pb-6 custom-scrollbar relative">
        {loadError ? (
          <div className="flex flex-col items-center justify-center text-center max-w-sm m-auto p-6 rounded-2xl bg-surface-container border border-outline-variant/20 animate-fade-in">
            <span className="material-symbols-outlined text-error text-[40px] mb-2">warning</span>
            <p className="text-sm font-semibold text-on-surface mb-1">Could not load PDF document</p>
            <button
              onClick={handleRetry}
              className="mt-3 px-4 py-1.5 text-xs font-bold rounded bg-primary-container text-on-primary-container hover:brightness-110 transition-all cursor-pointer"
            >
              Retry Loading
            </button>
          </div>
        ) : (
          <div className="relative group max-w-full px-4">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-primary-fixed-dim/10 to-primary-fixed-dim/5 rounded-xl blur-lg opacity-30 transition duration-1000 group-hover:opacity-40" />
            
            <Document
              key={reloadKey}
              file={pdfUrl}
              onLoadSuccess={onDocLoadSuccess}
              onLoadError={(err) => {
                console.error('PDF load failure:', err);
                setLoadError(true);
              }}
              loading={
                <div className="flex flex-col items-center justify-center h-[500px] w-[500px] max-w-full bg-surface-container/60 border border-outline-variant/20 rounded-xl backdrop-blur-sm">
                  <div className="w-8 h-8 border-2 border-primary-fixed-dim border-t-transparent rounded-full animate-spin mb-3" />
                  <span className="text-xs text-on-surface-variant font-mono font-semibold">Decrypting document context…</span>
                </div>
              }
              noData={
                <div className="flex items-center justify-center h-[300px] text-xs text-on-surface-variant font-semibold">
                  Preview unavailable.
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                loading={
                  <div className="w-[595px] h-[842px] max-w-full bg-surface-container-high/50 animate-pulse rounded-lg border border-outline-variant/10" />
                }
                className="shadow-2xl shadow-black/85 rounded-lg overflow-hidden border border-outline-variant/20"
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
