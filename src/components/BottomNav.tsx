import React from 'react';
import {
  HeartHandshake,
  Home,
  Newspaper,
  ShoppingBag,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MainTab } from '../types';
import { t } from '../i18n/translations';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, language, cart, adoptionPosts } = useApp();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const activeLostCount = adoptionPosts.filter(
    (p) => p.type === 'lost_cat' && p.status === 'active'
  ).length;

  // Exact rearranged order: 1. Feed, 2. Safe House, 3. Shop, 4. Adoption, 5. Profile
  const tabs: {
    id: MainTab;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    badge?: number;
  }[] = [
    { id: 'feed', label: t(language, 'nav_feed'), icon: Newspaper },
    { id: 'safehouse', label: t(language, 'nav_safehouse'), icon: Home },
    {
      id: 'shop',
      label: t(language, 'nav_shop'),
      icon: ShoppingBag,
      badge: cartCount > 0 ? cartCount : undefined,
    },
    {
      id: 'adoption',
      label: t(language, 'nav_adoption'),
      icon: HeartHandshake,
      badge: activeLostCount > 0 ? activeLostCount : undefined,
    },
    { id: 'profile', label: t(language, 'nav_profile'), icon: User },
  ];

  const handleSelect = (tab: MainTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(15,23,42,0.04)]"
    >
      <div className="grid grid-cols-5 h-16 max-w-xl mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            activeTab === tab.id || (activeTab === 'events' && tab.id === 'feed');
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelect(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-h-[48px] px-1 transition-colors cursor-pointer select-none ${
                active ? 'text-teal-700' : 'text-slate-500 active:text-slate-900'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-3 right-3 h-0.5 bg-teal-600 rounded-b-full" />
              )}
              <span className="relative flex items-center justify-center">
                <Icon
                  className={`w-[21px] h-[21px] transition-transform ${
                    active ? 'scale-105 text-teal-700' : 'text-slate-500'
                  }`}
                  strokeWidth={active ? 2.25 : 2}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </span>
              <span
                className={`mt-1 text-[10px] leading-none whitespace-nowrap truncate max-w-full ${
                  active ? 'font-bold text-teal-700' : 'font-medium text-slate-600'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
