/**
 * DocumentList — shows uploaded PDFs with selection, deletion, and metadata.
 */

import { useEffect, useState, useCallback } from 'react';
import { listDocuments, deleteDocument } from '../api';
import { useStore } from '../store';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DocumentList() {
  const documents = useStore((s) => s.documents);
  const setDocuments = useStore((s) => s.setDocuments);
  const selectedDocIds = useStore((s) => s.selectedDocIds);
  const toggleDocSelection = useStore((s) => s.toggleDocSelection);
  const selectSingleDoc = useStore((s) => s.selectSingleDoc);
  const removeDocument = useStore((s) => s.removeDocument);
  const setViewerDoc = useStore((s) => s.setViewerDoc);
  const setActiveTab = useStore((s) => s.setActiveTab);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await listDocuments();
      setDocuments(res.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [setDocuments]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingId) return;

    setDeletingId(docId);
    try {
      await deleteDocument(docId);
      removeDocument(docId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClick = (docId: string, pageCount: number) => {
    selectSingleDoc(docId);
    setViewerDoc(docId, pageCount);
    setActiveTab('viewer');
  };

  const handleCheckbox = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleDocSelection(docId);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-[var(--color-bg-tertiary)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-[var(--color-danger)] mb-2">{error}</p>
        <button
          onClick={fetchDocs}
          className="text-xs text-[var(--color-accent)] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="p-6 text-center">
        <svg className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <p className="text-sm text-[var(--color-text-muted)]">No documents yet</p>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">Upload a PDF to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-1">
      {documents.map((doc) => {
        const isSelected = selectedDocIds.includes(doc.doc_id);
        const isDeleting = deletingId === doc.doc_id;

        return (
          <div
            key={doc.doc_id}
            id={`doc-${doc.doc_id}`}
            onClick={() => handleClick(doc.doc_id, doc.page_count)}
            className={`
              group relative flex items-start gap-3 p-3 rounded-lg cursor-pointer
              transition-colors duration-150
              ${isSelected ? 'bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/30' : 'hover:bg-[var(--color-surface-hover)] border border-transparent'}
              ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            {/* Checkbox */}
            <button
              onClick={(e) => handleCheckbox(doc.doc_id, e)}
              className={`
                mt-0.5 flex-shrink-0 w-4 h-4 rounded border transition-colors duration-150
                ${isSelected ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--color-border-default)] hover:border-[var(--color-text-muted)]'}
              `}
            >
              {isSelected && (
                <svg className="w-4 h-4 text-[var(--color-bg-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{doc.filename}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[var(--color-text-muted)]">{doc.page_count} pg</span>
                <span className="text-xs text-[var(--color-text-muted)]">·</span>
                <span className="text-xs text-[var(--color-text-muted)]">{formatBytes(doc.file_size)}</span>
                <span className="text-xs text-[var(--color-text-muted)]">·</span>
                <span className="text-xs text-[var(--color-text-muted)]">{formatDate(doc.upload_time)}</span>
              </div>
            </div>

            {/* Delete */}
            <button
              onClick={(e) => handleDelete(doc.doc_id, e)}
              className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-[var(--color-danger-dim)]"
              title="Delete document"
            >
              <svg className="w-4 h-4 text-[var(--color-danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
