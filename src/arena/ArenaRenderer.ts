import { ArenaMap, TileType, Vec2 } from '../shared/types/arena';
import { PlayerController } from './PlayerController';
import { ArenaEnemy } from './EnemyFactory';
import { BossEntity } from './BossEntity';
import { DialogueSystem } from './DialogueSystem';
import { MASTER_PALETTE } from '../shared/utils/color';
import { MonsterArtist } from './MonsterArtist';

export class ArenaRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    life: number;
    maxLife: number;
    size: number;
  }> = [];

  constructor(
    private canvas: HTMLCanvasElement,
    width: number = 792,
    height: number = 576
  ) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('2D context not available');
    this.ctx = context;
  }

  public spawnHitParticles(x: number, y: number, color: string, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 0,
        maxLife: 200 + Math.random() * 200,
        size: 2 + Math.random() * 3,
      });
    }
  }

  public render(
    map: ArenaMap,
    player: PlayerController,
    enemies: ArenaEnemy[],
    boss: BossEntity,
    dialogue: DialogueSystem,
    _alpha: number,
    dt: number = 16
  ) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Background Void
    ctx.fillStyle = MASTER_PALETTE.vazio;
    ctx.fillRect(0, 0, this.width, this.height);

    // Render Tiles
    this.renderTiles(map);

    // Update & Render Particles
    this.renderParticles(dt);

    // Render Enemies
    enemies.forEach(enemy => this.renderEnemy(enemy));

    // Render Boss
    if (!boss.isDefeated) {
      this.renderBoss(boss);
    }

    // Render Player
    this.renderPlayer(player);

    // Render Dialogue
    this.renderDialogue(dialogue);
  }

  private renderTiles(map: ArenaMap) {
    const ctx = this.ctx;
    const size = map.tileSize;
    const primaryColor = map.palette[0] || MASTER_PALETTE.papelVivo;
    const secondaryColor = map.palette[1] || MASTER_PALETTE.grafiteUmido;

    for (let r = 0; r < map.rows; r++) {
      for (let c = 0; c < map.cols; c++) {
        const tile = map.tiles[r][c];
        const x = c * size;
        const y = r * size;

        switch (tile) {
          case 'floor':
            ctx.fillStyle = MASTER_PALETTE.papelVivo;
            ctx.fillRect(x, y, size, size);
            // Subtle grid grain
            ctx.strokeStyle = 'rgba(41, 40, 38, 0.06)';
            ctx.strokeRect(x, y, size, size);
            break;

          case 'obstacle':
            ctx.fillStyle = secondaryColor;
            ctx.fillRect(x, y, size, size);
            // Ink block border
            ctx.strokeStyle = MASTER_PALETTE.grafiteUmido;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
            break;

          case 'ink_pool':
            ctx.fillStyle = primaryColor;
            ctx.fillRect(x, y, size, size);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.beginPath();
            ctx.arc(x + size / 2, y + size / 2, size * 0.4, 0, Math.PI * 2);
            ctx.fill();
            break;

          case 'void':
            // Dark abyssal tile with subtle star dust
            ctx.fillStyle = MASTER_PALETTE.vazio;
            ctx.fillRect(x, y, size, size);
            break;
        }
      }
    }
  }

  private renderParticles(dt: number) {
    const ctx = this.ctx;
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life += dt;
      const progress = p.life / p.maxLife;

      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - progress);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.restore();

      return p.life < p.maxLife;
    });
  }

  private renderPlayer(player: PlayerController) {
    const ctx = this.ctx;
    ctx.save();

    // Aim Line
    ctx.strokeStyle = 'rgba(41, 40, 38, 0.2)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(player.pos.x, player.pos.y);
    ctx.lineTo(
      player.pos.x + Math.cos(player.aimAngle) * 45,
      player.pos.y + Math.sin(player.aimAngle) * 45
    );
    ctx.stroke();
    ctx.setLineDash([]);

    // Player body (Graphite Stylus Core)
    ctx.translate(player.pos.x, player.pos.y);
    ctx.rotate(player.aimAngle);

    // Invulnerability flashing
    if (player.invulnerableMs > 0 && Math.floor(player.invulnerableMs / 60) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 2, player.radius * 0.9, player.radius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stylus needle tip & ring
    ctx.fillStyle = MASTER_PALETTE.grafiteUmido;
    ctx.beginPath();
    ctx.moveTo(player.radius + 4, 0);
    ctx.lineTo(-player.radius + 2, -player.radius * 0.7);
    ctx.lineTo(-player.radius + 6, 0);
    ctx.lineTo(-player.radius + 2, player.radius * 0.7);
    ctx.closePath();
    ctx.fill();

    // Core light gem
    ctx.fillStyle = MASTER_PALETTE.ambarAtelier;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Render Slash Arc
    if (player.currentSlash) {
      const slash = player.currentSlash;
      const progress = 1 - slash.lifetimeMs / slash.maxLifetimeMs;
      ctx.save();
      ctx.translate(player.pos.x, player.pos.y);
      ctx.rotate(slash.angle);

      ctx.strokeStyle = MASTER_PALETTE.grafiteUmido;
      ctx.lineWidth = 4 * (1 - progress);
      ctx.beginPath();
      ctx.arc(0, 0, slash.radius, -0.8, 0.8);
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderEnemy(enemy: ArenaEnemy) {
    MonsterArtist.drawEnemy(this.ctx, enemy, Date.now());
  }

  private renderBoss(boss: BossEntity) {
    MonsterArtist.drawBoss(this.ctx, boss);

    // Render Boss Projectiles with distinct handcrafted forms
    boss.projectiles.forEach(proj => {
      MonsterArtist.drawProjectile(this.ctx, proj);
    });
  }

  private renderDialogue(dialogue: DialogueSystem) {
    if (!dialogue.current) return;

    const ctx = this.ctx;
    const text = dialogue.current.text;
    ctx.save();

    ctx.font = 'italic 16px serif';
    ctx.textAlign = 'center';
    const textWidth = ctx.measureText(text).width;

    const boxW = textWidth + 48;
    const boxH = 44;
    const boxX = this.width / 2 - boxW / 2;
    const boxY = 24;

    // Background banner
    ctx.fillStyle = 'rgba(18, 18, 20, 0.88)';
    ctx.fillRect(boxX, boxY, boxW, boxH);

    ctx.strokeStyle = 'rgba(232, 225, 211, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Text
    ctx.fillStyle = MASTER_PALETTE.papelVivo;
    ctx.fillText(text, this.width / 2, boxY + 27);

    ctx.restore();
  }
}
