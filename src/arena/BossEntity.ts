import { BossProfile, Vec2, ArenaMap } from '../shared/types/arena';
import { DialogueSystem } from './DialogueSystem';
import { DialogueBank } from './DialogueBank';
import { bus } from '../shared/EventBus';
import { audio } from '../shell/AudioManager';
import { normalize, dist, angleBetween } from '../shared/utils/math';
import { CollisionSystem } from './CollisionSystem';

export interface BossProjectile {
  pos: Vec2;
  vel: Vec2;
  radius: number;
  lifetimeMs: number;
  damage: number;
  color: string;
}

export class BossEntity {
  public phase: 1 | 2 | 3 = 1;
  public pos: Vec2;
  public vel: Vec2 = { x: 0, y: 0 };
  public radius: number = 28;
  public hp: number;
  public maxHp: number;
  public aimAngle: number = 0;
  public projectiles: BossProjectile[] = [];
  public isDefeated: boolean = false;

  private attackTimer: number = 0;
  private attackInterval: number = 2000;
  private dialogueTimer: number = 0;
  private dialogueLines: string[] = [];
  private dialogueIndex: number = 0;

  constructor(
    public profile: BossProfile,
    startPos: Vec2,
    private dialogue: DialogueSystem
  ) {
    this.pos = { ...startPos };
    this.maxHp = 120 * profile.intensityLevel;
    this.hp = this.maxHp;

    this.dialogueLines = DialogueBank.load(
      profile.toolId,
      profile.dialogueTier,
      profile.deviationType,
      profile.wasReconciled
    );

    // Initial dialogue line
    setTimeout(() => {
      if (this.dialogueLines.length > 0) {
        this.dialogue.queue(this.dialogueLines[0], 5000, profile.toolId.toUpperCase());
        this.dialogueIndex = 1;
      }
    }, 1200);
  }

  takeDamage(amount: number) {
    if (this.isDefeated) return;
    this.hp -= amount;
    audio.playHitEnemy();

    const ratio = this.hp / this.maxHp;
    if (ratio <= 0.6 && this.phase === 1) {
      this.setPhase(2);
    } else if (ratio <= 0.3 && this.phase === 2) {
      this.setPhase(3);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDefeated = true;
      bus.emit('arena:boss-phase', { phase: 3 });
      bus.emit('arena:resolution', {
        choice: 'reconcile', // Handled in resolution scene
        toolId: this.profile.toolId,
      });
    }
  }

  private setPhase(newPhase: 2 | 3) {
    this.phase = newPhase;
    bus.emit('arena:boss-phase', { phase: newPhase });
    audio.playBossPhaseChange();

    const line = DialogueBank.getPhaseLine(
      this.profile.toolId,
      newPhase,
      this.profile.deviationType
    );
    this.dialogue.queue(line, 4500, this.profile.toolId.toUpperCase());

    this.attackInterval = newPhase === 2 ? 1400 : 900;
  }

  update(playerPos: Vec2, dt: number, map: ArenaMap): { hitsPlayer: boolean; attackDamage: number } {
    if (this.isDefeated) return { hitsPlayer: false, attackDamage: 0 };

    this.aimAngle = angleBetween(this.pos, playerPos);
    this.attackTimer += dt;
    this.dialogueTimer += dt;

    // Periodic dialogue delivery
    if (this.dialogueTimer > 11000 && this.dialogueIndex < this.dialogueLines.length) {
      this.dialogueTimer = 0;
      this.dialogue.queue(
        this.dialogueLines[this.dialogueIndex],
        5000,
        this.profile.toolId.toUpperCase()
      );
      this.dialogueIndex++;
    }

    // Boss movement
    const d = dist(this.pos, playerPos);
    let speed = 1.1 + (this.phase - 1) * 0.4;
    let targetDist = this.profile.deviationType === 'excess' ? 60 : 180;

    let moveDir: Vec2 = { x: 0, y: 0 };
    if (d > targetDist + 30) {
      moveDir = normalize({ x: playerPos.x - this.pos.x, y: playerPos.y - this.pos.y });
    } else if (d < targetDist - 30) {
      moveDir = normalize({ x: this.pos.x - playerPos.x, y: this.pos.y - playerPos.y });
    } else {
      // Orbit player
      const orbitAngle = this.aimAngle + Math.PI / 2;
      moveDir = { x: Math.cos(orbitAngle), y: Math.sin(orbitAngle) };
    }

    const moveX = moveDir.x * speed;
    const moveY = moveDir.y * speed;

    if (moveX !== 0 && CollisionSystem.isWalkable({ x: this.pos.x + moveX, y: this.pos.y }, this.radius, map)) {
      this.pos.x += moveX;
    }
    if (moveY !== 0 && CollisionSystem.isWalkable({ x: this.pos.x, y: this.pos.y + moveY }, this.radius, map)) {
      this.pos.y += moveY;
    }

    this.pos = CollisionSystem.resolveCircleTileCollisions(this.pos, this.radius, map);

    // Boss Attacks based on tool nature
    if (this.attackTimer >= this.attackInterval) {
      this.attackTimer = 0;
      this.performSpecialAttack(playerPos);
    }

    // Update projectiles
    let projectileDamage = 0;
    this.projectiles = this.projectiles.filter(proj => {
      proj.pos.x += proj.vel.x;
      proj.pos.y += proj.vel.y;
      proj.lifetimeMs -= dt;

      // Check hit player
      if (dist(proj.pos, playerPos) < proj.radius + 14) {
        projectileDamage += proj.damage;
        return false;
      }
      return proj.lifetimeMs > 0;
    });

    if (projectileDamage > 0) {
      return { hitsPlayer: true, attackDamage: projectileDamage };
    }

    // Body contact damage
    if (d < this.radius + 14) {
      return { hitsPlayer: true, attackDamage: 12 };
    }

    return { hitsPlayer: false, attackDamage: 0 };
  }

