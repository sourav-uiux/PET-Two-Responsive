import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AddonProduct,
  AdoptionInquiry,
  AdoptionRescuePost,
  AppNotification,
  CartItem,
  CommunityEvent,
  Coupon,
  DeliveryZone,
  FeedPost,
  FosterHost,
  FosterRequest,
  Language,
  LostSighting,
  MainTab,
  ModerationReport,
  MonthlyPackage,
  NotificationPreferences,
  Order,
  PaymentMethod,
  PetProfile,
  PointsTransaction,
  ReturnRequest,
  RewardItem,
  SavedAddress,
  UserProfile,
  VaccineRecord,
} from '../types';
import {
  DELIVERY_ZONES,
  DHAKA_COORDINATES,
  INITIAL_ADDONS,
  INITIAL_ADOPTION_POSTS,
  INITIAL_COUPONS,
  INITIAL_EVENTS,
  INITIAL_FEED_POSTS,
  INITIAL_FOSTER_HOSTS,
  INITIAL_FOSTER_REQUESTS,
  INITIAL_NOTIFICATION_PREFS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ORDERS,
  INITIAL_PACKAGES,
  INITIAL_PETS,
  INITIAL_POINTS_HISTORY,
  INITIAL_REPORTS,
  INITIAL_REWARDS,
  INITIAL_USER,
} from '../data/seedData';

const STORAGE_KEY = 'petlove_dhaka_mvp_state_v3';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone?: 'teal' | 'rose' | 'amber' | 'slate';
}

interface PersistedState {
  language: Language;
  user: UserProfile | null;
  pets: PetProfile[];
  selectedPetId: string | null;
  packages: MonthlyPackage[];
  addons: AddonProduct[];
  rewards: RewardItem[];
  coupons: Coupon[];
  deliveryZones: DeliveryZone[];
  cart: CartItem[];
  orders: Order[];
  fosterHosts: FosterHost[];
  fosterRequests: FosterRequest[];
  events: CommunityEvent[];
  feedPosts: FeedPost[];
  adoptionPosts: AdoptionRescuePost[];
  blockedUserIds: string[];
  pointsHistory: PointsTransaction[];
  reports: ModerationReport[];
  notifications: AppNotification[];
  notificationPrefs: NotificationPreferences;
}

const DEFAULT_PERSISTED: PersistedState = {
  language: 'en',
  user: INITIAL_USER,
  pets: INITIAL_PETS,
  selectedPetId: INITIAL_PETS[0].id,
  packages: INITIAL_PACKAGES,
  addons: INITIAL_ADDONS,
  rewards: INITIAL_REWARDS,
  coupons: INITIAL_COUPONS,
  deliveryZones: DELIVERY_ZONES,
  cart: [],
  orders: INITIAL_ORDERS,
  fosterHosts: INITIAL_FOSTER_HOSTS,
  fosterRequests: INITIAL_FOSTER_REQUESTS,
  events: INITIAL_EVENTS,
  feedPosts: INITIAL_FEED_POSTS,
  adoptionPosts: INITIAL_ADOPTION_POSTS,
  blockedUserIds: [],
  pointsHistory: INITIAL_POINTS_HISTORY,
  reports: INITIAL_REPORTS,
  notifications: INITIAL_NOTIFICATIONS,
  notificationPrefs: INITIAL_NOTIFICATION_PREFS,
};

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PERSISTED;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return { ...DEFAULT_PERSISTED, ...parsed };
  } catch {
    return DEFAULT_PERSISTED;
  }
}

interface AppContextValue extends PersistedState {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  pendingActionLabel: string | null;
  requireAuth: (actionLabel: string, callback: () => void) => void;
  completeAuth: (
    profile: Omit<
      UserProfile,
      'id' | 'points' | 'dailyTreatsRemaining' | 'dailyTreatsCap' | 'dailyPointsEarned' | 'role' | 'devices' | 'joinedAt'
    >,
    firstPet?: Omit<PetProfile, 'id' | 'ownerId' | 'vaccineRecords'>
  ) => void;
  signInDemoUser: () => void;
  signOut: () => void;
  deleteAccount: () => void;
  setLanguage: (lang: Language) => void;
  setSelectedPetId: (petId: string | null) => void;
  toasts: ToastMessage[];
  pushToast: (title: string, description?: string, tone?: ToastMessage['tone']) => void;
  dismissToast: (id: string) => void;

  // Profile, Pets & Vaccine File Manager
  updateUserProfile: (patch: Partial<UserProfile>) => void;
  addAddress: (address: Omit<SavedAddress, 'id'>) => void;
  deleteAddress: (id: string) => void;
  addPet: (pet: Omit<PetProfile, 'id' | 'ownerId'>) => PetProfile;
  updatePet: (petId: string, patch: Partial<PetProfile>) => void;
  deletePet: (petId: string) => void;
  addVaccineRecord: (petId: string, record: Omit<VaccineRecord, 'id'>) => void;
  toggleVaccineReminder: (petId: string, recordId: string) => void;
  deleteVaccineRecord: (petId: string, recordId: string) => void;

