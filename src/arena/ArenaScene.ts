import { ArenaMap } from '../shared/types/arena';
import { GameLoop } from './GameLoop';
import { ArenaRenderer } from './ArenaRenderer';
import { PlayerController } from './PlayerController';
import { EnemyFactory, ArenaEnemy } from './EnemyFactory';
import { BossEntity } from './BossEntity';
import { DialogueSystem } from './DialogueSystem';
import { bus } from '../shared/EventBus';
import { audio } from '../shell/AudioManager';
import { CollisionSystem } from './CollisionSystem';

export class ArenaScene {
  public canvas: HTMLCanvasElement;
  public renderer: ArenaRenderer;
  public loop: GameLoop;
  public player: PlayerController;
  public enemies: ArenaEnemy[] = [];
  public boss: BossEntity;
  public dialogue: DialogueSystem;
  private cleanups: Array<() => void> = [];
  private isDefeated = false;
  private enemyFactory = new EnemyFactory();

  constructor(
    private container: HTMLElement,
    private map: ArenaMap,
    private onBossDefeated?: () => void,
    private onPlayerDefeated?: () => void
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'w-full h-full object-contain rounded shadow-lg select-none';
    this.container.appendChild(this.canvas);

    this.renderer = new ArenaRenderer(this.canvas, 792, 576);
    this.dialogue = new DialogueSystem();
    this.player = new PlayerController(this.map.playerStart);
    this.boss = new BossEntity(this.map.bossProfile, this.map.bossSpawn, this.dialogue);

    this.spawnInitialEnemies();

    this.loop = new GameLoop(
      (dt) => this.update(dt),
      (alpha) => this.render(alpha)
    );
  }

  private spawnInitialEnemies() {
    this.map.enemies.forEach(template => {
      for (let i = 0; i < template.count; i++) {
        // Offset spawn positions around arena corners
        const offsetAngle = (i / template.count) * Math.PI * 2;
        const spawnX = Math.max(
          40,
          Math.min(
            this.map.cols * this.map.tileSize - 40,
            this.map.bossSpawn.x + Math.cos(offsetAngle) * (60 + i * 20)
          )
        );
        const spawnY = Math.max(
          40,
          Math.min(
            this.map.rows * this.map.tileSize - 40,
            this.map.bossSpawn.y + Math.sin(offsetAngle) * (60 + i * 20)
          )
        );

        const enemy = this.enemyFactory.createEnemy(
          template.toolOrigin,
          template.movementStyle,
          { x: spawnX, y: spawnY },
          template.health,
          template.speed
        );
        this.enemies.push(enemy);
      }
    });
  }

  public mount() {
    audio.startArenaAmbience(this.map.bossProfile.intensityLevel);

    const onKeyDown = (e: KeyboardEvent) => {
      this.player.handleKeyDown(e.code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.player.handleKeyUp(e.code);
    };

    const getCanvasPos = (clientX: number, clientY: number) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = 792 / rect.width;
      const scaleY = 576 / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const onMouseMove = (e: MouseEvent) => {
      const pos = getCanvasPos(e.clientX, e.clientY);
      this.player.handleMouseMove(pos.x, pos.y);
    };

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      this.player.handleMouseDown(e.button);
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    this.canvas.addEventListener('mousemove', onMouseMove);
    this.canvas.addEventListener('mousedown', onMouseDown);
    this.canvas.addEventListener('contextmenu', onContextMenu);

    this.cleanups.push(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      this.canvas.removeEventListener('mousemove', onMouseMove);
      this.canvas.removeEventListener('mousedown', onMouseDown);
      this.canvas.removeEventListener('contextmenu', onContextMenu);
    });

    this.loop.start();
  }

  private update(dt: number) {
    if (this.isDefeated) return;

    const now = performance.now();
    this.dialogue.update(now);

    // Update Player
    this.player.update(dt, this.map);

    // Player Slash Attack Collisions
    if (this.player.currentSlash) {
      const slash = this.player.currentSlash;

      // Hit boss
      if (
        !this.boss.isDefeated &&
        CollisionSystem.checkEntityOverlap(slash, slash.radius, this.boss.pos, this.boss.radius)
      ) {
        this.boss.takeDamage(slash.damage);
        this.renderer.spawnHitParticles(this.boss.pos.x, this.boss.pos.y, '#7A3942', 10);
        if (this.boss.isDefeated && this.onBossDefeated) {
          this.onBossDefeated();
        }
      }

      // Hit enemies
      this.enemies.forEach(enemy => {
        if (CollisionSystem.checkEntityOverlap(slash, slash.radius, enemy.pos, enemy.radius)) {
          enemy.hp -= slash.damage;
          this.renderer.spawnHitParticles(enemy.pos.x, enemy.pos.y, enemy.color, 6);
          audio.playHitEnemy();
          if (enemy.hp <= 0) {
            bus.emit('arena:enemy-defeated', { enemyId: enemy.id, toolOrigin: enemy.toolOrigin });
          }
        }
      });
    }

    // Remove defeated enemies
    this.enemies = this.enemies.filter(e => e.hp > 0);

    // Update Enemies
    this.enemies.forEach(enemy => {
      const res = this.enemyFactory.updateEnemy(enemy, this.player.pos, dt, this.map);
      if (res.hitsPlayer) {
        this.player.takeDamage(res.attackDamage, enemy.id);
        this.renderer.spawnHitParticles(this.player.pos.x, this.player.pos.y, '#7A3942', 8);
      }
    });

    // Update Boss
    if (!this.boss.isDefeated) {
      const bossRes = this.boss.update(this.player.pos, dt, this.map);
      if (bossRes.hitsPlayer) {
        this.player.takeDamage(bossRes.attackDamage, 'boss');
        this.renderer.spawnHitParticles(this.player.pos.x, this.player.pos.y, '#7A3942', 10);
      }
    }

    // Check Player Death
    if (this.player.hp <= 0 && !this.isDefeated) {
      this.isDefeated = true;
      if (this.onPlayerDefeated) {
        this.onPlayerDefeated();
      }
    }
  }

  private render(alpha: number) {
    this.renderer.render(
      this.map,
      this.player,
      this.enemies,
      this.boss,
      this.dialogue,
      alpha
    );
  }

  public destroy() {
    this.loop.stop();
    this.dialogue.clear();
    this.cleanups.forEach(fn => fn());
    this.canvas.remove();
  }
}
