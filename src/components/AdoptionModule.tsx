import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Eye,
  HeartHandshake,
  ImagePlus,
  MapPin,
  Phone,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DHAKA_AREAS, IMAGES } from '../data/seedData';
import { formatBdt } from '../i18n/translations';
import { AdoptionPostType, AdoptionRescuePost, DhakaArea, Species } from '../types';

type AdoptionTabFilter = 'all' | 'adoption' | 'lost_cat' | 'found_rescue';

const PRESET_PHOTOS = [
  { label: 'Persian Cat', url: IMAGES.persianCat },
  { label: 'Ginger Tabby', url: IMAGES.tabbyCat },
  { label: 'Golden Dog', url: IMAGES.goldenDog },
  { label: 'Indoor Home', url: IMAGES.safeHouse },
];

function getTypeMeta(type: AdoptionPostType): {
  label: string;
  accentClass: string;
  actionLabel: string;
  resolvedLabel: string;
} {
  switch (type) {
    case 'lost_cat':
      return {
        label: 'Lost Cat Alert',
        accentClass: 'bg-rose-600 text-white',
        actionLabel: 'Report Sighting',
        resolvedLabel: 'Reunited Safe',
      };
    case 'found_rescue':
      return {
        label: 'Found & Rescue',
        accentClass: 'bg-amber-600 text-white',
        actionLabel: 'Claim / Help Rescue',
        resolvedLabel: 'Rescued / Reunited',
      };
    case 'give_adoption':
      return {
        label: 'Give for Adoption',
        accentClass: 'bg-teal-600 text-white',
        actionLabel: 'Take Adoption',
        resolvedLabel: 'Adopted',
      };
    case 'take_adoption':
      return {
        label: 'Looking to Adopt',
        accentClass: 'bg-indigo-600 text-white',
        actionLabel: 'Offer a Pet Match',
        resolvedLabel: 'Matched & Adopted',
      };
  }
}

