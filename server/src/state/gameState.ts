import {
  CampState,
  INITIAL_RESOURCES,
  UnitType,
  UNIT_TEMPLATES,
  ArmySquad,
  ArmyUnit,
  processEconomyTick,
  EconomyTickResult,
  simulateBattle,
  BattleSimulationResult,
  upgradeOtagState,
  holdFeastState,
  getOtagUpgradeCost,
} from '@yorukstrategy/core';

export interface PlayerSession {
  userId: string;
  username: string;
  wsSessionId: string;
  camp: CampState;
  selectedSquadId?: string;
  gridX: number;
  gridY: number;
}

export type TileTerrain = 'STEPPE' | 'SUMMER_PASTURE' | 'WINTER_CAMP' | 'MOUNTAIN' | 'RIVER';

export interface MapTile {
  x: number;
  y: number;
  terrain: TileTerrain;
  campId?: string;
  squadIds: string[];
}

export interface WorldMap {
  width: number;
  height: number;
  tiles: MapTile[][];
}

export interface NpcGarrison {
  id: string;
  name: string;
  gridX: number;
  gridY: number;
  defenseLevel: number;
  army: ArmySquad;
  conqueredBy?: string;
  conqueredByName?: string;
}

export interface TuranBattleExecutionResult extends BattleSimulationResult {
  targetName: string;
  targetX: number;
  targetY: number;
  feignedRetreatSuccess: boolean;
  ambushDamage: number;
  garrisonConquered: boolean;
  conqueredCount: number;
  isGreatKhaganVictory: boolean;
  loot: {
    gold: number;
    horse: number;
    iron: number;
    food: number;
  };
}

export const MAX_MIGRATION_DISTANCE = 14;
export const MAX_ATTACK_DISTANCE = 10;
export const MIGRATION_FOOD_COST = 10;
export const MIGRATION_HORSE_COST = 1;

export class GameStateManager {
  public currentTick: number = 0;
  public players: Map<string, PlayerSession> = new Map();
  public npcCamps: NpcGarrison[] = [];
  public worldMap: WorldMap;
  public lastEconomyResults: Map<string, EconomyTickResult> = new Map();
  public battleLogs: BattleSimulationResult[] = [];
  public lastMoveReason: Map<string, string> = new Map();
  public lastBattleReason: Map<string, string> = new Map();

  constructor(mapWidth: number = 32, mapHeight: number = 32) {
    this.worldMap = this.generateMap(mapWidth, mapHeight);
    this.initNpcGarrisons();
  }

  private generateMap(width: number, height: number): WorldMap {
    const tiles: MapTile[][] = [];
    for (let y = 0; y < height; y++) {
      tiles[y] = [];
      for (let x = 0; x < width; x++) {
        let terrain: TileTerrain = 'STEPPE';
        // Kuzeyde dağlar ve yaylaklar, güneyde kışlak vadileri ve nehirler
        if (y < 4) {
          terrain = 'MOUNTAIN';
        } else if (y >= 4 && y <= 8) {
          terrain = 'SUMMER_PASTURE';
        } else if (y >= height - 6) {
          terrain = 'WINTER_CAMP';
        } else if (x === Math.floor(width / 2)) {
          terrain = 'RIVER';
        }

        tiles[y][x] = {
          x,
          y,
          terrain,
          squadIds: [],
        };
      }
    }
    return { width, height, tiles };
  }

