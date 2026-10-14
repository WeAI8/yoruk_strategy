import { ResourceInventory } from '../types/resources.js';
import { SeasonType, SEASON_CONFIG, getSeasonFromTick } from '../types/seasons.js';
import { ArmySquad, ArmyUnit, UNIT_TEMPLATES } from '../types/units.js';

export interface CampState {
  id: string;
  name: string;
  ownerId: string;
  population: number;
  tents: number;
  otagLevel?: number;          // Otağ Seviyesi (1 - 5)
  conqueredGarrisons?: number; // Fethedilen garnizon sayısı (0 - 3)
  horsesInPasture: number;
  basePastureQuality: number;  // Varsayılan 1.0
  isInWinterCamp: boolean;     // Kışlak sığınağında mı?
  isInSummerCamp: boolean;     // Yaylakta mı?
  resources: ResourceInventory;
  army: ArmySquad;
}

export interface EconomyTickResult {
  tick: number;
  season: SeasonType;
  resourceDelta: ResourceInventory;
  finalResources: ResourceInventory;
  horseBirths: number;
  foodConsumed: number;
  tributeGold?: number;
  tributeIron?: number;
  tributeFood?: number;
  frostbiteCasualties: {
    populationLost: number;
    unitsLost: ArmyUnit[];
  };
  hasFamine: boolean;
  desertedUnits: ArmyUnit[];
}

export const MAX_OTAG_LEVEL = 5;
export const FEAST_TOY_COST = {
  gold: 30,
  food: 25,
};

/**
 * Otağ yükseltme maliyetini hesaplar (50 Altın, 30 Keçe, 20 Demir * Seviye)
 */
export function getOtagUpgradeCost(currentLevel: number = 1): {
  gold: number;
  leather: number;
  iron: number;
} {
  const lvl = Math.max(1, Math.floor(currentLevel));
  return {
    gold: 50 * lvl,
    leather: 30 * lvl,
    iron: 20 * lvl,
  };
}

/**
 * Otağ seviyesini yükseltir (+5 Çadır, +40 Oba Nüfusu, +0.25 Otlak Kalitesi)
 */
export function upgradeOtagState(camp: CampState): {
  success: boolean;
  newLevel: number;
  reason?: string;
} {
  const currentLevel = camp.otagLevel ?? 1;
  if (currentLevel >= MAX_OTAG_LEVEL) {
    return {
      success: false,
      newLevel: currentLevel,
      reason: `Otağ zaten azami seviyede (Sv. ${MAX_OTAG_LEVEL}).`,
    };
  }

  const cost = getOtagUpgradeCost(currentLevel);
  if (
    camp.resources.gold < cost.gold ||
    camp.resources.leather < cost.leather ||
    camp.resources.iron < cost.iron
  ) {
    return {
      success: false,
      newLevel: currentLevel,
      reason: `Otağ yükseltmek için ${cost.gold} Altın, ${cost.leather} Keçe ve ${cost.iron} Demir gerekli!`,
    };
  }

  camp.resources.gold = Number((camp.resources.gold - cost.gold).toFixed(2));
  camp.resources.leather = Number((camp.resources.leather - cost.leather).toFixed(2));
  camp.resources.iron = Number((camp.resources.iron - cost.iron).toFixed(2));

  camp.otagLevel = currentLevel + 1;
  camp.tents += 5;
  camp.population += 40;
  camp.basePastureQuality = Number((camp.basePastureQuality + 0.25).toFixed(2));

  return {
    success: true,
    newLevel: camp.otagLevel,
  };
}

/**
 * Kurultay Toyu / Şölen düzenler: Yaralı birliklerin canını %100 doldurur ve morali 100 yapar
 */