export const AdoptionModule: React.FC = () => {
  const {
    user,
    adoptionPosts,
    requireAuth,
    createAdoptionPost,
    addLostSighting,
    submitAdoptionInquiry,
    markAdoptionPostResolved,
    deleteAdoptionPost,
    pushToast,
  } = useApp();

  const [tabFilter, setTabFilter] = useState<AdoptionTabFilter>('all');
  const [areaFilter, setAreaFilter] = useState<'all' | DhakaArea>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Post Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [formType, setFormType] = useState<AdoptionPostType>('lost_cat');
  const [fTitle, setFTitle] = useState('');
  const [fPetName, setFPetName] = useState('');
  const [fSpecies, setFSpecies] = useState<Species>('cat');
  const [fBreed, setFBreed] = useState('Deshi Shorthair');
  const [fAgeLabel, setFAgeLabel] = useState('6 months');
  const [fGender, setFGender] = useState<'male' | 'female' | 'unknown'>('male');
  const [fColor, setFColor] = useState('');
  const [fArea, setFArea] = useState<DhakaArea>(user?.area || 'Dhanmondi');
  const [fExactLocation, setFExactLocation] = useState('');
  const [fDateLabel, setFDateLabel] = useState('Today');
  const [fPhone, setFPhone] = useState(user?.phone || '+880 1711-');
  const [fRewardBdt, setFRewardBdt] = useState('');
  const [fVaccinated, setFVaccinated] = useState(true);
  const [fNeutered, setFNeutered] = useState(false);
  const [fHealthCondition, setFHealthCondition] = useState<
    'Healthy' | 'Needs Vet Care' | 'Kitten / Vulnerable' | 'Scared / Shy'
  >('Healthy');
  const [fRequirements, setFRequirements] = useState(
    'Indoor Dhaka home with netted balcony/windows, zero adoption fee.'
  );
  const [fDescription, setFDescription] = useState('');
  const [fPhotos, setFPhotos] = useState<string[]>([IMAGES.tabbyCat]);

  // Detail & Interaction Modal
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [sightingLandmark, setSightingLandmark] = useState('');
  const [sightingArea, setSightingArea] = useState<DhakaArea>(user?.area || 'Dhanmondi');
  const [sightingNote, setSightingNote] = useState('');
  const [sightingPhone, setSightingPhone] = useState(user?.phone || '+880 1711-');

  const [inqArea, setInqArea] = useState<DhakaArea>(user?.area || 'Dhanmondi');
  const [inqHomeType, setInqHomeType] = useState('Apartment (Netted Balcony)');
  const [inqNetted, setInqNetted] = useState(true);
  const [inqPhone, setInqPhone] = useState(user?.phone || '+880 1711-');
  const [inqMessage, setInqMessage] = useState('');

  const selectedPost = useMemo(
    () => (selectedPostId ? adoptionPosts.find((p) => p.id === selectedPostId) || null : null),
    [adoptionPosts, selectedPostId]
  );

  // Urgent active lost-cat alerts (prioritize user's Dhaka area)
  const activeLostAlerts = useMemo(
    () =>
      adoptionPosts
        .filter((p) => p.type === 'lost_cat' && p.status === 'active')
        .sort((a, b) => {
          const userArea = user?.area || 'Dhanmondi';
          return (b.area === userArea ? 1 : 0) - (a.area === userArea ? 1 : 0);
        }),
    [adoptionPosts, user]
  );

  const filteredPosts = useMemo(() => {
    return adoptionPosts.filter((post) => {
      if (tabFilter === 'adoption') {
        if (post.type !== 'give_adoption' && post.type !== 'take_adoption') return false;
      } else if (tabFilter !== 'all' && post.type !== tabFilter) {
        return false;
      }
      if (areaFilter !== 'all' && post.area !== areaFilter) return false;
      if (
        searchQuery.trim() &&
        !`${post.title} ${post.petName} ${post.breed} ${post.area} ${post.colorMarkings} ${post.description}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [adoptionPosts, tabFilter, areaFilter, searchQuery]);

  const openCreateModalWithType = (type: AdoptionPostType) => {
    requireAuth('Create an Adoption or Lost/Found Rescue post', () => {
      setFormType(type);
      setFArea(user?.area || 'Dhanmondi');
      setFPhone(user?.phone || '+880 1711-');
      setFTitle('');
      setFPetName(type === 'take_adoption' ? 'Looking to Adopt' : '');
      setFColor('');
      setFExactLocation('');
      setFRewardBdt('');
      setFDescription('');
      setFPhotos([
        type === 'lost_cat'
          ? IMAGES.persianCat
          : type === 'take_adoption'
          ? IMAGES.safeHouse
          : IMAGES.tabbyCat,
      ]);
      setCreateOpen(true);
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5 - fPhotos.length);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFPhotos((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fTitle.trim() || !fDescription.trim()) return;
    const created = createAdoptionPost({
      type: formType,
      authorPhone: fPhone.trim(),
      title: fTitle.trim(),
      petName:
        fPetName.trim() ||
        (formType === 'found_rescue'
          ? 'Found Cat'
          : formType === 'take_adoption'
          ? 'Looking to Adopt'
          : 'Cat'),
      species: fSpecies,
      breed: fBreed.trim() || 'Deshi Shorthair',
      ageLabel: fAgeLabel.trim() || 'Unknown',
      gender: fGender,
      colorMarkings: fColor.trim() || 'See photos for coat markings',
      area: fArea,
      exactLocation: fExactLocation.trim() || `${fArea}, Dhaka`,
      dateLabel:
        fDateLabel.trim() ||
        (formType === 'lost_cat'
          ? 'Lost today'
          : formType === 'found_rescue'
          ? 'Found today'
          : 'Available now'),
      rewardBdt: formType === 'lost_cat' && Number(fRewardBdt) > 0 ? Number(fRewardBdt) : undefined,
      vaccinated: formType === 'give_adoption' || formType === 'lost_cat' ? fVaccinated : undefined,
      neutered: formType === 'give_adoption' || formType === 'lost_cat' ? fNeutered : undefined,
      healthCondition: formType === 'found_rescue' ? fHealthCondition : undefined,
      adoptionRequirements:
        formType === 'give_adoption' || formType === 'take_adoption'
          ? fRequirements.trim()
          : undefined,
      description: fDescription.trim(),
      photos: fPhotos.length > 0 ? fPhotos : [IMAGES.tabbyCat],
    });
    if (created) {
      setCreateOpen(false);
      setSelectedPostId(created.id);
    }
  };

  const handleSharePost = async (post: AdoptionRescuePost) => {
    const meta = getTypeMeta(post.type);
    const shareText = `[PetLove Dhaka · ${meta.label}] ${post.title}\nLocation: ${post.exactLocation}, ${post.area}, Dhaka\nContact: ${post.authorPhone}\nDetails: ${post.description}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
      }
      pushToast('Post text copied to share!', `Share this ${meta.label.toLowerCase()} with Dhaka groups.`, 'teal');
    } catch {
      pushToast('Ready to share', shareText.slice(0, 90) + '...', 'teal');
    }
  };

  const handleSightingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !sightingLandmark.trim()) return;
    requireAuth('Report a lost cat sighting', () => {
      addLostSighting(selectedPost.id, {
        reporterName: user?.name || 'Dhaka Neighbor',
        reporterPhone: sightingPhone.trim(),
        area: sightingArea,
        landmark: sightingLandmark.trim(),
        note: sightingNote.trim() || 'Spotted nearby — please call to coordinate.',
      });
      setSightingLandmark('');
      setSightingNote('');
    });
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !inqMessage.trim()) return;
    requireAuth('Submit adoption or rescue contact', () => {
      submitAdoptionInquiry(selectedPost.id, {
        applicantName: user?.name || 'Verified Pet Parent',
        applicantPhone: inqPhone.trim(),
        area: inqArea,
        homeType: inqHomeType,
        nettedBalcony: inqNetted,
        message: inqMessage.trim(),
      });
      setInqMessage('');
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-6">
      {/* Header + 4 Quick Create Actions */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900">
            Adoption, Lost &amp; Found Rescue
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Give or take a cat for free adoption, post a found rescue cat, or trigger an instant Dhaka area alert for a lost cat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openCreateModalWithType('lost_cat')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[42px] text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg whitespace-nowrap cursor-pointer"
          >
            <BellRing className="w-4 h-4" strokeWidth={2} />
            <span>Post Lost Cat Alert</span>
          </button>
          <button
            type="button"
            onClick={() => openCreateModalWithType('found_rescue')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[42px] text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="w-4 h-4" strokeWidth={2} />
            <span>Found / Rescue Cat</span>
          </button>
          <button
            type="button"
            onClick={() => openCreateModalWithType('give_adoption')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[42px] text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>Give / Take Adoption</span>
          </button>
        </div>
      </div>

      {/* Live Active Lost Cat Area Alert Banner */}
      {activeLostAlerts.length > 0 && (
        <section className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-rose-800">
              <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2.25} />
              <h2 className="text-xs sm:text-sm font-bold">
                Active Lost Cat Area Alerts in Dhaka ({activeLostAlerts.length})
              </h2>
            </div>
            <span className="text-[11px] font-medium text-rose-700">
              Neighborhood Push &amp; SMS Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeLostAlerts.slice(0, 2).map((alertPost) => (
              <button
                key={alertPost.id}
                type="button"
                onClick={() => setSelectedPostId(alertPost.id)}
                className="text-left bg-white border border-rose-200 hover:border-rose-400 rounded-xl p-3 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <img
                  src={alertPost.photos[0]}
                  alt={alertPost.petName}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-lg object-cover shrink-0 bg-slate-100"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700">
                    <span>{alertPost.area} Alert</span>
                    <span>·</span>
                    <span>{alertPost.areaNotifiedCount || 320} neighbors alerted</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
                    {alertPost.petName} — {alertPost.exactLocation}
                  </p>
                  <p className="text-xs text-slate-600 truncate">
                    {alertPost.colorMarkings}
                  </p>
                </div>
                <span className="px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 rounded-lg shrink-0">
                  Spotted?
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'all', label: `All (${adoptionPosts.length})` },
              {
                id: 'adoption',
                label: `Adoption (${adoptionPosts.filter((p) => p.type === 'give_adoption' || p.type === 'take_adoption').length})`,
              },
              {
                id: 'lost_cat',
                label: `Lost Alerts (${adoptionPosts.filter((p) => p.type === 'lost_cat').length})`,
              },
              {
                id: 'found_rescue',
                label: `Found & Rescue (${adoptionPosts.filter((p) => p.type === 'found_rescue').length})`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTabFilter(tab.id)}
              className={`px-3.5 py-2 min-h-[38px] text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                tabFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-56">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              strokeWidth={2}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area, breed, color..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value as 'all' | DhakaArea)}
            className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-800"
          >
            <option value="all">All Dhaka Areas</option>
            {DHAKA_AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      {filteredPosts.length === 0 ? (
        <div className="bg-[#F9F9F9] border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <HeartHandshake className="w-8 h-8 text-slate-400 mx-auto" strokeWidth={2} />
          <p className="text-sm font-semibold text-slate-900">No posts found for this area or filter</p>
          <button
            type="button"
            onClick={() => openCreateModalWithType('give_adoption')}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer"
          >
            Create the First Post
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPosts.map((post) => {
            const meta = getTypeMeta(post.type);
            const isResolved = post.status === 'resolved';
            return (
              <article
                key={post.id}
                className={`bg-white border rounded-2xl overflow-hidden flex flex-col transition-colors ${
                  post.type === 'lost_cat' && !isResolved
                    ? 'border-rose-300'
                    : 'border-slate-200 hover:border-teal-400'
                }`}
              >
                <div
                  onClick={() => setSelectedPostId(post.id)}
                  className="relative aspect-[16/10] bg-slate-100 overflow-hidden cursor-pointer"
                >
                  <img
                    src={post.photos[0]}
                    alt={post.title}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover ${isResolved ? 'opacity-70' : ''}`}
                  />
                  <span
                    className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                      isResolved ? 'bg-slate-800 text-white' : meta.accentClass
                    }`}
                  >
                    {isResolved ? meta.resolvedLabel : meta.label}
                  </span>
                  {post.rewardBdt && !isResolved && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-white/95 text-rose-700 text-[11px] font-bold font-mono tabular-nums shadow-sm">
                      Reward {formatBdt(post.rewardBdt)}
                    </span>
                  )}
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" strokeWidth={2} />
                        {post.area}, Dhaka
                      </span>
                      <span>{post.createdAt}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedPostId(post.id)}
                      className="text-left text-base font-bold text-slate-900 hover:text-teal-700 leading-snug cursor-pointer"
                    >
                      {post.title}
                    </button>

                    <p className="text-xs text-slate-500">
                      {post.breed} · {post.ageLabel}
                      {post.gender !== 'unknown' ? ` · ${post.gender}` : ''}
                      {post.vaccinated ? ' · Vaccinated' : ''}
                      {post.neutered ? ' · Neutered' : ''}
                    </p>

                    <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
                      {post.description}
                    </p>

                    {post.alertSentToArea && !isResolved && (
                      <p className="text-[11px] font-semibold text-rose-700 flex items-center gap-1.5 pt-0.5">
                        <BellRing className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                        <span>
                          Area alert active in {post.area} ({post.areaNotifiedCount} neighbors notified)
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPostId(post.id)}
                      className={`flex-1 py-2.5 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        isResolved
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : post.type === 'lost_cat'
                          ? 'bg-rose-600 text-white hover:bg-rose-700'
                          : post.type === 'found_rescue'
                          ? 'bg-amber-600 text-white hover:bg-amber-700'
                          : 'bg-teal-600 text-white hover:bg-teal-700'
                      }`}
                    >
                      {isResolved ? 'View Details' : meta.actionLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSharePost(post)}
                      aria-label="Share post"
                      className="inline-flex items-center gap-1 px-3 py-2.5 text-xs font-semibold text-slate-700 bg-[#F9F9F9] hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* CREATE ADOPTION / LOST CAT / FOUND RESCUE MODAL */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white border-t sm:border border-slate-200 rounded-t-2xl sm:rounded-2xl w-full max-w-xl shadow-2xl max-h-[92dvh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Create Adoption, Rescue, or Lost Cat Post
              </h2>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* 4 Mode Selector */}
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'lost_cat', label: 'Lost Cat (+ Area Alert)' },
                    { id: 'found_rescue', label: 'Found / Rescue Cat' },
                    { id: 'give_adoption', label: 'Give for Adoption' },
                    { id: 'take_adoption', label: 'Take Adoption (Seeking)' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormType(opt.id)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition-colors cursor-pointer ${
                      formType === opt.id
                        ? opt.id === 'lost_cat'
                          ? 'bg-rose-50 border-rose-500 text-rose-800'
                          : opt.id === 'found_rescue'
                          ? 'bg-amber-50 border-amber-500 text-amber-900'
                          : 'bg-teal-50 border-teal-600 text-teal-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Live Area Alert Notice for Lost Cat */}
              {formType === 'lost_cat' && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-900">
                  <BellRing className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" strokeWidth={2} />
                  <span>
                    <strong>Instant Area Alert:</strong> Publishing this Lost Cat post will automatically broadcast a Push &amp; SMS neighborhood alert to verified PetLove members in <strong>{fArea}, Dhaka</strong>.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Post Headline
                  </label>
                  <input
                    type="text"
                    value={fTitle}
                    onChange={(e) => setFTitle(e.target.value)}
                    placeholder={
                      formType === 'lost_cat'
                        ? 'e.g., Lost White Persian Cat near Road 9/A, Dhanmondi'
                        : formType === 'found_rescue'
                        ? 'e.g., Found Injured Kitten near Banani Road 11'
                        : formType === 'give_adoption'
                        ? 'e.g., 4-Month Vaccinated Tabby Kitten Ready for Adoption'
                        : 'e.g., Looking to Adopt an Indoor Rescued Kitten in Uttara'
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                {formType !== 'take_adoption' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pet Name
                    </label>
                    <input
                      type="text"
                      value={fPetName}
                      onChange={(e) => setFPetName(e.target.value)}
                      placeholder={formType === 'found_rescue' ? 'Found Cat' : 'e.g., Simba'}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dhaka Neighborhood (Area Alert Zone)
                  </label>
                  <select
                    value={fArea}
                    onChange={(e) => setFArea(e.target.value as DhakaArea)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {DHAKA_AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}, Dhaka
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {formType === 'lost_cat'
                      ? 'Last Seen Street / Landmark'
                      : formType === 'found_rescue'
                      ? 'Found Location / Landmark'
                      : 'Neighborhood / Pickup Location'}
                  </label>
                  <input
                    type="text"
                    value={fExactLocation}
                    onChange={(e) => setFExactLocation(e.target.value)}
                    placeholder="e.g., Road 27 near Rapa Plaza, Dhanmondi"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Breed / Type
                  </label>
                  <input
                    type="text"
                    value={fBreed}
                    onChange={(e) => setFBreed(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Age / Gender
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={fAgeLabel}
                      onChange={(e) => setFAgeLabel(e.target.value)}
                      placeholder="6 months"
                      className="flex-1 px-2.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                    <select
                      value={fGender}
                      onChange={(e) => setFGender(e.target.value as 'male' | 'female' | 'unknown')}
                      className="px-2 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="unknown">Any</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Mobile (Dhaka)
                  </label>
                  <input
                    type="tel"
                    value={fPhone}
                    onChange={(e) => setFPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                {formType === 'lost_cat' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Optional Reward (BDT ৳)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={fRewardBdt}
                      onChange={(e) => setFRewardBdt(e.target.value)}
                      placeholder="e.g., 2000"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                ) : formType === 'found_rescue' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Health Condition
                    </label>
                    <select
                      value={fHealthCondition}
                      onChange={(e) =>
                        setFHealthCondition(
                          e.target.value as
                            | 'Healthy'
                            | 'Needs Vet Care'
                            | 'Kitten / Vulnerable'
                            | 'Scared / Shy'
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Healthy">Healthy</option>
                      <option value="Needs Vet Care">Needs Vet Care</option>
                      <option value="Kitten / Vulnerable">Kitten / Vulnerable</option>
                      <option value="Scared / Shy">Scared / Shy</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Species
                    </label>
                    <select
                      value={fSpecies}
                      onChange={(e) => setFSpecies(e.target.value as Species)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="cat">Cat</option>
                      <option value="dog">Dog</option>
                    </select>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Color, Collar &amp; Distinguishing Markings
                  </label>
                  <input
                    type="text"
                    value={fColor}
                    onChange={(e) => setFColor(e.target.value)}
                    placeholder="e.g., Ginger tabby with white paws, wearing blue collar"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                {(formType === 'give_adoption' || formType === 'lost_cat') && (
                  <div className="sm:col-span-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fVaccinated}
                        onChange={(e) => setFVaccinated(e.target.checked)}
                        className="accent-teal-600"
                      />
                      <span>Vaccinated</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fNeutered}
                        onChange={(e) => setFNeutered(e.target.checked)}
                        className="accent-teal-600"
                      />
                      <span>Neutered / Spayed</span>
                    </label>
                  </div>
                )}

                {(formType === 'give_adoption' || formType === 'take_adoption') && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {formType === 'give_adoption'
                        ? 'Adoption Rules & Home Requirements'
                        : 'Your Home Environment (Netted Balcony / Experience)'}
                    </label>
                    <input
                      type="text"
                      value={fRequirements}
                      onChange={(e) => setFRequirements(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Details
                  </label>
                  <textarea
                    rows={3}
                    value={fDescription}
                    onChange={(e) => setFDescription(e.target.value)}
                    placeholder="Share temperament, how the cat went missing or was rescued, and best way to reach you..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg resize-none"
                    required
                  />
                </div>

                {/* Photo Uploader */}
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Photos ({fPhotos.length}/5)
                    </label>
                    <label className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline cursor-pointer">
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
                  <div className="flex flex-wrap gap-2">
                    {fPhotos.map((src, i) => (
                      <div
                        key={i}
                        className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200"
                      >
                        <img src={src} alt="Preview" className="w-full h-full object-cover" />
                        {fPhotos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setFPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-0.5 right-0.5 p-0.5 bg-slate-900/75 text-white rounded-full cursor-pointer"
                          >
                            <X className="w-3 h-3" strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_PHOTOS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          setFPhotos((prev) =>
                            prev.length < 5 && !prev.includes(preset.url)
                              ? [...prev, preset.url]
                              : prev
                          )
                        }
                        className="px-2 py-1 text-[11px] font-medium text-slate-600 bg-[#F9F9F9] border border-slate-200 rounded-md cursor-pointer"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 text-sm font-semibold text-white rounded-xl inline-flex items-center justify-center gap-2 cursor-pointer ${
                  formType === 'lost_cat'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : formType === 'found_rescue'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                {formType === 'lost_cat' ? (
                  <>
                    <BellRing className="w-4 h-4" strokeWidth={2} />
                    <span>Publish &amp; Send {fArea} Area Alert</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                    <span>Publish Post</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL (Sighting Report / Adoption Application / Rescue Claim) */}
      {selectedPost && (() => {
        const meta = getTypeMeta(selectedPost.type);
        const isOwner = user?.id === selectedPost.authorId;
        const isResolved = selectedPost.status === 'resolved';

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
            onClick={() => setSelectedPostId(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white border-t sm:border border-slate-200 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92dvh] flex flex-col"
            >
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 ${
                      isResolved ? 'bg-slate-800 text-white' : meta.accentClass
                    }`}
                  >
                    {isResolved ? meta.resolvedLabel : meta.label}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    {selectedPost.petName} · {selectedPost.area}, Dhaka
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPostId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-5 aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={selectedPost.photos[0]}
                      alt={selectedPost.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="sm:col-span-7 space-y-2.5">
                    <h4 className="text-lg font-bold text-slate-900 leading-snug">
                      {selectedPost.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedPost.description}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="bg-[#F9F9F9] border border-slate-200 rounded-lg p-2.5">
                        <span className="text-slate-500 block">Location</span>
                        <span className="font-semibold text-slate-900">
                          {selectedPost.exactLocation}
                        </span>
                      </div>
                      <div className="bg-[#F9F9F9] border border-slate-200 rounded-lg p-2.5">
                        <span className="text-slate-500 block">Contact</span>
                        <span className="font-mono font-semibold text-teal-700 flex items-center gap-1">
                          <Phone className="w-3 h-3" strokeWidth={2} />
                          {selectedPost.authorPhone}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Extra Clinical / Marking Info */}
                <div className="bg-[#F9F9F9] border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Breed · Age · Gender</span>
                    <span className="font-semibold text-slate-900 capitalize">
                      {selectedPost.breed} · {selectedPost.ageLabel} · {selectedPost.gender}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Coat / Markings</span>
                    <span className="font-semibold text-slate-900">
                      {selectedPost.colorMarkings}
                    </span>
                  </div>
                  {selectedPost.healthCondition && (
                    <div>
                      <span className="text-slate-500 block">Rescue Health Condition</span>
                      <span className="font-semibold text-amber-800">
                        {selectedPost.healthCondition}
                      </span>
                    </div>
                  )}
                  {selectedPost.adoptionRequirements && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block">Adoption / Home Notes</span>
                      <span className="font-semibold text-slate-900">
                        {selectedPost.adoptionRequirements}
                      </span>
                    </div>
                  )}
                </div>

                {/* Owner Actions (Mark Resolved / Delete) */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleSharePost(selectedPost)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>Share Text &amp; Details</span>
                  </button>

                  {isOwner && (
                    <div className="flex items-center gap-2">
                      {!isResolved && (
                        <button
                          type="button"
                          onClick={() => markAdoptionPostResolved(selectedPost.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>Mark {meta.resolvedLabel}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          deleteAdoptionPost(selectedPost.id);
                          setSelectedPostId(null);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                        <span>Remove</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* LOST CAT SIGHTINGS LOG & REPORT FORM */}
                {selectedPost.type === 'lost_cat' && (
                  <div className="space-y-4 border-t border-slate-200 pt-4">
                    <h5 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-rose-600" strokeWidth={2} />
                      <span>Community Sightings ({selectedPost.sightings.length})</span>
                    </h5>

                    {selectedPost.sightings.length > 0 && (
                      <div className="space-y-2">
                        {selectedPost.sightings.map((s) => (
                          <div
                            key={s.id}
                            className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-900">
                                {s.reporterName} · {s.area}
                              </span>
                              <span className="text-slate-500">{s.timestamp}</span>
                            </div>
                            <p className="font-semibold text-rose-800">Spotted at: {s.landmark}</p>
                            <p className="text-slate-700">{s.note}</p>
                            <p className="font-mono text-slate-600">Phone: {s.reporterPhone}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {!isResolved && (
                      <form
                        onSubmit={handleSightingSubmit}
                        className="p-4 rounded-xl bg-[#F9F9F9] border border-slate-200 space-y-3"
                      >
                        <p className="text-xs font-bold text-slate-900">
                          Spotted {selectedPost.petName}? Alert {selectedPost.authorName} immediately
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <select
                            value={sightingArea}
                            onChange={(e) => setSightingArea(e.target.value as DhakaArea)}
                            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                          >
                            {DHAKA_AREAS.map((a) => (
                              <option key={a} value={a}>
                                {a}
                              </option>
                            ))}
                          </select>
                          <input
                            type="tel"
                            value={sightingPhone}
                            onChange={(e) => setSightingPhone(e.target.value)}
                            placeholder="Your phone number"
                            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                            required
                          />
                          <input
                            type="text"
                            value={sightingLandmark}
                            onChange={(e) => setSightingLandmark(e.target.value)}
                            placeholder="Exact road / shop / building landmark"
                            className="sm:col-span-2 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                            required
                          />
                          <textarea
                            rows={2}
                            value={sightingNote}
                            onChange={(e) => setSightingNote(e.target.value)}
                            placeholder="Direction heading, collar seen, or whether you are holding the cat safely..."
                            className="sm:col-span-2 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white resize-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                        >
                          Send Sighting Alert Now
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* ADOPTION APPLICATION / RESCUE CLAIM / MATCH OFFER FORM */}
                {selectedPost.type !== 'lost_cat' && (
                  <div className="space-y-4 border-t border-slate-200 pt-4">
                    <h5 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-600" strokeWidth={2} />
                      <span>
                        {selectedPost.type === 'found_rescue'
                          ? `Rescue & Claim Responses (${selectedPost.inquiries.length})`
                          : `Adoption Responses (${selectedPost.inquiries.length})`}
                      </span>
                    </h5>

                    {selectedPost.inquiries.length > 0 && (
                      <div className="space-y-2">
                        {selectedPost.inquiries.map((inq) => (
                          <div
                            key={inq.id}
                            className="p-3 rounded-xl bg-teal-50/50 border border-teal-200 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-900">
                                {inq.applicantName} · {inq.area}
                              </span>
                              <span className="text-slate-500">{inq.timestamp}</span>
                            </div>
                            <p className="text-slate-700">{inq.message}</p>
                            <p className="text-slate-500">
                              {inq.homeType} {inq.nettedBalcony ? '· Netted Balcony ✓' : ''} ·{' '}
                              <span className="font-mono text-teal-800">{inq.applicantPhone}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {!isResolved && (
                      <form
                        onSubmit={handleInquirySubmit}
                        className="p-4 rounded-xl bg-[#F9F9F9] border border-slate-200 space-y-3"
                      >
                        <p className="text-xs font-bold text-slate-900">
                          {selectedPost.type === 'give_adoption'
                            ? `Apply to Take Adoption of ${selectedPost.petName}`
                            : selectedPost.type === 'take_adoption'
                            ? `Offer a Rescued Pet to ${selectedPost.authorName}`
                            : `Claim Your Cat or Offer Rescue Help`}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <select
                            value={inqArea}
                            onChange={(e) => setInqArea(e.target.value as DhakaArea)}
                            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                          >
                            {DHAKA_AREAS.map((a) => (
                              <option key={a} value={a}>
                                {a}
                              </option>
                            ))}
                          </select>
                          <input
                            type="tel"
                            value={inqPhone}
                            onChange={(e) => setInqPhone(e.target.value)}
                            placeholder="Your Dhaka phone"
                            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                            required
                          />
                          <select
                            value={inqHomeType}
                            onChange={(e) => setInqHomeType(e.target.value)}
                            className="sm:col-span-2 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                          >
                            <option>Apartment (Netted Balcony)</option>
                            <option>Duplex / Family Home</option>
                            <option>Ground Floor with Secure Rooms</option>
                          </select>
                          <label className="sm:col-span-2 flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={inqNetted}
                              onChange={(e) => setInqNetted(e.target.checked)}
                              className="accent-teal-600"
                            />
                            <span>My windows &amp; balconies are cat-netted for indoor safety</span>
                          </label>
                          <textarea
                            rows={2}
                            value={inqMessage}
                            onChange={(e) => setInqMessage(e.target.value)}
                            placeholder="Introduce yourself, your experience with cats, and when you can meet..."
                            className="sm:col-span-2 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white resize-none"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer"
                        >
                          {selectedPost.type === 'give_adoption'
                            ? 'Submit Adoption Application'
                            : selectedPost.type === 'take_adoption'
                            ? 'Send Pet Match Offer'
                            : 'Send Claim / Rescue Message'}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
