import {
  ArenaMap,
  CanvasAnalysis,
  TileType,
  EnemyTemplate,
  BossProfile,
  MovementStyle,
  Vec2,
} from '../shared/types/arena';
import { BehaviorSnapshot } from '../shared/types/behavior';
import { ToolId, ToolUsageRecord } from '../shared/types/tools';
import { SeededRNG, hashString } from '../shared/utils/random';

export class ArenaBuilder {
  private rng: SeededRNG;

  constructor(seed: string) {
    this.rng = new SeededRNG(hashString(seed));
  }

  build(
    analysis: CanvasAnalysis,
    behavior: BehaviorSnapshot,
    bossProfile: BossProfile
  ): ArenaMap {
    const TILE_SIZE = 36;
    const COLS = 22;
    const ROWS = 16;

    const tiles = this.generateTiles(analysis, COLS, ROWS);
    const playerStart = this.findPlayerStart(tiles, COLS, ROWS);
    const bossSpawn = this.findBossSpawnPoint(analysis, tiles, playerStart, COLS, ROWS);
    const enemies = this.spawnEnemies(behavior, tiles, bossProfile.toolId, bossSpawn);

    return {
      tiles,
      tileSize: TILE_SIZE,
      cols: COLS,
      rows: ROWS,
      palette: analysis.dominantColors,
      enemies,
      bossSpawn,
      bossProfile,
      playerStart,
      coverageRatio: analysis.coverageRatio,
      quadrantCoverage: analysis.quadrantCoverage,
    };
  }

  private generateTiles(
    analysis: CanvasAnalysis,
    cols: number,
    rows: number
  ): TileType[][] {
    const grid: TileType[][] = [];

    for (let row = 0; row < rows; row++) {
      grid[row] = [];
      for (let col = 0; col < cols; col++) {
        // Outer arena borders are indestructible obstacles
        if (row === 0 || row === rows - 1 || col === 0 || col === cols - 1) {
          grid[row][col] = 'obstacle';
          continue;
        }

        const quadrant =
          (row < rows / 2 ? 0 : 2) + (col < cols / 2 ? 0 : 1);
        const coverage = analysis.quadrantCoverage[quadrant] || 0.1;

        // Default to walkable paper floor
        let tile: TileType = 'floor';

        const rand = this.rng.next();
        if (coverage > 0.25) {
          // High drawing coverage converts to ink pools and tactile obstacle monoliths
          if (rand < 0.25) {
            tile = 'ink_pool';
          } else if (rand > 0.88) {
            tile = 'obstacle';
          }
        } else {
          // Low coverage is clean paper floor, with rare subtle ink droplets
          if (rand > 0.94) {
            tile = 'ink_pool';
          }
        }

        grid[row][col] = tile;
      }
    }

    return this.ensureConnectedAndClear(grid, cols, rows);
  }

  private ensureConnectedAndClear(grid: TileType[][], cols: number, rows: number): TileType[][] {
    // 1. Clear a generous 5x5 zone around player starting area (bottom-left)
    const pRow = rows - 4;
    const pCol = 4;
    for (let r = Math.max(1, pRow - 2); r <= Math.min(rows - 2, pRow + 2); r++) {
      for (let c = Math.max(1, pCol - 2); c <= Math.min(cols - 2, pCol + 2); c++) {
        grid[r][c] = 'floor';
      }
    }

    // 2. Clear a generous 5x5 zone around boss starting area (top-right)
    const bRow = 3;
    const bCol = cols - 5;
    for (let r = Math.max(1, bRow - 2); r <= Math.min(rows - 2, bRow + 2); r++) {
      for (let c = Math.max(1, bCol - 2); c <= Math.min(cols - 2, bCol + 2); c++) {
        grid[r][c] = 'floor';
      }
    }

    // 3. Clear central battle circle (at least 6 tiles wide)
    const midX = Math.floor(cols / 2);
    const midY = Math.floor(rows / 2);
    for (let r = 2; r < rows - 2; r++) {
      for (let c = 2; c < cols - 2; c++) {
        const d = Math.sqrt((r - midY) ** 2 + (c - midX) ** 2);
        if (d < 4.2 && (grid[r][c] === 'obstacle' || grid[r][c] === 'void')) {
          grid[r][c] = 'floor';
        }
      }
    }

    // 4. Carve wide 3-tile corridors connecting player, center, and boss
    for (let r = Math.min(bRow, pRow); r <= Math.max(bRow, pRow); r++) {
      for (let offset = -1; offset <= 1; offset++) {
        const c = Math.min(cols - 2, Math.max(1, Math.floor(midX + offset)));
        if (grid[r][c] === 'obstacle' || grid[r][c] === 'void') {
          grid[r][c] = 'floor';
        }
      }
    }
    for (let c = Math.min(pCol, bCol); c <= Math.max(pCol, bCol); c++) {
      for (let offset = -1; offset <= 1; offset++) {
        const r = Math.min(rows - 2, Math.max(1, Math.floor(midY + offset)));
        if (grid[r][c] === 'obstacle' || grid[r][c] === 'void') {
          grid[r][c] = 'floor';
        }
      }
    }

    return grid;
  }

