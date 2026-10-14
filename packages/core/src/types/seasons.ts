/**
 * Kadim Bozkır 4 Mevsim Döngüsü ve Katsayıları
 */
export enum SeasonType {
  SPRING = 'SPRING', // Bahar (Ergenekon - karlar erir, sürüler yavrular)
  SUMMER = 'SUMMER', // Yaz (Yaylak - semirme, akınlar, bol otlak)
  AUTUMN = 'AUTUMN', // Güz (Hazan - hasat toplama, kışlak göçü)
  WINTER = 'WINTER', // Kış (Zemheri - dondurucu soğuk, kışlak sığınağı)
}

export interface SeasonModifiers {
  name: string;
  horseBreedingMultiplier: number;  // At üreme çarpanı
  pastureQualityMultiplier: number; // Otlak kalitesi çarpanı
  consumptionMultiplier: number;    // Yiyecek/İaşe tüketim çarpanı
  frostbiteCasualtyRate: number;    // Kışlakta olmayan obalar için zayiat oranı (0.0 - 1.0)
}

export const SEASON_CONFIG: Record<SeasonType, SeasonModifiers> = {
  [SeasonType.SPRING]: {
    name: 'Bahar',
    horseBreedingMultiplier: 1.15,
    pastureQualityMultiplier: 1.20,
    consumptionMultiplier: 1.00,
    frostbiteCasualtyRate: 0.0,
  },
  [SeasonType.SUMMER]: {
    name: 'Yaz',
    horseBreedingMultiplier: 1.30,
    pastureQualityMultiplier: 1.50,
    consumptionMultiplier: 1.00,
    frostbiteCasualtyRate: 0.0,
  },
  [SeasonType.AUTUMN]: {
    name: 'Güz',
    horseBreedingMultiplier: 1.00,
    pastureQualityMultiplier: 1.00,
    consumptionMultiplier: 1.10,
    frostbiteCasualtyRate: 0.0,
  },
  [SeasonType.WINTER]: {
    name: 'Kış',
    horseBreedingMultiplier: 0.60,
    pastureQualityMultiplier: 0.30,
    consumptionMultiplier: 1.40,
    frostbiteCasualtyRate: 0.15, // Kışlakta olmayan obalara %15 donma zayiatı
  },
};

export const TICKS_PER_SEASON = 1000;
export const SEASONS_ORDER: SeasonType[] = [
  SeasonType.SPRING,
  SeasonType.SUMMER,
  SeasonType.AUTUMN,
  SeasonType.WINTER,
];

export function getSeasonFromTick(tick: number): SeasonType {
  const normalizedTick = Math.max(0, Math.floor(tick));
  const seasonIndex = Math.floor(normalizedTick / TICKS_PER_SEASON) % SEASONS_ORDER.length;
  return SEASONS_ORDER[seasonIndex];
}

export function getNextSeason(current: SeasonType): SeasonType {
  const currentIndex = SEASONS_ORDER.indexOf(current);
  return SEASONS_ORDER[(currentIndex + 1) % SEASONS_ORDER.length];
}
