import { CanvasAnalysis } from '../shared/types/arena';
import { MASTER_PALETTE } from '../shared/utils/color';

export class CanvasAnalyzer {
  analyze(imageData: ImageData): CanvasAnalysis {
    const { data, width, height } = imageData;

    const colorBuckets = new Map<string, number>();
    const quadrantCoverage: [number, number, number, number] = [0, 0, 0, 0];
    let coveredPixels = 0;

    // Sample step to be fast and accurate
    const step = 2;

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Paper base is #E8E1D3 (r: 232, g: 225, b: 211)
        // If significantly deviated from paper base or has low alpha, consider it drawn matter
        const isPaper =
          Math.abs(r - 232) < 20 &&
          Math.abs(g - 225) < 20 &&
          Math.abs(b - 211) < 20;

        if (!isPaper && a > 30) {
          coveredPixels++;

          // Quantized color bucket (32 steps)
          const bucket = `${r >> 5},${g >> 5},${b >> 5}`;
          colorBuckets.set(bucket, (colorBuckets.get(bucket) ?? 0) + 1);

          // Quadrant (0: TL, 1: TR, 2: BL, 3: BR)
          const qx = x < width / 2 ? 0 : 1;
          const qy = y < height / 2 ? 0 : 1;
          quadrantCoverage[qy * 2 + qx] += 1;
        }
      }
    }

    const totalSampledPixels = (width / step) * (height / step);
    const quadrantSamples = totalSampledPixels / 4;

    const dominantColors = [...colorBuckets.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([bucket]) => {
        const [r, g, b] = bucket.split(',').map(n => parseInt(n) << 5);
        return `rgb(${r},${g},${b})`;
      });

    // Fallbacks if canvas was left mostly empty
    if (dominantColors.length === 0) {
      dominantColors.push(MASTER_PALETTE.grafiteUmido, MASTER_PALETTE.vinhoFerido, MASTER_PALETTE.azulMemoria);
    }

    return {
      dominantColors,
      coverageRatio: Math.min(1, coveredPixels / totalSampledPixels),
      quadrantCoverage: [
        quadrantCoverage[0] / quadrantSamples,
        quadrantCoverage[1] / quadrantSamples,
        quadrantCoverage[2] / quadrantSamples,
        quadrantCoverage[3] / quadrantSamples,
      ],
    };
  }
}
