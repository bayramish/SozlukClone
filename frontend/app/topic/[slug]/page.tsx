'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { topicsAPI, entriesAPI } from '@/lib/api';
import EntryCard from '@/components/EntryCard';
import CreateEntryForm from '@/components/CreateEntryForm';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

export default function TopicPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated } = useAuthStore();

  const [topic, setTopic] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [slug]);

  const loadData = async () => {
    try {
      setLoading(true);
      const topicRes = await topicsAPI.getBySlug(slug);
      const topicData = topicRes.data;
      
      const entriesRes = await entriesAPI.getAll(topicData.id, 1, 50);
      const topicEntries = entriesRes.data.entries;

      setTopic(topicData);
      setEntries(topicEntries);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Başlık yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleEntryCreated = () => {
    loadData();
  };

  if (loading) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  if (error || !topic) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error || 'Başlık bulunamadı'}</p>
        <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline mt-4 inline-block">
          Ana sayfaya dön
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{topic.title}</h1>
        <div className="flex items-center gap-4 text-sm text-slate-700 dark:text-slate-200">
          <span className="text-slate-900 dark:text-slate-100 font-medium">@{topic.creator.username}</span>
          <span className="text-slate-600 dark:text-slate-300">{new Date(topic.createdAt).toLocaleDateString('tr-TR')}</span>
          <span className="text-slate-600 dark:text-slate-300">{topic._count.entries} entry</span>
        </div>
      </div>

      {isAuthenticated && (
        <div className="mb-8">
          <CreateEntryForm topicId={topic.id} onEntryCreated={handleEntryCreated} />
        </div>
      )}

      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-300">Henüz entry eklenmemiş.</p>
          </div>
        ) : (
          entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} onUpdate={loadData} />
          ))
        )}
      </div>
    </div>
  );
}
