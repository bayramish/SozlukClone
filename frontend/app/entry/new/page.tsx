'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { topicsAPI, entriesAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function NewEntryPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadTopics();
  }, [isAuthenticated, router]);

  const loadTopics = async () => {
    try {
      const response = await topicsAPI.getAll(1, 100);
      setTopics(response.data.topics);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId) {
      setError('Lütfen bir başlık seçin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await entriesAPI.create({ content, topicId: selectedTopicId });
      const selectedTopic = topics.find((t) => t.id === selectedTopicId);
      router.push(`/topic/${selectedTopic.slug}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Entry oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Yeni Entry Oluştur</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
              <p className="font-semibold">Hata</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Başlık
            </label>
            <select
              value={selectedTopicId || ''}
              onChange={(e) => setSelectedTopicId(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              required
            >
              <option value="">Başlık seçin...</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Entry İçeriği
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Entry içeriğinizi yazın..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              rows={10}
              required
            />
            <p className="text-sm text-gray-600 mt-1">
              {content.length} karakter
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedTopicId || !content.trim()}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
          >
            {loading ? 'Gönderiliyor...' : 'Entry Oluştur'}
          </button>
        </form>
      </div>
    </div>
  );
}
