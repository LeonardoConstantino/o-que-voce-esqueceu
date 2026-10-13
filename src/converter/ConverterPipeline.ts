import { CanvasAnalyzer } from './CanvasAnalyzer';
import { BossProfiler } from './BossProfiler';
import { ArenaBuilder } from './ArenaBuilder';
import { BehaviorSnapshot } from '../shared/types/behavior';
import { ToolRelation } from '../shared/types/tools';
import { ArenaMap } from '../shared/types/arena';

export class ConverterPipeline {
  private analyzer = new CanvasAnalyzer();
  private profiler = new BossProfiler();

  async convert(
    snapshot: ImageData,
    behavior: BehaviorSnapshot,
    relations: ToolRelation[]
  ): Promise<ArenaMap> {
    const analysis = this.analyzer.analyze(snapshot);
    const bossProfile = await this.profiler.identify(behavior, relations);
    const builder = new ArenaBuilder(behavior.sessionId);
    return builder.build(analysis, behavior, bossProfile);
  }
}
