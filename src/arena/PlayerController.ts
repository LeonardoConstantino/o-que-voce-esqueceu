import { Vec2, ArenaMap } from '../shared/types/arena';
import { CollisionSystem } from './CollisionSystem';
import { normalize, angleBetween, clamp } from '../shared/utils/math';
import { audio } from '../shell/AudioManager';
import { bus } from '../shared/EventBus';

export interface PlayerAttackSlash {
  angle: number;
  x: number;
  y: number;
  radius: number;
  lifetimeMs: number;
  maxLifetimeMs: number;
  damage: number;
}

export class PlayerController {
  public pos: Vec2;
  public vel: Vec2 = { x: 0, y: 0 };
  public radius: number = 14;
  public hp: number = 100;
  public maxHp: number = 100;
  public speed: number = 3.2;
  public aimAngle: number = 0;

  // Dash
  public isDashing: boolean = false;
  private dashCooldownMs: number = 0;
  private dashDurationMs: number = 0;
  private dashDirection: Vec2 = { x: 0, y: 0 };

  // Attack
  public isAttacking: boolean = false;
  private attackCooldownMs: number = 0;
  public currentSlash: PlayerAttackSlash | null = null;

  // Invulnerability
  public invulnerableMs: number = 0;

  // Inputs
  private keys: Record<string, boolean> = {};
  private mousePos: Vec2 = { x: 0, y: 0 };
  private mouseCanvasOffset: Vec2 = { x: 0, y: 0 };

  constructor(startPos: Vec2) {
    this.pos = { ...startPos };
  }

  handleKeyDown(code: string) {
    this.keys[code] = true;
    if (code === 'Space') {
      this.tryDash();
    }
  }

  handleKeyUp(code: string) {
    this.keys[code] = false;
  }

  handleMouseMove(canvasX: number, canvasY: number) {
    this.mousePos = { x: canvasX, y: canvasY };
    this.aimAngle = angleBetween(this.pos, this.mousePos);
  }

  handleMouseDown(button: number) {
    if (button === 0) {
      this.tryAttack();
    } else if (button === 2) {
      this.tryDash();
    }
  }

  private tryAttack() {
    if (this.attackCooldownMs > 0 || this.isDashing) return;

    this.isAttacking = true;
    this.attackCooldownMs = 320;

    this.currentSlash = {
      angle: this.aimAngle,
      x: this.pos.x + Math.cos(this.aimAngle) * 22,
      y: this.pos.y + Math.sin(this.aimAngle) * 22,
      radius: 36,
      lifetimeMs: 160,
      maxLifetimeMs: 160,
      damage: 25,
    };

    audio.playPlayerAttack();
  }

  private tryDash() {
    if (this.dashCooldownMs > 0 || this.isDashing) return;

    // Dash towards input direction, or aim direction if standing still
    let moveX = 0;
    let moveY = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    let dir = normalize({ x: moveX, y: moveY });
    if (dir.x === 0 && dir.y === 0) {
      dir = { x: Math.cos(this.aimAngle), y: Math.sin(this.aimAngle) };
    }

    this.isDashing = true;
    this.dashDirection = dir;
    this.dashDurationMs = 180;
    this.dashCooldownMs = 600;
    this.invulnerableMs = 220;

    audio.playPlayerDash();
  }

  takeDamage(amount: number, sourceId: string): boolean {
    if (this.invulnerableMs > 0 || this.hp <= 0) return false;

    this.hp = Math.max(0, this.hp - amount);
    this.invulnerableMs = 700;
    audio.playPlayerDamage();
    bus.emit('arena:player-hit', { damage: amount, source: sourceId });

    if (this.hp <= 0) {
      bus.emit('arena:session-end', { outcome: 'defeated' });
    }
    return true;
  }

  update(dt: number, map: ArenaMap) {
    if (this.dashCooldownMs > 0) this.dashCooldownMs -= dt;
    if (this.attackCooldownMs > 0) this.attackCooldownMs -= dt;
    if (this.invulnerableMs > 0) this.invulnerableMs -= dt;

    if (this.currentSlash) {
      this.currentSlash.lifetimeMs -= dt;
      if (this.currentSlash.lifetimeMs <= 0) {
        this.currentSlash = null;
        this.isAttacking = false;
      }
    }

    let moveX = 0;
    let moveY = 0;

    if (this.isDashing) {
      this.dashDurationMs -= dt;
      if (this.dashDurationMs <= 0) {
        this.isDashing = false;
      }
      moveX = this.dashDirection.x * 7.5;
      moveY = this.dashDirection.y * 7.5;
    } else {
      if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

      const norm = normalize({ x: moveX, y: moveY });
      moveX = norm.x * this.speed;
      moveY = norm.y * this.speed;
    }

    // Apply movement with smooth axis separation (wall sliding)
    if (moveX !== 0) {
      const nextX = this.pos.x + moveX;
      if (CollisionSystem.isWalkable({ x: nextX, y: this.pos.y }, this.radius, map)) {
        this.pos.x = nextX;
      }
    }

    if (moveY !== 0) {
      const nextY = this.pos.y + moveY;
      if (CollisionSystem.isWalkable({ x: this.pos.x, y: nextY }, this.radius, map)) {
        this.pos.y = nextY;
      }
    }

    // Push out of any overlaps and enforce arena bounds
    this.pos = CollisionSystem.resolveCircleTileCollisions(this.pos, this.radius, map);

    // Aim angle update
    this.aimAngle = angleBetween(this.pos, this.mousePos);
  }
}
