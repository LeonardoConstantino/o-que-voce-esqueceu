export interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export function hexToRgb(hex: string): RGB {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
    a: 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clampR = Math.max(0, Math.min(255, Math.round(r)));
  const clampG = Math.max(0, Math.min(255, Math.round(g)));
  const clampB = Math.max(0, Math.min(255, Math.round(b)));
  return '#' + [clampR, clampG, clampB].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function rgbToString(r: number, g: number, b: number, a: number = 1): string {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
}

export function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Master Palette colors from GDD
export const MASTER_PALETTE = {
  papelVivo: '#E8E1D3',     // Papel Vivo - Base
  grafiteUmido: '#292826',  // Grafite Úmido - Contorno e texto
  azulMemoria: '#657A83',   // Azul Memória - Melancolia e distância
  vinhoFerido: '#7A3942',   // Vinho Ferido - Perigo e conflito
  ambarAtelier: '#C79A58',  // Âmbar de Ateliê - Calor e segurança
  verdePigmento: '#65705A', // Verde Pigmento - Vida e matéria
  vazio: '#121214',         // Vazio - Ausência e desconhecido
};

export const ATELIER_PIGMENTS = [
  { name: 'Grafite Carvão', hex: '#292826' },
  { name: 'Sépia Queimada', hex: '#634832' },
  { name: 'Azul Memória', hex: '#657A83' },
  { name: 'Vinho Ferido', hex: '#7A3942' },
  { name: 'Âmbar Dourado', hex: '#C79A58' },
  { name: 'Verde Pigmento', hex: '#65705A' },
  { name: 'Terra Ocre', hex: '#A86834' },
  { name: 'Cinza Bruma', hex: '#9E9D97' },
  { name: 'Branco Giz', hex: '#F4EFE6' },
];
