import { BaseStore } from './BaseStore';
import { SessionRecord } from '../../shared/types/session';

export class SessionStore extends BaseStore<SessionRecord> {
  async getRecentSessions(limit: number = 10): Promise<SessionRecord[]> {
    const all = await this.getAll();
    return all.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }
}
