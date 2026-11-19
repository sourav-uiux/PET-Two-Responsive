import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Award,
  Bell,
  BellRing,
  Bone,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Edit3,
  FileImage,
  FolderHeart,
  ImagePlus,
  LogOut,
  MoreVertical,
  PawPrint,
  Plus,
  ShieldCheck,
  Smartphone,
  Syringe,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DHAKA_AREAS, IMAGES } from '../data/seedData';
import { t } from '../i18n/translations';
import { DhakaArea, PetProfile, Species, VaccineRecord } from '../types';

type ProfileTab = 'pets' | 'wallet';

const VACCINE_PRESETS = [
  { name: 'FVRCP (Cat Flu Core)', monthsAhead: 12 },
  { name: 'Anti-Rabies Vaccine', monthsAhead: 12 },
  { name: 'Deworming Treatment', monthsAhead: 3 },
  { name: 'DHPPi + Lepto (Dog Core)', monthsAhead: 12 },
  { name: 'FeLV / Booster Shot', monthsAhead: 12 },
];

function addMonthsToDate(isoDate: string, months: number): string {
  const base = isoDate ? new Date(`${isoDate}T00:00:00`) : new Date();
  if (Number.isNaN(base.getTime())) return '2027-11-19';
  base.setMonth(base.getMonth() + months);
  return base.toISOString().slice(0, 10);
}

