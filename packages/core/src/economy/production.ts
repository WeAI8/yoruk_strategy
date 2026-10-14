import { ResourceInventory } from '../types/resources.js';
import { SeasonType, SEASON_CONFIG, getSeasonFromTick } from '../types/seasons.js';
import { ArmySquad, ArmyUnit, UNIT_TEMPLATES, UnitType } from '../types/units.js';

export interface CampState {
  id: string;
  name: string;
  ownerId: string;
  population: number;
  tents: number;
  horsesInPasture: number;
  basePastureQuality: number; // Varsayılan 1.0
  isInWinterCamp: boolean;    // Kışlak sığınağında mı?
  isInSummerCamp: boolean;    // Yaylakta mı?
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
  frostbiteCasualties: {
    populationLost: number;
    unitsLost: ArmyUnit[];
  };
  hasFamine: boolean;
  desertedUnits: ArmyUnit[];
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
): { populationLost: number; remainingPopulation: number; lostUnits: ArmyUnit[]; remainingUnits: ArmyUnit[] } {
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

  // Ordu zayiatı: %15 olasılıkla veya doğrudan can kaybı
  for (const unit of units) {
    if (Math.random() < casualtyRate) {
      lostUnits.push(unit);
    } else {
      // Donmadan sağ kurtulanlar %20 can kaybı yaşar
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

  // 1. At Üremesi
  const horseBirths = calculateHorseBreeding(
    camp.horsesInPasture,
    season,
    camp.basePastureQuality
  );

  // 2. Temel Üretimler (Nüfus ve çadır ölçeğinde)
  const baseFoodProduction = (camp.population * 0.08) * modifiers.pastureQualityMultiplier;
  const baseIronProduction = camp.tents * 0.02;
  const baseLeatherProduction = camp.tents * 0.04;
  const baseGoldProduction = camp.population * 0.01;

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
    // Kıtlık: Moral çöküşü ve kaçış (desertion)
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
    frostbiteCasualties: {
      populationLost: frostbiteResult.populationLost,
      unitsLost: frostbiteResult.lostUnits,
    },
    hasFamine,
    desertedUnits,
  };
}
