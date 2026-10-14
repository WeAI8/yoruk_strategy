import { describe, it, expect } from 'vitest';
import {
  SeasonType,
  SEASON_CONFIG,
  getSeasonFromTick,
  getNextSeason,
  calculateHorseBreeding,
  calculateFoodConsumption,
  applyWinterFrostbite,
  processEconomyTick,
  CampState,
  INITIAL_RESOURCES,
} from '../src/index.js';

describe('Ekonomi & Mevsim Döngüsü Simülasyon Testleri', () => {
  it('Mevsimler tick değerine göre doğru periyotta değişmelidir (1000 tick / mevsim)', () => {
    expect(getSeasonFromTick(0)).toBe(SeasonType.SPRING);
    expect(getSeasonFromTick(500)).toBe(SeasonType.SPRING);
    expect(getSeasonFromTick(1000)).toBe(SeasonType.SUMMER);
    expect(getSeasonFromTick(2000)).toBe(SeasonType.AUTUMN);
    expect(getSeasonFromTick(3000)).toBe(SeasonType.WINTER);
    expect(getSeasonFromTick(4000)).toBe(SeasonType.SPRING); // Döngü başa döner
  });

  it('Mevsim sırası doğru ilerlemelidir', () => {
    expect(getNextSeason(SeasonType.SPRING)).toBe(SeasonType.SUMMER);
    expect(getNextSeason(SeasonType.SUMMER)).toBe(SeasonType.AUTUMN);
    expect(getNextSeason(SeasonType.AUTUMN)).toBe(SeasonType.WINTER);
    expect(getNextSeason(SeasonType.WINTER)).toBe(SeasonType.SPRING);
  });

  it('At üreme çarpanı yazın kışa göre çok daha yüksek olmalıdır', () => {
    const horses = 1000;
    const summerBreeding = calculateHorseBreeding(horses, SeasonType.SUMMER, 1.0);
    const winterBreeding = calculateHorseBreeding(horses, SeasonType.WINTER, 1.0);

    // Yaz: 1.30 * 1.50 = 1.95 çarpan
    // Kış: 0.60 * 0.30 = 0.18 çarpan
    expect(summerBreeding).toBeGreaterThan(winterBreeding);
    expect(summerBreeding).toBe(9); // 1000 * 0.005 * 1.30 * 1.50 = 9.75 -> floor 9
    expect(winterBreeding).toBe(0); // 1000 * 0.005 * 0.60 * 0.30 = 0.9 -> floor 0
  });

  it('Kışın yiyecek tüketimi diğer mevsimlere kıyasla 1.40x olmalıdır', () => {
    const population = 100;
    const units = [];
    const springConsumption = calculateFoodConsumption(population, units, SeasonType.SPRING);
    const winterConsumption = calculateFoodConsumption(population, units, SeasonType.WINTER);

    expect(winterConsumption).toBeCloseTo(springConsumption * 1.4, 2);
  });

  it('Kışlakta olmayan oba kışın %15 donma zayiatı almalıdır', () => {
    const population = 100;
    const units = [];
    const withoutWinterCamp = applyWinterFrostbite(population, units, SeasonType.WINTER, false);
    expect(withoutWinterCamp.populationLost).toBe(15);
    expect(withoutWinterCamp.remainingPopulation).toBe(85);

    const withWinterCamp = applyWinterFrostbite(population, units, SeasonType.WINTER, true);
    expect(withWinterCamp.populationLost).toBe(0);
    expect(withWinterCamp.remainingPopulation).toBe(100);
  });

  it('Kıtlık durumunda yiyecek negatife düşmemeli, moral düşmeli ve kaçış riski oluşmalıdır', () => {
    const testCamp: CampState = {
      id: 'camp_01',
      name: 'Kayı Obası',
      ownerId: 'player_01',
      population: 200,
      tents: 20,
      horsesInPasture: 100,
      basePastureQuality: 1.0,
      isInWinterCamp: true,
      isInSummerCamp: false,
      resources: {
        ...INITIAL_RESOURCES,
        food: 0, // Sıfır yiyecek!
      },
      army: {
        ownerId: 'player_01',
        squadId: 'squad_01',
        morale: 80,
        units: [],
      },
    };

    const result = processEconomyTick(testCamp, 3000); // Kış tick'i
    expect(result.hasFamine).toBe(true);
    expect(result.finalResources.food).toBe(0);
    expect(testCamp.army.morale).toBeLessThan(80);
  });
});
