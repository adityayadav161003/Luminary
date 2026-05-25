/** PDFViewer — privacy-first placeholder. PDF bytes are processed server-side and never stored. */
import { useStore } from '../store';

export default function PDFViewer() {
  const docId = useStore((s) => s.viewerDocId);
  const docs = useStore((s) => s.documents);

  const doc = docs.find((d) => d.doc_id === docId);

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
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface-1)]">
        <span className="text-sm font-medium text-[var(--color-ink)] truncate max-w-[260px]">{doc.filename}</span>
        <div className="flex items-center gap-2 text-xs text-[var(--color-ink-faint)]">
          <span className="px-2 py-0.5 rounded border border-[var(--color-border)]">{doc.page_count} pages</span>
          <span className="px-2 py-0.5 rounded border border-[var(--color-border)]">{doc.chunk_count} chunks</span>
        </div>
      </div>

      {/* Privacy-first placeholder */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-5">
        <div className="w-28 h-36 rounded-xl border-2 border-dashed border-[var(--color-border)] flex items-center justify-center bg-[var(--color-surface-2)]/50">
          <svg className="w-10 h-10 text-[var(--color-ink-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <div className="max-w-xs">
          <p className="text-sm font-medium text-[var(--color-ink)] mb-1.5">{doc.filename}</p>
          <p className="text-xs text-[var(--color-ink-faint)] leading-relaxed">
            PDF preview is unavailable — your document is processed privately on the server and never stored. Use the Chat panel to ask questions about it.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-accent)]">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
            <span>Privacy-first processing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
