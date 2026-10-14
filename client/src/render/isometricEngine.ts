export interface IsometricConfig {
  tileWidth: number;
  tileHeight: number;
  mapWidth: number;
  mapHeight: number;
}

export interface RenderableEntity {
  id: string;
  x: number;
  y: number;
  type: 'CAMP' | 'AKINCI' | 'ALP' | 'CERI' | 'ALPAGUT' | 'HORSE_HERD';
  ownerName?: string;
  isSelf?: boolean;
  isConquered?: boolean;
  hp?: number;
  maxHp?: number;
}

interface BattleEffect {
  gridX: number;
  gridY: number;
  startTime: number;
  duration: number;
}

export class IsometricEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: IsometricConfig;
  public cameraX: number = 0;
  public cameraY: number = 0;
  public zoom: number = 1.0;
  private hoveredTile: { x: number; y: number } | null = null;
  public selectedTile: { x: number; y: number } | null = null;
  public onTileSelected?: (tile: { x: number; y: number }) => void;
  private battleEffects: BattleEffect[] = [];

  public fps: number = 60;
  public drawCalls: number = 1;
  private frameCount: number = 0;
  private lastFpsUpdate: number = performance.now();

  constructor(canvas: HTMLCanvasElement, config?: Partial<IsometricConfig>) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;

    this.config = {
      tileWidth: 64,
      tileHeight: 32, // 2:1 Klasik İzometrik Elmas Oranı
      mapWidth: 32,
      mapHeight: 32,
      ...config,
    };

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.setupInteractions();
  }

  private resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.cameraX === 0 && this.cameraY === 0) {
      this.cameraX = this.canvas.width / 2;
      this.cameraY = 140;
    }
  }

  private setupInteractions() {
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        const tile = this.screenToGrid(e.clientX, e.clientY);
        if (this.isValidTile(tile.x, tile.y)) {
          this.selectedTile = tile;
          if (this.onTileSelected) {
            this.onTileSelected(tile);
          }
        }
      } else if (e.button === 2 || e.button === 1) {
        isDragging = true;
        startX = e.clientX - this.cameraX;
        startY = e.clientY - this.cameraY;
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (isDragging) {
        this.cameraX = e.clientX - startX;
        this.cameraY = e.clientY - startY;
      } else {
        const tile = this.screenToGrid(e.clientX, e.clientY);
        if (this.isValidTile(tile.x, tile.y)) {
          this.hoveredTile = tile;
        } else {
          this.hoveredTile = null;
        }
      }
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    this.canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const nextZoom = Math.min(1.8, Math.max(0.6, this.zoom * zoomFactor));
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        this.cameraX = mouseX - ((mouseX - this.cameraX) * nextZoom) / this.zoom;
        this.cameraY = mouseY - ((mouseY - this.cameraY) * nextZoom) / this.zoom;
        this.zoom = nextZoom;
      },
      { passive: false }
    );

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  public triggerBattleEffect(gridX: number, gridY: number) {
    this.battleEffects.push({
      gridX,
      gridY,
      startTime: performance.now(),
      duration: 2400,
    });
  }

  public isValidTile(x: number, y: number): boolean {
    return x >= 0 && x < this.config.mapWidth && y >= 0 && y < this.config.mapHeight;
  }

  public gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
    const halfW = (this.config.tileWidth * this.zoom) / 2;
    const halfH = (this.config.tileHeight * this.zoom) / 2;
    const screenX = (gridX - gridY) * halfW + this.cameraX;
    const screenY = (gridX + gridY) * halfH + this.cameraY;
    return { x: screenX, y: screenY };
  }

  public screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
    const halfW = (this.config.tileWidth * this.zoom) / 2;
    const halfH = (this.config.tileHeight * this.zoom) / 2;
    const dx = screenX - this.cameraX;
    const dy = screenY - this.cameraY;

    const invX = dx / halfW;
    const invY = dy / halfH;

    const gridX = Math.floor((invX + invY) / 2);
    const gridY = Math.floor((invY - invX) / 2);

    return { x: gridX, y: gridY };
  }

  public render(
    tiles: { x: number; y: number; terrain: string; hasCamp?: boolean }[][],
    entities: RenderableEntity[],
    playerCampPos?: { x: number; y: number }
  ) {
    this.updateFps();
    this.drawCalls = 0;

    const ctx = this.ctx;
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawCalls++;

    const halfW = (this.config.tileWidth * this.zoom) / 2;
    const halfH = (this.config.tileHeight * this.zoom) / 2;
    const now = performance.now();

    // 1. ZEMİN KATMANI (2:1 İzometrik Elmas Kiremitler + Prosedürel Arazi Detayları)
    for (let y = 0; y < this.config.mapHeight; y++) {
      for (let x = 0; x < this.config.mapWidth; x++) {
        const { x: sx, y: sy } = this.gridToScreen(x, y);

        if (
          sx + halfW < -120 ||
          sx - halfW > this.canvas.width + 120 ||
          sy + halfH < -120 ||
          sy - halfH > this.canvas.height + 120
        ) {
          continue;
        }

        const tileData = tiles[y] ? tiles[y][x] : null;
        const terrain = tileData ? tileData.terrain : 'STEPPE';

        let dist = 0;
        if (playerCampPos) {
          dist = Math.hypot(x - playerCampPos.x, y - playerCampPos.y);
        }
        const isVisible = dist <= 12.5 || !!tileData?.hasCamp;
        const isExplored = dist <= 20;

        ctx.beginPath();
        ctx.moveTo(sx, sy - halfH);
        ctx.lineTo(sx + halfW, sy);
        ctx.lineTo(sx, sy + halfH);
        ctx.lineTo(sx - halfW, sy);
        ctx.closePath();

        let fillColor = '#2d4a22'; // STEPPE
        if (terrain === 'SUMMER_PASTURE') fillColor = '#386629';
        else if (terrain === 'WINTER_CAMP') fillColor = '#4a4238';
        else if (terrain === 'MOUNTAIN') fillColor = '#3a3d45';
        else if (terrain === 'RIVER') fillColor = '#1e3a5f';

        if (!isVisible) {
          fillColor = isExplored ? '#16201c' : '#0d1117';
        }

        ctx.fillStyle = fillColor;
        ctx.fill();

        ctx.strokeStyle = isVisible ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Prosedürel Arazi Detayları
        if (isVisible) {
          this.drawTerrainDetail(ctx, sx, sy, x, y, terrain, halfW, halfH, now);
        }

        if (this.hoveredTile && this.hoveredTile.x === x && this.hoveredTile.y === y) {
          ctx.beginPath();
          ctx.moveTo(sx, sy - halfH);
          ctx.lineTo(sx + halfW, sy);
          ctx.lineTo(sx, sy + halfH);
          ctx.lineTo(sx - halfW, sy);
          ctx.closePath();
          ctx.fillStyle = 'rgba(212, 175, 55, 0.25)';
          ctx.fill();
        }
        if (this.selectedTile && this.selectedTile.x === x && this.selectedTile.y === y) {
          ctx.beginPath();
          ctx.moveTo(sx, sy - halfH);
          ctx.lineTo(sx + halfW, sy);
          ctx.lineTo(sx, sy + halfH);
          ctx.lineTo(sx - halfW, sy);
          ctx.closePath();
          ctx.strokeStyle = '#ecc94b';
          ctx.lineWidth = 2.2;
          ctx.stroke();
        }
      }
    }
    this.drawCalls++;

    // 2. Y-SORT VARLIK KATMANI
    const sortedEntities = [...entities].sort((a, b) => {
      const depthA = a.y * 1000 + a.x;
      const depthB = b.y * 1000 + b.x;
      return depthA - depthB;
    });

    for (const entity of sortedEntities) {
      const { x: sx, y: sy } = this.gridToScreen(entity.x, entity.y);

      if (entity.type === 'CAMP') {
        this.drawOtag(
          ctx,
          sx,
          sy,
          entity.isSelf || false,
          entity.ownerName,
          entity.isConquered || false
        );
        this.drawCalls++;
      } else {
        this.drawUnit(
          ctx,
          sx,
          sy,
          entity.type,
          entity.isSelf || false,
          entity.hp,
          entity.maxHp
        );
        this.drawCalls++;
      }
    }

    // 3. SAVAŞ VE TURAN OK YAĞMURU GÖRSEL EFEKT KATMANI
    this.renderBattleEffects(ctx, now);
  }

  private drawTerrainDetail(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    gridX: number,
    gridY: number,
    terrain: string,
    halfW: number,
    halfH: number,
    now: number
  ) {
    const z = this.zoom;
    if (terrain === 'MOUNTAIN') {
      const peakH = 22 * z;
      ctx.beginPath();
      ctx.moveTo(sx, sy - peakH);
      ctx.lineTo(sx - halfW * 0.75, sy + halfH * 0.15);
      ctx.lineTo(sx, sy + halfH * 0.65);
      ctx.closePath();
      ctx.fillStyle = '#4a5568';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(sx, sy - peakH);
      ctx.lineTo(sx + halfW * 0.75, sy + halfH * 0.15);
      ctx.lineTo(sx, sy + halfH * 0.65);
      ctx.closePath();
      ctx.fillStyle = '#2d3748';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(sx, sy - peakH);
      ctx.lineTo(sx - halfW * 0.28, sy - peakH * 0.35);
      ctx.lineTo(sx, sy - peakH * 0.18);
      ctx.lineTo(sx + halfW * 0.28, sy - peakH * 0.35);
      ctx.closePath();
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();
    } else if (terrain === 'RIVER') {
      const waveOffset = Math.sin(now * 0.004 + gridY * 0.8) * 3 * z;
      ctx.beginPath();
      ctx.moveTo(sx - 8 * z + waveOffset, sy - 4 * z);
      ctx.quadraticCurveTo(sx, sy, sx + 8 * z - waveOffset, sy + 4 * z);
      ctx.strokeStyle = 'rgba(144, 205, 244, 0.55)';
      ctx.lineWidth = 1.5 * z;
      ctx.stroke();
    } else if (
      terrain === 'SUMMER_PASTURE' ||
      (terrain === 'STEPPE' && (gridX + gridY) % 3 === 0)
    ) {
      const sway = Math.sin(now * 0.003 + gridX * 0.5 + gridY * 0.5) * 1.5 * z;
      ctx.beginPath();
      ctx.moveTo(sx - 4 * z, sy + 2 * z);
      ctx.lineTo(sx - 6 * z + sway, sy - 4 * z);
      ctx.moveTo(sx, sy + 3 * z);
      ctx.lineTo(sx + sway, sy - 5 * z);
      ctx.moveTo(sx + 4 * z, sy + 2 * z);
      ctx.lineTo(sx + 6 * z + sway, sy - 3 * z);
      ctx.strokeStyle = terrain === 'SUMMER_PASTURE' ? '#68d391' : '#48bb78';
      ctx.lineWidth = 1.2 * z;
      ctx.stroke();
    } else if (terrain === 'WINTER_CAMP') {
      ctx.beginPath();
      ctx.moveTo(sx - halfW * 0.45, sy - halfH * 0.2);
      ctx.lineTo(sx, sy - halfH * 0.55);
      ctx.lineTo(sx + halfW * 0.45, sy - halfH * 0.2);
      ctx.strokeStyle = '#8b6f47';
      ctx.lineWidth = 2 * z;
      ctx.stroke();
    }
  }

  private drawOtag(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    isSelf: boolean,
    name?: string,
    isConquered: boolean = false
  ) {
    const z = this.zoom;
    ctx.save();
    // Gölge
    ctx.beginPath();
    ctx.ellipse(sx, sy + 6 * z, 22 * z, 11 * z, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();

    // Otağ Silindirik Alt Duvarı (Kerege)
    ctx.fillStyle = isSelf ? '#e8e0d5' : isConquered ? '#d5e8e6' : '#b8a99a';
    ctx.fillRect(sx - 16 * z, sy - 10 * z, 32 * z, 12 * z);
    ctx.strokeStyle = isSelf || isConquered ? '#d4af37' : '#9b2c2c';
    ctx.lineWidth = 1.5 * z;
    ctx.strokeRect(sx - 16 * z, sy - 10 * z, 32 * z, 12 * z);

    // Keçe Kubbe (Üzük & Şangırak)
    ctx.beginPath();
    ctx.arc(sx, sy - 10 * z, 16 * z, Math.PI, 0, false);
    ctx.closePath();
    ctx.fillStyle = isSelf ? '#f7f3eb' : isConquered ? '#e6fffa' : '#d6c7b2';
    ctx.fill();
    ctx.strokeStyle = isSelf || isConquered ? '#d4af37' : '#c53030';
    ctx.lineWidth = 2 * z;
    ctx.stroke();

    // Otağ Kapısı
    ctx.fillStyle = isSelf || isConquered ? '#744210' : '#4a1c1c';
    ctx.fillRect(sx - 4 * z, sy - 6 * z, 8 * z, 8 * z);

    // Tuğ Direği
    ctx.beginPath();
    ctx.moveTo(sx, sy - 26 * z);
    ctx.lineTo(sx, sy - 40 * z);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2 * z;
    ctx.stroke();

    // Sancak / Bayrak (Fethedilen garnizonlar Göktürk Mavisi #00e5ff & Altın #d4af37 sancağı taşır)
    ctx.fillStyle = isSelf ? '#2b6cb0' : isConquered ? '#00e5ff' : '#dc2626';
    ctx.beginPath();
    ctx.moveTo(sx, sy - 40 * z);
    ctx.lineTo(sx + 13 * z, sy - 35 * z);
    ctx.lineTo(sx, sy - 30 * z);
    ctx.closePath();
    ctx.fill();

    // İsim Etiketi
    if (name) {
      ctx.font = `bold ${Math.max(9, Math.round(11 * z))}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = isSelf ? '#fefcbf' : isConquered ? '#00e5ff' : '#fed7d7';
      ctx.fillText(name, sx, sy - 45 * z);
    }

    ctx.restore();
  }

  private drawUnit(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    type: string,
    isSelf: boolean,
    hp: number = 100,
    maxHp: number = 100
  ) {
    const z = this.zoom;
    ctx.save();

    // Taban Gölgesi ve Birlik Halkası
    ctx.beginPath();
    ctx.ellipse(sx, sy + 4 * z, 12 * z, 6 * z, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();
    ctx.strokeStyle = isSelf ? '#48bb78' : '#f56565';
    ctx.lineWidth = 1.5 * z;
    ctx.stroke();

    if (type === 'AKINCI' || type === 'ALP') {
      ctx.fillStyle = type === 'ALP' ? '#4a5568' : '#744210';
      ctx.beginPath();
      ctx.ellipse(sx, sy - 4 * z, 9 * z, 5 * z, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(sx + 5 * z, sy - 6 * z);
      ctx.lineTo(sx + 10 * z, sy - 13 * z);
      ctx.lineTo(sx + 13 * z, sy - 11 * z);
      ctx.lineTo(sx + 8 * z, sy - 3 * z);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = type === 'ALP' ? '#dd6b20' : '#3182ce';
      ctx.fillRect(sx - 3 * z, sy - 15 * z, 6 * z, 8 * z);
      ctx.beginPath();
      ctx.arc(sx, sy - 17 * z, 3.5 * z, 0, Math.PI * 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();

      if (type === 'AKINCI') {
        ctx.beginPath();
        ctx.arc(sx + 6 * z, sy - 13 * z, 6 * z, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.strokeStyle = '#ecc94b';
        ctx.lineWidth = 1.8 * z;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(sx - 2 * z, sy - 8 * z);
        ctx.lineTo(sx + 9 * z, sy - 25 * z);
        ctx.strokeStyle = '#cbd5e0';
        ctx.lineWidth = 2 * z;
        ctx.stroke();

        ctx.fillStyle = '#e53e3e';
        ctx.beginPath();
        ctx.moveTo(sx + 9 * z, sy - 25 * z);
        ctx.lineTo(sx + 15 * z, sy - 22 * z);
        ctx.lineTo(sx + 7 * z, sy - 19 * z);
        ctx.closePath();
        ctx.fill();
      }
    } else if (type === 'CERI') {
      ctx.fillStyle = '#4a5568';
      ctx.fillRect(sx - 4 * z, sy - 13 * z, 8 * z, 11 * z);

      ctx.beginPath();
      ctx.arc(sx, sy - 15 * z, 4 * z, 0, Math.PI * 2);
      ctx.fillStyle = '#a0aec0';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(sx + 4 * z, sy - 8 * z, 5 * z, 0, Math.PI * 2);
      ctx.fillStyle = '#744210';
      ctx.fill();
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1.5 * z;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(sx - 4 * z, sy - 2 * z);
      ctx.lineTo(sx - 4 * z, sy - 22 * z);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.8 * z;
      ctx.stroke();
    } else if (type === 'ALPAGUT') {
      ctx.fillStyle = '#975a16';
      ctx.fillRect(sx - 5 * z, sy - 15 * z, 10 * z, 13 * z);
      ctx.strokeStyle = '#ecc94b';
      ctx.lineWidth = 1.5 * z;
      ctx.strokeRect(sx - 5 * z, sy - 15 * z, 10 * z, 13 * z);

      ctx.beginPath();
      ctx.arc(sx, sy - 18 * z, 4.5 * z, 0, Math.PI * 2);
      ctx.fillStyle = '#ecc94b';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(sx + 5 * z, sy - 4 * z);
      ctx.lineTo(sx + 5 * z, sy - 28 * z);
      ctx.strokeStyle = '#ecc94b';
      ctx.lineWidth = 2 * z;
      ctx.stroke();

      ctx.fillStyle = '#3182ce';
      ctx.beginPath();
      ctx.moveTo(sx + 5 * z, sy - 28 * z);
      ctx.lineTo(sx + 14 * z, sy - 24 * z);
      ctx.lineTo(sx + 5 * z, sy - 20 * z);
      ctx.closePath();
      ctx.fill();
    }

    // Üst Can Çubuğu (HP Bar)
    const barW = 22 * z;
    const barH = 3.5 * z;
    const barX = sx - barW / 2;
    const barY = sy - 31 * z;
    const ratio = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = ratio > 0.5 ? '#48bb78' : ratio > 0.25 ? '#ecc94b' : '#f56565';
    ctx.fillRect(barX, barY, barW * ratio, barH);

    ctx.restore();
  }

  private renderBattleEffects(ctx: CanvasRenderingContext2D, now: number) {
    this.battleEffects = this.battleEffects.filter((fx) => now - fx.startTime < fx.duration);

    for (const fx of this.battleEffects) {
      const progress = (now - fx.startTime) / fx.duration;
      const { x: sx, y: sy } = this.gridToScreen(fx.gridX, fx.gridY);
      const z = this.zoom;

      ctx.save();

      const radius = (18 + progress * 55) * z;
      ctx.beginPath();
      ctx.ellipse(sx, sy, radius, radius * 0.5, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(236, 201, 75, ${1 - progress})`;
      ctx.lineWidth = 3 * z;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(sx, sy, radius * 0.7, radius * 0.35, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(229, 62, 62, ${1 - progress})`;
      ctx.lineWidth = 2 * z;
      ctx.stroke();

      const arrowCount = 8;
      for (let i = 0; i < arrowCount; i++) {
        const angle = (i / arrowCount) * Math.PI * 2;
        const dropProgress = (progress * 3 + i * 0.12) % 1;
        const ax = sx + Math.cos(angle) * 24 * z * (1 - dropProgress * 0.5);
        const ay = sy - 45 * (1 - dropProgress) * z + Math.sin(angle) * 10 * z;

        ctx.beginPath();
        ctx.moveTo(ax - 4 * z, ay - 12 * z);
        ctx.lineTo(ax, ay);
        ctx.strokeStyle = `rgba(254, 252, 191, ${1 - progress * 0.8})`;
        ctx.lineWidth = 1.6 * z;
        ctx.stroke();
      }

      ctx.restore();
      this.drawCalls++;
    }
  }

  private updateFps() {
    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastFpsUpdate;
    if (elapsed >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }
}
