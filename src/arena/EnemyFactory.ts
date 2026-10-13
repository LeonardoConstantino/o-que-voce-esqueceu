import { ToolId } from '../shared/types/tools';
import { MovementStyle, Vec2, ArenaMap } from '../shared/types/arena';
import { normalize, dist, angleBetween } from '../shared/utils/math';
import { CollisionSystem } from './CollisionSystem';
import { bus } from '../shared/EventBus';

export interface ArenaEnemy {
  id: string;
  toolOrigin: ToolId;
  movementStyle: MovementStyle;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  color: string;
  stateTimer: number;
  attackCooldown: number;
  renderAngle: number;
}

export class EnemyFactory {
  private nextId = 1;

  createEnemy(
    toolOrigin: ToolId,
    movementStyle: MovementStyle,
    pos: Vec2,
    health: number = 25,
    speed: number = 1.4
  ): ArenaEnemy {
    const id = `enemy_${toolOrigin}_${this.nextId++}`;
    const colorMap: Record<ToolId, string> = {
      brush: '#65705A',
      eraser: '#9E9D97',
      fill: '#7A3942',
      line: '#292826',
      spray: '#C79A58',
      stamp: '#634832',
      smudge: '#657A83',
    };

    return {
      id,
      toolOrigin,
      movementStyle,
      pos: { ...pos },
      vel: { x: 0, y: 0 },
      radius: toolOrigin === 'stamp' ? 16 : toolOrigin === 'spray' ? 10 : 13,
      hp: health,
      maxHp: health,
      speed,
      damage: 10,
      color: colorMap[toolOrigin] || '#292826',
      stateTimer: Math.random() * 1000,
      attackCooldown: 0,
      renderAngle: 0,
    };
  }

  updateEnemy(
    enemy: ArenaEnemy,
    playerPos: Vec2,
    dt: number,
    map: ArenaMap
  ): { hitsPlayer: boolean; attackDamage: number } {
    enemy.stateTimer += dt;
    if (enemy.attackCooldown > 0) enemy.attackCooldown -= dt;

    const d = dist(enemy.pos, playerPos);
    let moveDir: Vec2 = { x: 0, y: 0 };
    enemy.renderAngle = angleBetween(enemy.pos, playerPos);

    switch (enemy.movementStyle) {
      case 'organic-curved': {
        // Slithers in undulating curved path toward player
        const baseAngle = angleBetween(enemy.pos, playerPos);
        const wave = Math.sin(enemy.stateTimer * 0.005) * 0.8;
        const currentAngle = baseAngle + wave;
        moveDir = { x: Math.cos(currentAngle), y: Math.sin(currentAngle) };
        break;
      }

      case 'retreating': {
        // Eraser retreats if too close, approaches if far
        if (d < 140) {
          moveDir = normalize({ x: enemy.pos.x - playerPos.x, y: enemy.pos.y - playerPos.y });
        } else {
          moveDir = normalize({ x: playerPos.x - enemy.pos.x, y: playerPos.y - enemy.pos.y });
        }
        break;
      }

      case 'flooding': {
        // Heavy slow push directly forward
        moveDir = normalize({ x: playerPos.x - enemy.pos.x, y: playerPos.y - enemy.pos.y });
        break;
      }

      case 'straight-charge': {
        // Pauses, then charges straight
        const cycle = enemy.stateTimer % 2400;
        if (cycle < 1600) {
          moveDir = { x: 0, y: 0 };
        } else {
          moveDir = normalize({ x: playerPos.x - enemy.pos.x, y: playerPos.y - enemy.pos.y });
          moveDir.x *= 2.6;
          moveDir.y *= 2.6;
        }
        break;
      }

      case 'scattered-swarm': {
        // Circles unpredictably
        const angle = angleBetween(enemy.pos, playerPos) + Math.PI / 2 + Math.sin(enemy.stateTimer * 0.008) * 0.6;
        moveDir = { x: Math.cos(angle) + (playerPos.x - enemy.pos.x) * 0.004, y: Math.sin(angle) + (playerPos.y - enemy.pos.y) * 0.004 };
        moveDir = normalize(moveDir);
        break;
      }

      case 'teleporting': {
        // Periodically teleports closer to player
        if (enemy.stateTimer > 3200) {
          enemy.stateTimer = 0;
          const jumpDist = 80;
          const jAngle = Math.random() * Math.PI * 2;
          const targetX = playerPos.x + Math.cos(jAngle) * jumpDist;
          const targetY = playerPos.y + Math.sin(jAngle) * jumpDist;
          const col = CollisionSystem.checkTileCollision({ x: targetX, y: targetY }, enemy.radius, map);
          if (!col.collided) {
            enemy.pos.x = targetX;
            enemy.pos.y = targetY;
          }
        }
        moveDir = normalize({ x: playerPos.x - enemy.pos.x, y: playerPos.y - enemy.pos.y });
        break;
      }

      case 'blurring': {
        // Fast darting zig-zag
        const dartAngle = angleBetween(enemy.pos, playerPos) + (Math.floor(enemy.stateTimer / 600) % 2 === 0 ? 0.7 : -0.7);
        moveDir = { x: Math.cos(dartAngle), y: Math.sin(dartAngle) };
        break;
      }
    }

    const moveX = moveDir.x * enemy.speed;
    const moveY = moveDir.y * enemy.speed;

    if (moveX !== 0 && CollisionSystem.isWalkable({ x: enemy.pos.x + moveX, y: enemy.pos.y }, enemy.radius, map)) {
      enemy.pos.x += moveX;
    }
    if (moveY !== 0 && CollisionSystem.isWalkable({ x: enemy.pos.x, y: enemy.pos.y + moveY }, enemy.radius, map)) {
      enemy.pos.y += moveY;
    }

    enemy.pos = CollisionSystem.resolveCircleTileCollisions(enemy.pos, enemy.radius, map);

    // Check hit player
    if (d < enemy.radius + 14 && enemy.attackCooldown <= 0) {
      enemy.attackCooldown = 1000;
      return { hitsPlayer: true, attackDamage: enemy.damage };
    }

    return { hitsPlayer: false, attackDamage: 0 };
  }
}
