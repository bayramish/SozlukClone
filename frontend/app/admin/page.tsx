'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { adminAPI, topicsAPI } from '@/lib/api';

export default function AdminPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'topics' | 'activity' | 'permissions' | 'bans'>('stats');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [permissions, setPermissions] = useState<any>(null);
  
  // Ban state
  const [banReason, setBanReason] = useState('');
  const [banUntil, setBanUntil] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    loadStats();
  }, [isAuthenticated, user, router]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getStatistics();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async () => {
    setLoading(true);
    try {
      const response = await topicsAPI.getAll(1, 100);
      setTopics(response.data.topics || response.data || []);
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getActivity();
      setActivities(response.data.activities || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBannedUsers = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getBannedUsers();
      setBannedUsers(response.data || []);
    } catch (error) {
      console.error('Error loading banned users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async (userId: number) => {
    try {
      const response = await adminAPI.getModeratorPermissions(userId);
      setPermissions(response.data);
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  };

  const handleTabChange = (tab: 'stats' | 'users' | 'topics' | 'activity' | 'permissions' | 'bans') => {
    setActiveTab(tab);
    if (tab === 'users') loadUsers();
    if (tab === 'topics') loadTopics();
    if (tab === 'activity') loadActivities();
    if (tab === 'bans') loadBannedUsers();
  };

  const handleRoleChange = async (userId: number, newRole: 'USER' | 'MODERATOR' | 'ADMIN') => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Rol güncellenirken hata oluştu');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try {
      await adminAPI.deleteUser(userId);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Kullanıcı silinirken hata oluştu');
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedUser || !permissions) return;
    try {
      await adminAPI.updateModeratorPermissions(selectedUser.id, permissions);
      alert('Yetkiler güncellendi!');
      setSelectedUser(null);
      setPermissions(null);
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Yetkiler güncellenirken hata oluştu');
    }
  };

  const handleBanUser = async (userId: number) => {
    if (!banReason.trim()) {
      alert('Lütfen ban sebebi girin');
      return;
    }
    try {
      await adminAPI.banUser(userId, banReason, banUntil || undefined);
      alert('Kullanıcı yasaklandı!');
      setBanReason('');
      setBanUntil('');
      loadBannedUsers();
      if (activeTab === 'users') loadUsers();
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Kullanıcı yasaklanırken hata oluştu');
    }
  };

  const handleUnbanUser = async (userId: number) => {
    try {
      await adminAPI.unbanUser(userId);
      alert('Kullanıcının yasağı kaldırıldı!');
      loadBannedUsers();
      if (activeTab === 'users') loadUsers();
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert('Yasak kaldırılırken hata oluştu');
    }
  };

  const handleDeleteTopic = async (topicId: number) => {
    if (!confirm('Bu başlığı ve tüm entry\'lerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;
    try {
      await adminAPI.deleteTopic(topicId);
      alert('Başlık başarıyla silindi');
      loadTopics();
      loadStats();
    } catch (error: any) {
      console.error('Error deleting topic:', error);
      alert(error.response?.data?.message || 'Başlık silinirken hata oluştu');
    }
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-700 rounded-2xl shadow-xl p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">Admin Paneli</h1>
        <p className="text-purple-100">Kelam platformunu yönetin</p>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-2">
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'stats', label: '📊 İstatistikler' },
            { key: 'users', label: '👥 Kullanıcılar' },
            { key: 'topics', label: '📚 Başlıklar' },
            { key: 'activity', label: '📝 Aktiviteler' },
            { key: 'permissions', label: '🔐 Yetkiler' },
            { key: 'bans', label: '🚫 Yasaklar' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key as any)}
              className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Stats Tab */}
          {activeTab === 'stats' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="text-4xl mb-2">👥</div>
                <div className="text-3xl font-bold">{stats.total.users}</div>
                <div className="text-blue-100 mt-1">Toplam Kullanıcı</div>
                <div className="text-sm mt-2 text-blue-200">+{stats.recent.users} bu hafta</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="text-4xl mb-2">📚</div>
                <div className="text-3xl font-bold">{stats.total.topics}</div>
                <div className="text-purple-100 mt-1">Toplam Başlık</div>
                <div className="text-sm mt-2 text-purple-200">+{stats.recent.topics} bu hafta</div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="text-4xl mb-2">✍️</div>
                <div className="text-3xl font-bold">{stats.total.entries}</div>
                <div className="text-green-100 mt-1">Toplam Entry</div>
                <div className="text-sm mt-2 text-green-200">+{stats.recent.entries} bu hafta</div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="text-4xl mb-2">⭐</div>
                <div className="text-3xl font-bold">{stats.total.votes}</div>
                <div className="text-orange-100 mt-1">Toplam Oy</div>
                <div className="text-sm mt-2 text-orange-200">Tüm zamanlar</div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-700 dark:to-slate-600">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Kullanıcı</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">Rol</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">İstatistikler</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-indigo-50/50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">@{user.username}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">{user.email}</td>
                        <td className="px-6 py-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                            className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-200"
                          >
                            <option value="USER">USER</option>
                            <option value="MODERATOR">MODERATOR</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex gap-4">
                            <span>{user._count.topics} başlık</span>
                            <span>{user._count.entries} entry</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700 font-medium text-sm"
                          >
                            Sil
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Topics Tab */}
          {activeTab === 'topics' && (
            <div className="space-y-6">
              {/* Topics List */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Tüm Başlıklar</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {topics.map((topic) => (
                    <div key={topic.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{topic.title}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {topic._count?.entries || 0} entry • @{topic.creator?.username}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTopic(topic.id)}
                        className="text-red-600 hover:text-red-700 font-medium text-sm px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Son Aktiviteler</h2>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {activity.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-grow">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        @{activity.user.username}
                        <span className="text-slate-600 dark:text-slate-300 font-normal ml-2">
                          "{activity.topic.title}" başlığına entry ekledi
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 text-sm mt-1">{activity.content}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-2">
                        {new Date(activity.createdAt).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Moderatör Yetkileri</h2>
              
              {!selectedUser ? (
                <div>
                  <p className="text-slate-700 dark:text-slate-200 mb-4">Yetki düzenlemek için bir moderatör veya admin seçin</p>
                  <button
                    onClick={loadUsers}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Kullanıcıları Yükle
                  </button>
                  
                  {users.length > 0 && (
                    <div className="mt-6 space-y-2">
                      {users.filter(u => u.role === 'MODERATOR' || u.role === 'ADMIN').map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">@{user.username}</span>
                            <span className={`ml-3 px-3 py-1 rounded-full text-xs font-semibold ${
                              user.role === 'ADMIN' 
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              loadPermissions(user.id);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Yetkileri Düzenle
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">@{selectedUser.username}</h3>
                      <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedUser.role === 'ADMIN' 
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}>
                        {selectedUser.role}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setPermissions(null);
                      }}
                      className="text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100"
                    >
                      ✕ Kapat
                    </button>
                  </div>

                  {permissions && (
                    <div className="space-y-4">
                      {[
                        { key: 'canDeleteEntry', label: 'Entry Silme' },
                        { key: 'canDeleteTopic', label: 'Başlık Silme' },
                        { key: 'canBanUser', label: 'Kullanıcı Yasaklama' },
                        { key: 'canEditEntry', label: 'Entry Düzenleme' },
                        { key: 'canMoveEntry', label: 'Entry Taşıma' },
                        { key: 'canMergeTopic', label: 'Başlık Birleştirme' },
                      ].map((perm) => (
                        <label key={perm.key} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                          <input
                            type="checkbox"
                            checked={permissions[perm.key] || false}
                            onChange={(e) => setPermissions({ ...permissions, [perm.key]: e.target.checked })}
                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-medium text-slate-700 dark:text-slate-300">{perm.label}</span>
                        </label>
                      ))}

                      <button
                        onClick={handleUpdatePermissions}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all mt-6"
                      >
                        Yetkileri Kaydet
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bans Tab */}
          {activeTab === 'bans' && (
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Kullanıcı Yasakları</h2>
              
              {/* Ban Form */}
              <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <h3 className="font-bold text-red-900 dark:text-red-300 mb-4">Yeni Yasak</h3>
                <button
                  onClick={loadUsers}
                  className="mb-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Kullanıcıları Yükle
                </button>
                
                {users.length > 0 && (
                  <div className="space-y-3">
                    <select
                      onChange={(e) => {
                        const userId = parseInt(e.target.value);
                        if (userId) {
                          const user = users.find(u => u.id === userId);
                          if (user) setSelectedUser(user);
                        }
                      }}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Kullanıcı Seçin</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          @{user.username} ({user.role})
                        </option>
                      ))}
                    </select>
                    
                    <input
                      type="text"
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      placeholder="Yasak sebebi..."
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    
                    <input
                      type="datetime-local"
                      value={banUntil}
                      onChange={(e) => setBanUntil(e.target.value)}
                      placeholder="Yasak bitiş tarihi (opsiyonel)"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      * Tarih belirtilmezse kalıcı yasak uygulanır
                    </p>
                    
                    <button
                      onClick={() => selectedUser && handleBanUser(selectedUser.id)}
                      disabled={!selectedUser || !banReason.trim()}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Kullanıcıyı Yasakla
                    </button>
                  </div>
                )}
              </div>

              {/* Banned Users List */}
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Yasaklı Kullanıcılar</h3>
                {bannedUsers.length === 0 ? (
                  <p className="text-slate-600 dark:text-slate-300">Yasaklı kullanıcı yok</p>
                ) : (
                  <div className="space-y-3">
                    {bannedUsers.map((user) => (
                      <div key={user.id} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">@{user.username}</span>
                            <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">
                              <strong className="text-slate-900 dark:text-slate-100">Sebep:</strong> {user.banReason || 'Belirtilmemiş'}
                            </p>
                            {user.bannedUntil && (
                              <p className="text-sm text-slate-700 dark:text-slate-200">
                                <strong className="text-slate-900 dark:text-slate-100">Bitiş:</strong> {new Date(user.bannedUntil).toLocaleString('tr-TR')}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleUnbanUser(user.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Yasağı Kaldır
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
