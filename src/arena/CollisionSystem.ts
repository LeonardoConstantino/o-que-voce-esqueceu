import { Vec2, ArenaMap } from '../shared/types/arena';
import { checkCircleCollision } from '../shared/utils/math';

export class CollisionSystem {
  static isSolid(tile?: string): boolean {
    return tile === 'obstacle' || tile === 'void';
  }

  static isWalkable(pos: Vec2, radius: number, map: ArenaMap): boolean {
    const minCol = Math.max(0, Math.floor((pos.x - radius) / map.tileSize));
    const maxCol = Math.min(map.cols - 1, Math.floor((pos.x + radius) / map.tileSize));
    const minRow = Math.max(0, Math.floor((pos.y - radius) / map.tileSize));
    const maxRow = Math.min(map.rows - 1, Math.floor((pos.y + radius) / map.tileSize));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tile = map.tiles[r]?.[c];
        if (this.isSolid(tile)) {
          const tileX = c * map.tileSize;
          const tileY = r * map.tileSize;
          const nearestX = Math.max(tileX, Math.min(pos.x, tileX + map.tileSize));
          const nearestY = Math.max(tileY, Math.min(pos.y, tileY + map.tileSize));
          const dx = pos.x - nearestX;
          const dy = pos.y - nearestY;
          if (dx * dx + dy * dy < radius * radius) {
            return false;
          }
        }
      }
    }
    return true;
  }

  static checkTileCollision(pos: Vec2, radius: number, map: ArenaMap): { collided: boolean; normal: Vec2 } {
    const minCol = Math.max(0, Math.floor((pos.x - radius) / map.tileSize));
    const maxCol = Math.min(map.cols - 1, Math.floor((pos.x + radius) / map.tileSize));
    const minRow = Math.max(0, Math.floor((pos.y - radius) / map.tileSize));
    const maxRow = Math.min(map.rows - 1, Math.floor((pos.y + radius) / map.tileSize));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tile = map.tiles[r]?.[c];
        if (this.isSolid(tile)) {
          const tileX = c * map.tileSize;
          const tileY = r * map.tileSize;
          const nearestX = Math.max(tileX, Math.min(pos.x, tileX + map.tileSize));
          const nearestY = Math.max(tileY, Math.min(pos.y, tileY + map.tileSize));
          const dx = pos.x - nearestX;
          const dy = pos.y - nearestY;
          const distSq = dx * dx + dy * dy;

          if (distSq < radius * radius) {
            const dist = Math.sqrt(distSq) || 0.001;
            return {
              collided: true,
              normal: { x: dx / dist, y: dy / dist },
            };
          }
        }
      }
    }

    return { collided: false, normal: { x: 0, y: 0 } };
  }

  static resolveCircleTileCollisions(pos: Vec2, radius: number, map: ArenaMap): Vec2 {
    let resolvedX = Math.max(radius + 2, Math.min(map.cols * map.tileSize - radius - 2, pos.x));
    let resolvedY = Math.max(radius + 2, Math.min(map.rows * map.tileSize - radius - 2, pos.y));

    const minCol = Math.max(0, Math.floor((resolvedX - radius) / map.tileSize));
    const maxCol = Math.min(map.cols - 1, Math.floor((resolvedX + radius) / map.tileSize));
    const minRow = Math.max(0, Math.floor((resolvedY - radius) / map.tileSize));
    const maxRow = Math.min(map.rows - 1, Math.floor((resolvedY + radius) / map.tileSize));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tile = map.tiles[r]?.[c];
        if (this.isSolid(tile)) {
          const tileX = c * map.tileSize;
          const tileY = r * map.tileSize;
          const nearestX = Math.max(tileX, Math.min(resolvedX, tileX + map.tileSize));
          const nearestY = Math.max(tileY, Math.min(resolvedY, tileY + map.tileSize));
          const dx = resolvedX - nearestX;
          const dy = resolvedY - nearestY;
          const distSq = dx * dx + dy * dy;

          if (distSq < radius * radius) {
            const d = Math.sqrt(distSq);
            if (d > 0.0001) {
              const overlap = radius - d;
              resolvedX += (dx / d) * overlap;
              resolvedY += (dy / d) * overlap;
            } else {
              // Center is inside tile - push away from tile center
              const centerX = tileX + map.tileSize / 2;
              const centerY = tileY + map.tileSize / 2;
              const dirX = resolvedX >= centerX ? 1 : -1;
              const dirY = resolvedY >= centerY ? 1 : -1;
              resolvedX += dirX * 2;
              resolvedY += dirY * 2;
            }
          }
        }
      }
    }

    return { x: resolvedX, y: resolvedY };
  }

  static checkEntityOverlap(posA: Vec2, radA: number, posB: Vec2, radB: number): boolean {
    return checkCircleCollision(posA, radA, posB, radB);
  }
}

