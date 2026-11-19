import React, { useState } from 'react';
import { Bell, CheckCheck, SlidersHorizontal, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NotificationPreferences } from '../types';

export const NotificationsDrawer: React.FC = () => {
  const {
    notifications,
    notificationPrefs,
    notificationsOpen,
    setNotificationsOpen,
    markAllNotificationsRead,
    toggleNotificationPref,
    setActiveTab,
  } = useApp();

  const [view, setView] = useState<'inbox' | 'settings'>('inbox');

  if (!notificationsOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="fixed inset-0 bg-slate-900/45"
        onClick={() => setNotificationsOpen(false)}
      />

      <aside className="relative ml-auto w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" strokeWidth={2} />
            <h2 className="text-base font-bold text-slate-900">
              Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setView(view === 'inbox' ? 'settings' : 'inbox')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                view === 'settings'
                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                  : 'bg-[#F9F9F9] text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={2} />
              <span>{view === 'inbox' ? 'Settings' : 'Inbox'}</span>
            </button>
            <button
              type="button"
              onClick={() => setNotificationsOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer"
              aria-label="Close notifications"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Content */}
        {view === 'inbox' ? (
          <div className="flex-1 overflow-y-auto">
            {unreadCount > 0 && (
              <div className="px-5 py-2.5 bg-[#F9F9F9] border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-600">{unreadCount} unread updates</span>
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>Mark all read</span>
                </button>
              </div>
            )}

            {notifications.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                You&apos;re all caught up!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      if (n.actionTab) setActiveTab(n.actionTab);
                      setNotificationsOpen(false);
                    }}
                    className={`w-full text-left px-5 py-4 flex items-start justify-between gap-3 hover:bg-[#F9F9F9] transition-colors cursor-pointer ${
                      !n.read ? 'bg-teal-50/35' : ''
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 leading-snug">{n.title}</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{n.body}</p>
                      <p className="text-[11px] text-slate-400">
                        {n.channel} · {n.category} · {n.timestamp}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="text-[11px] font-bold text-teal-700 shrink-0 mt-0.5">
                        New
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <p className="text-xs text-slate-600">
              Choose which PetLove push and SMS alerts you want to receive.
            </p>
            <div className="space-y-2.5">
              {(
                [
                  { key: 'alerts', label: 'Lost Cat Area Alerts & Adoption Updates' },
                  { key: 'vaccines', label: 'Pet Vaccine Due Reminders' },
                  { key: 'orders', label: 'Shop Orders & Delivery SMS/Push' },
                  { key: 'foster', label: 'Safe House Foster Requests' },
                  { key: 'chat', label: 'Safe House Stay Chat Messages' },
                  { key: 'events', label: 'Dhaka Events & Reminders' },
                  { key: 'treats', label: 'Feed Treats Received' },
                  { key: 'rewards', label: '100-Treat Reward Alerts' },
                ] as { key: keyof NotificationPreferences; label: string }[]
              ).map((pref) => (
                <label
                  key={pref.key}
                  className="flex items-center justify-between p-3.5 bg-[#F9F9F9] border border-slate-200 rounded-xl cursor-pointer min-h-[48px]"
                >
                  <span className="text-xs font-semibold text-slate-800">{pref.label}</span>
                  <input
                    type="checkbox"
                    checked={notificationPrefs[pref.key]}
                    onChange={() => toggleNotificationPref(pref.key)}
                    className="w-4 h-4 accent-teal-600"
                  />
                </label>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
