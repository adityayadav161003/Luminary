import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { createApiClient } from '../api';
import { useStore } from '../store';

const formatSize = (bytes: number) => {
  if (!bytes || isNaN(bytes)) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function getRelativeTime(isoDate: string): string {
  const d = new Date(isoDate);
  const elapsed = d.getTime() - Date.now();
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  
  const units: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
    { unit: 'year', ms: 31536000000 },
    { unit: 'month', ms: 2628000000 },
    { unit: 'day', ms: 86400000 },
    { unit: 'hour', ms: 3600000 },
    { unit: 'minute', ms: 60000 },
    { unit: 'second', ms: 1000 }
  ];

  for (const { unit, ms } of units) {
    if (Math.abs(elapsed) >= ms || unit === 'second') {
      return rtf.format(Math.round(elapsed / ms), unit);
    }
  }
  return 'just now';
}

export default function DocumentList() {
  const { getToken } = useAuth();
  const api = createApiClient(getToken);

  const documents = useStore((s) => s.documents);
  const setDocuments = useStore((s) => s.setDocuments);
  const selectedDocIds = useStore((s) => s.selectedDocIds);
  const toggleDocSelection = useStore((s) => s.toggleDocSelection);
  const selectSingleDoc = useStore((s) => s.selectSingleDoc);
  const removeDocument = useStore((s) => s.removeDocument);
  const setViewerDoc = useStore((s) => s.setViewerDoc);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const clearDocSelection = useStore((s) => s.clearDocSelection);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.listDocuments();
      const uniqueDocs = res.documents.filter(
        (doc, index, self) => self.findIndex((d) => d.doc_id === doc.doc_id) === index
      );
      setDocuments(uniqueDocs);
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

    const confirmDelete = window.confirm("Delete this document? This cannot be undone.");
    if (!confirmDelete) return;

    setDeletingId(docId);
    try {
      await api.deleteDocument(docId);
      removeDocument(docId);
    } catch {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: "Failed to delete document. Try again.", type: 'error' }
      }));
    } finally {
      setDeletingId(null);
    }
  };

  const handleClick = (docId: string, pageCount: number, e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) {
      toggleDocSelection(docId);
    } else {
      selectSingleDoc(docId);
      setViewerDoc(docId, pageCount);
      setActiveTab('viewer');
    }
  };

  const handleCheckbox = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleDocSelection(docId);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-2 py-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-surface-container-high border border-outline-variant/10 animate-pulse flex items-center justify-between px-3">
            <div className="flex items-center gap-3 w-3/4">
              <div className="w-4 h-4 rounded bg-surface-container-highest" />
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-surface-container-highest rounded w-2/3" />
                <div className="h-2.5 bg-surface-container rounded w-1/2" />
              </div>
            </div>
            <div className="w-5 h-5 rounded bg-surface-container-highest" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center animate-fade-in">
        <p className="text-xs font-semibold text-error mb-2">{error}</p>
        <button
          onClick={fetchDocs}
          className="px-3 py-1 text-xs font-semibold rounded-lg bg-surface-container border border-outline hover:bg-surface-container-high text-on-surface transition-all duration-150 cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-on-surface-variant/40 border border-dashed border-outline-variant/20 rounded-xl bg-surface-container-lowest/30 select-none">
        <span className="material-symbols-outlined text-display-lg opacity-30 mb-sm block">inventory_2</span>
        <p className="font-semibold text-on-surface-variant">No Documents Selected</p>
        <p className="text-[10px] opacity-60 mt-0.5">Upload a PDF file to begin</p>
      </div>
    );
  }

  const anyDocSelected = selectedDocIds.length > 0;

  return (
    <div className="flex flex-col gap-2.5 py-1.5 overflow-y-auto custom-scrollbar">
      {selectedDocIds.length > 1 && (
        <div className="mb-2 px-3 py-1.5 rounded-lg bg-primary-container/10 border border-primary-container/20 text-[11px] text-primary-container font-semibold flex items-center justify-between shadow">
          <span>Active context: {selectedDocIds.length} files</span>
          <button 
            onClick={(e) => { e.stopPropagation(); clearDocSelection(); }}
            className="hover:text-white transition-colors cursor-pointer text-xs font-bold"
          >
            ×
          </button>
        </div>
      )}

      {documents.map((doc) => {
        const isSelected = selectedDocIds.includes(doc.doc_id);
        const isDeleting = deletingId === doc.doc_id;

        return (
          <div
            key={doc.doc_id}
            id={`doc-${doc.doc_id}`}
            onClick={(e) => handleClick(doc.doc_id, doc.page_count, e)}
            className={`
              group relative flex items-center gap-2.5 px-3 py-3 rounded-lg cursor-pointer
              transition-all duration-150 border border-transparent
              ${isSelected 
                ? 'bg-primary/5 border-l-4 border-l-primary-fixed-dim border-outline-variant/20' 
                : 'hover:bg-surface-container-high/40'}
              ${isDeleting ? 'opacity-40 pointer-events-none' : ''}
            `}
          >
            {/* Left: Checkbox */}
            <button
              onClick={(e) => handleCheckbox(doc.doc_id, e)}
              className={`
                flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all duration-150
                ${anyDocSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                ${isSelected 
                  ? 'bg-primary-fixed-dim border-primary-fixed-dim text-on-primary-fixed' 
                  : 'border-outline-variant/50 bg-[#0d0e10]/60 hover:border-primary-fixed-dim'}
              `}
            >
              {isSelected && (
                <svg className="w-2.5 h-2.5 text-[#121315]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>

            {/* Middle: Info */}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-semibold text-on-surface truncate group-hover:text-primary transition-colors duration-150">
                {doc.filename}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-on-surface-variant opacity-75">
                <span>{doc.page_count} pgs</span>
                <span>·</span>
                <span>{formatSize(doc.file_size_bytes)}</span>
                <span>·</span>
                <span className="truncate">{getRelativeTime(doc.upload_time)}</span>
              </div>
            </div>

            {/* Right: Delete action */}
            <button
              onClick={(e) => handleDelete(doc.doc_id, e)}
              className="flex-shrink-0 p-1 text-on-surface-variant hover:text-error transition-colors duration-150 opacity-0 group-hover:opacity-100 cursor-pointer"
              title="Delete document"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="w-3.5 h-3.5 border border-error border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[16px]">delete</span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
