import React from 'react';
import {
  Bell,
  HeartHandshake,
  Home,
  Languages,
  Newspaper,
  PawPrint,
  ShoppingBag,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MainTab } from '../types';
import { t } from '../i18n/translations';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    language,
    setLanguage,
    user,
    cart,
    adoptionPosts,
    setCartOpen,
    setNotificationsOpen,
    setAuthModalOpen,
    notifications,
  } = useApp();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const activeLostCount = adoptionPosts.filter(
    (p) => p.type === 'lost_cat' && p.status === 'active'
  ).length;

  // Exact rearranged order: 1. Feed, 2. Safe House, 3. Shop, 4. Adoption, 5. Profile
  const navItems: { id: MainTab; label: string; icon: React.ReactNode; alertCount?: number }[] = [
    { id: 'feed', label: t(language, 'nav_feed'), icon: <Newspaper className="w-4 h-4" strokeWidth={2} /> },
    { id: 'safehouse', label: t(language, 'nav_safehouse'), icon: <Home className="w-4 h-4" strokeWidth={2} /> },
    { id: 'shop', label: t(language, 'nav_shop'), icon: <ShoppingBag className="w-4 h-4" strokeWidth={2} /> },
    {
      id: 'adoption',
      label: t(language, 'nav_adoption'),
      icon: <HeartHandshake className="w-4 h-4" strokeWidth={2} />,
      alertCount: activeLostCount > 0 ? activeLostCount : undefined,
    },
    { id: 'profile', label: t(language, 'nav_profile'), icon: <User className="w-4 h-4" strokeWidth={2} /> },
  ];

  const handleSelectTab = (tab: MainTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 h-14 lg:h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleSelectTab('feed')}
          className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer min-h-[44px]"
        >
          <span className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
            <PawPrint className="w-4 h-4" strokeWidth={2} />
          </span>
          <span>{t(language, 'brand')}</span>
        </button>

        {/* Zone 2: Primary 5 Module Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-7" aria-label="Primary navigation">
          {navItems.map((item) => {
            const active =
              activeTab === item.id || (activeTab === 'events' && item.id === 'feed');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`relative py-5 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                  active ? 'text-teal-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{item.label}</span>
                {item.alertCount !== undefined && (
                  <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {item.alertCount}
                  </span>
                )}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Touch-Friendly Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            title="Switch English / Bangla"
            className="inline-flex items-center justify-center gap-1 px-2.5 min-h-[40px] text-xs font-semibold text-slate-700 bg-[#F9F9F9] hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-teal-600" strokeWidth={2} />
            <span>{language === 'en' ? 'বাংলা' : 'EN'}</span>
          </button>

          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            aria-label="Notifications"
            className="relative inline-flex items-center justify-center min-w-[40px] min-h-[40px] text-slate-700 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label="Open Cart"
            className="relative inline-flex items-center justify-center min-w-[40px] min-h-[40px] text-slate-700 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" strokeWidth={2} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {cartCount}
              </span>
            )}
          </button>

          {user ? (
            <button
              type="button"
              onClick={() => handleSelectTab('profile')}
              className="hidden sm:inline-flex items-center gap-2 pl-2 pr-3 min-h-[40px] rounded-lg border border-slate-200 bg-[#F9F9F9] hover:border-teal-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <img
                src={user.avatarUrl}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-md object-cover bg-slate-200"
              />
              <span className="text-xs font-semibold text-slate-800 max-w-[96px] truncate">
                {user.name.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="px-3.5 min-h-[40px] text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t(language, 'sign_in')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
