import { describe, it, expect } from 'vitest';
import {
  UnitType,
  UNIT_TEMPLATES,
  ArmyUnit,
  ArmySquad,
  calculateDamage,
  executeTuranTactic,
  simulateBattle,
  CombatTacticPhase,
  TURAN_AMBUSH_DAMAGE_MULTIPLIER,
} from '../src/index.js';

describe('Savaş & Turan Taktiği Motoru Birim Testleri', () => {
  it('4 Temel Birliğin istatistikleri GDD şartnamesine birebir uymalıdır', () => {
    const akinci = UNIT_TEMPLATES[UnitType.AKINCI];
    expect(akinci.hp).toBe(60);
    expect(akinci.attack).toBe(35);
    expect(akinci.armor).toBe(12);
    expect(akinci.range).toBe(4);
    expect(akinci.speed).toBe(8);

    const alp = UNIT_TEMPLATES[UnitType.ALP];
    expect(alp.hp).toBe(100);
    expect(alp.attack).toBe(48);
    expect(alp.armor).toBe(28);
    expect(alp.range).toBe(1);
    expect(alp.speed).toBe(7);

    const ceri = UNIT_TEMPLATES[UnitType.CERI];
    expect(ceri.hp).toBe(80);
    expect(ceri.attack).toBe(25);
    expect(ceri.armor).toBe(20);
    expect(ceri.range).toBe(1);
    expect(ceri.speed).toBe(4);

    const alpagut = UNIT_TEMPLATES[UnitType.ALPAGUT];
    expect(alpagut.hp).toBe(140);
    expect(alpagut.attack).toBe(55);
    expect(alpagut.armor).toBe(40);
    expect(alpagut.range).toBe(1);
    expect(alpagut.speed).toBe(6);
  });

  it('Hasar formülü zırh hafifletmesini ve çarpanları doğru hesaplamalıdır', () => {
    const attacker: ArmyUnit = {
      id: 'a1',
      type: UnitType.AKINCI,
      currentHp: 60,
      maxHp: 60,
      attack: 35,
      armor: 12,
      range: 4,
      speed: 8,
      experience: 0,
    };

    const defender: ArmyUnit = {
      id: 'd1',
      type: UnitType.CERI,
      currentHp: 80,
      maxHp: 80,
      attack: 25,
      armor: 20, // 20 * 0.5 = 10 zırh savunması
      range: 1,
      speed: 4,
      experience: 0,
    };

    // Normal hasar: 35 - 10 = 25
    const normalDamage = calculateDamage(attacker, defender, 1.0);
    expect(normalDamage).toBe(25);

    // Turan Hilal Kapanı Hasarı: 35 * 2.5 - 10 = 87.5 - 10 = 78 (round 78)
    const ambushDamage = calculateDamage(attacker, defender, TURAN_AMBUSH_DAMAGE_MULTIPLIER);
    expect(ambushDamage).toBe(78);
  });

  it('Turan Taktiği 2. rauntta sahte ricat, 3. rauntta 2.5x hilal pususu tetiklemelidir', () => {
    const squadA: ArmySquad = {
      ownerId: 'p1',
      squadId: 'sq1',
      morale: 100,
      units: [
        {
          id: 'u1',
          type: UnitType.AKINCI,
          currentHp: 60,
          maxHp: 60,
          attack: 35,
          armor: 12,
          range: 4,
          speed: 8,
          experience: 0,
        },
      ],
    };

    const squadB: ArmySquad = {
      ownerId: 'enemy',
      squadId: 'sq2',
      morale: 100,
      units: [
        {
          id: 'e1',
          type: UnitType.CERI,
          currentHp: 80,
          maxHp: 80,
          attack: 25,
          armor: 20,
          range: 1,
          speed: 4,
          experience: 0,
        },
      ],
    };

    // Raunt 1: Doğrudan temas
    const r1 = executeTuranTactic(squadA, squadB, 1);
    expect(r1.phase).toBe(CombatTacticPhase.DIRECT_ENGAGEMENT);
    expect(r1.multiplier).toBe(1.0);

    // Raunt 2: Sahte Ricat
    const r2 = executeTuranTactic(squadA, squadB, 2);
    expect(r2.phase).toBe(CombatTacticPhase.FEIGNED_RETREAT);
    expect(squadA.isFeigningRetreat).toBe(true);

    // Raunt 3: Hilal Kapanı & 2.5x Hasar!
    const r3 = executeTuranTactic(squadA, squadB, 3);
    expect(r3.phase).toBe(CombatTacticPhase.CRESCENT_AMBUSH);
    expect(r3.multiplier).toBe(2.5);
    // Düşmanın morali 40 puan düşer
    expect(squadB.morale).toBe(60);
  });

  it('Alpagut birliği manga moralini otomatik artırmalıdır', () => {
    const squadWithAlpagut: ArmySquad = {
      ownerId: 'p1',
      squadId: 's1',
      morale: 70,
      units: [
        {
          id: 'g1',
          type: UnitType.ALPAGUT,
          currentHp: 140,
          maxHp: 140,
          attack: 55,
          armor: 40,
          range: 1,
          speed: 6,
          experience: 0,
        },
      ],
    };

    const enemySquad: ArmySquad = {
      ownerId: 'p2',
      squadId: 's2',
      morale: 80,
      units: [
        {
          id: 'c1',
          type: UnitType.CERI,
          currentHp: 80,
          maxHp: 80,
          attack: 25,
          armor: 20,
          range: 1,
          speed: 4,
          experience: 0,
        },
      ],
    };

    simulateBattle(squadWithAlpagut, enemySquad, false);
    // Alpagut aurası ile Squad moral en az 85'e çıkmış olmalı (70 + 15)
    expect(squadWithAlpagut.morale).toBeGreaterThanOrEqual(85);
  });

  it('Turan taktiği uygulayan tecrübeli ordu muharebeyi kazanmalıdır', () => {
    const turkishSquad: ArmySquad = {
      ownerId: 'turk_commander',
      squadId: 't1',
      morale: 100,
      units: [
        {
          id: 'ak1',
          type: UnitType.AKINCI,
          currentHp: 60,
          maxHp: 60,
          attack: 35,
          armor: 12,
          range: 4,
          speed: 8,
          experience: 10,
        },
        {
          id: 'alp1',
          type: UnitType.ALP,
          currentHp: 100,
          maxHp: 100,
          attack: 48,
          armor: 28,
          range: 1,
          speed: 7,
          experience: 10,
        },
      ],
    };

    const enemySquad: ArmySquad = {
      ownerId: 'crusader',
      squadId: 'e1',
      morale: 90,
      units: [
        {
          id: 'en1',
          type: UnitType.CERI,
          currentHp: 80,
          maxHp: 80,
          attack: 25,
          armor: 20,
          range: 1,
          speed: 4,
          experience: 0,
        },
        {
          id: 'en2',
          type: UnitType.CERI,
          currentHp: 80,
          maxHp: 80,
          attack: 25,
          armor: 20,
          range: 1,
          speed: 4,
          experience: 0,
        },
      ],
    };

    const battleResult = simulateBattle(turkishSquad, enemySquad, true);
    expect(battleResult.winner).toBe('SIDE_A');
    expect(battleResult.turanTacticExecuted).toBe(true);
    expect(battleResult.totalCasualtiesB).toBeGreaterThan(0);
  });
});
