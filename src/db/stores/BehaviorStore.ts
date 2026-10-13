import { BaseStore } from './BaseStore';
import { BehaviorSnapshot } from '../../shared/types/behavior';

export class BehaviorStore extends BaseStore<BehaviorSnapshot> {
  async getLatestBehavior(): Promise<BehaviorSnapshot | undefined> {
    const all = await this.getAll();
    if (all.length === 0) return undefined;
    return all[all.length - 1];
  }
}
