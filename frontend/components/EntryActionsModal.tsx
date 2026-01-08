'use client';

import { useState, useEffect } from 'react';
import { topicsAPI, adminAPI } from '@/lib/api';

interface EntryActionsModalProps {
  entryId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EntryActionsModal({
  entryId,
  isOpen,
  onClose,
  onSuccess,
}: EntryActionsModalProps) {
  const [action, setAction] = useState<'move' | 'delete' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (action === 'move') {
      if (searchQuery.trim()) {
        const timer = setTimeout(() => {
          searchTopics();
        }, 300);
        return () => clearTimeout(timer);
      } else {
        setTopics([]);
      }
    }
  }, [searchQuery, action]);

  const searchTopics = async () => {
    try {
      const response = await topicsAPI.search(searchQuery);
      setTopics(response.data || []);
    } catch (error) {
      console.error('Topic search error:', error);
    }
  };

  const handleMoveEntry = async () => {
    if (!selectedTopicId) return;

    setIsLoading(true);
    try {
      await adminAPI.moveEntry(entryId, selectedTopicId);
      alert('Entry başarıyla taşındı!');
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Entry taşınırken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!confirm('Bu entry\'yi kalıcı olarak silmek istediğinize emin misiniz?')) return;

    setIsLoading(true);
    try {
      await adminAPI.forceDeleteEntry(entryId);
      alert('Entry başarıyla silindi!');
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Entry silinirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <h3 className="text-xl font-bold">Entry İşlemleri</h3>
        </div>

        <div className="p-6">
          {!action ? (
            <div className="space-y-3">
              <button
                onClick={() => setAction('move')}
                className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-3 px-4 rounded-xl font-medium transition-colors text-left flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Entry'yi Taşı
              </button>
              <button
                onClick={() => setAction('delete')}
                className="w-full bg-red-50 hover:bg-red-100 text-red-700 py-3 px-4 rounded-xl font-medium transition-colors text-left flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Entry'yi Sil
              </button>
              <button
                onClick={onClose}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl font-medium transition-colors"
              >
                İptal
              </button>
            </div>
          ) : action === 'move' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">
                  Başlık Ara
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Başlık adını yazmaya başlayın..."
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                {searchQuery && topics.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Başlık bulunamadı. Aramaya devam edin...
                  </p>
                )}
              </div>

              {topics.length > 0 && (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopicId(topic.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        selectedTopicId === topic.id
                          ? 'bg-indigo-100 border-2 border-indigo-500 text-indigo-700'
                          : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent text-slate-700'
                      }`}
                    >
                      <div className="font-medium">{topic.title}</div>
                      <div className="text-sm text-slate-500">{topic._count?.entries || 0} entry</div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleMoveEntry}
                  disabled={!selectedTopicId || isLoading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Taşınıyor...' : 'Taşı'}
                </button>
                <button
                  onClick={() => {
                    setAction(null);
                    setSearchQuery('');
                    setTopics([]);
                    setSelectedTopicId(null);
                  }}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                  Geri
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-700">
                Bu entry kalıcı olarak silinecektir. Bu işlem geri alınamaz!
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteEntry}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Siliniyor...' : 'Evet, Sil'}
                </button>
                <button
                  onClick={() => setAction(null)}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
