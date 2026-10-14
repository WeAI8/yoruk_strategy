import { describe, it, expect } from 'vitest';
import {
  SeasonType,
  getSeasonFromTick,
  getNextSeason,
  calculateHorseBreeding,
  calculateFoodConsumption,
  applyWinterFrostbite,
  processEconomyTick,
  upgradeOtagState,
  holdFeastState,
  CampState,
  INITIAL_RESOURCES,
  UnitType,
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

  it('Otağ yükseltme (upgradeOtagState) kaynakları düşmeli, seviye, çadır ve nüfusu artırmalıdır', () => {
    const camp: CampState = {
      id: 'camp_up',
      name: 'Ötüken Otağı',
      ownerId: 'p_up',
      population: 120,
      tents: 15,
      otagLevel: 1,
      conqueredGarrisons: 1,
      horsesInPasture: 40,
      basePastureQuality: 1.0,
      isInWinterCamp: true,
      isInSummerCamp: false,
      resources: { ...INITIAL_RESOURCES, gold: 150, leather: 100, iron: 60 },
      army: { ownerId: 'p_up', squadId: 'sq_up', morale: 90, units: [] },
    };

    const res = upgradeOtagState(camp);
    expect(res.success).toBe(true);
    expect(res.newLevel).toBe(2);
    expect(camp.otagLevel).toBe(2);
    expect(camp.tents).toBe(20);
    expect(camp.population).toBe(160);

    const tickRes = processEconomyTick(camp, 100);
    expect(tickRes.tributeGold).toBe(5);
    expect(tickRes.tributeIron).toBe(4);
    expect(tickRes.tributeFood).toBe(6);
  });

  it('Kurultay Toyu (holdFeastState) yaralı askerleri iyileştirmeli ve morali 100 yapmalıdır', () => {
    const camp: CampState = {
      id: 'camp_feast',
      name: 'Toy Otağı',
      ownerId: 'p_feast',
      population: 120,
      tents: 15,
      horsesInPasture: 40,
      basePastureQuality: 1.0,
      isInWinterCamp: true,
      isInSummerCamp: false,
      resources: { ...INITIAL_RESOURCES, gold: 100, food: 100 },
      army: {
        ownerId: 'p_feast',
        squadId: 'sq_feast',
        morale: 65,
        units: [
          {
            id: 'u_wounded',
            type: UnitType.ALP,
            currentHp: 35,
            maxHp: 100,
            attack: 48,
            armor: 28,
            range: 1,
            speed: 7,
            experience: 20,
          },
        ],
      },
    };

    const feast = holdFeastState(camp);
    expect(feast.success).toBe(true);
    expect(feast.healedUnits).toBe(1);
    expect(camp.army.units[0].currentHp).toBe(100);
    expect(camp.army.morale).toBe(100);
  });
});
