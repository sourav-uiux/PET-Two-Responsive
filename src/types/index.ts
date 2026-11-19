export type Language = 'en' | 'bn';

export type MainTab = 'feed' | 'safehouse' | 'shop' | 'adoption' | 'events' | 'profile';

export type Species = 'cat' | 'dog';

export type DhakaArea =
  | 'Gulshan'
  | 'Banani'
  | 'Dhanmondi'
  | 'Uttara'
  | 'Mirpur'
  | 'Bashundhara R/A'
  | 'Mohakhali'
  | 'Mohammadpur'
  | 'Baily Road';

export interface SavedAddress {
  id: string;
  label: string;
  area: DhakaArea;
  street: string;
  apartment: string;
  phone: string;
  isDefault: boolean;
}

export interface UserDevice {
  id: string;
  deviceName: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  authMethod: 'phone' | 'email' | 'google';
  verified: boolean;
  ageConfirmed: boolean;
  termsAccepted: boolean;
  area: DhakaArea;
  avatarUrl: string;
  points: number; // Represented everywhere in UI as Treats balance
  dailyTreatsRemaining: number;
  dailyTreatsCap: number;
  dailyPointsEarned: {
    treats: number;
    posts: number;
    events: number;
    orders: number;
  };
  role: 'user' | 'admin';
  addresses: SavedAddress[];
  devices: UserDevice[];
  joinedAt: string;
}

export interface VaccineRecord {
  id: string;
  vaccineName: string;
  details: string;
  clinicName: string;
  dateGiven: string;
  nextDueDate: string;
  reminderEnabled: boolean;
  images: string[];
}

export interface PetProfile {
  id: string;
  ownerId: string;
  name: string;
  species: Species;
  breed: string;
  ageMonths: number;
  gender: 'male' | 'female';
  weightKg: number;
  activityLevel: 'low' | 'moderate' | 'high';
  neutered: boolean;
  neuteredDate?: string;
  microchipId?: string;
  medicalNotes?: string;
  foodAllergies: string[];
  vaccineStatus: 'up_to_date' | 'partial' | 'due';
  vaccineDetails: string;
  vaccineRecords: VaccineRecord[];
  photos: string[];
}

export interface PackageSwapOption {
  id: string;
  brand: string;
  flavor: string;
  weightLabel: string;
  nutritionTier: 'complete-indoor' | 'growth-kitten' | 'senior-care' | 'active-dog';
  priceDelta: number;
  inStock: boolean;
}

export interface PackageComponentItem {
  id: string;
  slotLabel: string;
  selectedOptionId: string;
  options: PackageSwapOption[];
}

export interface MonthlyPackage {
  id: string;
  name: string;
  species: Species;
  lifeStage: 'Kitten' | 'Adult Indoor' | 'Senior' | 'Puppy' | 'Adult Dog';
  description: string;
  imageUrl: string;
  basePriceBdt: number;
  retailValueBdt: number;
  marginFloorBdt: number;
  costBdt: number;
  nutritionSummary: string;
  proteinPct: number;
  fatPct: number;
  kcalPer100g: number;
  daysSupply: number;
  active: boolean;
  items: PackageComponentItem[];
}

export interface AddonProduct {
  id: string;
  name: string;
  brand: string;
  species: Species | 'both';
  category: 'Dry Food' | 'Wet Food' | 'Treats' | 'Litter' | 'Toys' | 'Accessories';
  priceBdt: number;
  retailPriceBdt?: number;
  unitLabel: string;
  imageUrl: string;
  stock: number;
  description: string;
  nutritionInfo?: string;
  ingredients?: string;
}

export interface RewardItem {
  id: string;
  name: string;
  brand: string;
  pointsCost: number;
  retailValueBdt: number;
  species: Species | 'both';
  imageUrl: string;
  stock: number;
}

export interface CartItem {
  id: string;
  type: 'package' | 'addon' | 'reward';
  refId: string;
  name: string;
  subtitle: string;
  petName?: string;
  unitPriceBdt: number;
  quantity: number;
  imageUrl: string;
  selectedSwaps?: Record<string, string>;
}

export interface Coupon {
  code: string;
  description: string;
  discountType: 'flat' | 'percent';
  value: number;
  minOrderBdt: number;
  active: boolean;
}

export interface DeliveryZone {
  area: DhakaArea;
  feeBdt: number;
  estimatedHours: string;
}

export type OrderStatus = 'Placed' | 'Confirmed' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled';

export type PaymentMethod = 'bKash' | 'Nagad' | 'Card' | 'COD';

export interface OrderStatusEvent {
  status: OrderStatus;
  timestamp: string;
  channel: string;
  note: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  reason: string;
  photoName: string;
  refundMethod: 'bKash' | 'Nagad' | 'Card';
  refundAccount: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  subtotalBdt: number;
  discountBdt: number;
  deliveryFeeBdt: number;
  totalBdt: number;
  couponCode?: string;
  rewardClaimedName?: string;
  address: SavedAddress;
  paymentMethod: PaymentMethod;
  paymentRef: string;
  status: OrderStatus;
  createdAt: string;
  daysSinceOrder: number;
  isPackageOrder: boolean;
  timeline: OrderStatusEvent[];
  returnRequest?: ReturnRequest;
}