export function holdFeastState(camp: CampState): {
  success: boolean;
  healedUnits: number;
  moraleRestored: number;
  reason?: string;
} {
  if (
    camp.resources.gold < FEAST_TOY_COST.gold ||
    camp.resources.food < FEAST_TOY_COST.food
  ) {
    return {
      success: false,
      healedUnits: 0,
      moraleRestored: 0,
      reason: `Toy düzenlemek için ${FEAST_TOY_COST.gold} Altın ve ${FEAST_TOY_COST.food} Aş gerekli!`,
    };
  }

  camp.resources.gold = Number((camp.resources.gold - FEAST_TOY_COST.gold).toFixed(2));
  camp.resources.food = Number((camp.resources.food - FEAST_TOY_COST.food).toFixed(2));

  let healedCount = 0;
  for (const unit of camp.army.units) {
    if (unit.currentHp < unit.maxHp) {
      unit.currentHp = unit.maxHp;
      healedCount++;
    }
  }

  const moraleGain = Math.max(0, 100 - camp.army.morale);
  camp.army.morale = 100;

  return {
    success: true,
    healedUnits: healedCount,
    moraleRestored: moraleGain,
  };
}

/**
 * At üreme artışını hesaplar
 * R_at = N_at * BASE_BREED_RATE * season.horseBreedingMultiplier * (pastureBonus * season.pastureQualityMultiplier)
 */
export const BASE_HORSE_BREED_RATE = 0.005; // Tick bazlı doğal üreme oranı

export function calculateHorseBreeding(
  horsesCount: number,
  season: SeasonType,
  basePastureQuality: number = 1.0
): number {
  if (horsesCount <= 0) return 0;
  const modifiers = SEASON_CONFIG[season];
  const effectivePasture = basePastureQuality * modifiers.pastureQualityMultiplier;
  const netRate = BASE_HORSE_BREED_RATE * modifiers.horseBreedingMultiplier * effectivePasture;
  return Math.floor(horsesCount * netRate);
}

/**
 * Nüfus ve ordu için yiyecek tüketimini hesaplar
 */
export const BASE_POPULATION_FOOD_UPKEEP = 0.05;

export function calculateFoodConsumption(
  population: number,
  units: ArmyUnit[],
  season: SeasonType
): number {
  const modifiers = SEASON_CONFIG[season];
  const popFood = population * BASE_POPULATION_FOOD_UPKEEP;
  const armyFood = units.reduce((total, unit) => {
    const template = UNIT_TEMPLATES[unit.type];
    return total + (template ? template.foodUpkeep : 0.1);
  }, 0);

  return (popFood + armyFood) * modifiers.consumptionMultiplier;
}

/**
 * Kışın kışlakta olmayan obalara %15 donma zayiatı uygular
 */
export function applyWinterFrostbite(
  population: number,
  units: ArmyUnit[],
  season: SeasonType,
  isInWinterCamp: boolean
): {
  populationLost: number;
  remainingPopulation: number;
  lostUnits: ArmyUnit[];
  remainingUnits: ArmyUnit[];
} {
  if (season !== SeasonType.WINTER || isInWinterCamp) {
    return {
      populationLost: 0,
      remainingPopulation: population,
      lostUnits: [],
      remainingUnits: [...units],
    };
  }

  const casualtyRate = SEASON_CONFIG[SeasonType.WINTER].frostbiteCasualtyRate; // 0.15
  const populationLost = Math.floor(population * casualtyRate);
  const remainingPopulation = Math.max(0, population - populationLost);

  const lostUnits: ArmyUnit[] = [];
  const remainingUnits: ArmyUnit[] = [];

  for (const unit of units) {
    if (Math.random() < casualtyRate) {
      lostUnits.push(unit);
    } else {
      const damagedHp = Math.max(1, Math.floor(unit.currentHp * 0.8));
      remainingUnits.push({ ...unit, currentHp: damagedHp });
    }
  }

  return {
    populationLost,
    remainingPopulation,
    lostUnits,
    remainingUnits,
  };
}

/**
 * Tek bir ekonomi tick'ini işletir
 */
