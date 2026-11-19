import React, { useState } from 'react';
import {
  CheckCircle2,
  Mail,
  MapPin,
  PawPrint,
  Phone,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DHAKA_AREAS, IMAGES } from '../data/seedData';
import { DhakaArea, Species } from '../types';

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, pendingActionLabel, completeAuth, signInDemoUser } = useApp();

  const [step, setStep] = useState<'method' | 'otp' | 'onboarding' | 'pet'>('method');
  const [authMethod, setAuthMethod] = useState<'phone' | 'email' | 'google'>('phone');
  const [phone, setPhone] = useState('+880 1712-');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('482910');
  const [name, setName] = useState('');
  const [area, setArea] = useState<DhakaArea>('Dhanmondi');
  const [ageConfirmed, setAgeConfirmed] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [error, setError] = useState('');

  // Optional First Pet fields (Flow 1 Step 5)
  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState<Species>('cat');
  const [petBreed, setPetBreed] = useState('Deshi Shorthair');
  const [petAgeMonths, setPetAgeMonths] = useState(14);
  const [petWeightKg, setPetWeightKg] = useState(3.6);

  if (!authModalOpen) return null;

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (authMethod === 'phone' && phone.trim().length < 10) {
      setError('Please enter a valid Bangladesh mobile number (+880 1XXX-XXXXXX).');
      return;
    }
    if (authMethod === 'email' && !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setStep('otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 4) {
      setError('Enter the 6-digit verification code (demo: 482910).');
      return;
    }
    setError('');
    setStep('onboarding');
  };

  const handleOnboardingNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!ageConfirmed || !termsAccepted) {
      setError('You must confirm you are 18+ and accept PetLove Terms, Privacy, Refund & Foster policies.');
      return;
    }
    setError('');
    setStep('pet');
  };

  const handleFinish = (skipPet: boolean) => {
    const cleanPhone = authMethod === 'phone' ? phone.trim() : '+880 1711-000123';
    const cleanEmail = authMethod === 'email' ? email.trim() : `${name.toLowerCase().replace(/\s+/g, '.')}@dhakamail.com`;

    completeAuth(
      {
        name: name.trim() || 'Dhaka Pet Parent',
        phone: cleanPhone,
        email: cleanEmail,
        authMethod,
        verified: true,
        ageConfirmed: true,
        termsAccepted: true,
        area,
        avatarUrl: petSpecies === 'dog' ? IMAGES.goldenDog : IMAGES.persianCat,
        addresses: [
          {
            id: `addr_${Date.now()}`,
            label: `Home (${area})`,
            area,
            street: `Road 12, ${area}`,
            apartment: 'Apt 4A',
            phone: cleanPhone,
            isDefault: true,
          },
        ],
      },
      !skipPet && petName.trim()
        ? {
            name: petName.trim(),
            species: petSpecies,
            breed: petBreed.trim() || (petSpecies === 'cat' ? 'Domestic Shorthair' : 'Mixed Breed'),
            ageMonths: Number(petAgeMonths) || 12,
            gender: 'female',
            weightKg: Number(petWeightKg) || 3.5,
            activityLevel: 'moderate',
            neutered: true,
            foodAllergies: [],
            vaccineStatus: 'up_to_date',
            vaccineDetails: 'Verified during onboarding',
            photos: [petSpecies === 'dog' ? IMAGES.goldenDog : IMAGES.tabbyCat],
          }
        : undefined
    );
    setStep('method');
  };

  const detectDhakaLocation = () => {
    setArea('Gulshan');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white border-t sm:border border-slate-200 rounded-t-2xl sm:rounded-xl w-full max-w-md shadow-xl overflow-hidden max-h-[92dvh] overflow-y-auto sm:my-auto pb-[env(safe-area-inset-bottom)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {step === 'method' && 'Sign Up or Log In to PetLove'}
              {step === 'otp' && 'Verify Your Code'}
              {step === 'onboarding' && 'Your Dhaka Profile & Policies'}
              {step === 'pet' && 'Add Your First Pet (Optional)'}
            </h2>
            {pendingActionLabel && (
              <p className="text-xs text-teal-700 font-medium mt-0.5">
                Continue to: {pendingActionLabel}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setAuthModalOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            aria-label="Close sign in dialog"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          {step === 'method' && (
            <div className="space-y-4">
              {/* Quick Demo Account Login */}
              <div className="p-3.5 rounded-lg bg-[#F9F9F9] border border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-900">Quick Demo Account</p>
                  <p className="text-xs text-slate-500">Nafisa Rahman · Dhanmondi · 105 Treats</p>
                </div>
                <button
                  type="button"
                  onClick={signInDemoUser}
                  className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Use Demo
                </button>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setAuthMethod('phone')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    authMethod === 'phone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Phone + SMS
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('email')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    authMethod === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Email Code
                </button>
              </div>

              <form onSubmit={handleSendCode} className="space-y-4">
                {authMethod === 'phone' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Bangladesh Mobile Number (Primary Path)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={2} />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+880 17XX-XXXXXX"
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:border-teal-600 bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={2} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:border-teal-600 bg-white"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer"
                >
                  Send Verification Code
                </button>
              </form>

              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-slate-200" />
                <span className="mx-3 text-xs text-slate-400">or</span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <button
                type="button"
                onClick={() => {
                  setAuthMethod('google');
                  setName('Tasnim Akter');
                  setEmail('tasnim.akter@gmail.com');
                  setStep('onboarding');
                }}
                className="w-full py-2.5 px-4 text-sm font-semibold text-slate-800 bg-white hover:bg-[#F9F9F9] border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                Continue with Google
              </button>
            </div>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-slate-600">
                We sent a 6-digit verification code to{' '}
                <span className="font-semibold text-slate-900">
                  {authMethod === 'phone' ? phone : email}
                </span>
                . (Demo code pre-filled: <span className="font-mono font-semibold">482910</span>)
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  SMS / Email Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-2.5 text-center text-lg font-mono tracking-widest border border-slate-300 rounded-lg focus:border-teal-600"
                  maxLength={6}
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('method')}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer"
                >
                  Verify &amp; Continue
                </button>
              </div>
            </form>
          )}

          {step === 'onboarding' && (
            <form onSubmit={handleOnboardingNext} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Samira Kabir"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:border-teal-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Area in Dhaka (Sets delivery zone, nearby events &amp; Safe Houses)
                  </label>
                  <button
                    type="button"
                    onClick={detectDhakaLocation}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
                  >
                    <MapPin className="w-3 h-3" strokeWidth={2} />
                    <span>Auto-detect</span>
                  </button>
                </div>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value as DhakaArea)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:border-teal-600"
                >
                  {DHAKA_AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}, Dhaka
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3.5 rounded-lg bg-[#F9F9F9] border border-slate-200 space-y-2.5">
                <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ageConfirmed}
                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                    className="mt-0.5 accent-teal-600"
                  />
                  <span>I confirm I am 18 years or older (required for shop checkout and foster stays).</span>
                </label>
                <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 accent-teal-600"
                  />
                  <span>
                    I accept PetLove&apos;s Terms of Service, Privacy Policy, Refund Policy, and Safe House Foster Policy.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer"
              >
                Continue to Pet Profile
              </button>
            </form>
          )}

          {step === 'pet' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Adding your pet builds their 30-day calorie nutrition plan immediately. You can skip and add them later.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {(['cat', 'dog'] as Species[]).map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => setPetSpecies(sp)}
                    className={`py-2.5 px-3 rounded-lg border text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                      petSpecies === sp
                        ? 'border-teal-600 bg-teal-50 text-teal-800'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <PawPrint className="w-4 h-4" strokeWidth={2} />
                    <span>{sp === 'cat' ? 'Cat' : 'Dog'}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pet Name</label>
                  <input
                    type="text"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder="e.g., Coco or Simba"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Breed</label>
                  <input
                    type="text"
                    value={petBreed}
                    onChange={(e) => setPetBreed(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age (Months)</label>
                  <input
                    type="number"
                    min={1}
                    value={petAgeMonths}
                    onChange={(e) => setPetAgeMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step={0.1}
                    min={0.5}
                    value={petWeightKg}
                    onChange={(e) => setPetWeightKg(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg tabular-nums"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleFinish(true)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  onClick={() => handleFinish(false)}
                  className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                  <span>Complete Sign Up</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" strokeWidth={2} />
            <span>Verified accounts keep PetLove Dhaka&apos;s Safe House network and shop trusted.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