export type HostVerificationStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'suspended';

export interface FosterHost {
  id: string;
  userId: string;
  hostName: string;
  area: DhakaArea;
  exactAddress: string;
  idDocumentNumber: string;
  homeType: 'Apartment (Netted Balcony)' | 'Duplex House' | 'Ground Floor with Yard';
  otherPets: string;
  childrenAtHome: boolean;
  experienceYears: number;
  bio: string;
  photos: string[];
  speciesAccepted: Species[];
  capacity: number;
  pricePerNightBdt: number;
  houseRules: string[];
  status: HostVerificationStatus;
  verificationChecklist: {
    idAndAddressChecked: boolean;
    videoHomeCheckDone: boolean;
    referenceVerified: boolean;
  };
  referenceContact: string;
  fosterTermsAccepted: boolean;
  submittedAt: string;
  coordinates: { x: number; y: number };
}

export interface FosterChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface FosterRequest {
  id: string;
  hostId: string;
  hostName: string;
  hostArea: DhakaArea;
  ownerId: string;
  ownerName: string;
  petId: string;
  petName: string;
  petSpecies: Species;
  petVaccineStatus: string;
  startDate: string;
  endDate: string;
  nights: number;
  estimatedTotalBdt: number;
  emergencyContactName: string;
  emergencyContactPhone: string;
  vetName: string;
  vetPhone: string;
  notes: string;
  fosterTermsAccepted: boolean;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  createdAt: string;
  messages: FosterChatMessage[];
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  photoUrl: string;
  dateISO: string;
  dateLabel: string;
  timeLabel: string;
  venueName: string;
  area: DhakaArea;
  capacity: number;
  rsvpGoingIds: string[];
  rsvpInterestedIds: string[];
  checkedInUserIds: string[];
  isFree: boolean;
  feeNote: string;
  whatToBring: string[];
  isPast?: boolean;
  notificationsScheduled: {
    newEventSent: boolean;
    oneDayReminder: boolean;
    twoHourReminder: boolean;
    changeAlertNote?: string;
    postEventPromptSent: boolean;
  };
  coordinates: { x: number; y: number };
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorArea: DhakaArea;
  authorAvatar: string;
  petId?: string;
  petName: string;
  petSpecies: Species;
  eventTag?: string;
  fromEventAttendee: boolean;
  photos: string[];
  caption: string;
  likesCount: number;
  likedByUserIds: string[];
  treatsCount: number;
  treatedByUserIds: string[];
  createdAt: string;
}

export interface PointsTransaction {
  id: string;
  userId: string;
  type: 'treat_received' | 'post_created' | 'event_checkin' | 'order_delivered' | 'reward_redeemed' | 'admin_adjustment';
  points: number;
  description: string;
  timestamp: string;
}

export interface ModerationReport {
  id: string;
  targetType: 'post' | 'user' | 'foster_host';
  targetId: string;
  targetTitle: string;
  reporterName: string;
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
  resolutionNote?: string;
}

export type NotificationCategory =
  | 'orders'
  | 'foster'
  | 'chat'
  | 'events'
  | 'treats'
  | 'rewards'
  | 'vaccines'
  | 'alerts';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  channel: 'Push' | 'SMS' | 'In-App';
  actionTab?: MainTab;
}

export interface NotificationPreferences {
  orders: boolean;
  foster: boolean;
  chat: boolean;
  events: boolean;
  treats: boolean;
  rewards: boolean;
  vaccines: boolean;
  alerts: boolean;
}

export type AdoptionPostType = 'lost_cat' | 'found_rescue' | 'give_adoption' | 'take_adoption';

export interface LostSighting {
  id: string;
  reporterName: string;
  reporterPhone: string;
  area: DhakaArea;
  landmark: string;
  note: string;
  timestamp: string;
}

export interface AdoptionInquiry {
  id: string;
  applicantName: string;
  applicantPhone: string;
  area: DhakaArea;
  homeType: string;
  nettedBalcony: boolean;
  message: string;
  timestamp: string;
}

export interface AdoptionRescuePost {
  id: string;
  type: AdoptionPostType;
  status: 'active' | 'resolved';
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorPhone: string;
  title: string;
  petName: string;
  species: Species;
  breed: string;
  ageLabel: string;
  gender: 'male' | 'female' | 'unknown';
  colorMarkings: string;
  area: DhakaArea;
  exactLocation: string;
  dateLabel: string;
  rewardBdt?: number;
  vaccinated?: boolean;
  neutered?: boolean;
  healthCondition?: 'Healthy' | 'Needs Vet Care' | 'Kitten / Vulnerable' | 'Scared / Shy';
  adoptionRequirements?: string;
  description: string;
  photos: string[];
  alertSentToArea?: boolean;
  areaNotifiedCount?: number;
  sightings: LostSighting[];
  inquiries: AdoptionInquiry[];
  createdAt: string;
}