export function processEconomyTick(camp: CampState, currentTick: number): EconomyTickResult {
  const season = getSeasonFromTick(currentTick);
  const modifiers = SEASON_CONFIG[season];

  const otagLevel = Math.max(1, camp.otagLevel ?? 1);
  const otagProductionMultiplier = 1 + (otagLevel - 1) * 0.15;
  const conqueredCount = Math.max(0, camp.conqueredGarrisons ?? 0);

  // Fethedilen her garnizon için Haraç Bonus Üretimi (+5 Altın, +4 Demir, +6 Erzak)
  const tributeGold = conqueredCount * 5;
  const tributeIron = conqueredCount * 4;
  const tributeFood = conqueredCount * 6;

  // 1. At Üremesi (Yaylakta ise +25% otlak kalitesi)
  const pastureQuality = camp.isInSummerCamp
    ? camp.basePastureQuality * 1.25
    : camp.basePastureQuality;
  const horseBirths = calculateHorseBreeding(camp.horsesInPasture, season, pastureQuality);

  // 2. Temel Üretimler (Nüfus, çadır, Otağ seviyesi ve fetih haracı ölçeğinde)
  const baseFoodProduction =
    camp.population * 0.08 * modifiers.pastureQualityMultiplier * otagProductionMultiplier +
    tributeFood;
  const baseIronProduction = camp.tents * 0.02 * otagProductionMultiplier + tributeIron;
  const baseLeatherProduction = camp.tents * 0.04 * otagProductionMultiplier;
  const baseGoldProduction = camp.population * 0.01 * otagProductionMultiplier + tributeGold;

  // 3. Tüketim
  const foodConsumed = calculateFoodConsumption(camp.population, camp.army.units, season);

  // 4. Donma Zayiatı
  const frostbiteResult = applyWinterFrostbite(
    camp.population,
    camp.army.units,
    season,
    camp.isInWinterCamp
  );

  camp.population = frostbiteResult.remainingPopulation;
  camp.army.units = frostbiteResult.remainingUnits;

  // 5. Kaynak Güncellemesi
  const netFoodDelta = baseFoodProduction - foodConsumed;
  let newFood = camp.resources.food + netFoodDelta;
  let hasFamine = false;
  const desertedUnits: ArmyUnit[] = [];

  if (newFood < 0) {
    hasFamine = true;
    newFood = 0;
    camp.army.morale = Math.max(0, camp.army.morale - 15);
    if (camp.army.units.length > 0 && Math.random() < 0.25) {
      const deserted = camp.army.units.pop();
      if (deserted) desertedUnits.push(deserted);
    }
  }

  const resourceDelta: ResourceInventory = {
    horse: horseBirths,
    food: Number(netFoodDelta.toFixed(2)),
    iron: Number(baseIronProduction.toFixed(2)),
    leather: Number(baseLeatherProduction.toFixed(2)),
    gold: Number(baseGoldProduction.toFixed(2)),
  };

  camp.resources.horse += horseBirths;
  camp.horsesInPasture += horseBirths;
  camp.resources.food = Number(newFood.toFixed(2));
  camp.resources.iron = Number((camp.resources.iron + baseIronProduction).toFixed(2));
  camp.resources.leather = Number((camp.resources.leather + baseLeatherProduction).toFixed(2));
  camp.resources.gold = Number((camp.resources.gold + baseGoldProduction).toFixed(2));

  return {
    tick: currentTick,
    season,
    resourceDelta,
    finalResources: { ...camp.resources },
    horseBirths,
    foodConsumed: Number(foodConsumed.toFixed(2)),
    tributeGold,
    tributeIron,
    tributeFood,
    frostbiteCasualties: {
      populationLost: frostbiteResult.populationLost,
      unitsLost: frostbiteResult.lostUnits,
    },
    hasFamine,
    desertedUnits,
  };
}
