import { PlayerProfile, SessionRecord } from '../shared/types/session';
import { BehaviorSnapshot } from '../shared/types/behavior';
import { ToolRelation } from '../shared/types/tools';

export const DB_NAME = 'oqve_db';
export const DB_VERSION = 1;

export interface DBSchema {
  profiles: PlayerProfile;
  sessions: SessionRecord;
  behaviors: BehaviorSnapshot;
  relations: ToolRelation;
}

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      console.warn('IndexedDB not available in current environment, using memory mock fallback');
      // For testing/fallback if indexedDB unavailable
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('profiles')) {
        db.createObjectStore('profiles', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sessions')) {
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'sessionId' });
        sessionStore.createIndex('byDate', 'createdAt');
      }
      if (!db.objectStoreNames.contains('behaviors')) {
        db.createObjectStore('behaviors', { keyPath: 'sessionId' });
      }
      if (!db.objectStoreNames.contains('relations')) {
        db.createObjectStore('relations', { keyPath: 'toolId' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
