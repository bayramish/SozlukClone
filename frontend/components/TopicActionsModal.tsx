'use client';

import { useState, useEffect } from 'react';
import { topicsAPI, adminAPI } from '@/lib/api';

interface TopicActionsModalProps {
  topicId: number;
  topicTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TopicActionsModal({
  topicId,
  topicTitle,
  isOpen,
  onClose,
  onSuccess,
}: TopicActionsModalProps) {
  const [action, setAction] = useState<'merge' | 'delete' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (action === 'merge') {
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
      // Mevcut başlığı listeden çıkar
      const filtered = (response.data || []).filter((t: any) => t.id !== topicId);
      setTopics(filtered);
    } catch (error) {
      console.error('Topic search error:', error);
    }
  };

  const handleMergeTopic = async () => {
    if (!selectedTopicId) return;

    setIsLoading(true);
    try {
      await adminAPI.mergeTopics(topicId, selectedTopicId);
      alert('Başlıklar başarıyla birleştirildi!');
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Başlıklar birleştirilirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTopic = async () => {
    if (!confirm(`"${topicTitle}" başlığını ve tüm entry'lerini kalıcı olarak silmek istediğinize emin misiniz?`)) return;

    setIsLoading(true);
    try {
      await adminAPI.deleteTopic(topicId);
      alert('Başlık başarıyla silindi!');
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Başlık silinirken hata oluştu');
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
          <h3 className="text-xl font-bold">Başlık İşlemleri</h3>
          <p className="text-indigo-100 text-sm mt-1">{topicTitle}</p>
        </div>

        <div className="p-6">
          {!action ? (
            <div className="space-y-3">
              <button
                onClick={() => setAction('delete')}
                className="w-full bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 py-3 px-4 rounded-xl font-medium transition-colors text-left flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Başlığı Sil
              </button>
              <button
                onClick={onClose}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 py-3 px-4 rounded-xl font-medium transition-colors"
              >
                İptal
              </button>
            </div>
          ) : action === 'merge' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">
                  Hedef Başlık Ara
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Hedef başlık adını yazmaya başlayın..."
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Tüm entry'ler seçtiğiniz başlığa taşınacak
                </p>
                {searchQuery && topics.length === 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
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
                          ? 'bg-indigo-100 dark:bg-indigo-900/50 border-2 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                          : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border-2 border-transparent text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-medium">{topic.title}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{topic._count?.entries || 0} entry</div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleMergeTopic}
                  disabled={!selectedTopicId || isLoading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Birleştiriliyor...' : 'Birleştir'}
                </button>
                <button
                  onClick={() => {
                    setAction(null);
                    setSearchQuery('');
                    setTopics([]);
                    setSelectedTopicId(null);
                  }}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Geri
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-700 dark:text-slate-300">
                Bu başlık ve tüm entry'leri kalıcı olarak silinecektir. Bu işlem geri alınamaz!
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteTopic}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Siliniyor...' : 'Evet, Sil'}
                </button>
                <button
                  onClick={() => setAction(null)}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
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
