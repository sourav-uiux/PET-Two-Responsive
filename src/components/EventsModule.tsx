import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BellRing,
  CalendarDays,
  CalendarPlus,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  History,
  MapPin,
  Share2,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { downloadEventIcs } from '../utils/nutrition';
import { t } from '../i18n/translations';
import { CommunityEvent } from '../types';
import { DhakaMap } from './DhakaMap';

export const EventsModule: React.FC = () => {
  const { language, user, events, rsvpEvent, requireAuth, pushToast, setActiveTab } = useApp();

  // Default to 'all' so both Upcoming AND Previous/Past events are immediately visible!
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [detailEvent, setDetailEvent] = useState<CommunityEvent | null>(null);

  const upcomingEvents = useMemo(() => events.filter((e) => !e.isPast), [events]);
  const pastEvents = useMemo(() => events.filter((e) => Boolean(e.isPast)), [events]);

  const mapEvents = useMemo(() => {
    if (filter === 'upcoming') return upcomingEvents;
    if (filter === 'past') return pastEvents;
    return events;
  }, [events, upcomingEvents, pastEvents, filter]);

  const mapMarkers = useMemo(
    () =>
      mapEvents.map((e) => ({
        id: e.id,
        label: e.title,
        sublabel: `${e.dateLabel} · ${e.venueName}`,
        area: e.area,
        x: e.coordinates.x,
        y: e.coordinates.y,
        priceText: e.isPast ? `Past · ${e.area}` : e.isFree ? 'Free Event' : e.area,
      })),
    [mapEvents]
  );

  const handleShareEvent = (evt: CommunityEvent) => {
    const text = `Join me at ${evt.title} on ${evt.dateLabel} (${evt.timeLabel}) at ${evt.venueName}, ${evt.area}, Dhaka — hosted by PetLove!`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    pushToast('Event card copied to share', `${evt.title} ready for WhatsApp or Facebook.`, 'teal');
  };

  const renderEventCard = (evt: CommunityEvent) => {
    const isGoing = user ? evt.rsvpGoingIds.includes(user.id) : false;
    const isInterested = user ? evt.rsvpInterestedIds.includes(user.id) : false;
    const isCheckedIn = user ? evt.checkedInUserIds.includes(user.id) : false;
    const spotsPct = Math.min(100, Math.round((evt.rsvpGoingIds.length / evt.capacity) * 100));

    return (
      <article
        key={evt.id}
        className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col"
      >
        <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
          <img
            src={evt.photoUrl}
            alt={evt.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur px-3 py-1 rounded-lg text-xs font-semibold text-slate-900 shadow-sm">
            {evt.isPast ? `Held ${evt.dateLabel}` : `${evt.dateLabel} · ${evt.timeLabel}`}
          </div>
        </div>

        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 font-medium text-teal-700 truncate">
                <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                <span className="truncate">{evt.venueName}</span>
              </span>
              <span className="font-semibold text-slate-700 whitespace-nowrap shrink-0">
                {evt.isPast ? 'Completed' : evt.isFree ? 'Free' : 'Paid Pass'}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1.5">{evt.title}</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{evt.description}</p>

            {/* Turnout / Capacity Bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-teal-600" strokeWidth={2} />
                  <span className="tabular-nums font-semibold text-slate-900">
                    {evt.rsvpGoingIds.length} {evt.isPast ? 'Attended' : 'Going'}
                  </span>
                  {!evt.isPast && <span>· {evt.rsvpInterestedIds.length} Interested</span>}
                </span>
                <span className="font-mono text-slate-500 tabular-nums">Cap: {evt.capacity}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${evt.isPast ? 'bg-slate-400' : 'bg-teal-600'}`}
                  style={{ width: `${spotsPct}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">{evt.feeNote}</p>
            </div>

            {!evt.isPast && (
              <div className="mt-4 p-3 rounded-xl bg-[#F9F9F9] border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5 text-teal-600" strokeWidth={2} />
                  <span>Automatic Event Reminders</span>
                </p>
                <p>
                  {evt.notificationsScheduled.oneDayReminder ? '✓ 1-day reminder' : '○ 1-day reminder'} ·{' '}
                  {evt.notificationsScheduled.twoHourReminder ? '✓ 2-hour alert' : '○ 2-hour alert'} · Post-event photo prompt
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            {evt.isPast ? (
              <>
                {isCheckedIn && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 mr-auto">
                    <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                    Checked in (+30 Treats)
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('feed')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>Post Event Photos</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() =>
                    requireAuth(`RSVP Going to ${evt.title}`, () =>
                      rsvpEvent(evt.id, isGoing ? 'none' : 'going')
                    )
                  }
                  className={`inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                    isGoing
                      ? 'bg-teal-600 text-white'
                      : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                  }`}
                >
                  {isGoing && <Check className="w-3.5 h-3.5" strokeWidth={2} />}
                  <span>{t(language, 'going')}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    requireAuth(`Mark Interested in ${evt.title}`, () =>
                      rsvpEvent(evt.id, isInterested ? 'none' : 'interested')
                    )
                  }
                  className={`px-3.5 py-2 min-h-[40px] text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                    isInterested
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t(language, 'interested')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    downloadEventIcs(evt);
                    pushToast('Calendar file downloaded', `${evt.title} (.ics)`, 'teal');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-xs font-semibold text-slate-700 bg-[#F9F9F9] hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5" strokeWidth={2} />
                  <span className="hidden sm:inline">{t(language, 'add_to_calendar')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShareEvent(evt)}
                  className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-teal-700 bg-[#F9F9F9] border border-slate-200 rounded-xl cursor-pointer"
                  aria-label="Share event"
                >
                  <Share2 className="w-4 h-4" strokeWidth={2} />
                </button>

                <button
                  type="button"
                  onClick={() => setDetailEvent(evt)}
                  className="ml-auto text-xs font-semibold text-teal-700 hover:underline cursor-pointer py-2"
                >
                  What to bring
                </button>
              </>
            )}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4 sm:pb-5">
        <div>
          <button
            type="button"
            onClick={() => {
              setActiveTab('feed');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Back to Feed</span>
          </button>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900">
            Dhaka Community Events
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Monthly PetLove meetups across Dhaka parks — browse upcoming gatherings and highlights from previous events.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'all', label: `All Events (${events.length})` },
              { id: 'upcoming', label: `Upcoming (${upcomingEvents.length})` },
              { id: 'past', label: `Previous Events (${pastEvents.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`flex-1 md:flex-none px-3.5 py-2.5 min-h-[40px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filter === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Dhaka Event Venue Map */}
      <DhakaMap
        markers={mapMarkers}
        selectedId={selectedEventId}
        onSelect={(id) => {
          setSelectedEventId(id);
          const found = events.find((e) => e.id === id);
          if (found) setDetailEvent(found);
        }}
        title="PetLove Dhaka Event Venues"
      />

      {/* Upcoming Events Section */}
      {(filter === 'all' || filter === 'upcoming') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Upcoming Meetups</h2>
            <span className="text-xs text-slate-500">Earn +30 Treats on venue check-in</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {upcomingEvents.map(renderEventCard)}
          </div>
        </section>
      )}

      {/* Previous / Past Events Section (Always shown in All & Previous Events views) */}
      {(filter === 'all' || filter === 'past') && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-t border-slate-200 pt-6">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-slate-500" strokeWidth={2} />
              <h2 className="text-lg font-bold text-slate-900">Previous Dhaka Events</h2>
            </div>
            <span className="text-xs text-slate-500">{pastEvents.length} completed</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {pastEvents.map(renderEventCard)}
          </div>
        </section>
      )}

      {/* Event Details & What to Bring Modal */}
      {detailEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white border-t sm:border border-slate-200 rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90dvh] overflow-y-auto sm:my-auto pb-[env(safe-area-inset-bottom)]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">{detailEvent.title}</h3>
              <button
                type="button"
                onClick={() => setDetailEvent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5 text-xs text-slate-600">
                <p className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-teal-600" strokeWidth={2} />
                  <span className="font-semibold text-slate-900">{detailEvent.dateLabel}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" strokeWidth={2} />
                  <span>{detailEvent.timeLabel}</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-600" strokeWidth={2} />
                  <span>
                    {detailEvent.venueName} ({detailEvent.area}, Dhaka)
                  </span>
                </p>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">{detailEvent.description}</p>

              <div className="bg-[#F9F9F9] border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-900 mb-2">What to Bring</p>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {detailEvent.whatToBring.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" strokeWidth={2} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {!detailEvent.isPast && (
                  <button
                    type="button"
                    onClick={() => downloadEventIcs(detailEvent)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                  >
                    Download .ICS Calendar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDetailEvent(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
