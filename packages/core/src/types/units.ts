import { ResourceInventory } from './resources.js';

export enum UnitType {
  AKINCI = 'AKINCI',     // Atlı Okçu (Vur-kaç, Parthian shot)
  ALP = 'ALP',           // Bozkır Kargıcısı (Hücum, zırh delici)
  CERI = 'CERI',         // Piyade Çeri (Oba savunması, tuzak)
  ALPAGUT = 'ALPAGUT',   // Muhafız / Kağan Koruması (Moral aurası)
}

export interface UnitStats {
  type: UnitType;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  armor: number;
  range: number;
  speed: number;
  cost: Partial<ResourceInventory>;
  foodUpkeep: number; // Tick başına yiyecek tüketimi
}

export const UNIT_TEMPLATES: Record<UnitType, UnitStats> = {
  [UnitType.AKINCI]: {
    type: UnitType.AKINCI,
    name: 'Akıncı (Atlı Okçu)',
    hp: 60,
    maxHp: 60,
    attack: 35,
    armor: 12,
    range: 4,
    speed: 8,
    cost: {
      horse: 2,
      food: 10,
      iron: 5,
      leather: 8,
      gold: 5,
    },
    foodUpkeep: 0.15,
  },
  [UnitType.ALP]: {
    type: UnitType.ALP,
    name: 'Alp (Bozkır Kargıcısı)',
    hp: 100,
    maxHp: 100,
    attack: 48,
    armor: 28,
    range: 1,
    speed: 7,
    cost: {
      horse: 1,
      food: 12,
      iron: 15,
      leather: 6,
      gold: 8,
    },
    foodUpkeep: 0.20,
  },
  [UnitType.CERI]: {
    type: UnitType.CERI,
    name: 'Piyade Çeri',
    hp: 80,
    maxHp: 80,
    attack: 25,
    armor: 20,
    range: 1,
    speed: 4,
    cost: {
      food: 8,
      iron: 8,
      leather: 10,
      gold: 3,
    },
    foodUpkeep: 0.10,
  },
  [UnitType.ALPAGUT]: {
    type: UnitType.ALPAGUT,
    name: 'Alpagut (Muhafız)',
    hp: 140,
    maxHp: 140,
    attack: 55,
    armor: 40,
    range: 1,
    speed: 6,
    cost: {
      horse: 2,
      food: 20,
      iron: 25,
      leather: 15,
      gold: 20,
    },
    foodUpkeep: 0.35,
  },
};

export interface ArmyUnit {
  id: string;
  type: UnitType;
  currentHp: number;
  maxHp: number;
  attack: number;
  armor: number;
  range: number;
  speed: number;
  experience: number;
}

export interface ArmySquad {
  ownerId: string;
  squadId: string;
  units: ArmyUnit[];
  morale: number; // 0 - 100
  isFeigningRetreat?: boolean;
}
