'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { topicsAPI, entriesAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import EntryCard from '@/components/EntryCard';
import CreateEntryForm from '@/components/CreateEntryForm';
import TopicActionsModal from '@/components/TopicActionsModal';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [error, setError] = useState<string>('');
  const [showTopicActions, setShowTopicActions] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const isModerator = user?.role === 'MODERATOR';
  const canModerate = isAdmin || isModerator;

  useEffect(() => {
    loadTopics();
  }, []);

  useEffect(() => {
    if (selectedTopic) {
      loadEntries(selectedTopic.id);
    }
  }, [selectedTopic]);

  const loadTopics = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await topicsAPI.getAll(1, 20);
      
      if (response.data && Array.isArray(response.data)) {
        setTopics(response.data);
        if (response.data.length > 0) {
          setSelectedTopic(response.data[0]);
        }
      } else if (response.data && response.data.topics) {
        setTopics(response.data.topics || []);
        if (response.data.topics && response.data.topics.length > 0) {
          setSelectedTopic(response.data.topics[0]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching topics:', error);
      setError(error.response?.data?.message || error.message || 'Başlıklar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadEntries = async (topicId: number) => {
    try {
      setLoadingEntries(true);
      const response = await entriesAPI.getAll(topicId, 1, 50);
      setEntries(response.data.entries || []);
    } catch (error: any) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await topicsAPI.getAll(1, 100);
      const allTopics = response.data.topics || response.data || [];

      const filtered = allTopics.filter((topic: any) =>
        topic.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );

      if (filtered.length === 0) {
        if (isAuthenticated) {
          router.push(`/topic/new?title=${encodeURIComponent(searchQuery.trim())}`);
        } else {
          router.push(`/login?redirect=/topic/new&title=${encodeURIComponent(searchQuery.trim())}`);
        }
      } else {
        setSearchResults(filtered);
        setSelectedTopic(filtered[0]);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error('Error searching topics:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTopicSelect = (topic: any) => {
    setSelectedTopic(topic);
    setSearchQuery('');
    setSearchResults([]);
    setShowMobileMenu(false); // Close mobile menu on selection
  };

  const handleEntryCreated = () => {
    if (selectedTopic) {
      loadEntries(selectedTopic.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mb-4"></div>
          <p className="text-slate-700 dark:text-slate-200 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile Menu Toggle Button - Top Left */}
      <div className="lg:hidden flex items-center gap-3">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {showMobileMenu ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {showMobileMenu ? 'Menüyü Kapat' : 'Başlıklar'}
        </span>
      </div>

      {/* Modern Search Box - Sticky */}
      <div className="sticky top-20 z-40 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Başlık ara veya yeni oluştur..."
              className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 placeholder-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-lg hover:shadow-md disabled:opacity-50 font-medium text-sm transition-all duration-200"
          >
            {isSearching ? 'Aranıyor...' : 'Ara'}
          </button>
        </form>
        
        {searchResults.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-700 dark:text-slate-200 mb-2 font-medium">Arama sonuçları ({searchResults.length})</p>
            <div className="grid gap-1.5">
              {searchResults.map((topic: any) => (
                <button
                  key={topic.id}
                  onClick={() => handleTopicSelect(topic)}
                  className="text-left px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-500 border border-transparent transition-all text-slate-800 dark:text-slate-200 font-medium"
                >
                  {topic.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 gap-4 relative">
        {/* Sidebar - Topics List */}
        <div className={`
          w-72 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 
          overflow-hidden flex flex-col max-h-[calc(100vh-180px)] sticky top-20
          lg:block
          ${showMobileMenu ? 'block' : 'hidden lg:block'}
        `}>
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Başlıklar</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{topics.length} başlık</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {error ? (
              <div className="p-4 text-red-600 text-xs">
                <p>{error}</p>
                <button
                  onClick={loadTopics}
                  className="mt-2 text-indigo-600 hover:text-indigo-700 font-medium text-xs"
                >
                  Tekrar Dene
                </button>
              </div>
            ) : topics.length === 0 ? (
              <div className="p-4 text-center text-slate-600 dark:text-slate-300 text-xs">
                <p>Henüz başlık eklenmemiş.</p>
              </div>
            ) : (
              <div>
                {topics.map((topic: any) => (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicSelect(topic)}
                    className={`w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all border-l-2 ${
                      selectedTopic?.id === topic.id 
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-600' 
                        : 'border-transparent'
                    }`}
                  >
                    <h3 className={`font-semibold text-sm mb-1 line-clamp-2 ${
                      selectedTopic?.id === topic.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-slate-100'
                    }`}>
                      {topic.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="text-slate-700 dark:text-slate-200 font-medium">@{topic.creator?.username || 'Bilinmeyen'}</span>
                      <span className="text-slate-500 dark:text-slate-400">•</span>
                      <span className="text-slate-600 dark:text-slate-300">{topic._count?.entries || 0} entry</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Entries */}
        <div className={`flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[calc(100vh-180px)] w-full ${showMobileMenu ? 'lg:block hidden' : 'block'}`}>
          {selectedTopic ? (
            <>
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex-1">{selectedTopic.title}</h1>
                  {canModerate && (
                    <button
                      onClick={() => setShowTopicActions(true)}
                      className="flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 px-3 py-1.5 rounded-lg font-medium text-xs transition-all shadow-sm hover:shadow"
                      title="Başlık İşlemleri"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Yönet
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">@{selectedTopic.creator?.username || 'Bilinmeyen'}</span>
                  <span className="text-slate-500 dark:text-slate-400">•</span>
                  <span className="text-slate-700 dark:text-slate-200">{new Date(selectedTopic.createdAt).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                  <span className="text-slate-500 dark:text-slate-400">•</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{selectedTopic._count?.entries || 0} entry</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {isAuthenticated && (
                  <div className="mb-3">
                    <CreateEntryForm topicId={selectedTopic.id} onEntryCreated={handleEntryCreated} />
                  </div>
                )}

                {loadingEntries ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-4 border-indigo-600 mb-3"></div>
                    <p className="text-slate-700 dark:text-slate-200 text-sm font-medium">Entryler yükleniyor...</p>
                  </div>
                ) : entries.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Bu başlıkta henüz entry eklenmemiş.</p>
                    {isAuthenticated && (
                      <p className="text-slate-400 text-sm mt-2">İlk entry'yi sen ekle!</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {entries.map((entry: any) => (
                      <EntryCard key={entry.id} entry={entry} onUpdate={handleEntryCreated} />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center">
                <svg className="mx-auto h-20 w-20 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-500 text-xl font-medium">Bir başlık seçin</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Topic Actions Modal */}
      {selectedTopic && (
        <TopicActionsModal
          topicId={selectedTopic.id}
          topicTitle={selectedTopic.title}
          isOpen={showTopicActions}
          onClose={() => setShowTopicActions(false)}
          onSuccess={() => {
            loadTopics();
            setSelectedTopic(null);
            setShowTopicActions(false);
          }}
        />
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
