import * as SDK from '@yorukgames/game-sdk';
const YorukGameClient = (SDK as any).YorukGameClient || (SDK as any).default || SDK;
import { UnitType } from '@yorukstrategy/core';

export interface GameSnapshot {
  currentTick: number;
  self: {
    userId: string;
    username: string;
    camp: any;
    gridX: number;
    gridY: number;
  } | null;
  otherCamps?: {
    id: string;
    name: string;
    ownerName: string;
    gridX: number;
    gridY: number;
    isNpc: boolean;
    unitCount: number;
  }[];
  worldMap: {
    width: number;
    height: number;
    tiles: any[][];
  };
  lastEconomy: any;
  recentBattles: any[];
}

export type SnapshotCallback = (snapshot: GameSnapshot) => void;
export type MessageCallback = (msg: any) => void;

export class NetworkManager {
  private socket: WebSocket | null = null;
  private serverUrl: string;
  private onSnapshot: SnapshotCallback | null = null;
  private onLog: MessageCallback | null = null;

  constructor(serverUrl: string = 'ws://localhost:8081/ws') {
    this.serverUrl = serverUrl;
  }

  public connect(onSnapshot: SnapshotCallback, onLog: MessageCallback) {
    this.onSnapshot = onSnapshot;
    this.onLog = onLog;

    // 1. Plan 02: URL'den bilet ayıkla (@yorukgames/game-sdk)
    let ticket = YorukGameClient.getTicketFromUrl();

    // Dev modunda bilet yoksa otomatik dev ticket ata (kolay test için)
    if (!ticket) {
      const devTicket = `dev_kagan_${Math.floor(1000 + Math.random() * 9000)}`;
      console.warn(`[SDK] URL'de bilet bulunamadı. Geliştirme ortamı için geçici bilet atanıyor: ${devTicket}`);
      ticket = devTicket;
      const url = new URL(window.location.href);
      url.searchParams.set('ticket', ticket);
      window.history.replaceState({}, '', url.toString());
    }

    const wsUrl = `${this.serverUrl}?ticket=${ticket}`;
    console.log(`[Network] WebSocket bağlantısı açılıyor: ${wsUrl}`);
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('[Network] Otoriter oyun sunucusuna bağlanıldı!');
      if (this.onLog) this.onLog({ text: 'Otoriter sunucu bağlantısı sağlandı.' });
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'INIT_STATE' || data.type === 'GAME_TICK') {
          if (this.onSnapshot) this.onSnapshot(data.payload);
        } else if (data.type === 'TRAIN_RESULT') {
          if (this.onLog) {
            this.onLog({
              text: data.success
                ? `Birlik eğitildi: ${data.unitType}`
                : `Yetersiz kaynak! Birlik eğitilemedi: ${data.unitType}`,
            });
          }
        } else if (data.type === 'MOVE_RESULT') {
          if (this.onLog) {
            this.onLog({
              text: data.success
                ? `Otağ yeni yaylak/kışlak arazisine göç etti: (${data.x}, ${data.y})`
                : `Göç başarısız! Arazi elverişli değil.`,
            });
          }
        } else if (data.type === 'BATTLE_RESULT') {
          if (this.onLog && data.payload) {
            const p = data.payload;
            const winText = p.winner === 'SIDE_A' ? 'ZAFER' : 'MUHAREBE';
            const retreatText = p.feignedRetreatSuccess ? 'Sahte Ricat Başarılı' : 'Doğrudan Hücum';
            const lootText =
              p.winner === 'SIDE_A'
                ? `Ganimet: +${p.loot.gold} Altın, +${p.loot.horse} At, +${p.loot.iron} Demir, +${p.loot.food} Erzak`
                : 'Ganimet yok';
            this.onLog({
              text: `[${winText}] ${p.targetName} (${p.rounds?.length || 0} Tur) | ${retreatText} | Hilal Pusu Hasarı: ${p.ambushDamage} | ${lootText}`,
              isAlert: true,
              battleResult: p,
            });
          }
        }
      } catch (err) {
        console.error('[Network] Parse error:', err);
      }
    };

    this.socket.onerror = (err) => {
      console.error('[Network] WebSocket hatası:', err);
    };

    this.socket.onclose = (event) => {
      console.warn(`[Network] Bağlantı kapandı. Kod: ${event.code}, Sebep: ${event.reason}`);
      if (this.onLog) {
        this.onLog({
          text: `Sunucu bağlantısı koptu (Kod: ${event.code} - ${event.reason || 'Bilinmiyor'})`,
        });
      }
    };
  }

  public trainUnit(unitType: UnitType) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: 'TRAIN_UNIT',
          unitType,
        })
      );
    }
  }

  public moveCamp(x: number, y: number) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: 'MOVE_CAMP',
          x,
          y,
        })
      );
    }
  }

  public executeTuran(x?: number, y?: number) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: 'EXECUTE_TURAN',
          x,
          y,
        })
      );
    }
  }
}
