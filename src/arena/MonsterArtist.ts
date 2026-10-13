import { ToolId } from '../shared/types/tools';
import { MASTER_PALETTE } from '../shared/utils/color';
import { ArenaEnemy } from './EnemyFactory';
import { BossEntity, BossProjectile } from './BossEntity';

export class MonsterArtist {
  /**
   * Renders a minion/creature born from a specific drawing tool manifestation.
   * Every enemy looks like living, mutated drawing medium (graphite, wet pigment, rubber friction, ink flood, aerosol dust, geometric seals, charcoal smudges).
   */
  static drawEnemy(ctx: CanvasRenderingContext2D, enemy: ArenaEnemy, time: number) {
    ctx.save();
    ctx.translate(enemy.pos.x, enemy.pos.y);

    // Dynamic squash/stretch/pulse based on speed and state timer
    const t = enemy.stateTimer * 0.005;
    const pulse = 1 + Math.sin(t * 3) * 0.08;

    // Organic graphite shadow
    ctx.fillStyle = 'rgba(28, 24, 20, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, enemy.radius * 0.75, enemy.radius * 0.9, enemy.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rotate facing direction
    ctx.rotate(enemy.renderAngle);

    switch (enemy.toolOrigin) {
      case 'brush':
        this.drawBrushCreature(ctx, enemy, t, pulse);
        break;
      case 'eraser':
        this.drawEraserCreature(ctx, enemy, t, pulse);
        break;
      case 'fill':
        this.drawFillCreature(ctx, enemy, t, pulse);
        break;
      case 'line':
        this.drawLineCreature(ctx, enemy, t, pulse);
        break;
      case 'spray':
        this.drawSprayCreature(ctx, enemy, t, pulse);
        break;
      case 'stamp':
        this.drawStampCreature(ctx, enemy, t, pulse);
        break;
      case 'smudge':
        this.drawSmudgeCreature(ctx, enemy, t, pulse);
        break;
      default:
        this.drawInkDropletCreature(ctx, enemy, t, pulse);
        break;
    }

    // Health pip indicator (subtle charcoal hash marks)
    if (enemy.hp < enemy.maxHp) {
      const hpPct = enemy.hp / enemy.maxHp;
      ctx.restore();
      ctx.save();
      ctx.translate(enemy.pos.x, enemy.pos.y - enemy.radius - 8);
      ctx.fillStyle = 'rgba(28, 24, 20, 0.4)';
      ctx.fillRect(-12, 0, 24, 2.5);
      ctx.fillStyle = MASTER_PALETTE.vinhoFerido;
      ctx.fillRect(-12, 0, 24 * hpPct, 2.5);
      ctx.strokeStyle = MASTER_PALETTE.grafiteUmido;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(-12, 0, 24, 2.5);
    }

    ctx.restore();
  }

