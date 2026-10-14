import { UnitType } from '@yorukstrategy/core';

export interface HudCallbacks {
  onTrain: (unitType: UnitType) => void;
  onMigrate: () => void;
  onTuran: () => void;
  onUpgradeOtag: () => void;
  onHoldFeast: () => void;
}

export class HudController {
  private resHorse = document.getElementById('resHorse');
  private resFood = document.getElementById('resFood');
  private resIron = document.getElementById('resIron');
  private resLeather = document.getElementById('resLeather');
  private resGold = document.getElementById('resGold');

  private seasonIcon = document.getElementById('seasonIcon');
  private seasonText = document.getElementById('seasonText');
  private fpsCounter = document.getElementById('fpsCounter');
  private drawCallCounter = document.getElementById('drawCallCounter');

  private campName = document.getElementById('campName');
  private playerUser = document.getElementById('playerUser');
  private campCoords = document.getElementById('campCoords');
  private campOtagBadge = document.getElementById('campOtagBadge');
  private campMorale = document.getElementById('campMorale');
  private armyComposition = document.getElementById('armyComposition');
  private upgradeOtagCostText = document.getElementById('upgradeOtagCostText');

  private inspectorCoord = document.getElementById('inspectorCoord');
  private inspectorTerrain = document.getElementById('inspectorTerrain');
  private inspectorDistance = document.getElementById('inspectorDistance');
  private inspectorGarrison = document.getElementById('inspectorGarrison');

  private battleLog = document.getElementById('battleLog');
  private portalBackLink = document.getElementById('portalBackLink') as HTMLAnchorElement | null;

  constructor(private callbacks: HudCallbacks) {
    this.bindEvents();
    this.configurePortalLink();
  }