function getDueCountdownLabel(nextDueDate: string): { label: string; urgent: boolean } {
  // Reference date aligned with app seed timeline (Nov 19, 2026) or real date if later
  const refDate = new Date('2026-11-19T00:00:00');
  const due = new Date(`${nextDueDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return { label: `Due ${nextDueDate}`, urgent: false };
  const diffDays = Math.round((due.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `Overdue by ${Math.abs(diffDays)}d`, urgent: true };
  if (diffDays === 0) return { label: 'Due Today', urgent: true };
  if (diffDays <= 14) return { label: `Due in ${diffDays} days`, urgent: true };
  if (diffDays <= 60) return { label: `Due in ${Math.round(diffDays / 7)} weeks`, urgent: false };
  return { label: `Next due ${nextDueDate}`, urgent: false };
}

function downloadVaccineReminderIcs(petName: string, record: VaccineRecord) {
  const cleanDate = record.nextDueDate.replace(/-/g, '');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PetLove Dhaka//Vaccine Reminder//EN',
    'BEGIN:VEVENT',
    `UID:${record.id}@petlove.dhaka`,
    `DTSTART;VALUE=DATE:${cleanDate}`,
    `DTEND;VALUE=DATE:${cleanDate}`,
    `SUMMARY:${petName} — Next Vaccine: ${record.vaccineName}`,
    `DESCRIPTION:PetLove Fast Vaxine reminder for ${petName}. Clinic: ${record.clinicName}. Details: ${record.details}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${petName.toLowerCase()}_${record.vaccineName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_reminder.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

export const ProfileModule: React.FC = () => {
  const {
    language,
    user,
    pets,
    pointsHistory,
    rewards,
    setAuthModalOpen,
    signOut,
    deleteAccount,
    updateUserProfile,
    addAddress,
    deleteAddress,
    addPet,
    updatePet,
    deletePet,
    addVaccineRecord,
    toggleVaccineReminder,
    deleteVaccineRecord,
    setSelectedPetId,
    setActiveTab,
    redeemReward,
    pushToast,
  } = useApp();

  // Order requested: 1. My Pets (default), 2. Account & Treats Wallet (Notifications moved to top-bar bell)
  const [subTab, setSubTab] = useState<ProfileTab>('pets');
  const [selectedDetailPetId, setSelectedDetailPetId] = useState<string | null>(null);
  const [openMenuPetId, setOpenMenuPetId] = useState<string | null>(null);
  const [detailMenuOpen, setDetailMenuOpen] = useState(false);
  const [petToDelete, setPetToDelete] = useState<PetProfile | null>(null);

  // Modals
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [petModalOpen, setPetModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<PetProfile | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Fast Vaxine Modal & Lightbox
  const [vaxModalOpen, setVaxModalOpen] = useState(false);
  const [vaxFilter, setVaxFilter] = useState<'all' | 'reminders'>('all');
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [vaxName, setVaxName] = useState('FVRCP (Cat Flu Core)');
  const [vaxClinic, setVaxClinic] = useState('Care & Cure Vet Clinic, Dhanmondi');
  const [vaxDetails, setVaxDetails] = useState('');
  const [vaxDateGiven, setVaxDateGiven] = useState('2026-11-19');
  const [vaxNextDue, setVaxNextDue] = useState('2027-11-19');
  const [vaxAutoReminder, setVaxAutoReminder] = useState(true);
  const [vaxImages, setVaxImages] = useState<string[]>([]);

  // Address Form
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrArea, setAddrArea] = useState<DhakaArea>(user?.area || 'Dhanmondi');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrApt, setAddrApt] = useState('');
  const [addrPhone, setAddrPhone] = useState(user?.phone || '+880 1711-');

  // Pet Form
  const [pName, setPName] = useState('');
  const [pSpecies, setPSpecies] = useState<Species>('cat');
  const [pBreed, setPBreed] = useState('Persian');
  const [pAgeMonths, setPAgeMonths] = useState(18);
  const [pGender, setPGender] = useState<'male' | 'female'>('female');
  const [pWeightKg, setPWeightKg] = useState(3.8);
  const [pActivity, setPActivity] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [pNeutered, setPNeutered] = useState(true);
  const [pNeuteredDate, setPNeuteredDate] = useState('');
  const [pMicrochipId, setPMicrochipId] = useState('');
  const [pMedicalNotes, setPMedicalNotes] = useState('');
  const [pAllergies, setPAllergies] = useState('');
  const [pVaccineStatus, setPVaccineStatus] = useState<'up_to_date' | 'partial' | 'due'>('up_to_date');
  const [pVaccineDetails, setPVaccineDetails] = useState('Flu & Rabies vaccinated at Dhaka Vet Clinic');

  const detailPet = useMemo(
    () => (selectedDetailPetId ? pets.find((p) => p.id === selectedDetailPetId) || null : null),
    [pets, selectedDetailPetId]
  );

  const openNewPetModal = () => {
    setEditingPet(null);
    setPName('');
    setPSpecies('cat');
    setPBreed('Deshi Shorthair');
    setPAgeMonths(12);
    setPGender('female');
    setPWeightKg(3.5);
    setPActivity('moderate');
    setPNeutered(true);
    setPNeuteredDate('');
    setPMicrochipId('');
    setPMedicalNotes('');
    setPAllergies('');
    setPVaccineStatus('up_to_date');
    setPVaccineDetails('Up to date');
    setPetModalOpen(true);
  };

  const openEditPetModal = (pet: PetProfile) => {
    setOpenMenuPetId(null);
    setDetailMenuOpen(false);
    setEditingPet(pet);
    setPName(pet.name);
    setPSpecies(pet.species);
    setPBreed(pet.breed);
    setPAgeMonths(pet.ageMonths);
    setPGender(pet.gender);
    setPWeightKg(pet.weightKg);
    setPActivity(pet.activityLevel);
    setPNeutered(pet.neutered);
    setPNeuteredDate(pet.neuteredDate || '');
    setPMicrochipId(pet.microchipId || '');
    setPMedicalNotes(pet.medicalNotes || '');
    setPAllergies(pet.foodAllergies.join(', '));
    setPVaccineStatus(pet.vaccineStatus);
    setPVaccineDetails(pet.vaccineDetails);
    setPetModalOpen(true);
  };

  const handleSavePet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) return;
    const payload = {
      name: pName.trim(),
      species: pSpecies,
      breed: pBreed.trim() || 'Mixed',
      ageMonths: Number(pAgeMonths) || 12,
      gender: pGender,
      weightKg: Number(pWeightKg) || 3.5,
      activityLevel: pActivity,
      neutered: pNeutered,
      neuteredDate: pNeutered ? pNeuteredDate.trim() || undefined : undefined,
      microchipId: pMicrochipId.trim() || undefined,
      medicalNotes: pMedicalNotes.trim() || undefined,
      foodAllergies: pAllergies
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      vaccineStatus: pVaccineStatus,
      vaccineDetails: pVaccineDetails.trim(),
      photos: editingPet?.photos?.length
        ? editingPet.photos
        : [pSpecies === 'dog' ? IMAGES.goldenDog : pAgeMonths < 12 ? IMAGES.tabbyCat : IMAGES.persianCat],
      vaccineRecords: editingPet?.vaccineRecords || [],
    };
    if (editingPet) {
      updatePet(editingPet.id, payload);
    } else {
      const created = addPet(payload);
      setSelectedDetailPetId(created.id);
    }
    setPetModalOpen(false);
  };

  const handleConfirmDeletePet = () => {
    if (!petToDelete) return;
    if (selectedDetailPetId === petToDelete.id) {
      setSelectedDetailPetId(null);
    }
    deletePet(petToDelete.id);
    setPetToDelete(null);
  };

  const openAddVaccineModal = () => {
    setVaxName('FVRCP (Cat Flu Core)');
    setVaxClinic('Care & Cure Vet Clinic, Dhanmondi');
    setVaxDetails('');
    setVaxDateGiven('2026-11-19');
    setVaxNextDue('2027-11-19');
    setVaxAutoReminder(true);
    setVaxImages([]);
    setVaxModalOpen(true);
  };

  const handleVaxImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setVaxImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleSaveVaccineRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailPet || !vaxName.trim()) return;
    addVaccineRecord(detailPet.id, {
      vaccineName: vaxName.trim(),
      clinicName: vaxClinic.trim() || 'Dhaka Vet Clinic',
      details: vaxDetails.trim() || 'Routine vaccination recorded in PetLove Fast Vaxine vault.',
      dateGiven: vaxDateGiven,
      nextDueDate: vaxNextDue,
      reminderEnabled: vaxAutoReminder,
      images: vaxImages,
    });
    setVaxModalOpen(false);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrStreet.trim()) return;
    addAddress({
      label: addrLabel.trim() || 'Home',
      area: addrArea,
      street: addrStreet.trim(),
      apartment: addrApt.trim() || 'Ground Floor',
      phone: addrPhone.trim(),
      isDefault: false,
    });
    setAddrStreet('');
    setAddrApt('');
    setAddressModalOpen(false);
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-xl bg-[#F9F9F9] border border-slate-200 text-teal-600 mx-auto flex items-center justify-center">
          <UserIcon className="w-7 h-7" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Sign In to Manage Your PetLove Profile</h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Access your pet health &amp; Fast Vaxine records, Dhaka delivery addresses, and Treats Wallet.
        </p>
        <button
          type="button"
          onClick={() => setAuthModalOpen(true)}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer"
        >
          {t(language, 'sign_in')} / Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-6">
      {/* Top Profile & Treats Wallet Banner */}
      <section className="bg-[#F9F9F9] border border-slate-200 rounded-xl p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-4">
          <img
            src={user.avatarUrl}
            alt={user.name}
            referrerPolicy="no-referrer"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover bg-slate-200 border border-slate-200 shrink-0"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900">{user.name}</h1>
              {user.verified && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700">
                  <ShieldCheck className="w-4 h-4" strokeWidth={2} />
                  Verified
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-0.5 truncate">
              {user.phone} · {user.email} · {user.area}, Dhaka
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
            <Award className="w-5 h-5 text-amber-600 shrink-0" strokeWidth={2} />
            <div>
              <p className="text-[11px] text-slate-500">Treats Wallet</p>
              <p className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-900">
                {user.points} Treats
              </p>
            </div>
            {user.points >= 100 && rewards[0] && (
              <button
                type="button"
                onClick={() => redeemReward(rewards[0].id)}
                className="ml-1 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg whitespace-nowrap cursor-pointer"
              >
                Redeem 100 Treats
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
            <span>{t(language, 'sign_out')}</span>
          </button>
        </div>
      </section>

      {/* 2 Sub-Tabs in Exact Order: 1. My Pets, 2. Account & Treats Wallet (Notifications via top Bell) */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setSubTab('pets')}
          className={`flex-1 sm:flex-none px-4 py-2.5 min-h-[40px] text-xs font-semibold rounded-md whitespace-nowrap cursor-pointer ${
            subTab === 'pets' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Pets ({pets.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setSubTab('wallet');
            setSelectedDetailPetId(null);
          }}
          className={`flex-1 sm:flex-none px-4 py-2.5 min-h-[40px] text-xs font-semibold rounded-md whitespace-nowrap cursor-pointer ${
            subTab === 'wallet' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Account &amp; Treats Wallet
        </button>
      </div>

      {/* TAB 1 (FIRST & DEFAULT): MY PETS + GENEROUS PET DETAILS & FAST VAXINE FILE MANAGER */}
      {subTab === 'pets' && (
        <>
          {!detailPet ? (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">My Pets &amp; Health Vault</h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tap any pet to open full clinical details, neuter info, vaccine certificates, and next-vaccine reminders.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openNewPetModal}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" strokeWidth={2} />
                  <span>Add Pet</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {pets.map((pet) => {
                  const records = pet.vaccineRecords || [];
                  const activeRemindersCount = records.filter((r) => r.reminderEnabled).length;
                  const nextDueRecord = records
                    .slice()
                    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))[0];

                  return (
                    <div
                      key={pet.id}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-teal-400 transition-colors"
                    >
                      <div
                        onClick={() => setSelectedDetailPetId(pet.id)}
                        className="aspect-[16/10] bg-slate-100 overflow-hidden cursor-pointer relative"
                      >
                        <img
                          src={pet.photos[0]}
                          alt={pet.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md bg-white/95 text-slate-900 text-[11px] font-semibold shadow-sm">
                          {records.length} vaccine {records.length === 1 ? 'file' : 'files'}
                        </span>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedDetailPetId(pet.id)}
                              className="text-left cursor-pointer"
                            >
                              <h3 className="text-lg font-bold text-slate-900 hover:text-teal-700">
                                {pet.name}
                              </h3>
                              <p className="text-xs text-slate-500">
                                {pet.species === 'cat' ? 'Cat' : 'Dog'} · {pet.breed} ·{' '}
                                {pet.ageMonths < 12
                                  ? `${pet.ageMonths}m`
                                  : `${Math.round(pet.ageMonths / 12)}y`}{' '}
                                · {pet.weightKg} kg
                              </p>
                            </button>

                            {/* Three-dots menu (Edit & Delete tucked cleanly away) */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenMenuPetId((prev) => (prev === pet.id ? null : pet.id))
                                }
                                aria-label={`Options for ${pet.name}`}
                                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" strokeWidth={2} />
                              </button>
                              {openMenuPetId === pet.id && (
                                <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuPetId(null);
                                      setSelectedDetailPetId(pet.id);
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-[#F9F9F9] flex items-center gap-2 cursor-pointer"
                                  >
                                    <FolderHeart className="w-3.5 h-3.5 text-teal-600" strokeWidth={2} />
                                    <span>View Details &amp; Vaccines</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditPetModal(pet)}
                                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-800 hover:bg-[#F9F9F9] flex items-center gap-2 cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-slate-600" strokeWidth={2} />
                                    <span>Edit Pet Profile</span>
                                  </button>
                                  {pets.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuPetId(null);
                                        setPetToDelete(pet);
                                      }}
                                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                                      <span>Delete Pet</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-3.5 grid grid-cols-2 gap-2.5 text-xs bg-[#F9F9F9] border border-slate-200 rounded-lg p-3">
                            <div>
                              <span className="text-slate-500 block">Neutered / Spayed</span>
                              <span className="font-semibold text-slate-900">
                                {pet.neutered ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Reminders Active</span>
                              <span className="font-semibold text-teal-700 tabular-nums">
                                {activeRemindersCount} scheduled
                              </span>
                            </div>
                            {nextDueRecord && (
                              <div className="col-span-2 pt-1.5 border-t border-slate-200 flex items-center justify-between gap-2">
                                <span className="text-slate-500 truncate">
                                  Next: {nextDueRecord.vaccineName}
                                </span>
                                <span className="font-mono font-semibold text-slate-800 shrink-0 tabular-nums">
                                  {nextDueRecord.nextDueDate}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedDetailPetId(pet.id)}
                          className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg inline-flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Syringe className="w-4 h-4" strokeWidth={2} />
                          <span>Open Pet Details &amp; Vaccine Files</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* GENEROUS PET DETAILS VIEW + FAST VAXINE FILE MANAGER */
            <div className="space-y-6">
              {/* Top Action Bar */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDetailPetId(null);
                    setDetailMenuOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-[#F9F9F9] rounded-lg cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                  <span>All Pets</span>
                </button>

                {/* Three-dots Menu for Edit & Delete */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDetailMenuOpen((o) => !o)}
                    aria-label="Pet options"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-[#F9F9F9] rounded-lg cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" strokeWidth={2} />
                    <span>Options</span>
                  </button>
                  {detailMenuOpen && (
                    <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20">
                      <button
                        type="button"
                        onClick={() => openEditPetModal(detailPet)}
                        className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-slate-800 hover:bg-[#F9F9F9] flex items-center gap-2 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-teal-600" strokeWidth={2} />
                        <span>Edit Pet Details</span>
                      </button>
                      {pets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setDetailMenuOpen(false);
                            setPetToDelete(detailPet);
                          }}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>Delete Pet Profile</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Generous Pet Identity & Clinical Profile Section */}
              <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  <div className="lg:col-span-4 aspect-[4/3] lg:aspect-auto bg-slate-100">
                    <img
                      src={detailPet.photos[0]}
                      alt={detailPet.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="lg:col-span-8 p-5 sm:p-7 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                            {detailPet.name}
                          </h2>
                          <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md capitalize">
                            {detailPet.species} · {detailPet.breed}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Clinical identity, spay/neuter history, and allergies shared safely with verified Dhaka Safe Houses.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPetId(detailPet.id);
                          setActiveTab('shop');
                        }}
                        className="px-3.5 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg whitespace-nowrap cursor-pointer shrink-0"
                      >
                        View 30-Day Food Plan
                      </button>
                    </div>

                    {/* Generous Clinical Metadata Grid */}
                    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
                      <div className="p-3.5 rounded-xl bg-[#F9F9F9] border border-slate-200">
                        <dt className="text-slate-500">Age &amp; Gender</dt>
                        <dd className="text-sm font-bold text-slate-900 mt-1 capitalize">
                          {detailPet.ageMonths < 12
                            ? `${detailPet.ageMonths} months`
                            : `${Math.floor(detailPet.ageMonths / 12)}y ${detailPet.ageMonths % 12 ? `${detailPet.ageMonths % 12}m` : ''}`}{' '}
                          · {detailPet.gender}
                        </dd>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#F9F9F9] border border-slate-200">
                        <dt className="text-slate-500">Weight &amp; Activity</dt>
                        <dd className="text-sm font-bold text-slate-900 mt-1 capitalize tabular-nums">
                          {detailPet.weightKg} kg · {detailPet.activityLevel}
                        </dd>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#F9F9F9] border border-slate-200">
                        <dt className="text-slate-500">Neutered / Spayed</dt>
                        <dd className="text-sm font-bold text-slate-900 mt-1">
                          {detailPet.neutered ? 'Yes' : 'Not yet'}
                        </dd>
                        {detailPet.neutered && detailPet.neuteredDate && (
                          <p className="text-[11px] text-teal-700 font-mono mt-0.5 tabular-nums">
                            Since {detailPet.neuteredDate}
                          </p>
                        )}
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#F9F9F9] border border-slate-200">
                        <dt className="text-slate-500">Microchip / Vet ID</dt>
                        <dd className="text-sm font-bold font-mono text-slate-900 mt-1">
                          {detailPet.microchipId || 'Not registered'}
                        </dd>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#F9F9F9] border border-slate-200">
                        <dt className="text-slate-500">Food Allergies</dt>
                        <dd className="text-sm font-bold text-slate-900 mt-1">
                          {detailPet.foodAllergies.length > 0
                            ? detailPet.foodAllergies.join(', ')
                            : 'None recorded'}
                        </dd>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#F9F9F9] border border-slate-200">
                        <dt className="text-slate-500">Vaccine Status</dt>
                        <dd className="text-sm font-bold text-teal-700 mt-1 capitalize">
                          {detailPet.vaccineStatus.replace('_', ' ')}
                        </dd>
                      </div>
                    </dl>

                    {detailPet.medicalNotes && (
                      <div className="p-4 rounded-xl bg-[#F9F9F9] border border-slate-200">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          Medical &amp; Care Notes
                        </p>
                        <p className="text-xs sm:text-sm text-slate-800 mt-1 leading-relaxed">
                          {detailPet.medicalNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* FAST VAXINE — VACCINE RECORD & IMAGE FILE MANAGER */}
              <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                      <Syringe className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                        Vaccine File Manager (Fast Vaxine)
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Store vaccine cards, upload certificate photos, track dates, and automatically set next-vaccine reminders for {detailPet.name}.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openAddVaccineModal}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2} />
                    <span>Add Vaccine Record</span>
                  </button>
                </div>

                {/* File Manager Summary Strip & Filter */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {(detailPet.vaccineRecords || []).length} Vaccine Files
                    </span>
                    <span>·</span>
                    <span className="tabular-nums">
                      {(detailPet.vaccineRecords || []).reduce(
                        (sum, r) => sum + (r.images?.length || 0),
                        0
                      )}{' '}
                      Uploaded Images
                    </span>
                    <span>·</span>
                    <span className="text-teal-700 font-semibold tabular-nums">
                      {(detailPet.vaccineRecords || []).filter((r) => r.reminderEnabled).length}{' '}
                      Active Reminders
                    </span>
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setVaxFilter('all')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                        vaxFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      All Files
                    </button>
                    <button
                      type="button"
                      onClick={() => setVaxFilter('reminders')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                        vaxFilter === 'reminders'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600'
                      }`}
                    >
                      Reminders On
                    </button>
                  </div>
                </div>

                {/* Vaccine File Cards */}
                {(() => {
                  const list = (detailPet.vaccineRecords || []).filter((r) =>
                    vaxFilter === 'reminders' ? r.reminderEnabled : true
                  );

                  if (list.length === 0) {
                    return (
                      <div className="bg-[#F9F9F9] border border-dashed border-slate-300 rounded-xl p-10 text-center space-y-3">
                        <FileImage className="w-8 h-8 text-slate-400 mx-auto" strokeWidth={2} />
                        <p className="text-sm font-semibold text-slate-900">
                          No vaccine records in this folder yet
                        </p>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Add {detailPet.name}&apos;s vaccine name, vet clinic notes, date given, and upload vaccine card photos to activate automatic booster reminders.
                        </p>
                        <button
                          type="button"
                          onClick={openAddVaccineModal}
                          className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer"
                        >
                          + Add First Vaccine File
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {list.map((rec) => {
                        const dueStatus = getDueCountdownLabel(rec.nextDueDate);
                        return (
                          <div
                            key={rec.id}
                            className="bg-[#F9F9F9] border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-base font-bold text-slate-900">
                                    {rec.vaccineName}
                                  </h4>
                                  <p className="text-xs text-slate-500 mt-0.5">{rec.clinicName}</p>
                                </div>
                                <span
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 tabular-nums ${
                                    dueStatus.urgent
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-teal-50 text-teal-700'
                                  }`}
                                >
                                  {dueStatus.label}
                                </span>
                              </div>

                              <p className="text-xs text-slate-700 leading-relaxed bg-white border border-slate-200 rounded-lg p-3">
                                {rec.details}
                              </p>

                              {/* Date Metadata */}
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white border border-slate-200 rounded-lg px-3 py-2">
                                  <span className="text-[11px] text-slate-500 block">Date Given</span>
                                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                                    {rec.dateGiven}
                                  </span>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-lg px-3 py-2">
                                  <span className="text-[11px] text-slate-500 block">
                                    Next Booster Due
                                  </span>
                                  <span className="font-mono font-semibold text-teal-700 tabular-nums">
                                    {rec.nextDueDate}
                                  </span>
                                </div>
                              </div>

                              {/* Uploaded Images File Strip */}
                              <div className="space-y-1.5">
                                <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                                  <FileImage className="w-3.5 h-3.5 text-teal-600" strokeWidth={2} />
                                  <span>
                                    Attached Vaccine Images ({rec.images?.length || 0})
                                  </span>
                                </p>
                                {rec.images && rec.images.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {rec.images.map((imgUrl, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() =>
                                          setLightboxImage({
                                            url: imgUrl,
                                            title: `${detailPet.name} — ${rec.vaccineName} (${rec.dateGiven})`,
                                          })
                                        }
                                        className="w-16 h-16 rounded-lg overflow-hidden border border-slate-300 bg-white hover:border-teal-500 transition-colors cursor-pointer"
                                      >
                                        <img
                                          src={imgUrl}
                                          alt={`${rec.vaccineName} certificate ${idx + 1}`}
                                          referrerPolicy="no-referrer"
                                          className="w-full h-full object-cover"
                                        />
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-slate-400">
                                    No certificate photo attached
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Automatic Next Vaccine Reminder Button + Calendar Export */}
                            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleVaccineReminder(detailPet.id, rec.id)}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                  rec.reminderEnabled
                                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                                    : 'bg-white text-slate-700 border border-slate-300 hover:border-teal-500'
                                }`}
                              >
                                {rec.reminderEnabled ? (
                                  <>
                                    <BellRing className="w-3.5 h-3.5" strokeWidth={2} />
                                    <span>Next Vaccine Reminder Active</span>
                                  </>
                                ) : (
                                  <>
                                    <Bell className="w-3.5 h-3.5" strokeWidth={2} />
                                    <span>Set Next Vaccine Reminder</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  downloadVaccineReminderIcs(detailPet.name, rec);
                                  pushToast(
                                    'Calendar reminder downloaded',
                                    `${rec.vaccineName} due ${rec.nextDueDate}`,
                                    'teal'
                                  );
                                }}
                                title="Download .ics calendar reminder"
                                className="p-2 text-slate-600 hover:text-teal-700 bg-white border border-slate-300 rounded-lg cursor-pointer"
                              >
                                <CalendarPlus className="w-4 h-4" strokeWidth={2} />
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteVaccineRecord(detailPet.id, rec.id)}
                                title="Delete vaccine record"
                                className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" strokeWidth={2} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </section>

              {/* Subtle Manage Pet Footer AFTER Details (Edit & Delete kept out of main focus) */}
              <section className="bg-[#F9F9F9] border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">Manage {detailPet.name}&apos;s Profile</p>
                  <p className="text-xs text-slate-500">
                    Update clinical info, weight, neuter date, or remove this profile.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditPetModal(detailPet)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>Edit Details</span>
                  </button>
                  {pets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setPetToDelete(detailPet)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Delete Pet</span>
                    </button>
                  )}
                </div>
              </section>
            </div>
          )}
        </>
      )}

      {/* TAB 2: ACCOUNT, SAVED ADDRESSES & TREATS WALLET */}
      {subTab === 'wallet' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Treats History & Daily Allowance */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Treats Wallet &amp; Daily Allowance</h2>
                  <p className="text-xs text-slate-500">
                    Every member gets 20 daily Treats to send on Feed posts and earns Treats across PetLove.
                  </p>
                </div>
                <span className="text-xs font-mono text-teal-700 font-bold tabular-nums">
                  {user.points} Treats balance
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Bone className="w-5 h-5 text-rose-600 shrink-0" strokeWidth={2} />
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">Daily Feed Treat Allowance</p>
                    <p className="text-slate-600">
                      Send 1, 2, 3, 5, 10, 12, or 15 Treats to pets you love in the Feed.
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold font-mono text-rose-700 tabular-nums shrink-0">
                  {user.dailyTreatsRemaining} / {user.dailyTreatsCap}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#F9F9F9] border border-slate-200">
                  <span className="text-slate-500 block">Treats Earned</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {user.dailyPointsEarned.treats} / 25
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#F9F9F9] border border-slate-200">
                  <span className="text-slate-500 block">Posts Today</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {user.dailyPointsEarned.posts} / 20
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#F9F9F9] border border-slate-200">
                  <span className="text-slate-500 block">Events Today</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {user.dailyPointsEarned.events} / 30
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#F9F9F9] border border-slate-200">
                  <span className="text-slate-500 block">Orders Today</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {user.dailyPointsEarned.orders} / 40
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {pointsHistory.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{tx.description}</p>
                      <p className="text-slate-500">{tx.timestamp}</p>
                    </div>
                    <span
                      className={`font-mono font-bold tabular-nums shrink-0 ${
                        tx.points >= 0 ? 'text-teal-700' : 'text-amber-700'
                      }`}
                    >
                      {tx.points >= 0 ? `+${tx.points}` : tx.points} Treats
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved Dhaka Addresses */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Saved Dhaka Addresses</h2>
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>Add Address</span>
                </button>
              </div>
              <div className="space-y-3">
                {user.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-3.5 rounded-lg bg-[#F9F9F9] border border-slate-200 flex items-start justify-between gap-3"
                  >
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">
                        {addr.label} · {addr.area}, Dhaka
                      </p>
                      <p className="text-slate-600 mt-0.5">
                        {addr.street}, {addr.apartment}
                      </p>
                      <p className="text-slate-500 mt-0.5">{addr.phone}</p>
                    </div>
                    {user.addresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteAddress(addr.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                        aria-label="Delete address"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Account Settings, Devices & Delete Account */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <h2 className="text-base font-bold text-slate-900">Account Details</h2>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={user.name}
                    onChange={(e) => updateUserProfile({ name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Primary Dhaka Area
                  </label>
                  <select
                    value={user.area}
                    onChange={(e) => updateUserProfile({ area: e.target.value as DhakaArea })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {DHAKA_AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}, Dhaka
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-teal-600" strokeWidth={2} />
                <span>Signed-In Devices</span>
              </h2>
              <div className="divide-y divide-slate-100 text-xs">
                {user.devices.map((dev) => (
                  <div key={dev.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{dev.deviceName}</p>
                      <p className="text-slate-500">
                        {dev.location} · {dev.lastActive}
                      </p>
                    </div>
                    {dev.current && <span className="text-teal-700 font-semibold">Current</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#F9F9F9] border border-slate-200 rounded-xl p-5 space-y-2">
              <h2 className="text-sm font-bold text-slate-900">Delete Account</h2>
              <p className="text-xs text-slate-600">
                Permanently remove your PetLove profile, saved addresses, and active sessions.
              </p>
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="mt-2 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer"
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD VACCINE RECORD MODAL (FAST VAXINE FILE UPLOADER) */}
      {vaxModalOpen && detailPet && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white border-t sm:border border-slate-200 rounded-t-2xl sm:rounded-xl w-full max-w-lg shadow-2xl max-h-[92dvh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Syringe className="w-4 h-4 text-teal-600" strokeWidth={2} />
                <h3 className="text-base font-bold text-slate-900">
                  Add Vaccine Record for {detailPet.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVaxModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSaveVaccineRecord} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Quick Vaccine Presets */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-700">Quick Select Vaccine</p>
                <div className="flex flex-wrap gap-1.5">
                  {VACCINE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setVaxName(preset.name);
                        setVaxNextDue(addMonthsToDate(vaxDateGiven, preset.monthsAhead));
                      }}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border cursor-pointer ${
                        vaxName === preset.name
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-[#F9F9F9] text-slate-700 border-slate-200 hover:border-teal-400'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vaccine Name
                  </label>
                  <input
                    type="text"
                    value={vaxName}
                    onChange={(e) => setVaxName(e.target.value)}
                    placeholder="e.g., FVRCP (Cat Flu) or Anti-Rabies"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vet Clinic / Doctor Name
                  </label>
                  <input
                    type="text"
                    value={vaxClinic}
                    onChange={(e) => setVaxClinic(e.target.value)}
                    placeholder="e.g., Care & Cure Vet Clinic, Dhanmondi"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date Given
                  </label>
                  <input
                    type="date"
                    value={vaxDateGiven}
                    onChange={(e) => {
                      const val = e.target.value;
                      setVaxDateGiven(val);
                      setVaxNextDue(
                        addMonthsToDate(
                          val,
                          vaxName.toLowerCase().includes('deworm') ? 3 : 12
                        )
                      );
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Next Due Date
                  </label>
                  <input
                    type="date"
                    value={vaxNextDue}
                    onChange={(e) => setVaxNextDue(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dose Details / Batch / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={vaxDetails}
                    onChange={(e) => setVaxDetails(e.target.value)}
                    placeholder="e.g., Annual core booster, sticker batch #FV-2026, no side effects."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg resize-none"
                  />
                </div>
              </div>

              {/* Multi-Image Certificate Uploader */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Upload Vaccine Card / Certificate Images
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setVaxImages((prev) => [
                        ...prev,
                        detailPet.species === 'dog' ? IMAGES.goldenDog : IMAGES.persianCat,
                      ])
                    }
                    className="text-[11px] font-semibold text-teal-700 hover:underline cursor-pointer"
                  >
                    + Attach sample photo
                  </button>
                </div>

                <label className="flex flex-col items-center justify-center gap-1.5 p-4 border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl bg-[#F9F9F9] cursor-pointer transition-colors">
                  <ImagePlus className="w-5 h-5 text-teal-600" strokeWidth={2} />
                  <span className="text-xs font-semibold text-slate-700">
                    Choose images from device (JPG, PNG)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Upload vet booklet pages, stickers, or prescriptions
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleVaxImageUpload}
                    className="hidden"
                  />
                </label>

                {vaxImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {vaxImages.map((img, i) => (
                      <div
                        key={i}
                        className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200"
                      >
                        <img
                          src={img}
                          alt={`Upload ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setVaxImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-slate-900/75 text-white rounded-full cursor-pointer"
                        >
                          <X className="w-3 h-3" strokeWidth={2.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Automatic Next Vaccine Reminder Toggle */}
              <label className="flex items-start gap-2.5 p-3.5 rounded-xl bg-teal-50 border border-teal-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vaxAutoReminder}
                  onChange={(e) => setVaxAutoReminder(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-teal-600"
                />
                <div className="text-xs">
                  <span className="font-bold text-teal-950 block">
                    Automatically set reminder for next vaccine ({vaxNextDue})
                  </span>
                  <span className="text-teal-800">
                    We&apos;ll alert you in Notifications before the next booster is due.
                  </span>
                </div>
              </label>

              <button
                type="submit"
                className="w-full py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                <span>Save Vaccine File &amp; Reminder</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* IMAGE LIGHTBOX FOR VACCINE CERTIFICATES */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl"
          >
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
              <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {lightboxImage.title}
              </p>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
            <div className="bg-slate-100 max-h-[75vh] flex items-center justify-center">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                referrerPolicy="no-referrer"
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Address Modal */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add Dhaka Delivery Address</h3>
              <button
                type="button"
                onClick={() => setAddressModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
            <form onSubmit={handleSaveAddress} className="p-6 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Label</label>
                  <input
                    type="text"
                    value={addrLabel}
                    onChange={(e) => setAddrLabel(e.target.value)}
                    placeholder="Home / Office"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dhaka Area
                  </label>
                  <select
                    value={addrArea}
                    onChange={(e) => setAddrArea(e.target.value as DhakaArea)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {DHAKA_AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  House &amp; Road
                </label>
                <input
                  type="text"
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
                  placeholder="House 14, Road 6, Banani"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Apt / Floor
                  </label>
                  <input
                    type="text"
                    value={addrApt}
                    onChange={(e) => setAddrApt(e.target.value)}
                    placeholder="Apt 4B"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer"
              >
                Save Address
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Pet Modal */}
      {petModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white border-t sm:border border-slate-200 rounded-t-2xl sm:rounded-xl w-full max-w-lg shadow-xl max-h-[92dvh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PawPrint className="w-4 h-4 text-teal-600" strokeWidth={2} />
                <h3 className="text-base font-bold text-slate-900">
                  {editingPet ? `Edit ${editingPet.name}` : 'Add a Pet Profile'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPetModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
            <form onSubmit={handleSavePet} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Species</label>
                  <select
                    value={pSpecies}
                    onChange={(e) => setPSpecies(e.target.value as Species)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="cat">Cat</option>
                    <option value="dog">Dog</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Breed</label>
                  <input
                    type="text"
                    value={pBreed}
                    onChange={(e) => setPBreed(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={pGender}
                    onChange={(e) => setPGender(e.target.value as 'male' | 'female')}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Age (Months)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={pAgeMonths}
                    onChange={(e) => setPAgeMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    min={0.5}
                    value={pWeightKg}
                    onChange={(e) => setPWeightKg(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Activity Level
                  </label>
                  <select
                    value={pActivity}
                    onChange={(e) => setPActivity(e.target.value as 'low' | 'moderate' | 'high')}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="low">Low (Indoor calm)</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High (Very active)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Microchip / Vet ID
                  </label>
                  <input
                    type="text"
                    value={pMicrochipId}
                    onChange={(e) => setPMicrochipId(e.target.value)}
                    placeholder="e.g., BD-DHK-904821"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                {/* Neutered Status + Date */}
                <div className="col-span-2 p-3 rounded-lg bg-[#F9F9F9] border border-slate-200 space-y-2.5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pNeutered}
                      onChange={(e) => setPNeutered(e.target.checked)}
                      className="w-4 h-4 accent-teal-600"
                    />
                    <span>Spayed / Neutered</span>
                  </label>
                  {pNeutered && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" strokeWidth={2} />
                        <span>Neutered / Spayed Date (Optional)</span>
                      </label>
                      <input
                        type="date"
                        value={pNeuteredDate}
                        onChange={(e) => setPNeuteredDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                      />
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Food Allergies (comma separated)
                  </label>
                  <input
                    type="text"
                    value={pAllergies}
                    onChange={(e) => setPAllergies(e.target.value)}
                    placeholder="e.g., Beef, Dairy"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Medical &amp; Care Notes
                  </label>
                  <textarea
                    rows={2}
                    value={pMedicalNotes}
                    onChange={(e) => setPMedicalNotes(e.target.value)}
                    placeholder="Sensitive stomach, prefers ceramic bowls, shy around strangers..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer"
              >
                {editingPet ? 'Save Pet Changes' : 'Save Pet Profile'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Pet Confirmation Modal */}
      {petToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Delete {petToDelete.name}&apos;s profile?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will permanently remove {petToDelete.name}&apos;s profile and all uploaded vaccine records.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPetToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePet}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete your PetLove account?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This removes your active session, saved addresses, and local cart. You can sign up again anytime.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  deleteAccount();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
