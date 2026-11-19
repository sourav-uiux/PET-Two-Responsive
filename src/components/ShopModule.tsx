import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Minus,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculatePetNutritionPlan, getRecommendedPackageForPet } from '../utils/nutrition';
import { formatBdt, t } from '../i18n/translations';
import { AddonProduct, MonthlyPackage, Order, Species } from '../types';

type ShopSubTab = 'shop' | 'orders';
type StoreCategory =
  | 'All'
  | 'Monthly Packs'
  | 'Dry Food'
  | 'Wet Food'
  | 'Treats'
  | 'Litter'
  | 'Toys & Accessories';

type ProductDetailModalTarget =
  | { kind: 'package'; item: MonthlyPackage }
  | { kind: 'addon'; item: AddonProduct };

export const ShopModule: React.FC = () => {
  const {
    language,
    user,
    pets,
    selectedPetId,
    setSelectedPetId,
    packages,
    addons,
    orders,
    addToCart,
    setCartOpen,
    oneTapReorder,
    cancelOrder,
    submitReturnRequest,
    requireAuth,
    setActiveTab,
  } = useApp();

  const [subTab, setSubTab] = useState<ShopSubTab>('shop');
  // Collapsed by default as requested: Tailored 30-Day Nutrition Plan dropdown
  const [nutritionOpen, setNutritionOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<'all' | Species>('all');
  const [categoryFilter, setCategoryFilter] = useState<StoreCategory>('All');

  // Product Details Modal (keeps nutrition details & live swaps inside Details view)
  const [detailTarget, setDetailTarget] = useState<ProductDetailModalTarget | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [selectedSwaps, setSelectedSwaps] = useState<Record<string, Record<string, string>>>({});

  // Receipt & Return Modals
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('Damaged packaging on delivery');
  const [returnPhotoName, setReturnPhotoName] = useState('damaged_pouch_dhaka.jpg');
  const [refundMethod, setRefundMethod] = useState<'bKash' | 'Nagad' | 'Card'>('bKash');
  const [refundAccount, setRefundAccount] = useState(user?.phone || '+880 1711-482910');

  const activePet = useMemo(
    () => pets.find((p) => p.id === selectedPetId) || pets[0],
    [pets, selectedPetId]
  );

  const nutritionEstimate = useMemo(
    () => (activePet ? calculatePetNutritionPlan(activePet) : null),
    [activePet]
  );

  const recommendedPackage = useMemo(
    () => getRecommendedPackageForPet(activePet, packages),
    [activePet, packages]
  );

  const reorderCandidate = useMemo(
    () =>
      orders.find(
        (o) =>
          o.userId === user?.id &&
          o.isPackageOrder &&
          o.status === 'Delivered' &&
          o.daysSinceOrder >= 23
      ),
    [orders, user]
  );

  const userOrders = useMemo(
    () => (user ? orders.filter((o) => o.userId === user.id) : []),
    [orders, user]
  );

  const getOptionForSlot = (pkg: MonthlyPackage, slotId: string) => {
    const slot = pkg.items.find((s) => s.id === slotId)!;
    const chosenId = selectedSwaps[pkg.id]?.[slotId] || slot.selectedOptionId;
    return slot.options.find((o) => o.id === chosenId) || slot.options[0];
  };

  const getPackageLiveTotal = (pkg: MonthlyPackage) => {
    let delta = 0;
    pkg.items.forEach((slot) => {
      const opt = getOptionForSlot(pkg, slot.id);
      delta += opt.priceDelta;
    });
    return Math.max(pkg.marginFloorBdt, pkg.basePriceBdt + delta);
  };

  const hasOutOfStockSelection = (pkg: MonthlyPackage) =>
    pkg.items.some((slot) => !getOptionForSlot(pkg, slot.id).inStock);

  const handleSwap = (pkgId: string, slotId: string, optionId: string) => {
    setSelectedSwaps((prev) => ({
      ...prev,
      [pkgId]: {
        ...(prev[pkgId] || {}),
        [slotId]: optionId,
      },
    }));
  };

  const handleAddPackageToCart = (pkg: MonthlyPackage) => {
    requireAuth(`Add ${pkg.name} to cart`, () => {
      if (hasOutOfStockSelection(pkg)) return;
      const liveTotal = getPackageLiveTotal(pkg);
      const summaryParts = pkg.items.map((slot) => {
        const opt = getOptionForSlot(pkg, slot.id);
        return `${opt.brand} (${opt.flavor})`;
      });
      addToCart({
        type: 'package',
        refId: pkg.id,
        name: pkg.name,
        subtitle: summaryParts.join(' · '),
        petName: activePet?.name,
        unitPriceBdt: liveTotal,
        quantity: 1,
        imageUrl: pkg.imageUrl,
        selectedSwaps: selectedSwaps[pkg.id],
      });
      setDetailTarget(null);
      setCartOpen(true);
    });
  };

  const handleAddAddonToCart = (item: AddonProduct, qty = 1) => {
    requireAuth(`Add ${item.name} to cart`, () => {
      addToCart({
        type: 'addon',
        refId: item.id,
        name: item.name,
        subtitle: `${item.brand} · ${item.unitLabel}`,
        unitPriceBdt: item.priceBdt,
        quantity: qty,
        imageUrl: item.imageUrl,
      });
      if (detailTarget) {
        setDetailTarget(null);
      }
    });
  };

  const filteredPackages = useMemo(() => {
    if (categoryFilter !== 'All' && categoryFilter !== 'Monthly Packs') return [];
    return packages.filter((pkg) => {
      if (!pkg.active) return false;
      if (speciesFilter !== 'all' && pkg.species !== speciesFilter) return false;
      if (
        searchQuery.trim() &&
        !`${pkg.name} ${pkg.lifeStage} ${pkg.description} monthly pack`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [packages, categoryFilter, speciesFilter, searchQuery]);

  const filteredAddons = useMemo(() => {
    if (categoryFilter === 'Monthly Packs') return [];
    return addons.filter((item) => {
      if (speciesFilter !== 'all' && item.species !== 'both' && item.species !== speciesFilter) {
        return false;
      }
      if (categoryFilter === 'Toys & Accessories') {
        if (item.category !== 'Toys' && item.category !== 'Accessories') return false;
      } else if (categoryFilter !== 'All' && item.category !== categoryFilter) {
        return false;
      }
      if (
        searchQuery.trim() &&
        !`${item.name} ${item.brand} ${item.category} ${item.unitLabel}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [addons, categoryFilter, speciesFilter, searchQuery]);

  const totalVisibleCount = filteredPackages.length + filteredAddons.length;

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnOrderId) return;
    submitReturnRequest(returnOrderId, {
      reason: returnReason,
      photoName: returnPhotoName,
      refundMethod,
      refundAccount,
    });
    setReturnOrderId(null);
  };

  const ORDER_STEPS = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered'] as const;
  const CATEGORIES: StoreCategory[] = [
    'All',
    'Monthly Packs',
    'Dry Food',
    'Wet Food',
    'Treats',
    'Litter',
    'Toys & Accessories',
  ];

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-5">
      {/* Header + 2 Clean Sub-Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900">PetLove Dhaka Shop</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Everyday cat &amp; dog food, litter, treats, and tailored 30-day monthly bundles delivered across Dhaka.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full md:w-auto">
          <button
            type="button"
            onClick={() => setSubTab('shop')}
            className={`flex-1 md:flex-none px-4 py-2.5 min-h-[40px] text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              subTab === 'shop' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t(language, 'shop_products')}
          </button>
          <button
            type="button"
            onClick={() => setSubTab('orders')}
            className={`flex-1 md:flex-none px-4 py-2.5 min-h-[40px] text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              subTab === 'orders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t(language, 'orders_tracking')} ({userOrders.length})
          </button>
        </div>
      </div>

      {/* Month-25 One-Tap Reorder Reminder Banner */}
      {reorderCandidate && subTab === 'shop' && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-bold text-teal-950">
                {t(language, 'reorder_banner_title')} — Day {reorderCandidate.daysSinceOrder} of 30
              </p>
              <p className="text-xs text-teal-800 mt-0.5">
                {reorderCandidate.items[0]?.name} for {reorderCandidate.items[0]?.petName || 'your pet'} runs low soon.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              requireAuth('Reorder monthly package', () => oneTapReorder(reorderCandidate.id))
            }
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t(language, 'reorder_one_tap')} · {formatBdt(reorderCandidate.subtotalBdt)}
          </button>
        </div>
      )}

      {/* TAB 1: REGULAR PRODUCT STOREFRONT + COLLAPSED TAILORED 30-DAY NUTRITION DROPDOWN */}
      {subTab === 'shop' && (
        <div className="space-y-5">
          {/* Collapsed-by-default Tailored 30-Day Nutrition Plan Dropdown */}
          <section className="bg-[#F9F9F9] border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setNutritionOpen((o) => !o)}
              aria-expanded={nutritionOpen}
              className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-100/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-teal-600/10 text-teal-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-sm font-bold text-slate-900">
                      Tailored 30-Day Nutrition Calculator
                    </span>
                    {activePet && nutritionEstimate && (
                      <span className="text-xs font-medium text-teal-700 font-mono tabular-nums">
                        {activePet.name} · {nutritionEstimate.dailyCaloriesKcal} kcal/day ·{' '}
                        {nutritionEstimate.monthlyDryKg}kg dry
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    Tap to expand daily calorie sizing &amp; recommended 30-day food plan
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 shrink-0">
                <span className="hidden sm:inline">{nutritionOpen ? 'Hide Plan' : 'Show Plan'}</span>
                {nutritionOpen ? (
                  <ChevronUp className="w-4 h-4" strokeWidth={2} />
                ) : (
                  <ChevronDown className="w-4 h-4" strokeWidth={2} />
                )}
              </span>
            </button>

            {nutritionOpen && (
              <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-600">
                    Sized from species, weight, age, activity level, and neuter status.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {pets.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPetId(p.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                          activePet?.id === p.id
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                        }`}
                      >
                        <span>{p.name}</span>
                        <span className="opacity-80">({p.weightKg}kg)</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setActiveTab('profile')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:border-teal-500 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Add Pet</span>
                    </button>
                  </div>
                </div>

                {activePet && nutritionEstimate ? (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="bg-white border border-slate-200 rounded-lg p-3.5">
                        <p className="text-[11px] text-slate-500">Daily Energy Target</p>
                        <p className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                          {nutritionEstimate.dailyCaloriesKcal}{' '}
                          <span className="text-xs font-sans font-normal text-slate-500">kcal</span>
                        </p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-3.5">
                        <p className="text-[11px] text-slate-500">Daily Dry Portion</p>
                        <p className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                          {nutritionEstimate.dailyDryGrams}{' '}
                          <span className="text-xs font-sans font-normal text-slate-500">g / day</span>
                        </p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-3.5">
                        <p className="text-[11px] text-slate-500">30-Day Supply</p>
                        <p className="text-xl font-bold text-teal-700 font-mono tabular-nums mt-0.5">
                          {nutritionEstimate.monthlyDryKg} kg{' '}
                          <span className="text-xs font-sans font-normal text-slate-500">
                            + {nutritionEstimate.monthlyWetPouches} pouches
                          </span>
                        </p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-3.5">
                        <p className="text-[11px] text-slate-500">Life Stage Match</p>
                        <p className="text-base font-bold text-slate-900 mt-1">
                          {nutritionEstimate.lifeStageLabel}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3">
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {nutritionEstimate.plainLanguageSummary}
                      </p>
                      {recommendedPackage && (
                        <button
                          type="button"
                          onClick={() => {
                            setDetailQty(1);
                            setDetailTarget({ kind: 'package', item: recommendedPackage });
                          }}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          View Recommended Pack
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" strokeWidth={2} />
                      <span>{t(language, 'vet_disclaimer')}</span>
                    </p>
                  </>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-lg p-5 text-center">
                    <p className="text-xs font-semibold text-slate-900">
                      Add a pet profile in My Pets to calculate their 30-day calorie plan.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Search & Filter Toolbar */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                  strokeWidth={2}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Me-O, Reflex, Nekko, litter, treats..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3">
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  {(['all', 'cat', 'dog'] as const).map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => setSpeciesFilter(sp)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                        speciesFilter === sp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      {sp === 'all' ? 'All Pets' : sp === 'cat' ? 'Cat' : 'Dog'}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-500 font-medium tabular-nums">
                  {totalVisibleCount} items
                </span>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-2 min-h-[38px] text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Clean Regular Product Cards Grid (Nutrition & Swaps inside Details Modal) */}
          {totalVisibleCount === 0 ? (
            <div className="bg-[#F9F9F9] border border-slate-200 rounded-xl p-10 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-900">No products match your search</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSpeciesFilter('all');
                  setCategoryFilter('All');
                }}
                className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
              {/* Regular Individual Products */}
              {filteredAddons.map((item) => (
                <article
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-teal-400 transition-colors group"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setDetailQty(1);
                      setDetailTarget({ kind: 'addon', item });
                    }}
                    className="relative aspect-[4/3] bg-slate-100 overflow-hidden text-left cursor-pointer"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                    {item.retailPriceBdt && item.retailPriceBdt > item.priceBdt && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold font-mono tabular-nums">
                        Save {formatBdt(item.retailPriceBdt - item.priceBdt)}
                      </span>
                    )}
                  </button>

                  <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {item.brand} · {item.unitLabel}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setDetailQty(1);
                          setDetailTarget({ kind: 'addon', item });
                        }}
                        className="text-left text-xs sm:text-sm font-bold text-slate-900 hover:text-teal-700 mt-1 line-clamp-2 leading-snug cursor-pointer"
                      >
                        {item.name}
                      </button>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm sm:text-base font-bold text-slate-900 font-mono tabular-nums">
                          {formatBdt(item.priceBdt)}
                        </span>
                        {item.retailPriceBdt && item.retailPriceBdt > item.priceBdt && (
                          <span className="text-[11px] text-slate-400 line-through font-mono tabular-nums">
                            {formatBdt(item.retailPriceBdt)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setDetailQty(1);
                            setDetailTarget({ kind: 'addon', item });
                          }}
                          className="px-2.5 py-2 text-[11px] font-semibold text-slate-700 bg-[#F9F9F9] hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          disabled={item.stock === 0}
                          onClick={() => handleAddAddonToCart(item, 1)}
                          className={`flex-1 py-2 px-2.5 text-[11px] sm:text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            item.stock > 0
                              ? 'bg-teal-600 text-white hover:bg-teal-700'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {item.stock > 0 ? 'Add' : 'Out'}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {/* Monthly 30-Day Packs as Clean Regular Product Cards */}
              {filteredPackages.map((pkg) => {
                const liveTotal = getPackageLiveTotal(pkg);
                const isRecommended = recommendedPackage?.id === pkg.id;
                return (
                  <article
                    key={pkg.id}
                    className={`bg-white rounded-xl overflow-hidden flex flex-col border transition-colors group ${
                      isRecommended
                        ? 'border-teal-500 ring-1 ring-teal-500/20'
                        : 'border-slate-200 hover:border-teal-400'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setDetailQty(1);
                        setDetailTarget({ kind: 'package', item: pkg });
                      }}
                      className="relative aspect-[4/3] bg-slate-100 overflow-hidden text-left cursor-pointer"
                    >
                      <img
                        src={pkg.imageUrl}
                        alt={pkg.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-teal-700 text-white text-[10px] font-bold">
                        {isRecommended && activePet
                          ? `Best for ${activePet.name}`
                          : '30-Day Pack'}
                      </span>
                    </button>

                    <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {pkg.species === 'cat' ? 'Cat' : 'Dog'} · {pkg.lifeStage} · {pkg.daysSupply}d
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setDetailQty(1);
                            setDetailTarget({ kind: 'package', item: pkg });
                          }}
                          className="text-left text-xs sm:text-sm font-bold text-slate-900 hover:text-teal-700 mt-1 line-clamp-2 leading-snug cursor-pointer"
                        >
                          {pkg.name}
                        </button>
                      </div>

                      <div className="space-y-2.5 pt-2 border-t border-slate-100">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm sm:text-base font-bold text-slate-900 font-mono tabular-nums">
                            {formatBdt(liveTotal)}
                          </span>
                          <span className="text-[11px] text-slate-400 line-through font-mono tabular-nums">
                            {formatBdt(pkg.retailValueBdt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setDetailQty(1);
                              setDetailTarget({ kind: 'package', item: pkg });
                            }}
                            className="px-2.5 py-2 text-[11px] font-semibold text-slate-700 bg-[#F9F9F9] hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (hasOutOfStockSelection(pkg)) {
                                setDetailTarget({ kind: 'package', item: pkg });
                              } else {
                                handleAddPackageToCart(pkg);
                              }
                            }}
                            className="flex-1 py-2 px-2.5 text-[11px] sm:text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors cursor-pointer"
                          >
                            Add Pack
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ORDERS, TRACKING, RECEIPTS, CANCEL & RETURN */}
      {subTab === 'orders' && (
        <div className="space-y-5">
          {!user ? (
            <div className="bg-[#F9F9F9] border border-slate-200 rounded-xl p-10 text-center">
              <p className="text-sm font-semibold text-slate-900">
                Sign in to view your Dhaka order history and live SMS tracking.
              </p>
            </div>
          ) : userOrders.length === 0 ? (
            <div className="bg-[#F9F9F9] border border-slate-200 rounded-xl p-10 text-center">
              <p className="text-sm font-semibold text-slate-900">No orders yet</p>
              <button
                type="button"
                onClick={() => setSubTab('shop')}
                className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg cursor-pointer"
              >
                Browse Shop Products
              </button>
            </div>
          ) : (
            userOrders.map((order) => {
              const currentStepIdx = ORDER_STEPS.indexOf(
                order.status as (typeof ORDER_STEPS)[number]
              );
              const canCancel = order.status === 'Placed' || order.status === 'Confirmed';
              const canReturn = order.status === 'Delivered' && !order.returnRequest;

              return (
                <div
                  key={order.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                >
                  <div className="px-5 py-4 bg-[#F9F9F9] border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold font-mono text-slate-900">
                          {order.id}
                        </span>
                        <span className="text-xs text-slate-500">· {order.createdAt}</span>
                        <span className="text-xs font-semibold text-teal-700">
                          · {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {order.address.street}, {order.address.area} · Paid via{' '}
                        {order.paymentMethod} ({order.paymentRef})
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold font-mono tabular-nums text-slate-900 mr-2">
                        {formatBdt(order.totalBdt)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setReceiptOrder(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" strokeWidth={2} />
                        <span>Receipt</span>
                      </button>
                      {order.isPackageOrder && (
                        <button
                          type="button"
                          onClick={() => oneTapReorder(order.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>Reorder</span>
                        </button>
                      )}
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => cancelOrder(order.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer"
                        >
                          Cancel Order
                        </button>
                      )}
                      {canReturn && (
                        <button
                          type="button"
                          onClick={() => setReturnOrderId(order.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>Request Return</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-5 space-y-5">
                    {order.status !== 'Cancelled' && (
                      <div className="grid grid-cols-5 gap-2">
                        {ORDER_STEPS.map((st, idx) => {
                          const completed = idx <= currentStepIdx;
                          return (
                            <div key={st} className="space-y-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  completed ? 'bg-teal-600' : 'bg-slate-200'
                                }`}
                              />
                              <p
                                className={`text-[11px] font-semibold ${
                                  completed ? 'text-teal-700' : 'text-slate-400'
                                }`}
                              >
                                {st}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-700">Order Items</p>
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-2 text-xs py-1.5 border-b border-slate-100 last:border-0"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">
                                {item.quantity}× {item.name}
                              </p>
                              <p className="text-slate-500 truncate">{item.subtitle}</p>
                            </div>
                            <span className="font-mono font-semibold text-slate-800 tabular-nums shrink-0">
                              {item.unitPriceBdt === 0
                                ? 'FREE'
                                : formatBdt(item.unitPriceBdt * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-teal-600" strokeWidth={2} />
                          <span>Push &amp; SMS Dispatch Log</span>
                        </p>
                        <div className="space-y-2">
                          {order.timeline.map((ev, i) => (
                            <div key={i} className="text-xs text-slate-600">
                              <span className="font-semibold text-slate-900">{ev.status}</span>{' '}
                              <span className="text-slate-400">
                                ({ev.timestamp} · {ev.channel})
                              </span>{' '}
                              — {ev.note}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {order.returnRequest && (
                      <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div>
                          <span className="font-bold text-amber-900">
                            Return Request ({order.returnRequest.status}):
                          </span>{' '}
                          <span className="text-amber-800">
                            {order.returnRequest.reason} · Refund to{' '}
                            {order.returnRequest.refundMethod} ({order.returnRequest.refundAccount})
                          </span>
                        </div>
                        <span className="font-mono text-amber-800">
                          Photo: {order.returnRequest.photoName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* PRODUCT DETAILS & NUTRITION MODAL */}
      {detailTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
          onClick={() => setDetailTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-t sm:border border-slate-200 rounded-t-2xl sm:rounded-xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Info className="w-4 h-4 text-teal-600 shrink-0" strokeWidth={2} />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  Product &amp; Nutrition Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailTarget(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {detailTarget.kind === 'addon' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-5 aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img
                        src={detailTarget.item.imageUrl}
                        alt={detailTarget.item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="sm:col-span-7 flex flex-col justify-between space-y-2">
                      <div>
                        <p className="text-xs text-slate-500">
                          {detailTarget.item.brand} · {detailTarget.item.category} ·{' '}
                          {detailTarget.item.unitLabel}
                        </p>
                        <h4 className="text-lg font-bold text-slate-900 mt-1">
                          {detailTarget.item.name}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          {detailTarget.item.description}
                        </p>
                      </div>
                      <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold font-mono tabular-nums text-slate-900">
                            {formatBdt(detailTarget.item.priceBdt)}
                          </span>
                          {detailTarget.item.retailPriceBdt &&
                            detailTarget.item.retailPriceBdt > detailTarget.item.priceBdt && (
                              <span className="text-xs text-slate-400 line-through font-mono tabular-nums">
                                {formatBdt(detailTarget.item.retailPriceBdt)}
                              </span>
                            )}
                        </div>
                        <span className="text-xs font-medium text-teal-700 tabular-nums">
                          {detailTarget.item.stock > 0
                            ? `${detailTarget.item.stock} in Dhaka stock`
                            : 'Out of stock'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nutrition & Ingredient Breakdown (Inside Details Only) */}
                  {(detailTarget.item.nutritionInfo || detailTarget.item.ingredients) && (
                    <div className="bg-[#F9F9F9] border border-slate-200 rounded-xl p-4 space-y-3">
                      <h5 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                        Nutrition &amp; Composition
                      </h5>
                      {detailTarget.item.nutritionInfo && (
                        <div>
                          <p className="text-[11px] font-semibold text-slate-500">
                            Guaranteed Analysis / Specs
                          </p>
                          <p className="text-xs text-slate-800 mt-0.5 leading-relaxed">
                            {detailTarget.item.nutritionInfo}
                          </p>
                        </div>
                      )}
                      {detailTarget.item.ingredients && (
                        <div>
                          <p className="text-[11px] font-semibold text-slate-500">
                            Ingredients / Materials
                          </p>
                          <p className="text-xs text-slate-800 mt-0.5 leading-relaxed">
                            {detailTarget.item.ingredients}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Qty & Add CTA */}
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                    <div className="inline-flex items-center border border-slate-300 rounded-lg bg-white">
                      <button
                        type="button"
                        onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                        className="p-2.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        <Minus className="w-4 h-4" strokeWidth={2} />
                      </button>
                      <span className="px-3 text-sm font-mono font-bold tabular-nums">
                        {detailQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDetailQty((q) => q + 1)}
                        className="p-2.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={detailTarget.item.stock === 0}
                      onClick={() => handleAddAddonToCart(detailTarget.item, detailQty)}
                      className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" strokeWidth={2} />
                      <span>
                        Add to Cart · {formatBdt(detailTarget.item.priceBdt * detailQty)}
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                (() => {
                  const pkg = detailTarget.item;
                  const liveTotal = getPackageLiveTotal(pkg);
                  const savings = Math.max(0, pkg.retailValueBdt - liveTotal);
                  const oosConflict = hasOutOfStockSelection(pkg);

                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                        <div className="sm:col-span-5 aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          <img
                            src={pkg.imageUrl}
                            alt={pkg.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="sm:col-span-7 flex flex-col justify-between space-y-2">
                          <div>
                            <p className="text-xs text-slate-500">
                              {pkg.species === 'cat' ? 'Cat' : 'Dog'} · {pkg.lifeStage} ·{' '}
                              {pkg.daysSupply} Days Supply
                            </p>
                            <h4 className="text-lg font-bold text-slate-900 mt-1">{pkg.name}</h4>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {pkg.description}
                            </p>
                          </div>
                          <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-bold font-mono tabular-nums text-slate-900">
                                {formatBdt(liveTotal)}
                              </span>
                              <span className="text-xs text-slate-400 line-through font-mono tabular-nums">
                                {formatBdt(pkg.retailValueBdt)}
                              </span>
                            </div>
                            {savings > 0 && (
                              <span className="text-xs font-semibold text-teal-700 tabular-nums">
                                Save {formatBdt(savings)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Full Package Nutrition Specs */}
                      <div className="bg-[#F9F9F9] border border-slate-200 rounded-xl p-4 space-y-3">
                        <h5 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                          Nutritional Profile
                        </h5>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                            <p className="text-[11px] text-slate-500">Protein</p>
                            <p className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                              {pkg.proteinPct}%
                            </p>
                          </div>
                          <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                            <p className="text-[11px] text-slate-500">Fat</p>
                            <p className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                              {pkg.fatPct}%
                            </p>
                          </div>
                          <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                            <p className="text-[11px] text-slate-500">Energy</p>
                            <p className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                              {pkg.kcalPer100g} kcal
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {pkg.nutritionSummary}
                        </p>
                      </div>

                      {/* Live Flavour & Brand Swaps */}
                      <div className="space-y-2.5">
                        <h5 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                          Customize Included Items (Swap Flavours Live)
                        </h5>
                        {pkg.items.map((slot) => {
                          const chosen = getOptionForSlot(pkg, slot.id);
                          return (
                            <div
                              key={slot.id}
                              className="bg-[#F9F9F9] border border-slate-200 rounded-lg p-3"
                            >
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-xs font-semibold text-slate-700">
                                  {slot.slotLabel}
                                </span>
                                {!chosen.inStock && (
                                  <span className="text-xs font-semibold text-rose-600 inline-flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} />
                                    Out of stock — pick swap
                                  </span>
                                )}
                              </div>
                              <select
                                value={chosen.id}
                                onChange={(e) => handleSwap(pkg.id, slot.id, e.target.value)}
                                className="w-full px-2.5 py-2 text-xs font-medium text-slate-900 border border-slate-300 rounded-md bg-white"
                              >
                                {slot.options.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.brand} — {opt.flavor} ({opt.weightLabel})
                                    {opt.priceDelta !== 0
                                      ? ` [${
                                          opt.priceDelta > 0
                                            ? `+${formatBdt(opt.priceDelta)}`
                                            : `-${formatBdt(Math.abs(opt.priceDelta))}`
                                        }]`
                                      : ' [Included]'}
                                    {!opt.inStock ? ' — OUT OF STOCK' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        disabled={oosConflict}
                        onClick={() => handleAddPackageToCart(pkg)}
                        className={`w-full py-3 px-4 text-sm font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                          oosConflict
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : 'bg-teal-600 text-white hover:bg-teal-700'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" strokeWidth={2} />
                        <span>
                          {oosConflict
                            ? 'Swap Out-of-Stock Item to Order'
                            : `Add 30-Day Pack to Cart · ${formatBdt(liveTotal)}`}
                        </span>
                      </button>
                    </>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-teal-600" strokeWidth={2} />
                <h3 className="text-base font-bold text-slate-900">PetLove Order Receipt</h3>
              </div>
              <button
                type="button"
                onClick={() => setReceiptOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID</span>
                <span className="font-mono font-bold text-slate-900">{receiptOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer</span>
                <span className="font-semibold text-slate-900">{receiptOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Area</span>
                <span className="text-slate-900">{receiptOrder.address.area}, Dhaka</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment</span>
                <span className="font-semibold text-slate-900">
                  {receiptOrder.paymentMethod} ({receiptOrder.paymentRef})
                </span>
              </div>
              <div className="border-t border-slate-200 pt-3 space-y-2">
                {receiptOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-2">
                    <span className="text-slate-700">
                      {item.quantity}× {item.name}
                    </span>
                    <span className="font-mono tabular-nums text-slate-900">
                      {item.unitPriceBdt === 0
                        ? '৳0 (Treat Reward)'
                        : formatBdt(item.unitPriceBdt * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 pt-3 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">
                    {formatBdt(receiptOrder.subtotalBdt)}
                  </span>
                </div>
                {receiptOrder.discountBdt > 0 && (
                  <div className="flex justify-between text-teal-700">
                    <span>Discount ({receiptOrder.couponCode})</span>
                    <span className="font-mono tabular-nums">
                      -{formatBdt(receiptOrder.discountBdt)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Dhaka Zone Delivery</span>
                  <span className="font-mono tabular-nums">
                    {formatBdt(receiptOrder.deliveryFeeBdt)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Paid</span>
                  <span className="font-mono tabular-nums">{formatBdt(receiptOrder.totalBdt)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer"
              >
                Print / Save PDF Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return & Refund Modal */}
      {returnOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Request Return &amp; Refund</h3>
              <button
                type="button"
                onClick={() => setReturnOrderId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
            <form onSubmit={handleReturnSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Return Reason
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option>Damaged packaging on delivery</option>
                  <option>Wrong flavor or brand packed</option>
                  <option>Near-expiry item received</option>
                  <option>Sealed item no longer needed (within 7 days)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Photo Evidence
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setReturnPhotoName(e.target.files?.[0]?.name || 'return_photo.jpg')
                  }
                  className="w-full text-xs text-slate-600 border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Refund Method
                  </label>
                  <select
                    value={refundMethod}
                    onChange={(e) =>
                      setRefundMethod(e.target.value as 'bKash' | 'Nagad' | 'Card')
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account / Mobile
                  </label>
                  <input
                    type="text"
                    value={refundAccount}
                    onChange={(e) => setRefundAccount(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                <span>Submit Return &amp; Refund Request</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
