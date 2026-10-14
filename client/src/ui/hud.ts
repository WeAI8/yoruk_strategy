import { UnitType } from '@yorukstrategy/core';

export interface HudCallbacks {
  onTrain: (unitType: UnitType) => void;
  onMigrate: () => void;
  onTuran: () => void;
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
  private campMorale = document.getElementById('campMorale');
  private battleLog = document.getElementById('battleLog');

  constructor(private callbacks: HudCallbacks) {
    this.bindEvents();
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
    if (this.campCoords) this.campCoords.textContent = `Konum: (${x}, ${y})`;
    if (this.campMorale && camp?.army) {
      this.campMorale.textContent = `Moral: %${camp.army.morale} | Ordu: ${camp.army.units.length} Birlik`;
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

    // Maksimum 20 kayıt tut
    while (this.battleLog.children.length > 20) {
      this.battleLog.removeChild(this.battleLog.lastChild!);
    }
  }
}
