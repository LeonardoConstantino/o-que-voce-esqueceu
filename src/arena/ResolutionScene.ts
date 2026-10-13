import { BossProfile } from '../shared/types/arena';
import { RelationStore } from '../db/stores/RelationStore';
import { ProfileStore } from '../db/stores/ProfileStore';
import { bus } from '../shared/EventBus';
import { audio } from '../shell/AudioManager';
import { TOOL_METADATA } from '../shared/types/tools';

export class ResolutionScene {
  async handleChoice(
    choice: 'reconcile' | 'destroy',
    bossProfile: BossProfile,
    relationStore: RelationStore,
    profileStore: ProfileStore
  ): Promise<void> {
    audio.playResolutionChime();
    const relation = await relationStore.getRelation(bossProfile.toolId);
    const profile = await profileStore.getOrCreateProfile();

    if (choice === 'reconcile') {
      await relationStore.put({
        ...relation,
        timesReconciled: relation.timesReconciled + 1,
        timesAsBoss: relation.timesAsBoss + 1,
        resentment: relation.resentment * 0.5,
      });

      if (!profile.reconciledTools.includes(bossProfile.toolId)) {
        profile.reconciledTools.push(bossProfile.toolId);
      }
    } else {
      await relationStore.put({
        ...relation,
        timesDestroyed: relation.timesDestroyed + 1,
        timesAsBoss: relation.timesAsBoss + 1,
      });

      if (!profile.destroyedTools.includes(bossProfile.toolId)) {
        profile.destroyedTools.push(bossProfile.toolId);
      }
    }

    profile.completedAtLeastOnce = true;
    await profileStore.put(profile);

    bus.emit('arena:resolution', { choice, toolId: bossProfile.toolId });
  }

  static getResolutionTexts(bossProfile: BossProfile) {
    const meta = TOOL_METADATA[bossProfile.toolId];
    const toolName = meta ? meta.shortName : bossProfile.toolId;

    const reconcileText = bossProfile.wasReconciled
      ? `${toolName} permanece no Ateliê. Ela volta mais pesada e atenta.`
      : `${toolName} continua com você. Diferente de antes.`;

    const destroyText = `${toolName} desaparece. O Ateliê fica permanentemente mais vazio.`;

    return {
      toolName,
      reconcileText,
      destroyText,
    };
  }
}
