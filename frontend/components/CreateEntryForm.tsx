'use client';

import { useState } from 'react';
import { entriesAPI } from '@/lib/api';

interface CreateEntryFormProps {
  topicId: number;
  onEntryCreated?: () => void;
}

export default function CreateEntryForm({ topicId, onEntryCreated }: CreateEntryFormProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError('');

    try {
      await entriesAPI.create({
        content: content.trim(),
        topicId,
      });
      setContent('');
      if (onEntryCreated) onEntryCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Entry oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg shadow-sm border border-indigo-200 dark:border-indigo-800 p-4">
      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Yeni Entry Ekle
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg">
            <p className="font-semibold text-xs">Hata</p>
            <p className="text-xs">{error}</p>
          </div>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Entry içeriğinizi yazın..."
          className="w-full px-3 py-2.5 text-sm border border-indigo-200 dark:border-indigo-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 resize-none placeholder-slate-400"
          rows={4}
          required
        />

        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {content.length} karakter
          </span>
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 text-sm"
          >
            {loading ? 'Gönderiliyor...' : 'Entry Ekle'}
          </button>
        </div>
      </form>
    </div>
  );
}