  // Shop, Cart & Orders
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  updateCartQty: (cartItemId: string, delta: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  placeOrder: (params: {
    address: SavedAddress;
    paymentMethod: PaymentMethod;
    paymentRef: string;
    couponCode?: string;
    discountBdt: number;
    deliveryFeeBdt: number;
  }) => Order | null;
  oneTapReorder: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  submitReturnRequest: (orderId: string, req: Omit<ReturnRequest, 'id' | 'orderId' | 'status' | 'createdAt'>) => void;

  // Feed, Likes, Multi-Treats & Rewards
  createFeedPost: (post: { petId?: string; petName: string; petSpecies: 'cat' | 'dog'; photos: string[]; caption: string; eventTag?: string }) => void;
  deleteFeedPost: (postId: string) => void;
  toggleLikePost: (postId: string) => void;
  sendTreat: (postId: string, amount?: number) => void;
  redeemReward: (rewardId: string) => boolean;
  reportContent: (report: Omit<ModerationReport, 'id' | 'status' | 'createdAt' | 'reporterName'>) => void;
  blockUser: (userId: string, userName: string) => void;

  // Safe House
  applyFosterHost: (host: Omit<FosterHost, 'id' | 'userId' | 'status' | 'verificationChecklist' | 'submittedAt' | 'coordinates'>) => void;
  createFosterRequest: (req: Omit<FosterRequest, 'id' | 'ownerId' | 'ownerName' | 'status' | 'createdAt' | 'messages'>) => void;
  respondFosterRequest: (requestId: string, decision: 'accepted' | 'declined') => void;
  sendFosterMessage: (requestId: string, text: string) => void;

  // Events
  rsvpEvent: (eventId: string, choice: 'going' | 'interested' | 'none') => void;

  // Adoption, Lost Cat Area Alerts & Found Rescue
  createAdoptionPost: (
    input: Omit<
      AdoptionRescuePost,
      | 'id'
      | 'status'
      | 'authorId'
      | 'authorName'
      | 'authorAvatar'
      | 'alertSentToArea'
      | 'areaNotifiedCount'
      | 'sightings'
      | 'inquiries'
      | 'createdAt'
    >
  ) => AdoptionRescuePost | null;
  addLostSighting: (
    postId: string,
    sighting: Omit<LostSighting, 'id' | 'timestamp'>
  ) => void;
  submitAdoptionInquiry: (
    postId: string,
    inquiry: Omit<AdoptionInquiry, 'id' | 'timestamp'>
  ) => void;
  markAdoptionPostResolved: (postId: string) => void;
  deleteAdoptionPost: (postId: string) => void;

  // Notifications
  markAllNotificationsRead: () => void;
  toggleNotificationPref: (key: keyof NotificationPreferences) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedState>(loadInitialState);
  const [activeTab, setActiveTab] = useState<MainTab>('feed');
  const [cartOpen, setCartOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingActionLabel, setPendingActionLabel] = useState<string | null>(null);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota errors
    }
  }, [state]);

  const pushToast = (title: string, description?: string, tone: ToastMessage['tone'] = 'teal') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, title, description, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addNotification = (
    prev: PersistedState,
    category: AppNotification['category'],
    title: string,
    body: string,
    channel: AppNotification['channel'] = 'Push',
    actionTab?: MainTab
  ): AppNotification[] => {
    if (!prev.notificationPrefs[category]) return prev.notifications;
    const notif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      category,
      title,
      body,
      timestamp: 'Just now',
      read: false,
      channel,
      actionTab,
    };
    return [notif, ...prev.notifications];
  };

  const requireAuth = (actionLabel: string, callback: () => void) => {
    if (state.user && state.user.verified) {
      callback();
      return;
    }
    setPendingActionLabel(actionLabel);
    setPendingCallback(() => callback);
    setAuthModalOpen(true);
  };

  const completeAuth: AppContextValue['completeAuth'] = (profileData, firstPet) => {
    const newUserId = `usr_${Date.now()}`;
    const newUser: UserProfile = {
      ...profileData,
      id: newUserId,
      points: 20,
      dailyTreatsRemaining: 20,
      dailyTreatsCap: 20,
      dailyPointsEarned: { treats: 0, posts: 0, events: 0, orders: 0 },
      role: 'user',
      joinedAt: new Date().toISOString().slice(0, 10),
      devices: [
        {
          id: `dev_${Date.now()}`,
          deviceName: 'Current Web Browser',
          location: `${profileData.area}, Dhaka`,
          lastActive: 'Active now',
          current: true,
        },
      ],
    };

    let createdPet: PetProfile | null = null;
    if (firstPet) {
      createdPet = {
        ...firstPet,
        id: `pet_${Date.now()}`,
        ownerId: newUserId,
        vaccineRecords: [],
      };
    }

    setState((prev) => ({
      ...prev,
      user: newUser,
      pets: createdPet ? [createdPet, ...prev.pets] : prev.pets,
      selectedPetId: createdPet ? createdPet.id : prev.selectedPetId,
      pointsHistory: [
        {
          id: `pt_${Date.now()}`,
          userId: newUserId,
          type: 'admin_adjustment',
          points: 20,
          description: 'Welcome bonus for completing Dhaka verification',
          timestamp: 'Just now',
        },
        ...prev.pointsHistory,
      ],
    }));

    setAuthModalOpen(false);
    pushToast(`Welcome to PetLove, ${newUser.name}!`, 'Account verified (+20 welcome Treats).', 'teal');

    if (pendingCallback) {
      const cb = pendingCallback;
      setPendingCallback(null);
      setPendingActionLabel(null);
      setTimeout(() => cb(), 120);
    }
  };

  const signInDemoUser = () => {
    setState((prev) => ({ ...prev, user: INITIAL_USER }));
    setAuthModalOpen(false);
    pushToast('Signed in as Nafisa Rahman', 'Dhanmondi · 105 Treats · 20 daily treats ready', 'teal');
    if (pendingCallback) {
      const cb = pendingCallback;
      setPendingCallback(null);
      setPendingActionLabel(null);
      setTimeout(() => cb(), 120);
    }
  };

  const signOut = () => {
    setState((prev) => ({ ...prev, user: null }));
    pushToast('Signed out', 'You can continue browsing Feed, Shop, Safe House, and Events as a guest.', 'slate');
  };

  const deleteAccount = () => {
    setState((prev) => ({ ...prev, user: null, cart: [] }));
    setActiveTab('feed');
    pushToast('Account deleted', 'Your account and active session have been removed.', 'rose');
  };

  const setLanguage = (lang: Language) => {
    setState((prev) => ({ ...prev, language: lang }));
  };

  const setSelectedPetId = (petId: string | null) => {
    setState((prev) => ({ ...prev, selectedPetId: petId }));
  };

  const updateUserProfile = (patch: Partial<UserProfile>) => {
    setState((prev) => {
      if (!prev.user) return prev;
      return { ...prev, user: { ...prev.user, ...patch } };
    });
    pushToast('Profile updated', undefined, 'teal');
  };

  const addAddress = (address: Omit<SavedAddress, 'id'>) => {
    setState((prev) => {
      if (!prev.user) return prev;
      const newAddr: SavedAddress = { ...address, id: `addr_${Date.now()}` };
      const existing = address.isDefault
        ? prev.user.addresses.map((a) => ({ ...a, isDefault: false }))
        : prev.user.addresses;
      return {
        ...prev,
        user: { ...prev.user, addresses: [newAddr, ...existing] },
      };
    });
    pushToast('Address saved', `${address.area}, Dhaka`, 'teal');
  };

  const deleteAddress = (id: string) => {
    setState((prev) => {
      if (!prev.user) return prev;
      return {
        ...prev,
        user: { ...prev.user, addresses: prev.user.addresses.filter((a) => a.id !== id) },
      };
    });
  };

  const addPet = (petData: Omit<PetProfile, 'id' | 'ownerId'>): PetProfile => {
    const newPet: PetProfile = {
      ...petData,
      id: `pet_${Date.now()}`,
      ownerId: state.user?.id || 'guest',
      vaccineRecords: petData.vaccineRecords || [],
    };
    setState((prev) => ({
      ...prev,
      pets: [newPet, ...prev.pets],
      selectedPetId: newPet.id,
    }));
    pushToast(`${newPet.name} added to My Pets`, 'You can now upload vaccine records and track reminders.', 'teal');
    return newPet;
  };

  const updatePet = (petId: string, patch: Partial<PetProfile>) => {
    setState((prev) => ({
      ...prev,
      pets: prev.pets.map((p) => (p.id === petId ? { ...p, ...patch } : p)),
    }));
    pushToast('Pet profile updated', undefined, 'teal');
  };

  const deletePet = (petId: string) => {
    setState((prev) => {
      const remaining = prev.pets.filter((p) => p.id !== petId);
      return {
        ...prev,
        pets: remaining,
        selectedPetId: prev.selectedPetId === petId ? remaining[0]?.id ?? null : prev.selectedPetId,
      };
    });
    pushToast('Pet profile removed', undefined, 'slate');
  };

  const addVaccineRecord = (petId: string, recordData: Omit<VaccineRecord, 'id'>) => {
    const pet = state.pets.find((p) => p.id === petId);
    const newRecord: VaccineRecord = {
      ...recordData,
      id: `vax_${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      pets: prev.pets.map((p) =>
        p.id === petId
          ? {
              ...p,
              vaccineStatus: 'up_to_date',
              vaccineDetails: `${recordData.vaccineName} (${recordData.dateGiven}) · Next due ${recordData.nextDueDate}`,
              vaccineRecords: [newRecord, ...(p.vaccineRecords || [])],
            }
          : p
      ),
      notifications: recordData.reminderEnabled
        ? addNotification(
            prev,
            'vaccines',
            `Next Vaccine Reminder Set: ${pet?.name || 'Pet'}`,
            `${recordData.vaccineName} next booster scheduled for ${recordData.nextDueDate}.`,
            'Push',
            'profile'
          )
        : prev.notifications,
    }));
    pushToast(
      'Vaccine record saved',
      recordData.reminderEnabled
        ? `Automatic reminder active for ${recordData.nextDueDate}.`
        : 'Added to pet health file manager.',
      'teal'
    );
  };

  const toggleVaccineReminder = (petId: string, recordId: string) => {
    const pet = state.pets.find((p) => p.id === petId);
    const rec = pet?.vaccineRecords.find((r) => r.id === recordId);
    const nextEnabled = !(rec?.reminderEnabled ?? false);

    setState((prev) => ({
      ...prev,
      pets: prev.pets.map((p) =>
        p.id === petId
          ? {
              ...p,
              vaccineRecords: (p.vaccineRecords || []).map((r) =>
                r.id === recordId ? { ...r, reminderEnabled: nextEnabled } : r
              ),
            }
          : p
      ),
      notifications:
        nextEnabled && rec && pet
          ? addNotification(
              prev,
              'vaccines',
              `Vaccine Reminder Enabled for ${pet.name}`,
              `We'll remind you before ${rec.vaccineName} is due on ${rec.nextDueDate}.`,
              'Push',
              'profile'
            )
          : prev.notifications,
    }));

    pushToast(
      nextEnabled ? 'Next vaccine reminder set' : 'Vaccine reminder paused',
      rec ? `${rec.vaccineName} · Due ${rec.nextDueDate}` : undefined,
      nextEnabled ? 'teal' : 'slate'
    );
  };

  const deleteVaccineRecord = (petId: string, recordId: string) => {
    setState((prev) => ({
      ...prev,
      pets: prev.pets.map((p) =>
        p.id === petId
          ? {
              ...p,
              vaccineRecords: (p.vaccineRecords || []).filter((r) => r.id !== recordId),
            }
          : p
      ),
    }));
    pushToast('Vaccine file deleted', undefined, 'slate');
  };

  const addToCart = (item: Omit<CartItem, 'id'>) => {
    setState((prev) => {
      const existing = prev.cart.find(
        (c) => c.refId === item.refId && c.subtitle === item.subtitle && c.type === item.type
      );
      if (existing) {
        return {
          ...prev,
          cart: prev.cart.map((c) =>
            c.id === existing.id ? { ...c, quantity: c.quantity + item.quantity } : c
          ),
        };
      }
      return {
        ...prev,
        cart: [...prev.cart, { ...item, id: `ci_${Date.now()}_${Math.random().toString(36).slice(2, 5)}` }],
      };
    });
    pushToast('Added to cart', item.name, 'teal');
  };

  const updateCartQty = (cartItemId: string, delta: number) => {
    setState((prev) => ({
      ...prev,
      cart: prev.cart
        .map((c) => (c.id === cartItemId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0),
    }));
  };

  const removeFromCart = (cartItemId: string) => {
    setState((prev) => ({
      ...prev,
      cart: prev.cart.filter((c) => c.id !== cartItemId),
    }));
  };

  const clearCart = () => {
    setState((prev) => ({ ...prev, cart: [] }));
  };

  const placeOrder: AppContextValue['placeOrder'] = ({
    address,
    paymentMethod,
    paymentRef,
    couponCode,
    discountBdt,
    deliveryFeeBdt,
  }) => {
    if (!state.user || state.cart.length === 0) return null;
    const subtotalBdt = state.cart.reduce((sum, item) => sum + item.unitPriceBdt * item.quantity, 0);
    const totalBdt = Math.max(0, subtotalBdt - discountBdt + deliveryFeeBdt);
    const rewardItem = state.cart.find((c) => c.type === 'reward');
    const isPackageOrder = state.cart.some((c) => c.type === 'package');
    const orderId = `PL-2026-${Math.floor(1110 + Math.random() * 880)}`;

    const newOrder: Order = {
      id: orderId,
      userId: state.user.id,
      customerName: state.user.name,
      customerPhone: address.phone || state.user.phone,
      items: [...state.cart],
      subtotalBdt,
      discountBdt,
      deliveryFeeBdt,
      totalBdt,
      couponCode,
      rewardClaimedName: rewardItem?.name,
      address,
      paymentMethod,
      paymentRef,
      status: 'Placed',
      createdAt: 'Nov 19, 2026 · Just now',
      daysSinceOrder: 0,
      isPackageOrder,
      timeline: [
        {
          status: 'Placed',
          timestamp: 'Just now',
          channel: 'Push & SMS',
          note: `Order placed via ${paymentMethod} (${paymentRef}). SMS confirmation sent to ${address.phone}.`,
        },
      ],
    };

    const orderTreats = state.user.dailyPointsEarned.orders < 40 ? 20 : 0;

    setState((prev) => {
      const updatedUser = prev.user
        ? {
            ...prev.user,
            points: prev.user.points + orderTreats,
            dailyPointsEarned: {
              ...prev.user.dailyPointsEarned,
              orders: prev.user.dailyPointsEarned.orders + orderTreats,
            },
          }
        : null;

      const ptsHist: PointsTransaction[] =
        orderTreats > 0 && prev.user
          ? [
              {
                id: `pt_${Date.now()}`,
                userId: prev.user.id,
                type: 'order_delivered',
                points: orderTreats,
                description: `Placed order #${orderId} (${paymentMethod})`,
                timestamp: 'Just now',
              },
              ...prev.pointsHistory,
            ]
          : prev.pointsHistory;

      return {
        ...prev,
        user: updatedUser,
        cart: [],
        orders: [newOrder, ...prev.orders],
        pointsHistory: ptsHist,
        notifications: addNotification(
          prev,
          'orders',
          `Order #${orderId} Confirmed`,
          `Payment via ${paymentMethod} received. Push & SMS updates enabled for ${address.area}.`,
          'SMS',
          'shop'
        ),
      };
    });

    setCartOpen(false);
    pushToast(`Order #${orderId} placed!`, `SMS sent to ${address.phone}. +${orderTreats} Treats earned.`, 'teal');
    return newOrder;
  };

  const oneTapReorder = (orderId: string) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;
    const itemsToAdd = order.items.filter((i) => i.type !== 'reward');
    setState((prev) => ({
      ...prev,
      cart: [
        ...prev.cart,
        ...itemsToAdd.map((item) => ({
          ...item,
          id: `ci_re_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        })),
      ],
    }));
    setCartOpen(true);
    pushToast('Monthly package added for 1-tap reorder', 'Review address & payment to complete.', 'teal');
  };

  const cancelOrder = (orderId: string) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId && (o.status === 'Placed' || o.status === 'Confirmed')
          ? {
              ...o,
              status: 'Cancelled',
              timeline: [
                ...o.timeline,
                {
                  status: 'Cancelled',
                  timestamp: 'Just now',
                  channel: 'Push & SMS',
                  note: 'Order cancelled by customer prior to packing. Auto-refund initiated if prepaid.',
                },
              ],
            }
          : o
      ),
      notifications: addNotification(
        prev,
        'orders',
        `Order #${orderId} Cancelled`,
        'Cancelled before packing. Any prepaid bKash/Nagad/Card amount will be refunded.',
        'SMS',
        'shop'
      ),
    }));
    pushToast(`Order #${orderId} cancelled`, 'Cancelled cleanly before packing.', 'amber');
  };

  const submitReturnRequest: AppContextValue['submitReturnRequest'] = (orderId, req) => {
    const returnReq: ReturnRequest = {
      ...req,
      id: `ret_${Date.now()}`,
      orderId,
      status: 'Pending',
      createdAt: 'Just now',
    };
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === orderId ? { ...o, returnRequest: returnReq } : o)),
      notifications: addNotification(
        prev,
        'orders',
        `Return Submitted for #${orderId}`,
        `Support reviewing return photo for refund to ${req.refundMethod}.`,
        'In-App',
        'shop'
      ),
    }));
    pushToast('Return & refund request submitted', 'PetLove support will verify and process your refund.', 'teal');
  };

  const createFeedPost: AppContextValue['createFeedPost'] = (postInput) => {
    if (!state.user) return;
    const postTreats = state.user.dailyPointsEarned.posts < 20 ? 10 : 0;
    const newPost: FeedPost = {
      id: `post_${Date.now()}`,
      authorId: state.user.id,
      authorName: state.user.name,
      authorArea: state.user.area,
      authorAvatar: state.user.avatarUrl,
      petId: postInput.petId,
      petName: postInput.petName,
      petSpecies: postInput.petSpecies,
      eventTag: postInput.eventTag,
      fromEventAttendee: Boolean(postInput.eventTag),
      photos: postInput.photos,
      caption: postInput.caption,
      likesCount: 0,
      likedByUserIds: [],
      treatsCount: 0,
      treatedByUserIds: [],
      createdAt: 'Just now',
    };

    setState((prev) => {
      const updatedUser = prev.user
        ? {
            ...prev.user,
            points: prev.user.points + postTreats,
            dailyPointsEarned: {
              ...prev.user.dailyPointsEarned,
              posts: prev.user.dailyPointsEarned.posts + postTreats,
            },
          }
        : null;
      return {
        ...prev,
        user: updatedUser,
        feedPosts: [newPost, ...prev.feedPosts],
        pointsHistory:
          postTreats > 0 && prev.user
            ? [
                {
                  id: `pt_${Date.now()}`,
                  userId: prev.user.id,
                  type: 'post_created',
                  points: postTreats,
                  description: `Shared a photo update for ${postInput.petName}`,
                  timestamp: 'Just now',
                },
                ...prev.pointsHistory,
              ]
            : prev.pointsHistory,
      };
    });
    pushToast(
      'Update posted to Feed!',
      postTreats > 0 ? `+${postTreats} Treats added to your wallet.` : 'Daily posting treat cap reached (post is live!).',
      'teal'
    );
  };

  const deleteFeedPost = (postId: string) => {
    setState((prev) => ({
      ...prev,
      feedPosts: prev.feedPosts.filter((p) => p.id !== postId),
    }));
    pushToast('Post deleted', undefined, 'slate');
  };

  const toggleLikePost = (postId: string) => {
    if (!state.user) return;
    const uid = state.user.id;
    setState((prev) => ({
      ...prev,
      feedPosts: prev.feedPosts.map((p) => {
        if (p.id !== postId) return p;
        const alreadyLiked = p.likedByUserIds.includes(uid);
        return {
          ...p,
          likesCount: alreadyLiked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1,
          likedByUserIds: alreadyLiked
            ? p.likedByUserIds.filter((id) => id !== uid)
            : [...p.likedByUserIds, uid],
        };
      }),
    }));
  };

  const sendTreat = (postId: string, amount = 1) => {
    if (!state.user) return;
    const post = state.feedPosts.find((p) => p.id === postId);
    if (!post) return;
    const cleanAmount = Math.max(1, Math.min(amount, state.user.dailyTreatsRemaining));

    if (state.user.dailyTreatsRemaining <= 0) {
      pushToast('Daily 20 Treats allowance used', 'Your 20 daily treats refresh tomorrow morning.', 'amber');
      return;
    }

    if (amount > state.user.dailyTreatsRemaining) {
      pushToast(
        `Only ${state.user.dailyTreatsRemaining} Treats left today`,
        'Pick a smaller amount from your remaining daily treats.',
        'amber'
      );
      return;
    }

    const isOwnPost = post.authorId === state.user.id;
    const remainingCap = Math.max(0, 25 - state.user.dailyPointsEarned.treats);
    const treatBonus = !isOwnPost ? Math.min(remainingCap, cleanAmount) : 0;

    setState((prev) => {
      if (!prev.user) return prev;
      const updatedUser: UserProfile = {
        ...prev.user,
        dailyTreatsRemaining: prev.user.dailyTreatsRemaining - cleanAmount,
        points: prev.user.points + treatBonus,
        dailyPointsEarned: {
          ...prev.user.dailyPointsEarned,
          treats: prev.user.dailyPointsEarned.treats + treatBonus,
        },
      };
      return {
        ...prev,
        user: updatedUser,
        feedPosts: prev.feedPosts.map((p) =>
          p.id === postId
            ? {
                ...p,
                treatsCount: p.treatsCount + cleanAmount,
                treatedByUserIds: Array.from(new Set([...p.treatedByUserIds, prev.user!.id])),
              }
            : p
        ),
        pointsHistory:
          treatBonus > 0
            ? [
                {
                  id: `pt_${Date.now()}`,
                  userId: prev.user.id,
                  type: 'treat_received',
                  points: treatBonus,
                  description: `Sent ${cleanAmount} Treats to ${post.petName}'s post`,
                  timestamp: 'Just now',
                },
                ...prev.pointsHistory,
              ]
            : prev.pointsHistory,
        notifications: addNotification(
          prev,
          'treats',
          `Sent ${cleanAmount} ${cleanAmount === 1 ? 'Treat' : 'Treats'} to ${post.petName}!`,
          `${post.authorName} received +${cleanAmount} Treats. You have ${updatedUser.dailyTreatsRemaining}/${updatedUser.dailyTreatsCap} Treats left today.`,
          'In-App',
          'feed'
        ),
      };
    });

    pushToast(
      `Sent ${cleanAmount} ${cleanAmount === 1 ? 'Treat' : 'Treats'} to ${post.petName}!`,
      `${state.user.dailyTreatsRemaining - cleanAmount} daily Treats remaining.`,
      'rose'
    );
  };

  const redeemReward = (rewardId: string): boolean => {
    if (!state.user) return false;
    const reward = state.rewards.find((r) => r.id === rewardId);
    if (!reward || state.user.points < reward.pointsCost) {
      pushToast('Not enough Treats', `You need ${reward?.pointsCost ?? 100} Treats to claim this reward.`, 'amber');
      return false;
    }

    setState((prev) => {
      if (!prev.user) return prev;
      const freeCartItem: CartItem = {
        id: `ci_rew_${Date.now()}`,
        type: 'reward',
        refId: reward.id,
        name: reward.name,
        subtitle: `Redeemed for ${reward.pointsCost} Treats · Free with next order`,
        unitPriceBdt: 0,
        quantity: 1,
        imageUrl: reward.imageUrl,
      };
      return {
        ...prev,
        user: { ...prev.user, points: prev.user.points - reward.pointsCost },
        cart: [freeCartItem, ...prev.cart],
        rewards: prev.rewards.map((r) => (r.id === rewardId ? { ...r, stock: Math.max(0, r.stock - 1) } : r)),
        pointsHistory: [
          {
            id: `pt_${Date.now()}`,
            userId: prev.user.id,
            type: 'reward_redeemed',
            points: -reward.pointsCost,
            description: `Redeemed ${reward.name} (added free to cart)`,
            timestamp: 'Just now',
          },
          ...prev.pointsHistory,
        ],
        notifications: addNotification(
          prev,
          'rewards',
          'Reward Added Free to Cart!',
          `${reward.name} has been added at ৳0 to your next Shop order.`,
          'Push',
          'shop'
        ),
      };
    });

    pushToast('Reward claimed!', `${reward.name} added free (৳0) to your cart.`, 'amber');
    setCartOpen(true);
    return true;
  };

  const reportContent: AppContextValue['reportContent'] = (reportData) => {
    const newReport: ModerationReport = {
      ...reportData,
      id: `rep_${Date.now()}`,
      reporterName: state.user?.name || 'Guest User',
      status: 'open',
      createdAt: 'Just now',
    };
    setState((prev) => ({
      ...prev,
      reports: [newReport, ...prev.reports],
    }));
    pushToast('Report submitted', 'Our safety team will review this promptly.', 'amber');
  };

  const blockUser = (userId: string, userName: string) => {
    setState((prev) => ({
      ...prev,
      blockedUserIds: Array.from(new Set([...prev.blockedUserIds, userId])),
    }));
    pushToast(`Blocked ${userName}`, 'Their posts are hidden from your feed.', 'slate');
  };

  const applyFosterHost: AppContextValue['applyFosterHost'] = (hostInput) => {
    if (!state.user) return;
    const newHost: FosterHost = {
      ...hostInput,
      id: `host_${Date.now()}`,
      userId: state.user.id,
      status: 'under_review',
      verificationChecklist: {
        idAndAddressChecked: false,
        videoHomeCheckDone: false,
        referenceVerified: false,
      },
      submittedAt: 'Nov 19, 2026',
      coordinates: DHAKA_COORDINATES[hostInput.area] || { x: 50, y: 50 },
    };

    setState((prev) => ({
      ...prev,
      fosterHosts: [newHost, ...prev.fosterHosts],
      notifications: addNotification(
        prev,
        'foster',
        'Safe House Application Received',
        'Status: Under Review. PetLove will verify your ID, book a video home-check, and contact your reference.',
        'Push',
        'safehouse'
      ),
    }));
    pushToast('Foster Host Application Submitted!', 'Status: Under Review — we will schedule your video home-check.', 'teal');
  };

  const createFosterRequest: AppContextValue['createFosterRequest'] = (reqInput) => {
    if (!state.user) return;
    const newReq: FosterRequest = {
      ...reqInput,
      id: `freq_${Date.now()}`,
      ownerId: state.user.id,
      ownerName: state.user.name,
      status: 'pending',
      createdAt: 'Just now',
      messages: [
        {
          id: `msg_${Date.now()}`,
          senderId: state.user.id,
          senderName: state.user.name,
          text: `Stay request sent for ${reqInput.petName} (${reqInput.startDate} to ${reqInput.endDate}). Emergency contact & vet info attached.`,
          timestamp: 'Just now',
        },
      ],
    };
    setState((prev) => ({
      ...prev,
      fosterRequests: [newReq, ...prev.fosterRequests],
      notifications: addNotification(
        prev,
        'foster',
        `Foster Request Sent to ${reqInput.hostName}`,
        `${reqInput.petName}'s profile, vaccine status & emergency vet details shared.`,
        'Push',
        'safehouse'
      ),
    }));
    pushToast('Stay request sent!', 'Once the host accepts, your stay chat opens.', 'teal');
  };

  const respondFosterRequest = (requestId: string, decision: 'accepted' | 'declined') => {
    setState((prev) => ({
      ...prev,
      fosterRequests: prev.fosterRequests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: decision,
              messages: [
                ...r.messages,
                {
                  id: `msg_${Date.now()}`,
                  senderId: 'system_host',
                  senderName: r.hostName,
                  text:
                    decision === 'accepted'
                      ? 'I have accepted your stay request! Chat is now open to coordinate drop-off timing.'
                      : 'Sorry, I am unable to host during those dates.',
                  timestamp: 'Just now',
                },
              ],
            }
          : r
      ),
      notifications: addNotification(
        prev,
        'foster',
        decision === 'accepted' ? 'Safe House Request Accepted!' : 'Safe House Request Declined',
        decision === 'accepted' ? 'Your stay chat is now active.' : 'Browse other verified Dhaka Safe Houses.',
        'Push',
        'safehouse'
      ),
    }));
    pushToast(`Request ${decision}`, decision === 'accepted' ? 'Stay chat is now open.' : undefined, decision === 'accepted' ? 'teal' : 'slate');
  };

  const sendFosterMessage = (requestId: string, text: string) => {
    if (!state.user || !text.trim()) return;
    setState((prev) => ({
      ...prev,
      fosterRequests: prev.fosterRequests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              messages: [
                ...r.messages,
                {
                  id: `msg_${Date.now()}`,
                  senderId: prev.user!.id,
                  senderName: prev.user!.name,
                  text: text.trim(),
                  timestamp: 'Just now',
                },
              ],
            }
          : r
      ),
    }));
  };

  const rsvpEvent = (eventId: string, choice: 'going' | 'interested' | 'none') => {
    if (!state.user) return;
    const uid = state.user.id;
    const evt = state.events.find((e) => e.id === eventId);
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) => {
        if (e.id !== eventId) return e;
        const going = e.rsvpGoingIds.filter((id) => id !== uid);
        const interested = e.rsvpInterestedIds.filter((id) => id !== uid);
        if (choice === 'going') going.push(uid);
        if (choice === 'interested') interested.push(uid);
        return { ...e, rsvpGoingIds: going, rsvpInterestedIds: interested };
      }),
      notifications:
        choice === 'going' && evt
          ? addNotification(
              prev,
              'events',
              `RSVP Confirmed: ${evt.title}`,
              `Automatic reminders scheduled 1 day & 2 hours before (${evt.dateLabel}).`,
              'Push',
              'events'
            )
          : prev.notifications,
    }));
    if (choice === 'going') {
      pushToast('You’re Going!', 'Automatic 1-day & 2-hour event reminders enabled.', 'teal');
    } else if (choice === 'interested') {
      pushToast('Marked as Interested', 'We will notify you of event updates.', 'slate');
    }
  };

  const createAdoptionPost: AppContextValue['createAdoptionPost'] = (input) => {
    if (!state.user) return null;
    const areaReachMap: Record<string, number> = {
      Dhanmondi: 418,
      Gulshan: 365,
      Banani: 294,
      Uttara: 382,
      Mirpur: 446,
      'Bashundhara R/A': 312,
      Mohakhali: 215,
      Mohammadpur: 338,
      'Baily Road': 248,
    };
    const isLostAlert = input.type === 'lost_cat';
    const isFoundRescue = input.type === 'found_rescue';
    const notifiedCount = isLostAlert || isFoundRescue ? areaReachMap[input.area] || 280 : undefined;

    const newPost: AdoptionRescuePost = {
      ...input,
      id: `adp_${Date.now()}`,
      status: 'active',
      authorId: state.user.id,
      authorName: state.user.name,
      authorAvatar: state.user.avatarUrl,
      alertSentToArea: isLostAlert || isFoundRescue,
      areaNotifiedCount: notifiedCount,
      sightings: [],
      inquiries: [],
      createdAt: 'Just now',
    };

    setState((prev) => ({
      ...prev,
      adoptionPosts: [newPost, ...prev.adoptionPosts],
      notifications: isLostAlert
        ? addNotification(
            prev,
            'alerts',
            `Lost Cat Alert Sent to ${input.area}: ${input.petName}`,
            `Urgent neighborhood alert pushed to ${notifiedCount} pet parents in ${input.area}, Dhaka (${input.exactLocation}).`,
            'Push',
            'adoption'
          )
        : isFoundRescue
        ? addNotification(
            prev,
            'alerts',
            `Found / Rescue Cat Posted in ${input.area}`,
            `Neighbors in ${input.area} (${notifiedCount} members) notified to help reunite or rescue.`,
            'Push',
            'adoption'
          )
        : addNotification(
            prev,
            'alerts',
            input.type === 'give_adoption'
              ? `Adoption Post Live: ${input.petName}`
              : `Adoption Request Live in ${input.area}`,
            `Your post is now visible to verified Dhaka pet parents in Adoption.`,
            'In-App',
            'adoption'
          ),
    }));

    if (isLostAlert) {
      pushToast(
        `Area Alert Sent to ${input.area}, Dhaka!`,
        `Notified ${notifiedCount} nearby pet parents to watch for ${input.petName}.`,
        'rose'
      );
    } else if (isFoundRescue) {
      pushToast(
        `Found & Rescue alert live in ${input.area}`,
        `Alerted ${notifiedCount} neighbors to help claim or rescue.`,
        'amber'
      );
    } else {
      pushToast(
        input.type === 'give_adoption' ? 'Adoption listing published!' : 'Looking-to-Adopt post live!',
        `Visible across ${input.area} and all of Dhaka.`,
        'teal'
      );
    }
    return newPost;
  };

  const addLostSighting: AppContextValue['addLostSighting'] = (postId, sightingInput) => {
    const post = state.adoptionPosts.find((p) => p.id === postId);
    const newSighting: LostSighting = {
      ...sightingInput,
      id: `sight_${Date.now()}`,
      timestamp: 'Just now',
    };
    setState((prev) => ({
      ...prev,
      adoptionPosts: prev.adoptionPosts.map((p) =>
        p.id === postId ? { ...p, sightings: [newSighting, ...p.sightings] } : p
      ),
      notifications: post
        ? addNotification(
            prev,
            'alerts',
            `New Sighting Reported for ${post.petName}!`,
            `${sightingInput.reporterName} spotted near ${sightingInput.landmark}, ${sightingInput.area}.`,
            'Push',
            'adoption'
          )
        : prev.notifications,
    }));
    pushToast('Sighting reported!', `Alerted ${post?.authorName || 'owner'} with location details.`, 'teal');
  };

  const submitAdoptionInquiry: AppContextValue['submitAdoptionInquiry'] = (postId, inquiryInput) => {
    const post = state.adoptionPosts.find((p) => p.id === postId);
    const newInquiry: AdoptionInquiry = {
      ...inquiryInput,
      id: `inq_${Date.now()}`,
      timestamp: 'Just now',
    };
    setState((prev) => ({
      ...prev,
      adoptionPosts: prev.adoptionPosts.map((p) =>
        p.id === postId ? { ...p, inquiries: [newInquiry, ...p.inquiries] } : p
      ),
      notifications: post
        ? addNotification(
            prev,
            'alerts',
            post.type === 'found_rescue'
              ? `Rescue / Claim Contact for ${post.title}`
              : `New Adoption Response from ${inquiryInput.applicantName}`,
            `${inquiryInput.area}, Dhaka · ${inquiryInput.applicantPhone}`,
            'Push',
            'adoption'
          )
        : prev.notifications,
    }));
    pushToast(
      post?.type === 'found_rescue' ? 'Rescue / Claim message sent!' : 'Adoption response sent!',
      `${post?.authorName || 'Poster'} received your contact info and message.`,
      'teal'
    );
  };

  const markAdoptionPostResolved = (postId: string) => {
    const post = state.adoptionPosts.find((p) => p.id === postId);
    setState((prev) => ({
      ...prev,
      adoptionPosts: prev.adoptionPosts.map((p) =>
        p.id === postId ? { ...p, status: 'resolved' } : p
      ),
    }));
    pushToast(
      post?.type === 'lost_cat'
        ? `${post.petName} marked Reunited Safe!`
        : post?.type === 'found_rescue'
        ? 'Marked as Rescued / Reunited!'
        : 'Marked as Adopted!',
      'Thank you for updating the Dhaka community.',
      'teal'
    );
  };

  const deleteAdoptionPost = (postId: string) => {
    setState((prev) => ({
      ...prev,
      adoptionPosts: prev.adoptionPosts.filter((p) => p.id !== postId),
    }));
    pushToast('Post removed', undefined, 'slate');
  };

  const markAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  };

  const toggleNotificationPref = (key: keyof NotificationPreferences) => {
    setState((prev) => ({
      ...prev,
      notificationPrefs: { ...prev.notificationPrefs, [key]: !prev.notificationPrefs[key] },
    }));
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        activeTab,
        setActiveTab,
        cartOpen,
        setCartOpen,
        notificationsOpen,
        setNotificationsOpen,
        authModalOpen,
        setAuthModalOpen,
        pendingActionLabel,
        requireAuth,
        completeAuth,
        signInDemoUser,
        signOut,
        deleteAccount,
        setLanguage,
        setSelectedPetId,
        toasts,
        pushToast,
        dismissToast,
        updateUserProfile,
        addAddress,
        deleteAddress,
        addPet,
        updatePet,
        deletePet,
        addVaccineRecord,
        toggleVaccineReminder,
        deleteVaccineRecord,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        placeOrder,
        oneTapReorder,
        cancelOrder,
        submitReturnRequest,
        createFeedPost,
        deleteFeedPost,
        toggleLikePost,
        sendTreat,
        redeemReward,
        reportContent,
        blockUser,
        applyFosterHost,
        createFosterRequest,
        respondFosterRequest,
        sendFosterMessage,
        rsvpEvent,
        createAdoptionPost,
        addLostSighting,
        submitAdoptionInquiry,
        markAdoptionPostResolved,
        deleteAdoptionPost,
        markAllNotificationsRead,
        toggleNotificationPref,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
