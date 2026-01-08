'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { entriesAPI, votesAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import VoteButtons from './VoteButtons';
import EntryActionsModal from './EntryActionsModal';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface EntryCardProps {
  entry: any;
  onUpdate?: () => void;
}

export default function EntryCard({ entry, onUpdate }: EntryCardProps) {
  const { isAuthenticated, user } = useAuthStore();
  const [voteCount, setVoteCount] = useState(entry.voteCount || 0);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(entry.content);
  const [isVoting, setIsVoting] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);

  const canEdit = isAuthenticated && user?.id === entry.user.id;
  const canVote = isAuthenticated && user?.id !== entry.user.id;
  const isAdmin = user?.role === 'ADMIN';
  const isModerator = user?.role === 'MODERATOR';
  const canModerate = isAdmin || isModerator;

  // Entry yüklendiğinde oy sayısını ve kullanıcının oyunu çek
  useEffect(() => {
    loadVoteInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id]);

  const loadVoteInfo = async () => {
    try {
      const voteRes = await votesAPI.getByEntry(entry.id);
      setVoteCount(voteRes.data.total || 0);
      setUserVote(voteRes.data.userVote ?? null);
    } catch (error) {
      console.error('Error loading vote info:', error);
    }
  };

  const handleVote = async (value: 1 | -1) => {
    if (!isAuthenticated || !canVote || isVoting) return;

    setIsVoting(true);
    try {
      await votesAPI.create({ entryId: entry.id, value });
      
      // Oy verildikten sonra güncel bilgileri çek
      const voteRes = await votesAPI.getByEntry(entry.id);
      setVoteCount(voteRes.data.total || 0);
      setUserVote(voteRes.data.userVote ?? null);
      
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Vote error:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      }
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu entry\'yi silmek istediğinize emin misiniz?')) return;

    setIsDeleting(true);
    try {
      await entriesAPI.delete(entry.id);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Entry silinirken bir hata oluştu');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await entriesAPI.update(entry.id, { content: editContent });
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Update error:', error);
      alert('Entry güncellenirken bir hata oluştu');
    }
  };

  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all duration-200 overflow-visible">
      <div className="flex gap-3 p-4">
        <div className="flex-shrink-0">
          <VoteButtons
            voteCount={voteCount}
            onVote={handleVote}
            disabled={!canVote || isVoting}
            userVote={userVote}
          />
        </div>

        <div className="flex-grow min-w-0">
          {/* Author & Date Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                {entry.user.username.charAt(0).toUpperCase()}
              </div>
              <Link 
                href={`/profile/${entry.user.username}`}
                className={`font-medium text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
                  entry.user.isBanned ? 'line-through opacity-60' : ''
                }`}
              >
                @{entry.user.username}
              </Link>
              {entry.user.isBanned && (
                <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full font-medium">
                  Yasaklı
                </span>
              )}
            </div>
            <span className="text-slate-500 dark:text-slate-400 text-xs">•</span>
            <time className="text-slate-600 dark:text-slate-300 text-xs">
              {format(new Date(entry.createdAt), 'dd MMM yyyy, HH:mm', {
                locale: tr,
              })}
            </time>
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-4 py-3 border border-indigo-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 resize-none"
                rows={5}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all font-medium text-sm"
                >
                  Kaydet
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(entry.content);
                  }}
                  className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-all font-medium text-sm"
                >
                  İptal
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mb-3">
                {entry.content}
              </p>

              {/* Action Buttons */}
              {!isEditing && (canEdit || canModerate) && (
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canEdit && (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs font-medium flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Düzenle
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {isDeleting ? 'Siliniyor...' : 'Sil'}
                      </button>
                    </>
                  )}
                  {canModerate && (
                    <>
                      <button
                        onClick={() => setShowActionsModal(true)}
                        className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-500 text-xs font-medium flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Yönet
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Admin Actions Modal */}
      <EntryActionsModal
        entryId={entry.id}
        isOpen={showActionsModal}
        onClose={() => setShowActionsModal(false)}
        onSuccess={() => {
          if (onUpdate) onUpdate();
        }}
      />
    </div>
  );
}
