import { IsometricEngine, RenderableEntity } from './render/isometricEngine.js';
import { NetworkManager, GameSnapshot } from './net/networkManager.js';
import { HudController } from './ui/hud.js';
import { UnitType } from '@yorukstrategy/core';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // 1. 2:1 İzometrik Elmas Motoru
  const engine = new IsometricEngine(canvas);

  // 2. En son alınan sunucu snapshot'ı
  let latestSnapshot: GameSnapshot | null = null;

  // 3. Ağ Yöneticisi ve HUD Entegrasyonu
  const network = new NetworkManager();

  const hud = new HudController({
    onTrain: (unitType: UnitType) => {
      network.trainUnit(unitType);
    },
    onMigrate: () => {
      if (!engine.selectedTile) {
        hud.addLogMessage('Lütfen haritada göç etmek istediğiniz bir kiremit seçin!', true);
        return;
      }
      network.moveCamp(engine.selectedTile.x, engine.selectedTile.y);
    },
    onTuran: () => {
      const targetX = engine.selectedTile?.x;
      const targetY = engine.selectedTile?.y;
      hud.addLogMessage(
        'TURAN TAKTİĞİ EMRİ VERİLDİ: Merkez sahte ricat yapıyor, kanatlar Hilal Kapanı kuruyor!',
        true
      );
      network.executeTuran(targetX, targetY);
    },
  });

  network.connect(
    (snapshot: GameSnapshot) => {
      latestSnapshot = snapshot;

      // HUD Güncellemeleri
      if (snapshot.self) {
        hud.updateResources(snapshot.self.camp.resources);
        hud.updatePlayerInfo(
          snapshot.self.username,
          snapshot.self.camp,
          snapshot.self.gridX,
          snapshot.self.gridY
        );
      }

      if (snapshot.lastEconomy) {
        hud.updateSeason(snapshot.lastEconomy.season);
      }
    },
    (logMsg: any) => {
      hud.addLogMessage(logMsg.text, !!logMsg.isAlert);
      if (logMsg.battleResult) {
        engine.triggerBattleEffect(
          logMsg.battleResult.targetX ?? 10,
          logMsg.battleResult.targetY ?? 6
        );
      }
    }
  );

  // 4. Ana 60 FPS Render Döngüsü
  function gameLoop() {
    if (latestSnapshot && latestSnapshot.worldMap) {
      const entities: RenderableEntity[] = [];

      // Rakip Boy Garnizonları ve diğer oyuncu obaları
      if (latestSnapshot.otherCamps) {
        for (const rival of latestSnapshot.otherCamps) {
          entities.push({
            id: rival.id,
            x: rival.gridX,
            y: rival.gridY,
            type: 'CAMP',
            ownerName: rival.name,
            isSelf: false,
          });
          // Garnizon muhafız birliği
          entities.push({
            id: `${rival.id}_guard`,
            x: rival.gridX + 1,
            y: rival.gridY,
            type: 'CERI',
            isSelf: false,
            hp: 100,
            maxHp: 100,
          });
        }
      }

      // Kendi Obamızı ve ordumuzu ekle
      if (latestSnapshot.self) {
        entities.push({
          id: latestSnapshot.self.userId,
          x: latestSnapshot.self.gridX,
          y: latestSnapshot.self.gridY,
          type: 'CAMP',
          ownerName: latestSnapshot.self.username,
          isSelf: true,
        });

        // Ordudaki birliklerin görsel temsili (obanın etrafında dizili)
        const units = latestSnapshot.self.camp?.army?.units || [];
        units.slice(0, 8).forEach((unit: any, idx: number) => {
          const offsetX = (idx % 3) - 1;
          const offsetY = Math.floor(idx / 3) + 1;
          entities.push({
            id: unit.id,
            x: latestSnapshot!.self!.gridX + offsetX,
            y: latestSnapshot!.self!.gridY + offsetY,
            type: unit.type,
            isSelf: true,
            hp: unit.currentHp,
            maxHp: unit.maxHp,
          });
        });
      }

      const playerPos = latestSnapshot.self
        ? { x: latestSnapshot.self.gridX, y: latestSnapshot.self.gridY }
        : undefined;

      engine.render(latestSnapshot.worldMap.tiles, entities, playerPos);
      hud.updatePerformance(engine.fps, engine.drawCalls);
    }

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
