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
    conqueredBy?: string;
    conqueredByName?: string;
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

export function resolveDefaultWsUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_WS_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim();
  }
  if (typeof window === 'undefined' || !window.location) {
    return 'ws://localhost:8081/ws';
  }
  const { protocol, hostname, host } = window.location;
  const wsProto = protocol === 'https:' ? 'wss:' : 'ws:';

  // Yerel geliştirme ortamında doğrudan 8081 oyun sunucusuna bağlan
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${wsProto}//${hostname}:8081/ws`;
  }

  // Canlı/Nginx ortamında aynı host üzerindeki /ws reverse-proxy tünelini kullan
  return `${wsProto}//${host}/ws`;
}

export class NetworkManager {
  private socket: WebSocket | null = null;
  private serverUrl: string;
  private onSnapshot: SnapshotCallback | null = null;
  private onLog: MessageCallback | null = null;

  constructor(serverUrl?: string) {
    this.serverUrl = serverUrl || resolveDefaultWsUrl();
  }

  public connect(onSnapshot: SnapshotCallback, onLog: MessageCallback) {
    this.onSnapshot = onSnapshot;
    this.onLog = onLog;

    // 1. Plan 02: URL'den bilet ayıkla (@yorukgames/game-sdk)
    let ticket = YorukGameClient.getTicketFromUrl();

    // Dev modunda bilet yoksa otomatik dev ticket ata (kolay test için)
    if (!ticket) {
      const devTicket = `dev_kagan_${Math.floor(1000 + Math.random() * 9000)}`;
      console.warn(
        `[SDK] URL'de bilet bulunamadı. Geliştirme ortamı için geçici bilet atanıyor: ${devTicket}`
      );
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
                ? `Yeni birlik sancağa katıldı: ${data.unitType}`
                : `Yetersiz kaynak! Birlik eğitilemedi: ${data.unitType}`,
              isAlert: !data.success,
            });
          }
        } else if (data.type === 'MOVE_RESULT') {
          if (this.onLog) {
            this.onLog({
              text:
                data.reason ||
                (data.success
                  ? `Otağ yeni yaylak/kışlak arazisine göç etti: (${data.x}, ${data.y})`
                  : `Göç başarısız! Arazi veya menzil uygun değil.`),
              isAlert: !data.success,
            });
          }
        } else if (data.type === 'UPGRADE_OTAG_RESULT') {
          if (this.onLog) {
            this.onLog({
              text: data.success
                ? `Otağ Seviye ${data.newLevel}'e yükseltildi! (+5 Çadır, +40 Oba Nüfusu, +0.25 Otlak Verimi, +%15 Üretim)`
                : data.reason || 'Otağ yükseltilemedi!',
              isAlert: true,
            });
          }
        } else if (data.type === 'FEAST_RESULT') {
          if (this.onLog) {
            this.onLog({
              text: data.success
                ? `Kurultay Toyu düzenlendi! ${data.healedUnits} yaralı birlik iyileştirildi, ordu morali %100 oldu.`
                : data.reason || 'Toy düzenlenemedi!',
              isAlert: true,
            });
          }
        } else if (data.type === 'BATTLE_RESULT') {
          if (this.onLog) {
            if (!data.success || !data.payload) {
              this.onLog({
                text:
                  data.reason ||
                  'Hedef garnizon çok uzakta! Önce obanızı hedefe yaklaştırın.',
                isAlert: true,
              });
            } else {
              const p = data.payload;
              const winText = p.winner === 'SIDE_A' ? 'ZAFER & FETİH' : 'MUHAREBE';
              const retreatText = p.feignedRetreatSuccess
                ? 'Sahte Ricat Başarılı'
                : 'Doğrudan Hücum';
              const conquestText = p.garrisonConquered
                ? ` | Sancak Dikildi (${p.conqueredCount}/3 Garnizon)`
                : '';
              const khaganText = p.isGreatKhaganVictory
                ? ' | BOZKIRIN ULU KAĞANI İLAN EDİLDİ!'
                : '';
              const lootText =
                p.winner === 'SIDE_A'
                  ? `Ganimet: +${p.loot.gold} Altın, +${p.loot.horse} At, +${p.loot.iron} Demir, +${p.loot.food} Aş`
                  : 'Ganimet yok';
              this.onLog({
                text: `[${winText}] ${p.targetName} (${p.rounds?.length || 0} Tur) | ${retreatText} | Pusu Hasarı: ${p.ambushDamage}${conquestText}${khaganText} | ${lootText}`,
                isAlert: true,
                battleResult: p,
              });
            }
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

  public upgradeOtag() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: 'UPGRADE_OTAG',
        })
      );
    }
  }

  public holdFeast() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: 'HOLD_FEAST',
        })
      );
    }
  }
}
