import React, { useEffect, useState, useCallback } from 'react';
import { openDB } from './db/Database';
import { ProfileStore } from './db/stores/ProfileStore';
import { SessionStore } from './db/stores/SessionStore';
import { BehaviorStore } from './db/stores/BehaviorStore';
import { RelationStore } from './db/stores/RelationStore';
import { ConverterPipeline } from './converter/ConverterPipeline';
import { bus } from './shared/EventBus';
import { audio } from './shell/AudioManager';
import { ToolId, ToolRelation, ALL_TOOL_IDS, TOOL_METADATA } from './shared/types/tools';
import { BehaviorSnapshot } from './shared/types/behavior';
import { ArenaMap, BossProfile } from './shared/types/arena';
import { PlayerProfile } from './shared/types/session';

import { TitleScreenView } from './components/TitleScreenView';
import { AtelierView } from './components/AtelierView';
import { TransitionView } from './components/TransitionView';
import { ArenaView } from './components/ArenaView';
import { ResolutionView } from './components/ResolutionView';
import { PostArenaView } from './components/PostArenaView';
import { ResolutionScene } from './arena/ResolutionScene';

type Scene = 'title' | 'atelier' | 'transition' | 'arena' | 'resolution' | 'postarena';

export default function App() {
  const [scene, setScene] = useState<Scene>('title');
  const [dbStores, setDbStores] = useState<{
    profiles: ProfileStore;
    sessions: SessionStore;
    behaviors: BehaviorStore;
    relations: RelationStore;
  } | null>(null);

  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [destroyedTools, setDestroyedTools] = useState<ToolId[]>([]);
  const [relations, setRelations] = useState<ToolRelation[]>([]);

  const [currentArenaMap, setCurrentArenaMap] = useState<ArenaMap | null>(null);
  const [currentBehavior, setCurrentBehavior] = useState<BehaviorSnapshot | null>(null);
  const [currentBossProfile, setCurrentBossProfile] = useState<BossProfile | null>(null);
  const [sessionOutcome, setSessionOutcome] = useState<'survived' | 'defeated'>('survived');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Initialize DB on mount
  useEffect(() => {
    async function init() {
      try {
        const db = await openDB();
        const profiles = new ProfileStore(db, 'profiles');
        const sessions = new SessionStore(db, 'sessions');
        const behaviors = new BehaviorStore(db, 'behaviors');
        const relationsStore = new RelationStore(db, 'relations');

        await relationsStore.initializeIfEmpty();
        const p = await profiles.getOrCreateProfile();
        const rels = await relationsStore.getAll();

        setDbStores({ profiles, sessions, behaviors, relations: relationsStore });
        setProfile(p);
        setSessionCount(p.totalSessions);
        setDestroyedTools(p.destroyedTools || []);
        setRelations(rels);
      } catch (err) {
        console.error('Failed to initialize database:', err);
      }
    }
    init();
  }, []);

  // Listen to EventBus for metronome triggers
  useEffect(() => {
    const unbindMetronome = bus.on(
      'atelier:metronome-fires',
      async ({ canvasSnapshot, behavior }) => {
        if (!dbStores) return;

        // Save behavior
        await dbStores.behaviors.put(behavior);
        await dbStores.relations.applySessionBehavior(behavior);

        const allRelations = await dbStores.relations.getAll();
        setRelations(allRelations);
        setCurrentBehavior(behavior);

        // Convert canvas drawing to ArenaMap
        const pipeline = new ConverterPipeline();
        const arenaMap = await pipeline.convert(canvasSnapshot, behavior, allRelations);

        setCurrentArenaMap(arenaMap);
        setCurrentBossProfile(arenaMap.bossProfile);
        setScene('transition');
      }
    );

    return () => {
      unbindMetronome();
    };
  }, [dbStores]);

  const handleToggleMute = useCallback(() => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleTransitionComplete = useCallback(() => {
    setScene('arena');
  }, []);

  const handleBossDefeated = useCallback(() => {
    setSessionOutcome('survived');
    setScene('resolution');
  }, []);

  const handlePlayerDefeated = useCallback(() => {
    setSessionOutcome('defeated');
    // On player death, still show resolution or direct autopsy
    if (currentBossProfile) {
      setScene('resolution');
    } else {
      setScene('postarena');
    }
  }, [currentBossProfile]);

  const handleResolutionChoice = useCallback(
    async (choice: 'reconcile' | 'destroy') => {
      if (!dbStores || !currentBossProfile) return;

      const resolution = new ResolutionScene();
      await resolution.handleChoice(
        choice,
        currentBossProfile,
        dbStores.relations,
        dbStores.profiles
      );

      // Record session
      await dbStores.sessions.put({
        sessionId,
        sessionNumber: sessionCount + 1,
        outcome: sessionOutcome,
        bossToolId: currentBossProfile.toolId,
        bossDeviationType: currentBossProfile.deviationType,
        resolutionChoice: choice,
        createdAt: Date.now(),
        durationMs: currentBehavior?.totalMs || 60000,
      });

      // Update state
      const updatedProfile = await dbStores.profiles.getOrCreateProfile();
      const updatedRelations = await dbStores.relations.getAll();
      setProfile(updatedProfile);
      setDestroyedTools(updatedProfile.destroyedTools);
      setRelations(updatedRelations);

      setScene('postarena');
    },
    [dbStores, currentBossProfile, sessionId, sessionCount, sessionOutcome, currentBehavior]
  );

  const handleNextSession = useCallback(async () => {
    if (!dbStores) return;

    const newSessionId = crypto.randomUUID();
    const updatedProfile = await dbStores.profiles.incrementSession();
    const rels = await dbStores.relations.getAll();

    setSessionId(newSessionId);
    setSessionCount(updatedProfile.totalSessions);
    setDestroyedTools(updatedProfile.destroyedTools || []);
    setRelations(rels);
    setCurrentArenaMap(null);
    setCurrentBehavior(null);
    setCurrentBossProfile(null);
    setScene('atelier');
  }, [dbStores]);

  const handleResetAll = useCallback(async () => {
    if (!dbStores) return;
    await dbStores.profiles.clear();
    await dbStores.sessions.clear();
    await dbStores.behaviors.clear();
    await dbStores.relations.clear();
    await dbStores.relations.initializeIfEmpty();

    const p = await dbStores.profiles.getOrCreateProfile();
    const rels = await dbStores.relations.getAll();

    setProfile(p);
    setSessionCount(0);
    setDestroyedTools([]);
    setRelations(rels);
    setSessionId(crypto.randomUUID());
    setCurrentArenaMap(null);
    setCurrentBehavior(null);
    setCurrentBossProfile(null);
    setScene('atelier');
  }, [dbStores]);

  const bossToolMeta = currentBossProfile ? TOOL_METADATA[currentBossProfile.toolId] : null;

  return (
    <main className="w-full min-h-screen bg-[#1C1814] text-[#292826] flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {scene === 'title' && (
        <TitleScreenView
          sessionCount={sessionCount}
          destroyedTools={destroyedTools}
          onStartGame={() => setScene('atelier')}
          onResetMemory={handleResetAll}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {scene === 'atelier' && (
        <AtelierView
          sessionId={sessionId}
          sessionCount={sessionCount}
          destroyedTools={destroyedTools}
          onFinishDrawing={() => {}}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {scene === 'transition' && (
        <TransitionView
          onComplete={handleTransitionComplete}
          bossToolName={bossToolMeta ? bossToolMeta.shortName : 'A Ferramenta'}
        />
      )}

      {scene === 'arena' && currentArenaMap && (
        <ArenaView
          arenaMap={currentArenaMap}
          onBossDefeated={handleBossDefeated}
          onPlayerDefeated={handlePlayerDefeated}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {scene === 'resolution' && currentBossProfile && (
        <ResolutionView
          bossProfile={currentBossProfile}
          onChoice={handleResolutionChoice}
        />
      )}

      {scene === 'postarena' && currentBehavior && (
        <PostArenaView
          behavior={currentBehavior}
          relations={relations}
          sessionNumber={sessionCount + 1}
          outcome={sessionOutcome}
          onNextSession={handleNextSession}
          onResetAll={handleResetAll}
        />
      )}
    </main>
  );
}