  private configurePortalLink() {
    if (!this.portalBackLink || typeof window === 'undefined') return;
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      this.portalBackLink.href = 'http://localhost:3000/games/turan-tactics';
    } else {
      this.portalBackLink.href = 'https://yoruk.herbokolog.site/games/turan-tactics';
    }
  }

  private bindEvents() {
    document.getElementById('btnTrainAkinci')?.addEventListener('click', () => {
      this.callbacks.onTrain(UnitType.AKINCI);
    });
    document.getElementById('btnTrainAlp')?.addEventListener('click', () => {
      this.callbacks.onTrain(UnitType.ALP);
    });
    document.getElementById('btnTrainCeri')?.addEventListener('click', () => {
      this.callbacks.onTrain(UnitType.CERI);
    });
    document.getElementById('btnTrainAlpagut')?.addEventListener('click', () => {
      this.callbacks.onTrain(UnitType.ALPAGUT);
    });
    document.getElementById('btnUpgradeOtag')?.addEventListener('click', () => {
      this.callbacks.onUpgradeOtag();
    });
    document.getElementById('btnHoldFeast')?.addEventListener('click', () => {
      this.callbacks.onHoldFeast();
    });
    document.getElementById('btnMigrate')?.addEventListener('click', () => {
      this.callbacks.onMigrate();
    });
    document.getElementById('btnTuran')?.addEventListener('click', () => {
      this.callbacks.onTuran();
    });
  }

  public updateResources(resources: any) {
    if (!resources) return;
    if (this.resHorse) this.resHorse.textContent = Math.floor(resources.horse).toString();
    if (this.resFood) this.resFood.textContent = Math.floor(resources.food).toString();
    if (this.resIron) this.resIron.textContent = Math.floor(resources.iron).toString();
    if (this.resLeather) this.resLeather.textContent = Math.floor(resources.leather).toString();
    if (this.resGold) this.resGold.textContent = Math.floor(resources.gold).toString();
  }

  public updateSeason(season: string) {
    if (!this.seasonText || !this.seasonIcon) return;
    let icon = '🌿';
    let label = 'BAHAR';

    if (season === 'SUMMER') {
      icon = '☀️';
      label = 'YAZ (YAYLAK)';
    } else if (season === 'AUTUMN') {
      icon = '🍂';
      label = 'GÜZ (GÖÇ)';
    } else if (season === 'WINTER') {
      icon = '❄️';
      label = 'KIŞ (ZEMHERİ)';
    }

    this.seasonIcon.textContent = icon;
    this.seasonText.textContent = label;
  }

  public updatePlayerInfo(username: string, camp: any, x: number, y: number) {
    if (this.playerUser) this.playerUser.textContent = `Kağan: ${username}`;
    if (this.campName && camp) this.campName.textContent = camp.name;
    if (this.campCoords) {
      const campStance = camp?.isInSummerCamp
        ? ' [Yaylak]'
        : camp?.isInWinterCamp
          ? ' [Kışlak]'
          : ' [Bozkır]';
      this.campCoords.textContent = `Konum: (${x}, ${y})${campStance} | Nüfus: ${camp?.population || 120}`;
    }

    const otagLevel = camp?.otagLevel || 1;
    const conqueredCount = camp?.conqueredGarrisons || 0;
    if (this.playerUser) {
      const titlePrefix = conqueredCount >= 3 ? 'Bozkırın Ulu Kağanı' : 'Kağan';
      this.playerUser.textContent = `${titlePrefix}: ${username}`;
    }
    if (this.campOtagBadge) {
      this.campOtagBadge.textContent = `Otağ Sv. ${otagLevel}/5 | Fetih: ${conqueredCount}/3 Garnizon (+${conqueredCount * 5} Altın Haraç)`;
    }

    if (this.upgradeOtagCostText && camp?.nextUpgradeCost) {
      if (otagLevel >= 5) {
        this.upgradeOtagCostText.textContent = 'Azami Seviye (Sv. 5)';
      } else {
        const c = camp.nextUpgradeCost;
        this.upgradeOtagCostText.textContent = `${c.gold} Altın, ${c.leather} Keç, ${c.iron} Dem`;
      }
    }

    if (camp?.army) {
      const units: any[] = camp.army.units || [];
      const totalHp = units.reduce((s, u) => s + (u.currentHp || 0), 0);
      const totalMaxHp = units.reduce((s, u) => s + (u.maxHp || 1), 0);
      const hpPercent = totalMaxHp > 0 ? Math.round((totalHp / totalMaxHp) * 100) : 100;

      if (this.campMorale) {
        this.campMorale.textContent = `Moral: %${camp.army.morale} | Ordu Sağlığı: %${hpPercent} (${units.length} Birlik)`;
      }

      if (this.armyComposition) {
        const counts = {
          AKINCI: 0,
          ALP: 0,
          CERI: 0,
          ALPAGUT: 0,
        };
        for (const u of units) {
          if (u.type in counts) {
            counts[u.type as keyof typeof counts]++;
          }
        }
        this.armyComposition.textContent = `Akıncı: ${counts.AKINCI} | Alp: ${counts.ALP} | Çeri: ${counts.CERI} | Alpagut: ${counts.ALPAGUT}`;
      }
    }
  }

  public updateTileInspector(
    tile: { x: number; y: number } | null,
    snapshot: any
  ) {
    if (!tile || !snapshot || !snapshot.worldMap) return;

    const tileData = snapshot.worldMap.tiles[tile.y]?.[tile.x];
    const terrain = tileData?.terrain || 'STEPPE';

    let terrainTitle = 'Bozkır Düzlüğü (Dengeli Konaklama)';
    if (terrain === 'SUMMER_PASTURE') {
      terrainTitle = 'Yaylak Otlakları (+%25 At Üremesi & Otlak Bereketi)';
    } else if (terrain === 'WINTER_CAMP') {
      terrainTitle = 'Kışlak Vadisi (%100 Zemheri Donma Koruması)';
    } else if (terrain === 'MOUNTAIN') {
      terrainTitle = 'Sarp Dağ Sırası (Otağ Kurulamaz)';
    } else if (terrain === 'RIVER') {
      terrainTitle = 'Gökırmak Nehri (Otağ Kurulamaz)';
    }

    if (this.inspectorCoord) {
      this.inspectorCoord.textContent = `Seçili Karo: (${tile.x}, ${tile.y})`;
    }
    if (this.inspectorTerrain) {
      this.inspectorTerrain.textContent = `Arazi: ${terrainTitle}`;
    }

    if (this.inspectorDistance && snapshot.self) {
      const dist = Math.hypot(tile.x - snapshot.self.gridX, tile.y - snapshot.self.gridY);
      const canMigrate =
        dist <= 14 && terrain !== 'MOUNTAIN' && terrain !== 'RIVER';
      this.inspectorDistance.textContent = `Otağa Mesafe: ${dist.toFixed(1)} karo (${canMigrate ? 'Göç Menzilinde - 10 Aş, 1 At' : 'Göç Edilemez'})`;
    }

    if (this.inspectorGarrison) {
      const otherCamps: any[] = snapshot.otherCamps || [];
      let nearestNpc: any = null;
      let minDist = Infinity;

      for (const c of otherCamps) {
        const d = Math.hypot(c.gridX - tile.x, c.gridY - tile.y);
        if (d < minDist) {
          minDist = d;
          nearestNpc = c;
        }
      }

      if (nearestNpc && minDist <= 2.5) {
        const isMine = nearestNpc.conqueredBy && nearestNpc.conqueredBy === snapshot.self?.userId;
        const defLvl = nearestNpc.defenseLevel || 1;
        const unitsCount = nearestNpc.unitCount || 2;
        const distToSelf = snapshot.self
          ? Math.hypot(nearestNpc.gridX - snapshot.self.gridX, nearestNpc.gridY - snapshot.self.gridY)
          : 0;
        const rangeStatus =
          distToSelf <= 10
            ? `${distToSelf.toFixed(1)} Karo — Saldırı Menzilinde`
            : `${distToSelf.toFixed(1)} Karo — Menzil Dışı (>10 Karo)`;

        this.inspectorGarrison.textContent = isMine
          ? `${nearestNpc.name} (Sv.${defLvl} | ${unitsCount} Birlik) [FETHEDİLDİ — Sancağımız Altında]`
          : `${nearestNpc.name} (Sv.${defLvl} | ${unitsCount} Savunma) [${rangeStatus}]`;
      } else if (nearestNpc) {
        const distToSelf = snapshot.self
          ? Math.hypot(nearestNpc.gridX - snapshot.self.gridX, nearestNpc.gridY - snapshot.self.gridY)
          : 0;
        const rangeLabel = distToSelf <= 10 ? 'Saldırı Menzilinde' : 'Önce Yaklaşın';
        this.inspectorGarrison.textContent = `En Yakın Hedef: ${nearestNpc.name} (${nearestNpc.gridX}, ${nearestNpc.gridY}) [${distToSelf.toFixed(1)} Karo — ${rangeLabel}]`;
      } else {
        this.inspectorGarrison.textContent = 'Bölgede düşman garnizonu yok.';
      }
    }
  }

  public updatePerformance(fps: number, drawCalls: number) {
    if (this.fpsCounter) this.fpsCounter.textContent = `FPS: ${fps}`;
    if (this.drawCallCounter) this.drawCallCounter.textContent = `DrawCalls: ${drawCalls}`;
  }

  public addLogMessage(text: string, isAlert: boolean = false) {
    if (!this.battleLog) return;
    const item = document.createElement('div');
    item.className = isAlert ? 'log-item turan-alert' : 'log-item';
    item.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    this.battleLog.prepend(item);

    while (this.battleLog.children.length > 20) {
      this.battleLog.removeChild(this.battleLog.lastChild!);
    }
  }
}
