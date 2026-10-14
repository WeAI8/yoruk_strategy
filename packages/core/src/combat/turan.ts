import { ArmySquad, ArmyUnit, UnitType, UNIT_TEMPLATES } from '../types/units.js';

export enum CombatTacticPhase {
  DIRECT_ENGAGEMENT = 'DIRECT_ENGAGEMENT', // Doğrudan Göğüs Göğüse Muharebe
  FEIGNED_RETREAT = 'FEIGNED_RETREAT',     // Sahte Ricat (Geri çekilme oyunu)
  CRESCENT_AMBUSH = 'CRESCENT_AMBUSH',     // Hilal Kapanı (2.5x Turan Çarpanı)
}

export interface AttackResult {
  attackerId: string;
  defenderId: string;
  attackerType: UnitType;
  defenderType: UnitType;
  rawAttack: number;
  armorMitigation: number;
  damageMultiplier: number;
  finalDamage: number;
  defenderHpRemaining: number;
  defenderKilled: boolean;
}

export interface BattleRoundReport {
  round: number;
  phase: CombatTacticPhase;
  attacks: AttackResult[];
  sideAMorale: number;
  sideBMorale: number;
  sideACasualties: number;
  sideBCasualties: number;
}

export interface BattleSimulationResult {
  winner: 'SIDE_A' | 'SIDE_B' | 'DRAW';
  rounds: BattleRoundReport[];
  totalCasualtiesA: number;
  totalCasualtiesB: number;
  turanTacticExecuted: boolean;
}

export const TURAN_AMBUSH_DAMAGE_MULTIPLIER = 2.5;

/**
 * Tek bir birimin diğerine vurduğu hasarı hesaplar
 * Hasar = max(1, attack * multiplier - defender.armor * 0.5)
 */
export function calculateDamage(
  attacker: ArmyUnit,
  defender: ArmyUnit,
  multiplier: number = 1.0
): number {
  const baseAttack = attacker.attack;
  const effectiveAttack = baseAttack * multiplier;
  const armorMitigation = defender.armor * 0.5;
  const netDamage = Math.max(1, Math.round(effectiveAttack - armorMitigation));
  return netDamage;
}

/**
 * Turan taktiğini devreye sokar
 */
export function executeTuranTactic(
  yorukSquad: ArmySquad,
  enemySquad: ArmySquad,
  round: number
): { phase: CombatTacticPhase; multiplier: number } {
  // Eğer Türk mangasında Akıncı veya Alp varsa ve taktik başlatılmışsa
  const hasCavalry = yorukSquad.units.some(
    (u) => u.type === UnitType.AKINCI || u.type === UnitType.ALP
  );

  if (hasCavalry && round === 2) {
    yorukSquad.isFeigningRetreat = true;
    return { phase: CombatTacticPhase.FEIGNED_RETREAT, multiplier: 0.8 };
  }

  if (yorukSquad.isFeigningRetreat && round >= 3) {
    // Hilal Kapanı kapanır!
    yorukSquad.isFeigningRetreat = false;
    // Düşmanın morali çöker
    enemySquad.morale = Math.max(0, enemySquad.morale - 40);
    return {
      phase: CombatTacticPhase.CRESCENT_AMBUSH,
      multiplier: TURAN_AMBUSH_DAMAGE_MULTIPLIER, // 2.5x hasar çarpanı!
    };
  }

  return { phase: CombatTacticPhase.DIRECT_ENGAGEMENT, multiplier: 1.0 };
}

/**
 * İki ordu arasında deterministik muharebe simülasyonu
 */
