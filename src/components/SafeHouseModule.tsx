import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Flag,
  Home,
  List,
  Map as MapIcon,
  MessageSquare,
  Send,
  Share2,
  ShieldCheck,
  Star,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DHAKA_AREAS, IMAGES } from '../data/seedData';
import { formatBdt, t } from '../i18n/translations';
import { DhakaArea, FosterHost, Species } from '../types';
import { DhakaMap } from './DhakaMap';

type SafeHouseTab = 'browse' | 'stays' | 'apply';

export const SafeHouseModule: React.FC = () => {
  const {
    language,
    user,
    pets,
    fosterHosts,
    fosterRequests,
    requireAuth,
    applyFosterHost,
    createFosterRequest,
    respondFosterRequest,
    sendFosterMessage,
    reportContent,
    pushToast,
    setActiveTab,
  } = useApp();

  const [subTab, setSubTab] = useState<SafeHouseTab>('browse');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [speciesFilter, setSpeciesFilter] = useState<'all' | Species>('all');
  const [areaFilter, setAreaFilter] = useState<'all' | DhakaArea>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'under700'>('all');
  const [selectedMapHostId, setSelectedMapHostId] = useState<string | null>(null);

  // Modals
  const [detailHost, setDetailHost] = useState<FosterHost | null>(null);
  const [requestHost, setRequestHost] = useState<FosterHost | null>(null);
  const [shareHost, setShareHost] = useState<FosterHost | null>(null);
  const [reportTargetHost, setReportTargetHost] = useState<FosterHost | null>(null);
  const [reportReason, setReportReason] = useState('Safety concern or inaccurate home listing');

  // Foster Request Form (M20 & M21)
  const [reqPetId, setReqPetId] = useState(pets[0]?.id || '');
  const [startDate, setStartDate] = useState('2026-12-04');
  const [endDate, setEndDate] = useState('2026-12-07');
  const [emergencyName, setEmergencyName] = useState('Tariq Rahman');
  const [emergencyPhone, setEmergencyPhone] = useState('+880 1713-902211');
  const [vetName, setVetName] = useState('Dr. Mahmudul Hasan (Central Vet)');
  const [vetPhone, setVetPhone] = useState('+880 1715-002391');
  const [reqNotes, setReqNotes] = useState('');
  const [reqTermsAccepted, setReqTermsAccepted] = useState(true);

  // Chat State
  const [activeRequestId, setActiveRequestId] = useState<string | null>(
    fosterRequests[0]?.id || null
  );
  const [chatInput, setChatInput] = useState('');

  // Become a Host Application Form (M16)
  const [appIdDoc, setAppIdDoc] = useState('NID-1993269118204');
  const [appArea, setAppArea] = useState<DhakaArea>(user?.area || 'Dhanmondi');
  const [appExactAddress, setAppExactAddress] = useState('');
  const [appHomeType, setAppHomeType] = useState<FosterHost['homeType']>(
    'Apartment (Netted Balcony)'
  );
  const [appOtherPets, setAppOtherPets] = useState('1 vaccinated indoor cat');
  const [appChildren, setAppChildren] = useState(false);
  const [appExpYears, setAppExpYears] = useState(3);
  const [appBio, setAppBio] = useState('');
  const [appSpecies, setAppSpecies] = useState<Species[]>(['cat']);
  const [appCapacity, setAppCapacity] = useState(2);
  const [appIsFree, setAppIsFree] = useState(false);
  const [appPrice, setAppPrice] = useState(600);
  const [appReference, setAppReference] = useState('');
  const [appTerms, setAppTerms] = useState(false);

  const approvedHosts = useMemo(
    () =>
      fosterHosts.filter((h) => {
        if (h.status !== 'approved') return false;
        if (speciesFilter !== 'all' && !h.speciesAccepted.includes(speciesFilter)) return false;
        if (areaFilter !== 'all' && h.area !== areaFilter) return false;
        if (priceFilter === 'free' && h.pricePerNightBdt !== 0) return false;
        if (priceFilter === 'under700' && h.pricePerNightBdt > 700) return false;
        return true;
      }),
    [fosterHosts, speciesFilter, areaFilter, priceFilter]
  );

  const myHostApplication = useMemo(
    () => (user ? fosterHosts.find((h) => h.userId === user.id) : undefined),
    [fosterHosts, user]
  );

  const myRequests = useMemo(
    () => (user ? fosterRequests.filter((r) => r.ownerId === user.id) : []),
    [fosterRequests, user]
  );

  const activeRequest = useMemo(
    () => myRequests.find((r) => r.id === activeRequestId) || myRequests[0] || null,
    [myRequests, activeRequestId]
  );

  const mapMarkers = useMemo(
    () =>
      approvedHosts.map((h) => ({
        id: h.id,
        label: h.hostName,
        sublabel: `${h.homeType} · Up to ${h.capacity} ${h.speciesAccepted.join('/')}`,
        area: h.area,
        x: h.coordinates.x,
        y: h.coordinates.y,
        priceText: h.pricePerNightBdt === 0 ? 'Free' : `${formatBdt(h.pricePerNightBdt)}/n`,
      })),
    [approvedHosts]
  );

  const calculateNights = (s: string, e: string) => {
    const diff = Math.round((new Date(e).getTime() - new Date(s).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, isNaN(diff) ? 2 : diff);
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestHost) return;
    const pet = pets.find((p) => p.id === reqPetId) || pets[0];
    if (!pet) {
      pushToast('Add a pet first', 'Safe House stays require a pet profile with vaccine status.', 'amber');
      setActiveTab('profile');
      return;
    }
    const nights = calculateNights(startDate, endDate);
    createFosterRequest({
      hostId: requestHost.id,
      hostName: requestHost.hostName,
      hostArea: requestHost.area,
      petId: pet.id,
      petName: pet.name,
      petSpecies: pet.species,
      petVaccineStatus: `${pet.vaccineStatus.replace('_', ' ')} — ${pet.vaccineDetails}`,
      startDate,
      endDate,
      nights,
      estimatedTotalBdt: requestHost.pricePerNightBdt * nights,
      emergencyContactName: emergencyName,
      emergencyContactPhone: emergencyPhone,
      vetName,
      vetPhone,
      notes: reqNotes,
      fosterTermsAccepted: reqTermsAccepted,
    });
    setRequestHost(null);
    setSubTab('stays');
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appTerms || appSpecies.length === 0) return;
    requireAuth('Submit Safe House host application', () => {
      applyFosterHost({
        hostName: user?.name || 'Dhaka Host',
        area: appArea,
        exactAddress: appExactAddress.trim() || `Road 10, ${appArea}, Dhaka`,
        idDocumentNumber: appIdDoc.trim(),
        homeType: appHomeType,
        otherPets: appOtherPets.trim() || 'None',
        childrenAtHome: appChildren,
        experienceYears: Number(appExpYears) || 1,
        bio:
          appBio.trim() ||
          'Verified pet-loving apartment in Dhaka offering calm indoor care with safety netting.',
        photos: [IMAGES.safeHouse],
        speciesAccepted: appSpecies,
        capacity: Number(appCapacity) || 1,
        pricePerNightBdt: appIsFree ? 0 : Number(appPrice) || 500,
        houseRules: [
          'Up-to-date vaccinations required',
          'Emergency vet contact shared in request',
          'Owner provides pet food pack',
        ],
        referenceContact: appReference.trim() || 'Dr. Mahmudul Hasan (+880 1715-002391)',
        fosterTermsAccepted: true,
      });
    });
  };

  const handleSharePlatform = (platform: 'WhatsApp' | 'Facebook' | 'Messenger' | 'Copy', host: FosterHost) => {
    const shareText = `Verified PetLove Safe House in ${host.area}, Dhaka: ${host.hostName} (${
      host.pricePerNightBdt === 0 ? 'Free community foster' : `${formatBdt(host.pricePerNightBdt)}/night`
    }, ${host.homeType}). View on PetLove Dhaka!`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).catch(() => {});
    }
    pushToast(`Shared to ${platform}`, `Copied share card for ${host.hostName} (${host.area}).`, 'teal');
    setShareHost(null);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest || !chatInput.trim()) return;
    sendFosterMessage(activeRequest.id, chatInput);
    setChatInput('');
  };

  const toggleAppSpecies = (sp: Species) => {
    setAppSpecies((prev) =>
      prev.includes(sp) ? (prev.length > 1 ? prev.filter((x) => x !== sp) : prev) : [...prev, sp]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-6">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4 sm:pb-5">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900">
            Safe House Foster Network
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            ID-checked, video-verified foster homes across Dhaka so you can travel with peace of mind.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full md:w-auto overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSubTab('browse')}
            className={`flex-1 md:flex-none px-3.5 py-2.5 min-h-[40px] text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'browse' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            {t(language, 'browse_homes')} ({approvedHosts.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('stays')}
            className={`flex-1 md:flex-none px-3.5 py-2.5 min-h-[40px] text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'stays' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            {t(language, 'my_stays')} ({myRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('apply')}
            className={`flex-1 md:flex-none px-3.5 py-2.5 min-h-[40px] text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'apply' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            {t(language, 'become_host')}
          </button>
        </div>
      </div>

      {/* TAB 1: BROWSE VERIFIED SAFE HOUSES (M18, M19) */}
      {subTab === 'browse' && (
        <div className="space-y-6">
          {/* Filters & List/Map Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F9F9F9] border border-slate-200 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
                {(['all', 'cat', 'dog'] as const).map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => setSpeciesFilter(sp)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                      speciesFilter === sp ? 'bg-teal-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    {sp === 'all' ? 'All Pets' : sp === 'cat' ? 'Cats' : 'Dogs'}
                  </button>
                ))}
              </div>

              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value as 'all' | DhakaArea)}
                className="px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg bg-white"
              >
                <option value="all">{t(language, 'all_areas')}</option>
                {DHAKA_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>

              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as 'all' | 'free' | 'under700')}
                className="px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg bg-white"
              >
                <option value="all">Any Nightly Rate</option>
                <option value="free">Free Community Stays</option>
                <option value="under700">Under ৳700 / night</option>
              </select>
            </div>

            <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                  viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-600'
                }`}
              >
                <List className="w-3.5 h-3.5" strokeWidth={2} />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                  viewMode === 'map' ? 'bg-slate-900 text-white' : 'text-slate-600'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Dhaka Map</span>
              </button>
            </div>
          </div>

          {viewMode === 'map' && (
            <DhakaMap
              markers={mapMarkers}
              selectedId={selectedMapHostId}
              onSelect={(id) => {
                setSelectedMapHostId(id);
                const found = approvedHosts.find((h) => h.id === id);
                if (found) setDetailHost(found);
              }}
              title="Verified Dhaka Safe Houses"
            />
          )}

          {/* Verified Foster Profile Cards (M18) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {approvedHosts.map((host) => (
              <article
                key={host.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-teal-400 transition-colors"
              >
                <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden">
                  <img
                    src={host.photos[0]}
                    alt={`${host.hostName} Safe House in ${host.area}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-md text-xs font-semibold text-teal-800 inline-flex items-center gap-1.5 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" strokeWidth={2} />
                    <span>{t(language, 'verified_host')}</span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{host.hostName}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {host.area}, Dhaka · {host.homeType} · Max {host.capacity} pet
                          {host.capacity > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold font-mono tabular-nums text-slate-900">
                          {host.pricePerNightBdt === 0
                            ? t(language, 'free_label')
                            : formatBdt(host.pricePerNightBdt)}
                        </p>
                        {host.pricePerNightBdt > 0 && (
                          <p className="text-[11px] text-slate-500">{t(language, 'per_night')}</p>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-3 leading-relaxed">{host.bio}</p>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>Accepts: {host.speciesAccepted.map((s) => (s === 'cat' ? 'Cats' : 'Dogs')).join(' & ')}</span>
                      <span aria-hidden="true">·</span>
                      <span>{host.experienceYears} yrs exp</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Star className="w-3 h-3 text-amber-500" strokeWidth={2} />
                        New Verified Host (Ratings in R2)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setDetailHost(host)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-[#F9F9F9] hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      House Rules
                    </button>
                    <button
                      type="button"
                      onClick={() => setShareHost(host)}
                      aria-label="Share foster card"
                      className="p-2 text-slate-600 hover:text-teal-700 bg-[#F9F9F9] hover:bg-teal-50 border border-slate-200 rounded-lg cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        requireAuth(`Request a stay with ${host.hostName}`, () => setRequestHost(host))
                      }
                      className="flex-1 py-2 px-4 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer"
                    >
                      {t(language, 'request_stay')}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MY STAYS, REQUESTS & STAY-SCOPED CHAT (M20, M21) */}
      {subTab === 'stays' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-3">
            {myRequests.length === 0 ? (
              <div className="bg-[#F9F9F9] border border-slate-200 rounded-xl p-8 text-center">
                <p className="text-sm font-semibold text-slate-900">No foster requests yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Request a stay with any verified Safe House to share your pet&apos;s profile and open chat.
                </p>
                <button
                  type="button"
                  onClick={() => setSubTab('browse')}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg cursor-pointer"
                >
                  Browse Verified Homes
                </button>
              </div>
            ) : (
              myRequests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setActiveRequestId(req.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    activeRequest?.id === req.id
                      ? 'border-teal-600 bg-teal-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{req.hostName}</p>
                      <p className="text-xs text-slate-500">
                        {req.hostArea}, Dhaka · Pet: {req.petName}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold capitalize ${
                        req.status === 'accepted'
                          ? 'text-teal-700'
                          : req.status === 'declined'
                          ? 'text-rose-600'
                          : 'text-amber-700'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600">
                    <span>
                      {req.startDate} → {req.endDate} ({req.nights} nights)
                    </span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {req.estimatedTotalBdt === 0 ? 'Free' : formatBdt(req.estimatedTotalBdt)}
                    </span>
                  </div>

                  {/* Interactive Host Decision Simulator for End-to-End Flow 4 Testing */}
                  {req.status === 'pending' && (
                    <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">Simulate Host Action:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            respondFosterRequest(req.id, 'accepted');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md cursor-pointer"
                        >
                          Accept Stay
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            respondFosterRequest(req.id, 'declined');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-md cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Stay Safety Summary + Request-Scoped Chat Panel */}
          <div className="lg:col-span-7">
            {activeRequest ? (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                <div className="px-5 py-4 bg-[#F9F9F9] border-b border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Stay Chat with {activeRequest.hostName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {activeRequest.petName} · {activeRequest.startDate} to {activeRequest.endDate} · Request #{activeRequest.id}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const host = fosterHosts.find((h) => h.id === activeRequest.hostId);
                      if (host) setReportTargetHost(host);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>Report Problem</span>
                  </button>
                </div>

                {/* M21: Shared Safety Info Strip */}
                <div className="px-5 py-3 bg-teal-50/50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-900">Emergency Contact:</span>{' '}
                    {activeRequest.emergencyContactName} ({activeRequest.emergencyContactPhone})
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Vet on File:</span>{' '}
                    {activeRequest.vetName} ({activeRequest.vetPhone})
                  </div>
                  <div className="sm:col-span-2 text-slate-600">
                    <span className="font-semibold text-slate-900">Shared Vaccine Status:</span>{' '}
                    {activeRequest.petVaccineStatus}
                  </div>
                </div>

                {/* Messages */}
                <div className="p-5 space-y-3 min-h-[240px] max-h-[340px] overflow-y-auto bg-white">
                  {activeRequest.messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[82%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-teal-600 text-white'
                              : 'bg-[#F9F9F9] border border-slate-200 text-slate-800'
                          }`}
                        >
                          <p className="font-semibold mb-0.5 opacity-90">{msg.senderName}</p>
                          <p>{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1">{msg.timestamp}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Chat Input (Strictly tied to Accepted Request per Out-of-Scope rule!) */}
                {activeRequest.status === 'accepted' ? (
                  <form
                    onSubmit={handleSendMessage}
                    className="p-4 border-t border-slate-200 bg-[#F9F9F9] flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Coordinate drop-off time, food schedule, or emergency notes..."
                      className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer"
                    >
                      <Send className="w-4 h-4" strokeWidth={2} />
                      <span>Send</span>
                    </button>
                  </form>
                ) : (
                  <div className="p-4 border-t border-slate-200 bg-[#F9F9F9] text-xs text-slate-600 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-400" strokeWidth={2} />
                    <span>
                      Chat opens automatically once the host accepts this stay request (MVP keeps chat request-scoped for safety).
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#F9F9F9] border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
                Select a stay request on the left to view shared safety records and chat.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BECOME A FOSTER HOST APPLICATION (M16, M17, Flow 3) */}
      {subTab === 'apply' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            {myHostApplication ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Your Safe House Host Status</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Submitted {myHostApplication.submittedAt} · {myHostApplication.area}, Dhaka
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold uppercase px-2.5 py-1 rounded-md ${
                      myHostApplication.status === 'approved'
                        ? 'bg-teal-50 text-teal-700'
                        : myHostApplication.status === 'rejected' || myHostApplication.status === 'suspended'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {myHostApplication.status.replace('_', ' ')}
                  </span>
                </div>

                {/* M17 Verification Checklist Tracker */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      label: '1. ID & Address Check',
                      done: myHostApplication.verificationChecklist.idAndAddressChecked,
                    },
                    {
                      label: '2. Video Home-Check Call',
                      done: myHostApplication.verificationChecklist.videoHomeCheckDone,
                    },
                    {
                      label: '3. Reference Verified',
                      done: myHostApplication.verificationChecklist.referenceVerified,
                    },
                  ].map((step) => (
                    <div
                      key={step.label}
                      className="p-3.5 rounded-lg bg-[#F9F9F9] border border-slate-200 flex items-center gap-2.5 text-xs font-semibold text-slate-800"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          step.done ? 'text-teal-600' : 'text-slate-300'
                        }`}
                        strokeWidth={2}
                      />
                      <span>{step.label}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-slate-600">
                  Our Dhaka verification team will reach out on WhatsApp/phone within 24 hours to schedule your 5-minute video home-check and confirm your reference.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleApplySubmit}
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
              >
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Offer Your Home as a Safe House</h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Every host completes NID/address verification, a short video home-check, and 1 personal or vet reference before receiving the Verified badge.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      NID or Passport Number (Private)
                    </label>
                    <input
                      type="text"
                      value={appIdDoc}
                      onChange={(e) => setAppIdDoc(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dhaka Neighborhood (Shown on public card)
                    </label>
                    <select
                      value={appArea}
                      onChange={(e) => setAppArea(e.target.value as DhakaArea)}
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
                      Exact Apartment / Street Address (Hidden from public profile)
                    </label>
                    <input
                      type="text"
                      value={appExactAddress}
                      onChange={(e) => setAppExactAddress(e.target.value)}
                      placeholder="House, Road, Apt number for admin verification only"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Home Type</label>
                    <select
                      value={appHomeType}
                      onChange={(e) => setAppHomeType(e.target.value as FosterHost['homeType'])}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option>Apartment (Netted Balcony)</option>
                      <option>Duplex House</option>
                      <option>Ground Floor with Yard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Years of Pet Care Experience
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={appExpYears}
                      onChange={(e) => setAppExpYears(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Other Pets at Home
                    </label>
                    <input
                      type="text"
                      value={appOtherPets}
                      onChange={(e) => setAppOtherPets(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="flex items-center gap-2.5 pt-5">
                    <input
                      type="checkbox"
                      id="childrenAtHome"
                      checked={appChildren}
                      onChange={(e) => setAppChildren(e.target.checked)}
                      className="accent-teal-600"
                    />
                    <label htmlFor="childrenAtHome" className="text-xs font-semibold text-slate-700">
                      Children under 12 live at home
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Species Accepted
                    </label>
                    <div className="flex items-center gap-2">
                      {(['cat', 'dog'] as Species[]).map((sp) => (
                        <button
                          key={sp}
                          type="button"
                          onClick={() => toggleAppSpecies(sp)}
                          className={`flex-1 py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                            appSpecies.includes(sp)
                              ? 'border-teal-600 bg-teal-50 text-teal-800'
                              : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          {sp === 'cat' ? 'Cats' : 'Dogs'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Max Pet Capacity
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={appCapacity}
                      onChange={(e) => setAppCapacity(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
                    />
                  </div>
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-[#F9F9F9] border border-slate-200 rounded-lg p-3.5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={appIsFree}
                        onChange={(e) => setAppIsFree(e.target.checked)}
                        className="accent-teal-600"
                      />
                      <span>Offer Free Community Fostering (৳0/night)</span>
                    </label>
                    {!appIsFree && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Nightly Rate (BDT ৳)
                        </label>
                        <input
                          type="number"
                          min={100}
                          step={50}
                          value={appPrice}
                          onChange={(e) => setAppPrice(Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white font-mono tabular-nums"
                        />
                      </div>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reference Contact (Dhaka Vet or Pet Parent)
                    </label>
                    <input
                      type="text"
                      value={appReference}
                      onChange={(e) => setAppReference(e.target.value)}
                      placeholder="Name, clinic/relation & phone number"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      About Your Space &amp; Care Routine
                    </label>
                    <textarea
                      rows={3}
                      value={appBio}
                      onChange={(e) => setAppBio(e.target.value)}
                      placeholder="Describe balcony safety netting, quiet rooms, nearby Dhaka vet clinics..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <label className="flex items-start gap-2.5 text-xs text-slate-700 bg-[#F9F9F9] border border-slate-200 rounded-lg p-3.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appTerms}
                    onChange={(e) => setAppTerms(e.target.checked)}
                    className="mt-0.5 accent-teal-600"
                    required
                  />
                  <span>
                    I accept the PetLove Safe House Foster Host Terms, agree to the mandatory video home-check, and will prioritize pet safety and emergency vet protocols.
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer"
                >
                  Submit Application for Verification
                </button>
              </form>
            )}
          </div>

          <aside className="lg:col-span-4 bg-[#F9F9F9] border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900">How Verification Works</h3>
            <ol className="space-y-3 text-xs text-slate-600">
              <li>
                <strong className="text-slate-900">1. ID &amp; Dhaka Address Check:</strong> Your exact address is verified privately and never published on your public card.
              </li>
              <li>
                <strong className="text-slate-900">2. Video Home-Check Call:</strong> A 5-minute walkthrough confirms balcony safety netting and clean rest spaces.
              </li>
              <li>
                <strong className="text-slate-900">3. Reference Verification:</strong> We contact at least one local vet or fellow pet owner.
              </li>
              <li>
                <strong className="text-slate-900">4. Verified Badge &amp; Share Card:</strong> Approved hosts receive a Verified Safe House badge ready to share on WhatsApp &amp; Facebook.
              </li>
            </ol>
          </aside>
        </div>
      )}

      {/* Host House Rules / Detail Modal */}
      {detailHost && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden my-auto">
            <div className="aspect-[16/9] bg-slate-100 relative">
              <img
                src={detailHost.photos[0]}
                alt={detailHost.hostName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setDetailHost(null)}
                className="absolute top-3 right-3 p-2 bg-white/95 text-slate-800 rounded-lg shadow-sm cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 mb-0.5">
                    <ShieldCheck className="w-4 h-4" strokeWidth={2} />
                    <span>Verified Safe House · {detailHost.area}, Dhaka</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{detailHost.hostName}</h3>
                </div>
                <span className="text-base font-bold font-mono tabular-nums text-slate-900">
                  {detailHost.pricePerNightBdt === 0
                    ? 'Free'
                    : `${formatBdt(detailHost.pricePerNightBdt)}/night`}
                </span>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">{detailHost.bio}</p>

              <div className="grid grid-cols-2 gap-3 text-xs bg-[#F9F9F9] border border-slate-200 rounded-lg p-3.5">
                <div>
                  <span className="text-slate-500 block">Home Type</span>
                  <span className="font-semibold text-slate-900">{detailHost.homeType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Other Pets</span>
                  <span className="font-semibold text-slate-900">{detailHost.otherPets}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Children at Home</span>
                  <span className="font-semibold text-slate-900">
                    {detailHost.childrenAtHome ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Capacity</span>
                  <span className="font-semibold text-slate-900">Up to {detailHost.capacity} pets</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-900 mb-2">House Rules</p>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {detailHost.houseRules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" strokeWidth={2} />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setReportTargetHost(detailHost);
                    setDetailHost(null);
                  }}
                  className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                >
                  Report Host
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShareHost(detailHost);
                      setDetailHost(null);
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Share Card
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = detailHost;
                      setDetailHost(null);
                      requireAuth(`Request a stay with ${target.hostName}`, () =>
                        setRequestHost(target)
                      );
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer"
                  >
                    Request a Stay
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request a Stay Modal (M20, M21) */}
      {requestHost && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl my-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Request Stay with {requestHost.hostName}
                </h3>
                <p className="text-xs text-slate-500">
                  {requestHost.area}, Dhaka ·{' '}
                  {requestHost.pricePerNightBdt === 0
                    ? 'Free community stay'
                    : `${formatBdt(requestHost.pricePerNightBdt)}/night`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRequestHost(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Pet (Profile &amp; Vaccine Status auto-shared)
                </label>
                <select
                  value={reqPetId}
                  onChange={(e) => setReqPetId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.species} · Vaccine: {p.vaccineStatus.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Check-in</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Check-out</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#F9F9F9] border border-slate-200 space-y-3">
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" strokeWidth={2} />
                  <span>Required Safety Contacts (M21)</span>
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="Emergency Contact Name"
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    required
                  />
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="Emergency Phone"
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    required
                  />
                  <input
                    type="text"
                    value={vetName}
                    onChange={(e) => setVetName(e.target.value)}
                    placeholder="Dhaka Vet Clinic / Name"
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    required
                  />
                  <input
                    type="tel"
                    value={vetPhone}
                    onChange={(e) => setVetPhone(e.target.value)}
                    placeholder="Vet Phone"
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Feeding &amp; Care Notes
                </label>
                <textarea
                  rows={2}
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  placeholder="Share meal times, shyness tips, or litter habits..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reqTermsAccepted}
                  onChange={(e) => setReqTermsAccepted(e.target.checked)}
                  className="mt-0.5 accent-teal-600"
                  required
                />
                <span>
                  I accept the PetLove Foster Safety Terms and confirm my pet&apos;s vaccination record is accurate.
                </span>
              </label>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-600">
                  Est. {calculateNights(startDate, endDate)} nights:{' '}
                  <strong className="font-mono text-slate-900">
                    {requestHost.pricePerNightBdt === 0
                      ? 'Free'
                      : formatBdt(requestHost.pricePerNightBdt * calculateNights(startDate, endDate))}
                  </strong>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer"
                >
                  Send Stay Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Foster Card Modal (M19: WhatsApp, Facebook, Messenger) */}
      {shareHost && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Share Safe House Card</h3>
              <button
                type="button"
                onClick={() => setShareHost(null)}
                className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-lg bg-[#F9F9F9] border border-slate-200">
                <p className="text-xs font-semibold text-teal-700">Verified Safe House · {shareHost.area}</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{shareHost.hostName}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {shareHost.homeType} ·{' '}
                  {shareHost.pricePerNightBdt === 0
                    ? 'Free'
                    : `${formatBdt(shareHost.pricePerNightBdt)}/night`}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {(['WhatsApp', 'Facebook', 'Messenger', 'Copy'] as const).map((plat) => (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => handleSharePlatform(plat, shareHost)}
                    className="py-2.5 px-3 text-xs font-semibold text-slate-800 bg-white hover:bg-teal-50 hover:text-teal-800 border border-slate-200 rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {plat === 'Copy' ? (
                      <Copy className="w-3.5 h-3.5" strokeWidth={2} />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" strokeWidth={2} />
                    )}
                    <span>{plat === 'Copy' ? 'Copy Link' : plat}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Host Modal (M21) */}
      {reportTargetHost && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Report {reportTargetHost.hostName}
              </h3>
              <button
                type="button"
                onClick={() => setReportTargetHost(null)}
                className="p-1 text-slate-400 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                reportContent({
                  targetType: 'foster_host',
                  targetId: reportTargetHost.id,
                  targetTitle: `Safe House: ${reportTargetHost.hostName} (${reportTargetHost.area})`,
                  reason: reportReason,
                });
                setReportTargetHost(null);
              }}
              className="p-6 space-y-4"
            >
              <textarea
                rows={3}
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                required
              />
              <button
                type="submit"
                className="w-full py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                Submit Safety Report to Admin
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