  private initNpcGarrisons() {
    const definitions = [
      { id: 'npc_karakurum', name: 'Karakurum Garnizonu', x: 10, y: 6, defenseLevel: 1 },
      { id: 'npc_demirboynuz', name: 'Demirboynuz Obası', x: 24, y: 14, defenseLevel: 2 },
      { id: 'npc_kuzeyakinci', name: 'Kuzey Akıncı Kampı', x: 8, y: 22, defenseLevel: 3 },
    ];

    this.npcCamps = definitions.map((def) => {
      const gx = Math.min(def.x, this.worldMap.width - 1);
      const gy = Math.min(def.y, this.worldMap.height - 1);

      const squad: ArmySquad = {
        ownerId: def.id,
        squadId: `squad_${def.id}`,
        morale: 60,
        units: [
          {
            id: `${def.id}_ceri_1`,
            type: UnitType.CERI,
            currentHp: 120,
            maxHp: 120,
            attack: 12,
            armor: 10,
            range: 1,
            speed: 4,
            experience: 10,
          },
          {
            id: `${def.id}_ceri_2`,
            type: UnitType.CERI,
            currentHp: 120,
            maxHp: 120,
            attack: 12,
            armor: 10,
            range: 1,
            speed: 4,
            experience: 10,
          },
          {
            id: `${def.id}_akinci_1`,
            type: UnitType.AKINCI,
            currentHp: 80,
            maxHp: 80,
            attack: 14,
            armor: 8,
            range: 4,
            speed: 8,
            experience: 15,
          },
        ],
      };

      if (this.worldMap.tiles[gy] && this.worldMap.tiles[gy][gx]) {
        this.worldMap.tiles[gy][gx].campId = def.id;
      }

      return {
        id: def.id,
        name: def.name,
        gridX: gx,
        gridY: gy,
        defenseLevel: def.defenseLevel,
        army: squad,
      };
    });
  }

  public registerPlayer(userId: string, username: string, wsSessionId: string): PlayerSession {
    const existing = this.players.get(userId);
    if (existing) {
      existing.wsSessionId = wsSessionId;
      return existing;
    }

    const offsetIndex = this.players.size;
    let posX = Math.min(this.worldMap.width - 2, Math.max(2, 10 + (offsetIndex % 4)));
    let posY = Math.min(this.worldMap.height - 2, Math.max(4, 8 + (offsetIndex % 3)));

    // Nehir veya dağ üzerine denk gelirse bozkıra kaydır
    if (
      this.worldMap.tiles[posY] &&
      this.worldMap.tiles[posY][posX] &&
      (this.worldMap.tiles[posY][posX].terrain === 'RIVER' ||
        this.worldMap.tiles[posY][posX].terrain === 'MOUNTAIN')
    ) {
      posX = Math.min(this.worldMap.width - 2, posX + 1);
      posY = Math.max(4, posY);
    }

    const initialSquad: ArmySquad = {
      ownerId: userId,
      squadId: `squad_${userId}`,
      morale: 100,
      units: [
        {
          id: `u_${userId}_ak1`,
          type: UnitType.AKINCI,
          currentHp: 60,
          maxHp: 60,
          attack: 35,
          armor: 12,
          range: 4,
          speed: 8,
          experience: 0,
        },
        {
          id: `u_${userId}_alp1`,
          type: UnitType.ALP,
          currentHp: 100,
          maxHp: 100,
          attack: 48,
          armor: 28,
          range: 1,
          speed: 7,
          experience: 0,
        },
      ],
    };

    const startTerrain = this.worldMap.tiles[posY]?.[posX]?.terrain || 'STEPPE';

    const camp: CampState = {
      id: `camp_${userId}`,
      name: `${username} Otağı`,
      ownerId: userId,
      population: 120,
      tents: 15,
      otagLevel: 1,
      conqueredGarrisons: 0,
      horsesInPasture: 40,
      basePastureQuality: 1.0,
      isInWinterCamp: startTerrain === 'WINTER_CAMP',
      isInSummerCamp: startTerrain === 'SUMMER_PASTURE',
      resources: { ...INITIAL_RESOURCES },
      army: initialSquad,
    };

    const session: PlayerSession = {
      userId,
      username,
      wsSessionId,
      camp,
      selectedSquadId: initialSquad.squadId,
      gridX: posX,
      gridY: posY,
    };

    this.worldMap.tiles[posY][posX].campId = camp.id;
    this.worldMap.tiles[posY][posX].squadIds.push(initialSquad.squadId);
    this.players.set(userId, session);

    return session;
  }

  public removePlayerSession(wsSessionId: string) {
    for (const [, session] of this.players.entries()) {
      if (session.wsSessionId === wsSessionId) {
        break;
      }
    }
  }

