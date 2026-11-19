import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  Bone,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flag,
  Heart,
  Image as ImageIcon,
  ImagePlus,
  MoreHorizontal,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { IMAGES } from '../data/seedData';
import { t } from '../i18n/translations';
import { FeedPost } from '../types';

const GALLERY_PRESETS = [
  { label: 'Persian Cat', url: IMAGES.persianCat },
  { label: 'Ginger Tabby', url: IMAGES.tabbyCat },
  { label: 'Golden Retriever', url: IMAGES.goldenDog },
  { label: 'Park Meetup', url: IMAGES.communityEvent },
  { label: 'Safe House', url: IMAGES.safeHouse },
];

const TREAT_AMOUNTS = [1, 2, 3, 5, 10, 12, 15];

type FeedSortMode = 'nearby' | 'fast' | 'recent';

export const FeedModule: React.FC = () => {
  const {
    language,
    user,
    pets,
    feedPosts,
    blockedUserIds,
    events,
    adoptionPosts,
    requireAuth,
    createFeedPost,
    deleteFeedPost,
    toggleLikePost,
    sendTreat,
    reportContent,
    blockUser,
    setActiveTab,
    pushToast,
  } = useApp();

  // Only Nearby, Fast, and Recent options (no All Pets / Cats / Dogs filter)
  const [sortMode, setSortMode] = useState<FeedSortMode>('nearby');
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [reportModalPostId, setReportModalPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('Inappropriate or off-topic content');
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const [treatPickerPostId, setTreatPickerPostId] = useState<string | null>(null);
  const [photoIndexByPost, setPhotoIndexByPost] = useState<Record<string, number>>({});
  const [expandedCaptions, setExpandedCaptions] = useState<Record<string, boolean>>({});

  // Create Post Form
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([IMAGES.persianCat]);
  const [caption, setCaption] = useState('');
  const [selectedPetId, setSelectedPetId] = useState<string>(pets[0]?.id || '');

  // Next upcoming event for the compact Events section at top of Feed
  const nextUpcomingEvent = useMemo(
    () => events.find((e) => !e.isPast) || events[0],
    [events]
  );

  // Active lost cat alert in user's Dhaka neighborhood (if any)
  const localLostAlert = useMemo(() => {
    const userArea = user?.area || 'Dhanmondi';
    return (
      adoptionPosts.find((p) => p.type === 'lost_cat' && p.status === 'active' && p.area === userArea) ||
      adoptionPosts.find((p) => p.type === 'lost_cat' && p.status === 'active') ||
      null
    );
  }, [adoptionPosts, user]);

  const visiblePosts = useMemo(() => {
    const filtered = feedPosts.filter((p) => !blockedUserIds.includes(p.authorId));

    if (sortMode === 'nearby') {
      const userArea = user?.area || 'Dhanmondi';
      return [...filtered].sort((a, b) => {
        const aLocal = a.authorArea === userArea ? 1 : 0;
        const bLocal = b.authorArea === userArea ? 1 : 0;
        return bLocal - aLocal;
      });
    }

    if (sortMode === 'fast') {
      // Fast / Trending: highest momentum (likes + treats)
      return [...filtered].sort(
        (a, b) => b.likesCount + b.treatsCount - (a.likesCount + a.treatsCount)
      );
    }

    // Recent: original chronological order
    return filtered;
  }, [feedPosts, blockedUserIds, sortMode, user]);

  const handleOpenPostModal = () => {
    requireAuth('Share a photo on Feed', () => {
      setPostModalOpen(true);
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 10 - selectedPhotos.length);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedPhotos((prev) => (prev.length < 10 ? [...prev, reader.result as string] : prev));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() || selectedPhotos.length === 0) return;
    const pet = pets.find((p) => p.id === selectedPetId);
    createFeedPost({
      petId: pet?.id,
      petName: pet?.name || 'My Pet',
      petSpecies: pet?.species || 'cat',
      photos: selectedPhotos.slice(0, 10),
      caption: caption.trim(),
    });
    setCaption('');
    setSelectedPhotos([IMAGES.persianCat]);
    setPostModalOpen(false);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    const post = feedPosts.find((p) => p.id === reportModalPostId);
    if (!post) return;
    reportContent({
      targetType: 'post',
      targetId: post.id,
      targetTitle: `${post.authorName}'s post about ${post.petName}`,
      reason: reportReason,
    });
    setReportModalPostId(null);
  };

  const handlePickTreatAmount = (postId: string, petName: string, amount: number) => {
    requireAuth(`Send ${amount} Treats to ${petName}`, () => {
      sendTreat(postId, amount);
      setTreatPickerPostId(null);
    });
  };

  const handleSharePost = async (post: FeedPost) => {
    const shareText = `${post.authorName} (${post.authorArea}, Dhaka) shared about ${post.petName}: "${post.caption}" — via PetLove Dhaka`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${post.petName} on PetLove Dhaka`,
          text: shareText,
        });
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
      }
      pushToast('Post text copied to share!', `"${post.caption.slice(0, 60)}..."`, 'teal');
    } catch {
      pushToast('Share text ready', shareText.slice(0, 80) + '...', 'teal');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-4">
      {/* 1. Top Social Composer Bar: Profile Avatar + Share Photo + Photo Icon ONLY */}
      <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          aria-label="Open profile"
          className="shrink-0 cursor-pointer"
        >
          <img
            src={user?.avatarUrl || IMAGES.persianCat}
            alt={user?.name || 'Profile'}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover bg-slate-100 border border-slate-200"
          />
        </button>

        <button
          type="button"
          onClick={handleOpenPostModal}
          className="flex-1 text-left px-4 py-2.5 min-h-[42px] bg-[#F9F9F9] hover:bg-slate-100 border border-slate-200 rounded-full text-xs sm:text-sm text-slate-500 transition-colors cursor-pointer truncate"
        >
          Share a photo...
        </button>

        <button
          type="button"
          onClick={handleOpenPostModal}
          aria-label="Share photo"
          className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 hover:bg-teal-100 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
        >
          <ImageIcon className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>

      {/* 2. Top Events Section on Feed -> Click to Open Full Events Page */}
      {nextUpcomingEvent && (
        <button
          type="button"
          onClick={() => {
            setActiveTab('events');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="w-full text-left bg-[#F9F9F9] hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 rounded-2xl p-3 flex items-center justify-between gap-3 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={nextUpcomingEvent.photoUrl}
              alt={nextUpcomingEvent.title}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-xl object-cover bg-slate-200 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-700">
                <CalendarDays className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                <span>Dhaka Events</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600 font-medium truncate">
                  {nextUpcomingEvent.dateLabel}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
                {nextUpcomingEvent.title}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-teal-700 whitespace-nowrap shrink-0">
            <span>Events</span>
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
          </span>
        </button>
      )}

      {/* Optional Compact Area Alert Strip when a Lost Cat is active in Dhaka */}
      {localLostAlert && (
        <button
          type="button"
          onClick={() => {
            setActiveTab('adoption');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="w-full text-left bg-rose-50 hover:bg-rose-100/70 border border-rose-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2.5 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={2.25} />
            <p className="text-xs font-semibold text-rose-900 truncate">
              Lost Cat Alert in {localLostAlert.area}: {localLostAlert.petName} —{' '}
              {localLostAlert.exactLocation}
            </p>
          </div>
          <span className="text-[11px] font-bold text-rose-700 whitespace-nowrap shrink-0">
            View Alert →
          </span>
        </button>
      )}

      {/* 3. Clean 3-Option Post Sort Tabs: Nearby | Fast | Recent */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
        {(
          [
            { id: 'nearby', label: 'Nearby' },
            { id: 'fast', label: 'Fast' },
            { id: 'recent', label: 'Recent' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSortMode(tab.id)}
            className={`flex-1 py-2 min-h-[38px] text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              sortMode === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Facebook / Instagram Style Feed Stream */}
      {visiblePosts.length === 0 ? (
        <div className="bg-[#F9F9F9] border border-slate-200 rounded-2xl p-10 text-center">
          <p className="text-sm font-semibold text-slate-900">No posts yet</p>
          <button
            type="button"
            onClick={handleOpenPostModal}
            className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl cursor-pointer"
          >
            Share First Photo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {visiblePosts.map((post) => {
            const hasLiked = user ? post.likedByUserIds.includes(user.id) : false;
            const hasTreated = user ? post.treatedByUserIds.includes(user.id) : false;
            const isOwner = user?.id === post.authorId;
            const activePhotoIdx = photoIndexByPost[post.id] || 0;
            const isPickerOpen = treatPickerPostId === post.id;
            const isExpanded = Boolean(expandedCaptions[post.id]);
            const shouldTruncate = post.caption.length > 90;

            return (
              <article
                key={post.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
              >
                {/* Social Header */}
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover bg-slate-100 border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {post.authorName}
                        </p>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs font-semibold text-teal-700 truncate">
                          {post.petName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {post.authorArea}, Dhaka · {post.createdAt}
                      </p>
                    </div>
                  </div>

                  {/* Three-Dots Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)
                      }
                      aria-label="Post options"
                      className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full cursor-pointer"
                    >
                      <MoreHorizontal className="w-5 h-5" strokeWidth={2} />
                    </button>

                    {openMenuPostId === post.id && (
                      <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20">
                        {isOwner ? (
                          <button
                            type="button"
                            onClick={() => {
                              deleteFeedPost(post.id);
                              setOpenMenuPostId(null);
                            }}
                            className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                            <span>Delete post</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setReportModalPostId(post.id);
                                setOpenMenuPostId(null);
                              }}
                              className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Flag className="w-3.5 h-3.5 text-amber-600" strokeWidth={2} />
                              <span>Report post</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                blockUser(post.authorId, post.authorName);
                                setOpenMenuPostId(null);
                              }}
                              className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" strokeWidth={2} />
                              <span>Block {post.authorName.split(' ')[0]}</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Instagram / Facebook Edge-to-Edge Photo */}
                <div className="relative bg-slate-100 aspect-[4/3] overflow-hidden">
                  <img
                    src={post.photos[activePhotoIdx] || post.photos[0]}
                    alt={`${post.petName} photo`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {post.photos.length > 1 && (
                    <>
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/70 text-white text-[11px] font-mono tabular-nums">
                        {activePhotoIdx + 1}/{post.photos.length}
                      </div>
                      {activePhotoIdx > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setPhotoIndexByPost((prev) => ({
                              ...prev,
                              [post.id]: activePhotoIdx - 1,
                            }))
                          }
                          aria-label="Previous photo"
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" strokeWidth={2} />
                        </button>
                      )}
                      {activePhotoIdx < post.photos.length - 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setPhotoIndexByPost((prev) => ({
                              ...prev,
                              [post.id]: activePhotoIdx + 1,
                            }))
                          }
                          aria-label="Next photo"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" strokeWidth={2} />
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Action Row: Heart + Number ONLY | Send Treats | Share Text Button */}
                <div className="px-4 pt-3 pb-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Like: Heart icon + number ONLY */}
                      <button
                        type="button"
                        onClick={() =>
                          requireAuth(`Like ${post.petName}'s post`, () => toggleLikePost(post.id))
                        }
                        aria-label={`Like (${post.likesCount})`}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                          hasLiked
                            ? 'bg-rose-50 border-rose-200 text-rose-600'
                            : 'bg-[#F9F9F9] border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Heart
                          className={`w-[18px] h-[18px] ${
                            hasLiked ? 'fill-rose-600 text-rose-600' : ''
                          }`}
                          strokeWidth={2}
                        />
                        <span className="font-mono tabular-nums">{post.likesCount}</span>
                      </button>

                      {/* Send Treats (Multi-Treat Picker) */}
                      <button
                        type="button"
                        onClick={() => setTreatPickerPostId(isPickerOpen ? null : post.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          isPickerOpen || hasTreated
                            ? 'bg-amber-600 text-white hover:bg-amber-700'
                            : 'bg-teal-600 text-white hover:bg-teal-700'
                        }`}
                      >
                        <Bone className="w-4 h-4" strokeWidth={2} />
                        <span>{t(language, 'send_treat')}</span>
                        <span className="font-mono tabular-nums">{post.treatsCount}</span>
                      </button>
                    </div>

                    {/* Share Button (Icon + Text) */}
                    <button
                      type="button"
                      onClick={() => handleSharePost(post)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl text-xs font-semibold text-slate-700 bg-[#F9F9F9] hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" strokeWidth={2} />
                      <span>{t(language, 'share_label')}</span>
                    </button>
                  </div>

                  {/* Multi-Treat Selector Drawer */}
                  {isPickerOpen && (
                    <div className="p-3 rounded-xl bg-[#F9F9F9] border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900">
                          Send Treats to {post.petName}
                        </p>
                        <span className="text-[11px] font-mono text-amber-800 font-semibold tabular-nums">
                          {user ? `${user.dailyTreatsRemaining}/20 left` : 'Sign in'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {TREAT_AMOUNTS.map((amt) => {
                          const disabled = Boolean(user && amt > user.dailyTreatsRemaining);
                          return (
                            <button
                              key={amt}
                              type="button"
                              disabled={disabled}
                              onClick={() => handlePickTreatAmount(post.id, post.petName, amt)}
                              className={`px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-bold font-mono tabular-nums border transition-colors cursor-pointer ${
                                disabled
                                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                  : 'bg-white border-amber-300 text-amber-900 hover:bg-amber-600 hover:text-white hover:border-amber-600'
                              }`}
                            >
                              +{amt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Concise 2-Line Caption with "See more" Toggle */}
                  <div className="text-sm text-slate-800 leading-snug">
                    <p className={isExpanded ? '' : 'line-clamp-2'}>
                      <span className="font-bold text-slate-900 mr-1.5">{post.authorName}</span>
                      {post.caption}
                    </p>
                    {shouldTruncate && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCaptions((prev) => ({
                            ...prev,
                            [post.id]: !prev[post.id],
                          }))
                        }
                        className="mt-0.5 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                      >
                        {isExpanded ? t(language, 'see_less') : t(language, 'see_more')}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Share Photo Post Modal */}
      {postModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white border-t sm:border border-slate-200 rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-xl max-h-[92dvh] overflow-y-auto sm:my-auto pb-[env(safe-area-inset-bottom)]">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Share a Photo</h2>
              <button
                type="button"
                onClick={() => setPostModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
            <form onSubmit={handleCreatePost} className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Photos ({selectedPhotos.length}/10)
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline cursor-pointer">
                    <ImagePlus className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>Upload from device</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  {selectedPhotos.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg overflow-hidden border border-slate-200"
                    >
                      <img src={src} alt="Upload preview" className="w-full h-full object-cover" />
                      {selectedPhotos.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedPhotos((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="absolute top-1 right-1 p-1 bg-white/90 text-slate-800 rounded-md cursor-pointer"
                        >
                          <X className="w-3 h-3" strokeWidth={2} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {GALLERY_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        setSelectedPhotos((prev) =>
                          prev.length < 10 && !prev.includes(preset.url)
                            ? [...prev, preset.url]
                            : prev
                        )
                      }
                      className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-[#F9F9F9] hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tag Your Pet
                </label>
                <select
                  value={selectedPetId}
                  onChange={(e) => setSelectedPetId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.species})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Caption</label>
                <textarea
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption for your pet's moment..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPostModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl cursor-pointer"
                >
                  Post (+10 Treats)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Post Modal */}
      {reportModalPostId && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white border-t sm:border border-slate-200 rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-xl pb-[env(safe-area-inset-bottom)]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Report Post or User</h2>
              <button
                type="button"
                onClick={() => setReportModalPostId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
            <form onSubmit={handleSubmitReport} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Why are you reporting this post?
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option>Inappropriate or off-topic content</option>
                  <option>Prohibited live pet selling / breeding ad</option>
                  <option>Spam or treat farming abuse</option>
                  <option>Animal welfare concern</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReportModalPostId(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
