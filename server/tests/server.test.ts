import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../src/state/gameState.js';
import { exchangeTicket } from '../src/auth/ssoValidator.js';
import { UnitType, UNIT_TEMPLATES } from '@yorukstrategy/core';

describe('Authoritative Server Testleri', () => {
  let stateManager: GameStateManager;

  beforeEach(() => {
    stateManager = new GameStateManager(16, 16);
  });

  it('SSO Validator sahte/dev biletleri başarıyla onaylamalıdır', async () => {
    const user = await exchangeTicket('dev_kursat123', {
      platformAuthUrl: 'http://localhost:8080/api/v1/auth/exchange-ticket',
      clientId: 'game-client-strategy-01',
      clientSecret: 'yoruk_strategy_secret_key',
    });

    expect(user).not.toBeNull();
    expect(user?.userId).toBe('user-kursat123');
    expect(user?.username).toContain('Kürşat');
  });

  it('Harita doğru boyutlarda ve arazi tipleriyle oluşturulmalıdır', () => {
    expect(stateManager.worldMap.width).toBe(16);
    expect(stateManager.worldMap.height).toBe(16);
    expect(stateManager.worldMap.tiles[0][0].terrain).toBe('MOUNTAIN');
    expect(stateManager.worldMap.tiles[5][5].terrain).toBe('SUMMER_PASTURE');
    expect(stateManager.worldMap.tiles[14][2].terrain).toBe('WINTER_CAMP');
  });

  it('Oyuncu kaydı otağ ve başlangıç ordusu oluşturmalıdır', () => {
    const session = stateManager.registerPlayer('u1', 'Bumin_Kagan', 'ws_1');
    expect(session.userId).toBe('u1');
    expect(session.username).toBe('Bumin_Kagan');
    expect(session.camp.army.units.length).toBe(2); // 1 Akıncı, 1 Alp
    expect(session.camp.resources.horse).toBeGreaterThan(0);
    expect(session.camp.otagLevel).toBe(1);
  });

  it('Asker eğitimi kaynak kontrolü yapıp orduya yeni asker eklemelidir', () => {
    const session = stateManager.registerPlayer('u2', 'İstemi_Yabgu', 'ws_2');
    const initialUnitCount = session.camp.army.units.length;
    const initialHorses = session.camp.resources.horse;

    const trained = stateManager.trainUnit('u2', UnitType.AKINCI);
    expect(trained).toBe(true);
    expect(session.camp.army.units.length).toBe(initialUnitCount + 1);
    expect(session.camp.resources.horse).toBe(
      initialHorses - UNIT_TEMPLATES[UnitType.AKINCI].cost.horse!
    );
  });

  it('Oba göçü (moveCamp) pozisyonu, iaşe maliyetini ve yaylak/kışlak durumunu güncellemelidir', () => {
    const session = stateManager.registerPlayer('u3', 'Bilge_Kagan', 'ws_3');
    // Yaylak arazisi (y: 5, x: 2)
    const moved = stateManager.moveCamp('u3', 2, 5);
    expect(moved).toBe(true);
    expect(session.gridX).toBe(2);
    expect(session.gridY).toBe(5);
    expect(session.camp.isInSummerCamp).toBe(true);
    expect(session.camp.isInWinterCamp).toBe(false);

    // Dağ arazisine göç engellenmelidir (y: 1, x: 2)
    const invalidMove = stateManager.moveCamp('u3', 2, 1);
    expect(invalidMove).toBe(false);
  });

  it('Oyun döngüsü tick ilerletmeli ve ekonomi sonuçlarını güncellemelidir', () => {
    stateManager.registerPlayer('u4', 'Kul_Tigin', 'ws_4');
    for (let i = 0; i < 20; i++) {
      stateManager.advanceTick();
    }
    expect(stateManager.currentTick).toBe(20);
    expect(stateManager.lastEconomyResults.has('u4')).toBe(true);
  });

  it('getSnapshotForPlayer diğer oyuncuları ve 3 Rakip Boy Garnizonunu otherCamps içinde döndürmelidir', () => {
    const fullMapManager = new GameStateManager(32, 32);
    fullMapManager.registerPlayer('u5', 'Tonyukuk', 'ws_5');
    fullMapManager.registerPlayer('u6', 'Kapgan_Kagan', 'ws_6');

    const snapshot = fullMapManager.getSnapshotForPlayer('u5');
    expect(snapshot.otherCamps).toBeDefined();
    expect(snapshot.otherCamps.length).toBe(4); // 1 diğer oyuncu + 3 NPC garnizonu
    expect(snapshot.otherCamps.some((c) => c.name === 'Karakurum Garnizonu')).toBe(true);
    expect(snapshot.otherCamps.some((c) => c.name === 'Demirboynuz Obası')).toBe(true);
    expect(snapshot.otherCamps.some((c) => c.name === 'Kuzey Akıncı Kampı')).toBe(true);
  });

  it('executeTuranBattle gerçek Turan Taktiğini çalıştırmalı, garnizonu fethetmeli ve ganimet kazandırmalıdır', () => {
    const fullMapManager = new GameStateManager(32, 32);
    const session = fullMapManager.registerPlayer('u7', 'Mete_Han', 'ws_7');
    const initialGold = session.camp.resources.gold;
    const initialHorse = session.camp.resources.horse;

    const result = fullMapManager.executeTuranBattle('u7', 10, 6);
    expect(result).not.toBeNull();
    expect(result?.winner).toBe('SIDE_A');
    expect(result?.turanTacticExecuted).toBe(true);
    expect(result?.feignedRetreatSuccess).toBe(true);
    expect(result?.ambushDamage).toBeGreaterThan(0);
    expect(result?.garrisonConquered).toBe(true);
    expect(result?.conqueredCount).toBe(1);
    expect(session.camp.resources.gold).toBe(initialGold + 45);
    expect(session.camp.resources.horse).toBe(initialHorse + 15);
    expect(session.camp.army.units[0].experience).toBeGreaterThanOrEqual(25);
  });

  it('upgradeOtag ve holdFeast sunucu aksiyonları otağ seviyesini ve ordu sağlığını güncellemelidir', () => {
    const fullMapManager = new GameStateManager(32, 32);
    const session = fullMapManager.registerPlayer('u8', 'Alparslan', 'ws_8');

    // Kaynak takviyesi
    session.camp.resources.gold = 200;
    session.camp.resources.leather = 120;
    session.camp.resources.iron = 80;
    session.camp.resources.food = 150;

    // Otağ yükseltme
    const upg = fullMapManager.upgradeOtag('u8');
    expect(upg.success).toBe(true);
    expect(upg.newLevel).toBe(2);
    expect(session.camp.otagLevel).toBe(2);

    // Birimi yarala ve Toy düzenle
    session.camp.army.units[0].currentHp = 20;
    session.camp.army.morale = 60;
    const feast = fullMapManager.holdFeast('u8');
    expect(feast.success).toBe(true);
    expect(feast.healedUnits).toBe(1);
    expect(session.camp.army.units[0].currentHp).toBe(session.camp.army.units[0].maxHp);
    expect(session.camp.army.morale).toBe(100);
  });
});
