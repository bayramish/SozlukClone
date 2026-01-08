'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usersAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [topEntries, setTopEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'entries' | 'top'>('entries');
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    loadUserData();
  }, [username]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const [userRes, entriesRes, topRes] = await Promise.all([
        usersAPI.getByUsername(username),
        usersAPI.getUserEntries(username, 1, 20),
        usersAPI.getTopEntries(username, 10),
      ]);
      
      setUser(userRes.data);
      setEntries(entriesRes.data.entries || []);
      setTopEntries(topRes.data || []);
      setEmail(userRes.data.email || '');
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateMessage('');

    if (password && password !== confirmPassword) {
      setUpdateMessage('Şifreler eşleşmiyor');
      return;
    }

    try {
      const updateData: any = {};
      if (email !== user.email) updateData.email = email;
      if (password) updateData.password = password;

      await usersAPI.updateProfile(updateData);
      setUpdateMessage('Profil başarıyla güncellendi!');
      setPassword('');
      setConfirmPassword('');
      setIsEditing(false);
      loadUserData();
    } catch (error: any) {
      setUpdateMessage(error.response?.data?.message || 'Güncelleme başarısız');
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

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-700 dark:text-slate-200">Kullanıcı bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className={`text-3xl font-bold text-slate-900 dark:text-slate-100 ${user.isBanned ? 'line-through opacity-60' : ''}`}>
                @{user.username}
              </h1>
              
              {user.isBanned && (
                <div className="mt-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                  <p className="text-red-700 dark:text-red-400 font-semibold text-sm">⛔ Yasaklı Kullanıcı</p>
                  {user.bannedUntil ? (
                    <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                      {new Date(user.bannedUntil) > new Date() 
                        ? `${format(new Date(user.bannedUntil), 'dd MMM yyyy, HH:mm', { locale: tr })} tarihine kadar` 
                        : 'Yasak süresi dolmuş'}
                    </p>
                  ) : (
                    <p className="text-red-600 dark:text-red-400 text-xs mt-1">Kalıcı yasak</p>
                  )}
                  {user.banReason && (
                    <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                      <strong>Sebep:</strong> {user.banReason}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 mt-3">
                <div className="text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Kayıt:</span>
                  <span className="ml-2 text-slate-700 dark:text-slate-300 font-medium">
                    {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: tr })}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full font-medium">
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="flex gap-6 mt-3 text-sm">
                <div>
                  <span className="text-slate-600 dark:text-slate-300">Başlık:</span>
                  <span className="ml-2 text-slate-900 dark:text-slate-100 font-bold">{user._count.topics}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-300">Entry:</span>
                  <span className="ml-2 text-slate-900 dark:text-slate-100 font-bold">{user._count.entries}</span>
                </div>
              </div>
            </div>
          </div>

          {isOwnProfile && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {isEditing ? 'İptal' : 'Profili Düzenle'}
            </button>
          )}
        </div>

        {/* Edit Profile Form */}
        {isOwnProfile && isEditing && (
          <form onSubmit={handleUpdateProfile} className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Profil Ayarları</h3>
            
            {updateMessage && (
              <div className={`px-4 py-3 rounded-lg text-sm ${
                updateMessage.includes('başarıyla') 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}>
                {updateMessage}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Yeni Şifre (değiştirmek istemiyorsanız boş bırakın)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full px-4 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            {password && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Şifre Tekrar
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Şifreyi tekrar girin"
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}

            <button
              type="submit"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-lg hover:shadow-md font-medium text-sm transition-all"
            >
              Değişiklikleri Kaydet
            </button>
          </form>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('entries')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'entries'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Tüm Entry'ler ({entries.length})
          </button>
          <button
            onClick={() => setActiveTab('top')}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'top'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            🏆 En Çok Oy Alanlar
          </button>
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-3">
        {activeTab === 'entries' ? (
          entries.length > 0 ? (
            entries.map((entry) => (
              <div key={entry.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                <Link href={`/topic/${entry.topic.slug}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold text-sm mb-2 block">
                  {entry.topic.title}
                </Link>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
                  {entry.content}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>{format(new Date(entry.createdAt), 'dd MMM yyyy, HH:mm', { locale: tr })}</span>
                  <span className={`font-medium ${entry.voteCount > 0 ? 'text-green-600 dark:text-green-400' : entry.voteCount < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                    {entry.voteCount > 0 && '+'}{entry.voteCount} oy
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-slate-600 dark:text-slate-300">Henüz entry eklenmemiş</p>
            </div>
          )
        ) : (
          topEntries.length > 0 ? (
            topEntries.map((entry, index) => (
              <div key={entry.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <Link href={`/topic/${entry.topic.slug}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold text-sm mb-2 block">
                      {entry.topic.title}
                    </Link>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
                      {entry.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span>{format(new Date(entry.createdAt), 'dd MMM yyyy', { locale: tr })}</span>
                      <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                        ⬆ +{entry.voteCount} oy
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-slate-600 dark:text-slate-300">Henüz oy almamış</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
