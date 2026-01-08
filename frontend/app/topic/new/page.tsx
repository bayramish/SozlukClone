'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { topicsAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

interface CreateTopicForm {
  title: string;
}

export default function NewTopicPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateTopicForm>();

  useEffect(() => {
    const titleParam = searchParams.get('title');
    if (titleParam) {
      setValue('title', decodeURIComponent(titleParam));
    }
  }, [searchParams, setValue]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          <p className="text-gray-700 mb-4">Başlık oluşturmak için giriş yapmalısınız.</p>
          <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
            Giriş Yap
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: CreateTopicForm) => {
    setLoading(true);
    setError('');

    try {
      const response = await topicsAPI.create(data);
      router.push(`/topic/${response.data.slug}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Başlık oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Yeni Başlık Oluştur</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <input
              {...register('title', {
                required: 'Başlık gereklidir',
                minLength: { value: 3, message: 'En az 3 karakter olmalıdır' },
                maxLength: { value: 200, message: 'En fazla 200 karakter olabilir' },
              })}
              type="text"
              placeholder="Başlık adını girin..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
          >
            {loading ? 'Oluşturuluyor...' : 'Başlık Oluştur'}
          </button>
        </form>
      </div>
    </div>
  );
}