  private performSpecialAttack(playerPos: Vec2) {
    const baseAngle = angleBetween(this.pos, playerPos);

    switch (this.profile.toolId) {
      case 'brush': {
        // Sweeping arc of fluid ink slashes
        const count = this.phase === 1 ? 3 : this.phase === 2 ? 5 : 7;
        for (let i = 0; i < count; i++) {
          const spread = (i - (count - 1) / 2) * 0.25;
          const angle = baseAngle + spread;
          this.projectiles.push({
            pos: { ...this.pos },
            vel: { x: Math.cos(angle) * 3.5, y: Math.sin(angle) * 3.5 },
            radius: 8,
            lifetimeMs: 2500,
            damage: 12,
            color: '#65705A',
          });
        }
        break;
      }

      case 'eraser': {
        // Expanding void bubbles that erase matter
        const count = this.phase * 2;
        for (let i = 0; i < count; i++) {
          const angle = baseAngle + (Math.random() - 0.5) * 1.2;
          this.projectiles.push({
            pos: { ...this.pos },
            vel: { x: Math.cos(angle) * 2.8, y: Math.sin(angle) * 2.8 },
            radius: 14,
            lifetimeMs: 3200,
            damage: 15,
            color: '#9E9D97',
          });
        }
        break;
      }

      case 'line': {
        // Fast piercing geometric laser lines
        for (let i = 0; i < (this.phase === 3 ? 3 : 1); i++) {
          const angle = baseAngle + (i - 1) * 0.3;
          this.projectiles.push({
            pos: { ...this.pos },
            vel: { x: Math.cos(angle) * 6.5, y: Math.sin(angle) * 6.5 },
            radius: 6,
            lifetimeMs: 1800,
            damage: 18,
            color: '#292826',
          });
        }
        break;
      }

      case 'spray': {
        // Volley of small erratic particles
        const count = this.phase * 6;
        for (let i = 0; i < count; i++) {
          const angle = baseAngle + (Math.random() - 0.5) * 1.5;
          const speed = 2.5 + Math.random() * 2.5;
          this.projectiles.push({
            pos: { ...this.pos },
            vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
            radius: 4,
            lifetimeMs: 2000,
            damage: 8,
            color: '#C79A58',
          });
        }
        break;
      }

      case 'stamp': {
        // Shockwave rings
        const count = 8;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          this.projectiles.push({
            pos: { ...this.pos },
            vel: { x: Math.cos(angle) * 3.0, y: Math.sin(angle) * 3.0 },
            radius: 10,
            lifetimeMs: 2200,
            damage: 14,
            color: '#634832',
          });
        }
        break;
      }

      case 'fill': {
        // Slow massive creeping pool
        this.projectiles.push({
          pos: { ...this.pos },
          vel: { x: Math.cos(baseAngle) * 1.8, y: Math.sin(baseAngle) * 1.8 },
          radius: 20,
          lifetimeMs: 3800,
          damage: 20,
          color: '#7A3942',
        });
        break;
      }

      case 'smudge': {
        // Homing cloud of distortion
        const count = this.phase + 1;
        for (let i = 0; i < count; i++) {
          const angle = baseAngle + (i - 0.5) * 0.6;
          this.projectiles.push({
            pos: { ...this.pos },
            vel: { x: Math.cos(angle) * 2.6, y: Math.sin(angle) * 2.6 },
            radius: 12,
            lifetimeMs: 3000,
            damage: 12,
            color: '#657A83',
          });
        }
        break;
      }
    }
  }
}
