import { BaseStore } from './BaseStore';
import { PlayerProfile } from '../../shared/types/session';

export class ProfileStore extends BaseStore<PlayerProfile> {
  async getOrCreateProfile(): Promise<PlayerProfile> {
    const existing = await this.get('player');
    if (existing) {
      return existing;
    }
    const newProfile: PlayerProfile = {
      id: 'player',
      totalSessions: 0,
      completedAtLeastOnce: false,
      destroyedTools: [],
      reconciledTools: [],
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
    };
    await this.put(newProfile);
    return newProfile;
  }

  async incrementSession(): Promise<PlayerProfile> {
    const profile = await this.getOrCreateProfile();
    profile.totalSessions += 1;
    profile.lastPlayedAt = Date.now();
    await this.put(profile);
    return profile;
  }
}