export function simulateBattle(
  squadA: ArmySquad,
  squadB: ArmySquad,
  useTuranTactic: boolean = false
): BattleSimulationResult {
  const rounds: BattleRoundReport[] = [];
  let currentRound = 1;
  const maxRounds = 20;
  let turanExecuted = false;

  // Alpagut aurası: Mangada Alpagut varsa moral +15
  if (squadA.units.some((u) => u.type === UnitType.ALPAGUT)) {
    squadA.morale = Math.min(100, squadA.morale + 15);
  }
  if (squadB.units.some((u) => u.type === UnitType.ALPAGUT)) {
    squadB.morale = Math.min(100, squadB.morale + 15);
  }

  while (
    squadA.units.length > 0 &&
    squadB.units.length > 0 &&
    squadA.morale > 10 &&
    squadB.morale > 10 &&
    currentRound <= maxRounds
  ) {
    let phase = CombatTacticPhase.DIRECT_ENGAGEMENT;
    let multiplierA = 1.0;

    if (useTuranTactic) {
      const tacticState = executeTuranTactic(squadA, squadB, currentRound);
      phase = tacticState.phase;
      multiplierA = tacticState.multiplier;
      if (phase === CombatTacticPhase.CRESCENT_AMBUSH) {
        turanExecuted = true;
      }
    }

    const attacks: AttackResult[] = [];
    let casualtiesAThisRound = 0;
    let casualtiesBThisRound = 0;

    // Squad A -> Squad B Saldırıları
    for (const attacker of squadA.units) {
      if (squadB.units.length === 0) break;
      const target = squadB.units[0]; // Ön hat hedefi
      const damage = calculateDamage(attacker, target, multiplierA);
      target.currentHp -= damage;

      const killed = target.currentHp <= 0;
      attacks.push({
        attackerId: attacker.id,
        defenderId: target.id,
        attackerType: attacker.type,
        defenderType: target.type,
        rawAttack: attacker.attack,
        armorMitigation: target.armor * 0.5,
        damageMultiplier: multiplierA,
        finalDamage: damage,
        defenderHpRemaining: Math.max(0, target.currentHp),
        defenderKilled: killed,
      });

      if (killed) {
        squadB.units.shift();
        casualtiesBThisRound++;
        squadB.morale = Math.max(0, squadB.morale - 5);
      }
    }

    // Squad B -> Squad A Karşı Saldırıları (Eğer sahte ricat fazındaysa Squad B Squad A'ya daha az hasar verir)
    const multiplierB = phase === CombatTacticPhase.FEIGNED_RETREAT ? 0.7 : 1.0;

    for (const attacker of squadB.units) {
      if (squadA.units.length === 0) break;
      const target = squadA.units[0];
      const damage = calculateDamage(attacker, target, multiplierB);
      target.currentHp -= damage;

      const killed = target.currentHp <= 0;
      attacks.push({
        attackerId: attacker.id,
        defenderId: target.id,
        attackerType: attacker.type,
        defenderType: target.type,
        rawAttack: attacker.attack,
        armorMitigation: target.armor * 0.5,
        damageMultiplier: multiplierB,
        finalDamage: damage,
        defenderHpRemaining: Math.max(0, target.currentHp),
        defenderKilled: killed,
      });

      if (killed) {
        squadA.units.shift();
        casualtiesAThisRound++;
        squadA.morale = Math.max(0, squadA.morale - 5);
      }
    }

    rounds.push({
      round: currentRound,
      phase,
      attacks,
      sideAMorale: squadA.morale,
      sideBMorale: squadB.morale,
      sideACasualties: casualtiesAThisRound,
      sideBCasualties: casualtiesBThisRound,
    });

    currentRound++;
  }

  let winner: 'SIDE_A' | 'SIDE_B' | 'DRAW' = 'DRAW';
  if (squadA.units.length > 0 && (squadB.units.length === 0 || squadB.morale <= 10)) {
    winner = 'SIDE_A';
  } else if (squadB.units.length > 0 && (squadA.units.length === 0 || squadA.morale <= 10)) {
    winner = 'SIDE_B';
  }

  const totalCasualtiesA = rounds.reduce((sum, r) => sum + r.sideACasualties, 0);
  const totalCasualtiesB = rounds.reduce((sum, r) => sum + r.sideBCasualties, 0);

  return {
    winner,
    rounds,
    totalCasualtiesA,
    totalCasualtiesB,
    turanTacticExecuted: turanExecuted,
  };
}
