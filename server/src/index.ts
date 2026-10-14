import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { exchangeTicket } from './auth/ssoValidator.js';
import { GameStateManager } from './state/gameState.js';
import { GameLoop } from './loop/gameLoop.js';
import { UnitType } from '@yorukstrategy/core';

dotenv.config();

const PORT = parseInt(process.env.PORT || '8081', 10);
const PLATFORM_AUTH_URL =
  process.env.PLATFORM_AUTH_URL || 'http://localhost:8080/api/v1/auth/exchange-ticket';
const CLIENT_ID = process.env.CLIENT_ID || 'game-client-strategy-01';
const CLIENT_SECRET = process.env.CLIENT_SECRET || 'yoruk_strategy_secret_key';

// 1. Simülasyon Durum Yöneticisi ve Oyun Döngüsü
const stateManager = new GameStateManager();
const gameLoop = new GameLoop(stateManager);

// 2. HTTP Server (Sağlık kontrolü ve metrikler)
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'UP',
        service: 'yoruk_strategy_server',
        tick: stateManager.currentTick,
        onlinePlayers: stateManager.players.size,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// 3. WebSocket Server
const wss = new WebSocketServer({ server });

wss.on('connection', async (ws: WebSocket, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const ticket = url.searchParams.get('ticket');

  console.log(
    `[WS] Connection attempt from ${req.socket.remoteAddress}, ticket=${ticket?.slice(0, 10)}...`
  );

  // Plan 02: Zero-Login & SSO Ticket Doğrulaması
  if (!ticket) {
    console.warn('[WS] Connection rejected: No ticket provided');
    ws.close(4001, 'Unauthorized Ticket: Ticket parameter missing');
    return;
  }

  const ssoUser = await exchangeTicket(ticket, {
    platformAuthUrl: PLATFORM_AUTH_URL,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
  });

  if (!ssoUser) {
    console.warn('[WS] Connection rejected: Ticket exchange failed');
    ws.close(4001, 'Unauthorized Ticket');
    return;
  }

  console.log(`[WS] Player authenticated successfully: ${ssoUser.username} (${ssoUser.userId})`);

  // Oyuncuyu durum yöneticisine kaydet
  const wsSessionId = Math.random().toString(36).substring(2);
  stateManager.registerPlayer(ssoUser.userId, ssoUser.username, wsSessionId);
  gameLoop.registerClient(ssoUser.userId, ws);

  // İlk bağlantı el sıkışması ve hoş geldin paketi
  ws.send(
    JSON.stringify({
      type: 'INIT_STATE',
      payload: stateManager.getSnapshotForPlayer(ssoUser.userId),
    })
  );

  // İstemciden gelen mesajlar
  ws.on('message', (data: string) => {
    try {
      const message = JSON.parse(data.toString());
      handlePlayerMessage(ssoUser.userId, message, ws);
    } catch (err) {
      console.error('[WS] Failed to parse message:', err);
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Player disconnected: ${ssoUser.username}`);
    gameLoop.removeClient(ssoUser.userId);
    stateManager.removePlayerSession(wsSessionId);
  });
});

function sendImmediateSnapshot(userId: string, ws: WebSocket) {
  ws.send(
    JSON.stringify({
      type: 'GAME_TICK',
      payload: stateManager.getSnapshotForPlayer(userId),
    })
  );
}

function handlePlayerMessage(userId: string, message: any, ws: WebSocket) {
  switch (message.type) {
    case 'TRAIN_UNIT': {
      const unitType = message.unitType as UnitType;
      const success = stateManager.trainUnit(userId, unitType);
      ws.send(
        JSON.stringify({
          type: 'TRAIN_RESULT',
          success,
          unitType,
        })
      );
      sendImmediateSnapshot(userId, ws);
      break;
    }

    case 'MOVE_CAMP': {
      const { x, y } = message;
      const success = stateManager.moveCamp(userId, x, y);
      const reason = stateManager.lastMoveReason.get(userId);
      ws.send(
        JSON.stringify({
          type: 'MOVE_RESULT',
          success,
          x,
          y,
          reason,
        })
      );
      sendImmediateSnapshot(userId, ws);
      break;
    }

    case 'EXECUTE_TURAN': {
      const battleResult = stateManager.executeTuranBattle(userId, message.x, message.y);
      const reason = stateManager.lastBattleReason.get(userId);
      ws.send(
        JSON.stringify({
          type: 'BATTLE_RESULT',
          success: !!battleResult,
          reason,
          payload: battleResult,
        })
      );
      sendImmediateSnapshot(userId, ws);
      break;
    }

    case 'UPGRADE_CAMP':
    case 'UPGRADE_OTAG': {
      const upgradeResult = stateManager.upgradeOtag(userId);
      ws.send(
        JSON.stringify({
          type: 'UPGRADE_OTAG_RESULT',
          ...upgradeResult,
        })
      );
      sendImmediateSnapshot(userId, ws);
      break;
    }

    case 'HOLD_FEAST': {
      const feastResult = stateManager.holdFeast(userId);
      ws.send(
        JSON.stringify({
          type: 'FEAST_RESULT',
          ...feastResult,
        })
      );
      sendImmediateSnapshot(userId, ws);
      break;
    }

    default:
      console.warn(`[WS] Unknown action type: ${message.type}`);
  }
}

// 4. Sunucuyu Başlat
server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`  🏹 YORUK STRATEGY AUTHORITATIVE SERVER RUNNING ON PORT ${PORT}`);
  console.log(`  🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`  📡 WebSocket SSO: ws://localhost:${PORT}/ws?ticket=<TICKET>`);
  console.log(`================================================================`);
  gameLoop.start();
});

export { server, stateManager, gameLoop };