  private spawnEnemies(
    behavior: BehaviorSnapshot,
    _tiles: TileType[][],
    bossToolId: ToolId,
    _bossSpawn: Vec2
  ): EnemyTemplate[] {
    const list: EnemyTemplate[] = [];

    Object.entries(behavior.toolUsage).forEach(([toolIdStr, usage]) => {
      const toolId = toolIdStr as ToolId;
      // Do not spawn minions of the boss tool in massive numbers to keep boss focal
      if (usage.useCount > 0) {
        const isBossTool = toolId === bossToolId;
        const count = isBossTool
          ? Math.min(2, Math.ceil(usage.useCount / 20))
          : Math.min(4, Math.max(1, Math.ceil(usage.useCount / 12)));

        list.push({
          toolOrigin: toolId,
          count,
          movementStyle: this.toolToMovement(toolId),
          health: Math.max(15, Math.min(45, Math.ceil(usage.strokeMs / 1200))),
          speed: this.toolToSpeed(toolId),
          damage: 10,
        });
      }
    });

    // Fallback if player barely touched anything
    if (list.length === 0) {
      list.push({
        toolOrigin: 'brush',
        count: 2,
        movementStyle: 'organic-curved',
        health: 20,
        speed: 1.2,
        damage: 10,
      });
    }

    return list;
  }

  private toolToMovement(toolId: ToolId): MovementStyle {
    const styles: Record<ToolId, MovementStyle> = {
      brush: 'organic-curved',
      eraser: 'retreating',
      fill: 'flooding',
      line: 'straight-charge',
      spray: 'scattered-swarm',
      stamp: 'teleporting',
      smudge: 'blurring',
    };
    return styles[toolId] || 'organic-curved';
  }

  private toolToSpeed(toolId: ToolId): number {
    switch (toolId) {
      case 'line':
        return 2.2;
      case 'spray':
        return 1.8;
      case 'eraser':
        return 1.6;
      case 'smudge':
        return 1.4;
      case 'brush':
        return 1.5;
      case 'fill':
        return 0.9;
      case 'stamp':
        return 1.1;
    }
  }

  private findPlayerStart(tiles: TileType[][], cols: number, rows: number): Vec2 {
    const pRow = rows - 4;
    const pCol = 4;
    if (tiles[pRow] && tiles[pRow][pCol] === 'floor') {
      return { x: pCol * 36 + 18, y: pRow * 36 + 18 };
    }
    // Fallback search
    for (let r = rows - 3; r >= 2; r--) {
      for (let c = 2; c < cols - 2; c++) {
        if (tiles[r][c] === 'floor') {
          return { x: c * 36 + 18, y: r * 36 + 18 };
        }
      }
    }
    return { x: 4 * 36 + 18, y: (rows - 4) * 36 + 18 };
  }

  private findBossSpawnPoint(
    _analysis: CanvasAnalysis,
    tiles: TileType[][],
    playerStart: Vec2,
    cols: number,
    rows: number
  ): Vec2 {
    const bRow = 3;
    const bCol = cols - 5;
    if (tiles[bRow] && tiles[bRow][bCol] === 'floor') {
      return { x: bCol * 36 + 18, y: bRow * 36 + 18 };
    }

    // Prefer upper-right area far from player
    for (let r = 2; r < rows / 2; r++) {
      for (let c = cols - 3; c > 4; c--) {
        if (tiles[r][c] === 'floor') {
          const pos = { x: c * 36 + 18, y: r * 36 + 18 };
          const dist = Math.hypot(pos.x - playerStart.x, pos.y - playerStart.y);
          if (dist > 280) {
            return pos;
          }
        }
      }
    }
    return { x: (cols - 5) * 36 + 18, y: 3 * 36 + 18 };
  }
}
