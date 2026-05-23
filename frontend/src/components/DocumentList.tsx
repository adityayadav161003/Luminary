/**
 * DocumentList — shows uploaded PDFs with selection, deletion, and metadata.
 * Redesigned into modern dark-glass cards with smooth interactions.
 */

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
      
      // Deduplicate by doc_id
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
    } catch (err) {
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
      <div className="flex flex-col gap-2 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse flex items-center justify-between px-3">
            <div className="flex items-center gap-3 w-3/4">
              <div className="w-4 h-4 rounded bg-white/[0.04]" />
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-white/[0.04] rounded w-2/3" />
                <div className="h-2.5 bg-white/[0.02] rounded w-1/2" />
              </div>
            </div>
            <div className="w-5 h-5 rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center animate-fade-in">
        <p className="text-xs font-semibold text-[#EF4444] mb-2">{error}</p>
        <button
          onClick={fetchDocs}
          className="px-3 py-1 text-xs font-semibold rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] text-[#F0EDE8] transition-all duration-150 cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="p-3">
        <div
          onClick={() => document.getElementById("upload-dropzone")?.click()}
          className="py-8 text-center text-xs text-[#374151] border border-dashed border-white/[0.08] rounded-xl hover:border-[#C8A84B]/40 hover:bg-white/[0.01] cursor-pointer transition-all duration-300"
        >
          <p className="font-semibold text-[#6B7280]">No documents yet</p>
          <p className="text-[10px] text-[#374151] mt-0.5">Upload a PDF to begin</p>
        </div>
      </div>
    );
  }

  const anyDocSelected = selectedDocIds.length > 0;

  return (
    <div className="flex flex-col gap-1 py-2 overflow-y-auto custom-scrollbar">
      {selectedDocIds.length > 1 && (
        <div className="mx-3 mb-2 px-3 py-1.5 rounded-lg bg-[#C8A84B]/10 border border-[#C8A84B]/20 text-[11px] text-[#C8A84B] font-medium flex items-center justify-between">
          <span>Chatting with {selectedDocIds.length} documents</span>
          <button 
            onClick={(e) => { e.stopPropagation(); clearDocSelection(); }}
            className="hover:text-white transition-colors cursor-pointer text-xs"
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
              group relative flex items-center gap-2.5 px-3 py-2.5 mx-1.5 rounded-lg cursor-pointer
              transition-all duration-150
              ${isSelected 
                ? 'bg-[#C8A84B]/[0.08] border-l-2 border-[#C8A84B]' 
                : 'hover:bg-white/[0.04]'}
              ${isDeleting ? 'opacity-40 pointer-events-none' : ''}
            `}
          >
            {/* Left: checkbox */}
            <button
              onClick={(e) => handleCheckbox(doc.doc_id, e)}
              className={`
                flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all duration-150
                ${anyDocSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                ${isSelected 
                  ? 'bg-[#C8A84B] border-[#C8A84B]' 
                  : 'border-white/20 bg-black/20 hover:border-[#C8A84B]/80'}
              `}
            >
              {isSelected && (
                <svg className="w-2.5 h-2.5 text-[#0F1218]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>

            {/* Middle: filename & info */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[#F0EDE8] truncate group-hover:text-white transition-colors duration-150">
                {doc.filename}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#6B7280]">
                <span>{doc.page_count} pgs</span>
                <span>·</span>
                <span>{formatSize(doc.file_size_bytes)}</span>
                <span>·</span>
                <span>{getRelativeTime(doc.upload_time)}</span>
              </div>
            </div>

            {/* Right: delete action */}
            <button
              onClick={(e) => handleDelete(doc.doc_id, e)}
              className="flex-shrink-0 p-1 text-[#6B7280] hover:text-[#EF4444] transition-colors duration-150 opacity-0 group-hover:opacity-100 cursor-pointer"
              title="Delete document"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="w-3.5 h-3.5 border border-[#EF4444] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
