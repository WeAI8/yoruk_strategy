import { GameStateManager } from '../state/gameState.js';
import { WebSocket } from 'ws';

export interface ClientConnection {
  ws: WebSocket;
  userId: string;
}

export class GameLoop {
  private tickIntervalMs: number = 100; // 100ms Fixed-Tick
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private clients: Map<string, ClientConnection> = new Map();

  constructor(private stateManager: GameStateManager) {}

  public registerClient(userId: string, ws: WebSocket) {
    this.clients.set(userId, { ws, userId });
  }

  public removeClient(userId: string) {
    this.clients.delete(userId);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[GameLoop] Starting 100ms authoritative fixed-tick loop...`);

    let lastTime = Date.now();

    this.timer = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;

      this.tick();
    }, this.tickIntervalMs);
  }

  public stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log(`[GameLoop] Stopped.`);
  }

  private tick() {
    // 1. Simülasyonu 1 tick ilerlet
    this.stateManager.advanceTick();

    // 2. Her tick'te veya belirli aralıklarla istemcilere state yayınla
    // Ağ trafiğini optimize etmek için snapshot'ı her 200ms'de bir (her 2 tick) broadcast edelim
    if (this.stateManager.currentTick % 2 === 0) {
      this.broadcastState();
    }
  }

  private broadcastState() {
    for (const [userId, client] of this.clients.entries()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        const snapshot = this.stateManager.getSnapshotForPlayer(userId);
        const payload = JSON.stringify({
          type: 'GAME_TICK',
          payload: snapshot,
        });
        client.ws.send(payload);
      }
    }
  }
}
