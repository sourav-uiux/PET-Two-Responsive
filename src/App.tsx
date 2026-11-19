import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { FeedModule } from './components/FeedModule';
import { ShopModule } from './components/ShopModule';
import { SafeHouseModule } from './components/SafeHouseModule';
import { AdoptionModule } from './components/AdoptionModule';
import { EventsModule } from './components/EventsModule';
import { ProfileModule } from './components/ProfileModule';
import { CartCheckoutDrawer } from './components/CartCheckoutDrawer';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { AuthModal } from './components/AuthModal';
import { ToastContainer } from './components/ToastContainer';

const AppShell: React.FC = () => {
  const { activeTab, setActiveTab, language, setLanguage } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 pb-16 lg:pb-0">
      <Navbar />

      <main className="flex-1">
        {activeTab === 'feed' && <FeedModule />}
        {activeTab === 'safehouse' && <SafeHouseModule />}
        {activeTab === 'shop' && <ShopModule />}
        {activeTab === 'adoption' && <AdoptionModule />}
        {activeTab === 'events' && <EventsModule />}
        {activeTab === 'profile' && <ProfileModule />}
      </main>

      <footer className="border-t border-slate-200 bg-[#F9F9F9] mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <div>
            <span className="font-semibold text-slate-800">PetLove Dhaka</span> · Tailored Nutrition, Verified Safe House, Adoption &amp; Lost Cat Rescue · Prices in BDT (৳)
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('safehouse')}
              className="hover:text-teal-700 cursor-pointer py-1"
            >
              Safe House
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('shop')}
              className="hover:text-teal-700 cursor-pointer py-1"
            >
              Shop
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('adoption')}
              className="hover:text-teal-700 cursor-pointer py-1"
            >
              Adoption
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className="hover:text-teal-700 cursor-pointer py-1"
            >
              Events
            </button>
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className="font-semibold text-teal-700 hover:underline cursor-pointer py-1"
            >
              {language === 'en' ? 'বাংলা সংস্করণ' : 'English Version'}
            </button>
          </div>
        </div>
      </footer>

      <BottomNav />
      <CartCheckoutDrawer />
      <NotificationsDrawer />
      <AuthModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
