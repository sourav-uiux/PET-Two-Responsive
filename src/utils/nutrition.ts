import { CommunityEvent, MonthlyPackage, PetProfile } from '../types';

export interface NutritionEstimate {
  dailyCaloriesKcal: number;
  dailyDryGrams: number;
  dailyWetPouches: number;
  monthlyDryKg: number;
  monthlyWetPouches: number;
  lifeStageLabel: MonthlyPackage['lifeStage'];
  plainLanguageSummary: string;
}

/**
 * Veterinary RER = 70 * (weightKg ^ 0.75) multiplied by species/life-stage/activity factor.
 */
export function calculatePetNutritionPlan(pet: PetProfile): NutritionEstimate {
  const safeWeight = Math.max(0.5, pet.weightKg);
  const rer = 70 * Math.pow(safeWeight, 0.75);

  let lifeStageLabel: MonthlyPackage['lifeStage'] = 'Adult Indoor';
  let factor = 1.2;

  if (pet.species === 'cat') {
    if (pet.ageMonths < 12) {
      lifeStageLabel = 'Kitten';
      factor = 2.2;
    } else if (pet.ageMonths >= 84) {
      lifeStageLabel = 'Senior';
      factor = 1.1;
    } else {
      lifeStageLabel = 'Adult Indoor';
      factor = pet.neutered ? 1.2 : 1.4;
      if (pet.activityLevel === 'high') factor += 0.15;
      if (pet.activityLevel === 'low') factor -= 0.05;
    }
  } else {
    if (pet.ageMonths < 12) {
      lifeStageLabel = 'Adult Dog';
      factor = 2.0;
    } else {
      lifeStageLabel = 'Adult Dog';
      factor = pet.neutered ? 1.5 : 1.7;
      if (pet.activityLevel === 'high') factor += 0.25;
      if (pet.activityLevel === 'low') factor -= 0.15;
    }
  }

  const dailyCaloriesKcal = Math.round(rer * factor);
  const wetPouchKcal = pet.species === 'cat' ? 58 : 105;
  const dailyWetPouches = pet.species === 'cat' ? 0.5 : 0.35; // ~12-15 pouches/month
  const kcalFromDry = Math.max(80, dailyCaloriesKcal - wetPouchKcal * dailyWetPouches);
  const kcalPerGramDry = pet.species === 'cat' ? 3.75 : 3.65;
  const dailyDryGrams = Math.round(kcalFromDry / kcalPerGramDry);
  const monthlyDryKg = Number(((dailyDryGrams * 30) / 1000).toFixed(1));
  const monthlyWetPouches = Math.round(dailyWetPouches * 30);

  const allergyNote =
    pet.foodAllergies.length > 0
      ? ` Avoiding ${pet.foodAllergies.join(', ')} based on ${pet.name}'s allergy notes.`
      : '';

  const plainLanguageSummary = `${pet.name} (${pet.weightKg} kg, ${
    pet.ageMonths < 12 ? `${pet.ageMonths} months` : `${Math.round(pet.ageMonths / 12)} yrs`
  }) needs about ${dailyCaloriesKcal} kcal/day — roughly ${dailyDryGrams}g of complete kibble daily plus ${monthlyWetPouches} hydrating wet pouches across 30 days (${monthlyDryKg} kg dry total).${allergyNote}`;

  return {
    dailyCaloriesKcal,
    dailyDryGrams,
    dailyWetPouches,
    monthlyDryKg,
    monthlyWetPouches,
    lifeStageLabel,
    plainLanguageSummary,
  };
}

export function getRecommendedPackageForPet(
  pet: PetProfile | undefined,
  packages: MonthlyPackage[]
): MonthlyPackage | undefined {
  if (!pet) return packages[0];
  const estimate = calculatePetNutritionPlan(pet);
  return (
    packages.find((p) => p.species === pet.species && p.lifeStage === estimate.lifeStageLabel && p.active) ||
    packages.find((p) => p.species === pet.species && p.active) ||
    packages[0]
  );
}

export function downloadEventIcs(evt: CommunityEvent): void {
  const start = new Date(evt.dateISO);
  const end = new Date(start.getTime() + 2.5 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PetLove Dhaka//Community Events//EN',
    'BEGIN:VEVENT',
    `UID:${evt.id}@petlove.dhaka`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${evt.title}`,
    `DESCRIPTION:${evt.description.replace(/\n/g, ' ')}`,
    `LOCATION:${evt.venueName}, ${evt.area}, Dhaka`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${evt.id}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