  // --- 1. PINCEL: Tinta líquida, cerdas vivas e cauda caligráfica sinuosa ---
  private static drawBrushCreature(ctx: CanvasRenderingContext2D, enemy: ArenaEnemy, t: number, pulse: number) {
    const r = enemy.radius * pulse;

    // Tail: undulating calligraphy stroke behind body
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const tailPoints = 6;
    for (let i = 1; i <= tailPoints; i++) {
      const dist = (-r * 1.5 * i) / tailPoints;
      const wave = Math.sin(t * 4 - i * 0.8) * (r * 0.5);
      ctx.lineTo(dist, wave);
    }
    ctx.strokeStyle = MASTER_PALETTE.verdePigmento;
    ctx.lineWidth = r * 0.65;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Main ink-bulb body
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.moveTo(r * 1.2, 0);
    ctx.bezierCurveTo(r * 0.8, -r * 1.1, -r * 0.5, -r * 0.9, -r * 0.8, 0);
    ctx.bezierCurveTo(-r * 0.5, r * 0.9, r * 0.8, r * 1.1, r * 1.2, 0);
    ctx.closePath();
    ctx.fill();

    // Wet bristle fibers
    ctx.strokeStyle = MASTER_PALETTE.grafiteUmido;
    ctx.lineWidth = 1.2;
    for (let i = -2; i <= 2; i++) {
      const off = i * (r * 0.28);
      ctx.beginPath();
      ctx.moveTo(-r * 0.3, off);
      ctx.quadraticCurveTo(r * 0.5, off + Math.sin(t * 5 + i) * 2, r * 1.3, off * 0.4);
      ctx.stroke();
    }

    // Wet sheen drop
    ctx.fillStyle = MASTER_PALETTE.papelVivo;
    ctx.beginPath();
    ctx.arc(r * 0.3, -r * 0.3, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- 2. BORRACHA: Monólito de látex desbotado, resíduo e bordas descascadas ---
  private static drawEraserCreature(ctx: CanvasRenderingContext2D, enemy: ArenaEnemy, t: number, pulse: number) {
    const w = enemy.radius * 2.2 * pulse;
    const h = enemy.radius * 1.3 * pulse;

    // Eraser shavings orbiting / drifting
    ctx.fillStyle = 'rgba(158, 157, 151, 0.6)';
    for (let i = 0; i < 4; i++) {
      const angle = t * 2 + (i * Math.PI) / 2;
      const ox = Math.cos(angle) * (w * 0.7);
      const oy = Math.sin(angle) * (h * 0.9);
      ctx.fillRect(ox - 1.5, oy - 1.5, 3, 3);
    }

    // Beveled Eraser Block Body
    ctx.fillStyle = enemy.color;
    ctx.strokeStyle = MASTER_PALETTE.grafiteUmido;
    ctx.lineWidth = 1.6;

    ctx.beginPath();
    ctx.moveTo(-w * 0.4, -h * 0.5);
    ctx.lineTo(w * 0.5, -h * 0.4);
    ctx.lineTo(w * 0.35, h * 0.5);
    ctx.lineTo(-w * 0.5, h * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Worn wedge friction tip (slanted erase head)
    ctx.fillStyle = '#C8C4B7';
    ctx.beginPath();
    ctx.moveTo(w * 0.25, -h * 0.4);
    ctx.lineTo(w * 0.5, -h * 0.4);
    ctx.lineTo(w * 0.35, h * 0.5);
    ctx.lineTo(w * 0.1, h * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Graphite scuff marks etched on the surface
    ctx.strokeStyle = 'rgba(41, 40, 38, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-w * 0.2, -h * 0.2);
    ctx.lineTo(-w * 0.05, h * 0.25);
    ctx.moveTo(-w * 0.3, h * 0.1);
    ctx.lineTo(-w * 0.15, -h * 0.15);
    ctx.stroke();
  }

  // --- 3. BALDE / PREENCHIMENTO: Poça voraz de pigmento visceral e tentáculos viscosos ---
  private static drawFillCreature(ctx: CanvasRenderingContext2D, enemy: ArenaEnemy, t: number, pulse: number) {
    const r = enemy.radius * 1.2 * pulse;

    // Fluid tendrils pulsing outward
    ctx.fillStyle = MASTER_PALETTE.vinhoFerido;
    ctx.beginPath();
    const vertices = 10;
    for (let i = 0; i < vertices; i++) {
      const angle = (i / vertices) * Math.PI * 2;
      const wobble = Math.sin(t * 6 + i * 2) * (r * 0.35);
      const rad = r + wobble;
      const x = Math.cos(angle) * rad;
      const y = Math.sin(angle) * rad;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Dark core pool
    ctx.fillStyle = '#421E24';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Thick ink border
    ctx.strokeStyle = MASTER_PALETTE.grafiteUmido;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Floating viscous eye / highlight
    ctx.fillStyle = MASTER_PALETTE.ambarAtelier;
    ctx.beginPath();
    ctx.arc(r * 0.2, -r * 0.15, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- 4. LINHA: Fagulha geométrica, agulha de grafite afiada e vértices rígidos ---
  private static drawLineCreature(ctx: CanvasRenderingContext2D, enemy: ArenaEnemy, t: number, pulse: number) {
    const r = enemy.radius * 1.3 * pulse;

    // Kinetic vector trail lines
    ctx.strokeStyle = 'rgba(41, 40, 38, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-r * 1.8, -r * 0.4);
    ctx.lineTo(-r * 0.8, -r * 0.1);
    ctx.moveTo(-r * 1.8, r * 0.4);
    ctx.lineTo(-r * 0.8, r * 0.1);
    ctx.stroke();

    // Sharp Graphite Needle / Diamond body
    ctx.fillStyle = enemy.color;
    ctx.strokeStyle = MASTER_PALETTE.grafiteUmido;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(r * 1.5, 0); // Piercing sharp tip
    ctx.lineTo(-r * 0.3, -r * 0.6);
    ctx.lineTo(-r * 0.9, 0);
    ctx.lineTo(-r * 0.3, r * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Internal geometric ruling bisector
    ctx.strokeStyle = MASTER_PALETTE.papelVivo;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, 0);
    ctx.lineTo(r * 1.3, 0);
    ctx.stroke();

    // Acute compass points
    ctx.fillStyle = MASTER_PALETTE.ambarAtelier;
    ctx.beginPath();
    ctx.arc(r * 0.2, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- 5. SPRAY / AEROSOL: Enxame difuso de poeira dourada e gotículas caóticas ---
  private static drawSprayCreature(ctx: CanvasRenderingContext2D, enemy: ArenaEnemy, t: number, _pulse: number) {
    const r = enemy.radius;

    // Diffuse aerosol mist cloud
    const grad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.8);
    grad.addColorStop(0, 'rgba(199, 154, 88, 0.7)');
    grad.addColorStop(0.6, 'rgba(199, 154, 88, 0.25)');
    grad.addColorStop(1, 'rgba(199, 154, 88, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // High density particle swarm
    ctx.fillStyle = MASTER_PALETTE.ambarAtelier;
    for (let i = 0; i < 9; i++) {
      const angle = t * 4 + (i * Math.PI * 2) / 9;
      const dist = (r * 0.4) + Math.sin(t * 8 + i * 3) * (r * 0.6);
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist;
      const size = 1.5 + (i % 3);
      ctx.fillRect(px, py, size, size);
    }

    // Dense graphite pressurized center nozzle
    ctx.fillStyle = MASTER_PALETTE.grafiteUmido;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = MASTER_PALETTE.papelVivo;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // --- 6. CARIMBO: Sinete de madeira octogonal, relevo entalhado e impacto rítmico ---
  private static drawStampCreature(ctx: CanvasRenderingContext2D, enemy: ArenaEnemy, t: number, pulse: number) {
    const r = enemy.radius * 1.15 * pulse;

    // Heavy wooden octagon base
    ctx.fillStyle = enemy.color;
    ctx.strokeStyle = MASTER_PALETTE.grafiteUmido;
    ctx.lineWidth = 2.2;

    ctx.beginPath();
    const sides = 8;
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 + (Math.PI / 8);
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wood grain rings
    ctx.strokeStyle = '#4A3525';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
    ctx.stroke();

    // Embossed inner symbol (the sacred seal rune)
    ctx.fillStyle = MASTER_PALETTE.papelVivo;
    ctx.fillRect(-r * 0.28, -r * 0.28, r * 0.56, r * 0.56);
    ctx.fillStyle = MASTER_PALETTE.vinhoFerido;
    ctx.fillRect(-r * 0.12, -r * 0.12, r * 0.24, r * 0.24);
  }

  // --- 7. ESFUMINHO / SMUDGE: Espectro de carvão difuso, borrões fantasmagóricos e névoa cinzenta ---
  private static drawSmudgeCreature(ctx: CanvasRenderingContext2D, enemy: ArenaEnemy, t: number, pulse: number) {
    const r = enemy.radius * pulse;

    // Faded graphite ghost trail
    ctx.fillStyle = 'rgba(101, 122, 131, 0.35)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.7, 0, r * 0.9, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Blurry charcoal core
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.3);
    grad.addColorStop(0, '#292826');
    grad.addColorStop(0.5, '#657A83');
    grad.addColorStop(1, 'rgba(101, 122, 131, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Compressed paper tortillon spiral tip
    ctx.strokeStyle = MASTER_PALETTE.papelVivo;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 1.4);
    ctx.stroke();
  }

  private static drawInkDropletCreature(ctx: CanvasRenderingContext2D, enemy: ArenaEnemy, t: number, pulse: number) {
    const r = enemy.radius * pulse;
    ctx.fillStyle = enemy.color;
    ctx.strokeStyle = MASTER_PALETTE.grafiteUmido;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  /**
   * Renders the Boss Avatar with dramatic artistic presence based on its tool origin, phase, and deviation type.
   */
  static drawBoss(ctx: CanvasRenderingContext2D, boss: BossEntity) {
    ctx.save();
    ctx.translate(boss.pos.x, boss.pos.y);

    const time = Date.now() * 0.003;
    const pulse = 1 + Math.sin(time * 2) * 0.07;
    const r = boss.radius * pulse;

    // 1. Ominous Ink Pressure Aura
    const auraColor =
      boss.profile.deviationType === 'excess'
        ? 'rgba(122, 57, 66,' // Vinho Ferido
        : 'rgba(101, 122, 131,'; // Azul Memória

    const auraGrad = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 2.6);
    auraGrad.addColorStop(0, `${auraColor} 0.5)`);
    auraGrad.addColorStop(0.6, `${auraColor} 0.2)`);
    auraGrad.addColorStop(1, `${auraColor} 0)`);

    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.6, 0, Math.PI * 2);
    ctx.fill();

    // 2. Graphite shadow under boss
    ctx.fillStyle = 'rgba(20, 18, 16, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.9, r * 1.2, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rotate towards aim direction
    ctx.rotate(boss.aimAngle);

    // 3. Phase Crown / Spikes
    const spikeCount = boss.phase === 1 ? 6 : boss.phase === 2 ? 10 : 16;
    ctx.fillStyle = MASTER_PALETTE.ambarAtelier;
    ctx.strokeStyle = MASTER_PALETTE.grafiteUmido;
    ctx.lineWidth = 1;

    for (let i = 0; i < spikeCount; i++) {
      const angle = (i / spikeCount) * Math.PI * 2 + (time * (boss.phase === 3 ? 1.5 : 0.6));
      const sx = Math.cos(angle) * (r + 10 + (boss.phase === 3 ? Math.sin(time * 6 + i) * 4 : 0));
      const sy = Math.sin(angle) * (r + 10 + (boss.phase === 3 ? Math.sin(time * 6 + i) * 4 : 0));
      ctx.beginPath();
      ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 4. Main Tool-Specific Boss Body
    ctx.fillStyle = boss.profile.deviationType === 'excess' ? MASTER_PALETTE.vinhoFerido : MASTER_PALETTE.azulMemoria;
    ctx.strokeStyle = MASTER_PALETTE.grafiteUmido;
    ctx.lineWidth = 3;

    switch (boss.profile.toolId) {
      case 'brush': {
        // Colossal Calligraphic Brush Spirit: Deep sweeping ink mane and bristle jaws
        ctx.beginPath();
        ctx.arc(0, 0, r, -0.6, Math.PI * 1.6);
        ctx.lineTo(r * 1.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner wet ink swirls
        ctx.strokeStyle = MASTER_PALETTE.papelVivo;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-r * 0.2, 0, r * 0.5, 0, Math.PI);
        ctx.stroke();
        break;
      }

      case 'eraser': {
        // Colossal Void Monolith: Chiseled block of erasure cutting through reality
        ctx.fillRect(-r * 1.1, -r * 0.8, r * 2.2, r * 1.6);
        ctx.strokeRect(-r * 1.1, -r * 0.8, r * 2.2, r * 1.6);

        // Chipped white erasure wedge
        ctx.fillStyle = '#EDEAE1';
        ctx.beginPath();
        ctx.moveTo(r * 0.4, -r * 0.8);
        ctx.lineTo(r * 1.1, -r * 0.8);
        ctx.lineTo(r * 0.8, r * 0.8);
        ctx.lineTo(r * 0.2, r * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      }

      case 'line': {
        // Geometer Arch-Construct: Piercing crystal compass needle
        ctx.beginPath();
        ctx.moveTo(r * 1.7, 0);
        ctx.lineTo(-r * 0.4, -r * 1.1);
        ctx.lineTo(-r * 1.2, 0);
        ctx.lineTo(-r * 0.4, r * 1.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner gold axis
        ctx.strokeStyle = MASTER_PALETTE.ambarAtelier;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-r * 1.0, 0);
        ctx.lineTo(r * 1.5, 0);
        ctx.stroke();
        break;
      }

      case 'fill': {
        // Visceral Ink Leviathan: Roiling wave of pigment
        ctx.beginPath();
        const pts = 14;
        for (let i = 0; i < pts; i++) {
          const a = (i / pts) * Math.PI * 2;
          const dist = r + Math.sin(time * 5 + i * 2) * (r * 0.28);
          const px = Math.cos(a) * dist;
          const py = Math.sin(a) * dist;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
      }

      case 'spray': {
        // Aerosol Storm Core: Dense pressurized gold-charcoal vortex
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // High velocity orbital dust rings
        ctx.strokeStyle = MASTER_PALETTE.ambarAtelier;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.4, r * 0.7, time * 2, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      case 'stamp': {
        // Colossal Obsidian Sigil Seal
        ctx.beginPath();
        const sides = 8;
        for (let i = 0; i < sides; i++) {
          const a = (i / sides) * Math.PI * 2;
          const px = Math.cos(a) * (r * 1.2);
          const py = Math.sin(a) * (r * 1.2);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Concentric glyph
        ctx.fillStyle = MASTER_PALETTE.papelVivo;
        ctx.fillRect(-r * 0.4, -r * 0.4, r * 0.8, r * 0.8);
        break;
      }

      default: {
        // Smudge / Charcoal Shadow
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      }
    }

    // Central core sentient eye (Observing what the player created)
    ctx.fillStyle = MASTER_PALETTE.papelVivo;
    ctx.beginPath();
    ctx.arc(r * 0.2, 0, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = MASTER_PALETTE.grafiteUmido;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = MASTER_PALETTE.grafiteUmido;
    ctx.beginPath();
    ctx.arc(r * 0.28, 0, r * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Tiny golden highlight
    ctx.fillStyle = MASTER_PALETTE.ambarAtelier;
    ctx.beginPath();
    ctx.arc(r * 0.32, -r * 0.06, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Renders specialized projectile visuals based on tool nature.
   */
  static drawProjectile(ctx: CanvasRenderingContext2D, proj: BossProjectile) {
    ctx.save();
    ctx.translate(proj.pos.x, proj.pos.y);

    const angle = Math.atan2(proj.vel.y, proj.vel.x);
    ctx.rotate(angle);

    // Projectile core
    ctx.fillStyle = proj.color;
    ctx.strokeStyle = MASTER_PALETTE.grafiteUmido;
    ctx.lineWidth = 1.2;

    // Teardrop / aerodynamic ink bullet
    ctx.beginPath();
    ctx.moveTo(proj.radius * 1.5, 0);
    ctx.quadraticCurveTo(0, -proj.radius, -proj.radius, 0);
    ctx.quadraticCurveTo(0, proj.radius, proj.radius * 1.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Charcoal tail wake
    ctx.fillStyle = 'rgba(41, 40, 38, 0.25)';
    ctx.fillRect(-proj.radius * 2, -1, proj.radius, 2);

    ctx.restore();
  }
}