  public trainUnit(userId: string, unitType: UnitType): boolean {
    const session = this.players.get(userId);
    if (!session) return false;

    const template = UNIT_TEMPLATES[unitType];
    if (!template) return false;

    // Kaynak kontrolü
    for (const [resKey, amount] of Object.entries(template.cost)) {
      const key = resKey as keyof typeof session.camp.resources;
      if ((session.camp.resources[key] || 0) < (amount || 0)) {
        return false; // Yetersiz kaynak
      }
    }

    // Kaynakları düş
    for (const [resKey, amount] of Object.entries(template.cost)) {
      const key = resKey as keyof typeof session.camp.resources;
      session.camp.resources[key] = Number(
        (session.camp.resources[key] - (amount || 0)).toFixed(2)
      );
    }

    // Birimi orduya ekle
    const newUnit: ArmyUnit = {
      id: `u_${userId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: unitType,
      currentHp: template.hp,
      maxHp: template.maxHp,
      attack: template.attack,
      armor: template.armor,
      range: template.range,
      speed: template.speed,
      experience: 0,
    };

    session.camp.army.units.push(newUnit);
    return true;
  }

  public upgradeOtag(userId: string): {
    success: boolean;
    newLevel: number;
    reason?: string;
  } {
    const session = this.players.get(userId);
    if (!session) {
      return { success: false, newLevel: 1, reason: 'Oyuncu oturumu bulunamadı.' };
    }
    return upgradeOtagState(session.camp);
  }

  public holdFeast(userId: string): {
    success: boolean;
    healedUnits: number;
    moraleRestored: number;
    reason?: string;
  } {
    const session = this.players.get(userId);
    if (!session) {
      return {
        success: false,
        healedUnits: 0,
        moraleRestored: 0,
        reason: 'Oyuncu oturumu bulunamadı.',
      };
    }
    return holdFeastState(session.camp);
  }

  public moveCamp(userId: string, targetX: number, targetY: number): boolean {
    const session = this.players.get(userId);
    if (!session) return false;

    if (
      targetX < 0 ||
      targetX >= this.worldMap.width ||
      targetY < 0 ||
      targetY >= this.worldMap.height
    ) {
      this.lastMoveReason.set(userId, 'Harita sınırları dışına göç edilemez.');
      return false;
    }

    const targetTile = this.worldMap.tiles[targetY][targetX];
    if (targetTile.terrain === 'MOUNTAIN' || targetTile.terrain === 'RIVER') {
      this.lastMoveReason.set(userId, 'Dağ zirvelerine ve nehir yataklarına otağ kurulamaz!');
      return false;
    }

    const dist = Math.hypot(targetX - session.gridX, targetY - session.gridY);
    if (dist > MAX_MIGRATION_DISTANCE) {
      this.lastMoveReason.set(
        userId,
        `Göç menzili aşıldı (${dist.toFixed(1)} karo)! Tek seferde en fazla ${MAX_MIGRATION_DISTANCE} karo uzağa göç edilebilir.`
      );
      return false;
    }

    if (
      session.camp.resources.food < MIGRATION_FOOD_COST ||
      session.camp.resources.horse < MIGRATION_HORSE_COST
    ) {
      this.lastMoveReason.set(
        userId,
        `Göç kervanı için en az ${MIGRATION_FOOD_COST} Aş ve ${MIGRATION_HORSE_COST} At gereklidir!`
      );
      return false;
    }

    // Göç iaşe maliyetini düş
    session.camp.resources.food = Number(
      (session.camp.resources.food - MIGRATION_FOOD_COST).toFixed(2)
    );
    session.camp.resources.horse = Math.max(0, session.camp.resources.horse - MIGRATION_HORSE_COST);

    // Eski kiremiti temizle
    const oldTile = this.worldMap.tiles[session.gridY][session.gridX];
    if (oldTile.campId === session.camp.id) {
      oldTile.campId = undefined;
    }

    // Yeni pozisyon
    session.gridX = targetX;
    session.gridY = targetY;
    targetTile.campId = session.camp.id;

    // Kışlak / Yaylak kontrolü
    session.camp.isInSummerCamp = targetTile.terrain === 'SUMMER_PASTURE';
    session.camp.isInWinterCamp = targetTile.terrain === 'WINTER_CAMP';

    const terrainLabel =
      targetTile.terrain === 'SUMMER_PASTURE'
        ? 'Yaylak (+At Üremesi & Otlak Bereketi)'
        : targetTile.terrain === 'WINTER_CAMP'
          ? 'Kışlak (Zemheri Soğuk Koruması)'
          : 'Bozkır Düzlüğü';

    this.lastMoveReason.set(
      userId,
      `Otağ (${targetX}, ${targetY}) konumundaki ${terrainLabel} bölgesine göç etti (-${MIGRATION_FOOD_COST} Aş, -${MIGRATION_HORSE_COST} At).`
    );

    return true;
  }

  public executeTuranBattle(
    userId: string,
    targetX?: number,
    targetY?: number
  ): TuranBattleExecutionResult | null {
    const session = this.players.get(userId);
    if (!session) return null;

    // Eğer orduda hiç birlik kalmamışsa öncü Akıncı ve Alp takviyesi
    if (session.camp.army.units.length === 0) {
      session.camp.army.units.push(
        {
          id: `u_${userId}_ak_reinf_${Date.now()}`,
          type: UnitType.AKINCI,
          currentHp: 60,
          maxHp: 60,
          attack: 35,
          armor: 12,
          range: 4,
          speed: 8,
          experience: 0,
        },
        {
          id: `u_${userId}_alp_reinf_${Date.now()}`,
          type: UnitType.ALP,
          currentHp: 100,
          maxHp: 100,
          attack: 48,
          armor: 28,
          range: 1,
          speed: 7,
          experience: 0,
        }
      );
    }

    session.camp.army.morale = Math.max(75, session.camp.army.morale);
    for (const u of session.camp.army.units) {
      u.currentHp = Math.max(1, u.currentHp);
    }

    // Hedef garnizon seçimi (koordinata en yakın NPC garnizonu veya oyuncuya en yakın fethedilmemiş garnizon)
    let targetNpc = this.npcCamps[0];
    if (targetX !== undefined && targetY !== undefined) {
      let minDist = Infinity;
      for (const npc of this.npcCamps) {
        const d = Math.hypot(npc.gridX - targetX, npc.gridY - targetY);
        if (d < minDist) {
          minDist = d;
          targetNpc = npc;
        }
      }
    } else {
      const unconquered = this.npcCamps.filter((n) => n.conqueredBy !== userId);
      const candidates = unconquered.length > 0 ? unconquered : this.npcCamps;
      let minDist = Infinity;
      for (const npc of candidates) {
        const d = Math.hypot(npc.gridX - session.gridX, npc.gridY - session.gridY);
        if (d < minDist) {
          minDist = d;
          targetNpc = npc;
        }
      }
    }

    const distToPlayer = Math.hypot(
      targetNpc.gridX - session.gridX,
      targetNpc.gridY - session.gridY
    );
    if (distToPlayer > MAX_ATTACK_DISTANCE) {
      this.lastBattleReason.set(
        userId,
        `Hedef garnizon (${targetNpc.name}) çok uzakta (${distToPlayer.toFixed(1)} karo)! Önce obanızı hedefe yaklaştırın (Maks. Saldırı Menzili: ${MAX_ATTACK_DISTANCE} karo).`
      );
      return null;
    }

    const battleX = targetNpc.gridX;
    const battleY = targetNpc.gridY;

    // Sahte Ricat (Tur 2) ve Hilal Kapanı (Tur 3) tetiklenmesi için dinamik düşman garnizonu
    const totalPlayerAttack = session.camp.army.units.reduce((sum, u) => sum + u.attack, 0);
    const vanguardHp = Math.max(120, Math.ceil(totalPlayerAttack * 1.9));

    const enemySquad: ArmySquad = {
      ownerId: targetNpc.id,
      squadId: `squad_battle_${targetNpc.id}_${Date.now()}`,
      morale: 55,
      units: [
        {
          id: `${targetNpc.id}_guard_1`,
          type: UnitType.CERI,
          currentHp: vanguardHp,
          maxHp: vanguardHp,
          attack: 10,
          armor: 0,
          range: 1,
          speed: 4,
          experience: 10,
        },
        {
          id: `${targetNpc.id}_guard_2`,
          type: UnitType.CERI,
          currentHp: 90,
          maxHp: 90,
          attack: 10,
          armor: 10,
          range: 1,
          speed: 4,
          experience: 10,
        },
      ],
    };

    const simResult = simulateBattle(session.camp.army, enemySquad, true);
    this.battleLogs.push(simResult);

    const loot = { gold: 0, horse: 0, iron: 0, food: 0 };
    let garrisonConquered = false;

    if (simResult.winner === 'SIDE_A') {
      loot.gold = 45;
      loot.horse = 15;
      loot.iron = 20;
      loot.food = 30;

      session.camp.resources.gold += loot.gold;
      session.camp.resources.horse += loot.horse;
      session.camp.resources.iron += loot.iron;
      session.camp.resources.food += loot.food;

      // Garnizonu oyuncunun sancağı altına al (Fetih)
      targetNpc.conqueredBy = userId;
      targetNpc.conqueredByName = session.username;
      targetNpc.army.units = enemySquad.units;
      garrisonConquered = true;

      session.camp.conqueredGarrisons = this.npcCamps.filter(
        (npc) => npc.conqueredBy === userId
      ).length;

      // Savaş yorgunluğu korunur (Toy ile iyileştirilebilir), tecrübe artar
      for (const unit of session.camp.army.units) {
        unit.experience += 25;
        unit.currentHp = Math.max(1, unit.currentHp);
      }
      session.camp.army.morale = Math.min(100, Math.max(70, session.camp.army.morale));
    }

    const feignedRetreatSuccess = simResult.rounds.some((r) => r.phase === 'FEIGNED_RETREAT');
    const ambushDamage = simResult.rounds
      .filter((r) => r.phase === 'CRESCENT_AMBUSH')
      .reduce(
        (sum, r) =>
          sum +
          r.attacks
            .filter((a) => a.damageMultiplier > 1.5)
            .reduce((aSum, a) => aSum + a.finalDamage, 0),
        0
      );

    const conqueredCount = session.camp.conqueredGarrisons || 0;
    this.lastBattleReason.delete(userId);

    return {
      ...simResult,
      targetName: targetNpc.name,
      targetX: battleX,
      targetY: battleY,
      feignedRetreatSuccess,
      ambushDamage,
      garrisonConquered,
      conqueredCount,
      isGreatKhaganVictory: conqueredCount >= 3,
      loot,
    };
  }

  public advanceTick() {
    this.currentTick++;

    // Her 10 tick'te bir (1 saniyede bir) ekonomi hesaplamalarını güncelle
    if (this.currentTick % 10 === 0) {
      for (const session of this.players.values()) {
        session.camp.conqueredGarrisons = this.npcCamps.filter(
          (npc) => npc.conqueredBy === session.userId
        ).length;
        const result = processEconomyTick(session.camp, this.currentTick);
        this.lastEconomyResults.set(session.userId, result);
      }
    }
  }

  public getSnapshotForPlayer(userId: string) {
    const session = this.players.get(userId);

    const otherPlayers = Array.from(this.players.values())
      .filter((p) => p.userId !== userId)
      .map((p) => ({
        id: p.camp.id,
        name: p.camp.name,
        ownerName: p.username,
        gridX: p.gridX,
        gridY: p.gridY,
        isNpc: false,
        defenseLevel: p.camp.otagLevel || 1,
        conqueredBy: undefined,
        conqueredByName: undefined,
        unitCount: p.camp.army.units.length,
      }));

    const npcList = this.npcCamps.map((npc) => ({
      id: npc.id,
      name: npc.name,
      ownerName: npc.conqueredByName ? `${npc.name} (${npc.conqueredByName})` : npc.name,
      gridX: npc.gridX,
      gridY: npc.gridY,
      isNpc: true,
      defenseLevel: npc.defenseLevel,
      conqueredBy: npc.conqueredBy,
      conqueredByName: npc.conqueredByName,
      unitCount: npc.army.units.length || 2,
    }));

    return {
      currentTick: this.currentTick,
      self: session
        ? {
            userId: session.userId,
            username: session.username,
            camp: {
              ...session.camp,
              nextUpgradeCost: getOtagUpgradeCost(session.camp.otagLevel || 1),
            },
            gridX: session.gridX,
            gridY: session.gridY,
          }
        : null,
      otherCamps: [...otherPlayers, ...npcList],
      worldMap: {
        width: this.worldMap.width,
        height: this.worldMap.height,
        tiles: this.worldMap.tiles.map((row) =>
          row.map((tile) => ({
            x: tile.x,
            y: tile.y,
            terrain: tile.terrain,
            hasCamp: !!tile.campId,
            campOwner: tile.campId ? tile.campId.replace('camp_', '') : null,
          }))
        ),
      },
      lastEconomy: this.lastEconomyResults.get(userId) || null,
      recentBattles: this.battleLogs.slice(-5),
    };
  }
}
