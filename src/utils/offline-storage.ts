/**
 * Offline Storage Utility using IndexedDB
 * Handles caching of capsules and queuing of offline actions
 */

const DB_NAME = 'eras_offline_db';
const DB_VERSION = 1;
const STORES = {
  CAPSULES: 'capsules',
  QUEUE: 'offline_queue',
  MEDIA: 'media_cache' // For caching images/videos if needed
};

// Initialize DB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('OfflineDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = (event) => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Store for cached capsules (read-only access when offline)
      if (!db.objectStoreNames.contains(STORES.CAPSULES)) {
        db.createObjectStore(STORES.CAPSULES, { keyPath: 'id' });
      }

      // Store for offline actions queue (create, edit, delete)
      if (!db.objectStoreNames.contains(STORES.QUEUE)) {
        db.createObjectStore(STORES.QUEUE, { keyPath: 'id', autoIncrement: true });
      }

      // Store for media blobs
      if (!db.objectStoreNames.contains(STORES.MEDIA)) {
        db.createObjectStore(STORES.MEDIA, { keyPath: 'url' });
      }
    };
  });
};

// Generic get/put/getAll helpers
const dbAction = async <T,>(
  storeName: string, 
  mode: 'readonly' | 'readwrite', 
  action: (store: IDBObjectStore) => IDBRequest | void
): Promise<T> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    
    let request: IDBRequest | void;
    try {
      request = action(store);
    } catch (e) {
      reject(e);
      return;
    }

    transaction.oncomplete = () => {
      resolve(request ? request.result : undefined);
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
};

// --- CAPSULE CACHING ---

export const cacheCapsules = async (capsules: any[]) => {
  const db = await openDB();
  const tx = db.transaction(STORES.CAPSULES, 'readwrite');
  const store = tx.objectStore(STORES.CAPSULES);
  
  // We overwrite/update existing ones
  capsules.forEach(capsule => {
    store.put(capsule);
  });
  
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedCapsules = async (): Promise<any[]> => {
  return dbAction(STORES.CAPSULES, 'readonly', store => store.getAll());
};

export const getCachedCapsuleById = async (id: string): Promise<any> => {
  return dbAction(STORES.CAPSULES, 'readonly', store => store.get(id));
};

// --- ACTION QUEUE ---

export interface OfflineAction {
  id?: number;
  type: 'CREATE_CAPSULE' | 'EDIT_CAPSULE' | 'DELETE_CAPSULE';
  payload: any;
  timestamp: number;
  retryCount: number;
}

export const queueOfflineAction = async (type: OfflineAction['type'], payload: any) => {
  const action: OfflineAction = {
    type,
    payload,
    timestamp: Date.now(),
    retryCount: 0
  };
  return dbAction(STORES.QUEUE, 'readwrite', store => store.add(action));
};

export const getOfflineQueue = async (): Promise<OfflineAction[]> => {
  return dbAction(STORES.QUEUE, 'readonly', store => store.getAll());
};

export const removeOfflineAction = async (id: number) => {
  return dbAction(STORES.QUEUE, 'readwrite', store => store.delete(id));
};

export const clearOfflineQueue = async () => {
  return dbAction(STORES.QUEUE, 'readwrite', store => store.clear());
};

// --- MEDIA CACHING ---
// Used to cache media for offline viewing or for pending uploads

export const cacheMedia = async (url: string, blob: Blob) => {
  return dbAction(STORES.MEDIA, 'readwrite', store => store.put({ url, blob, timestamp: Date.now() }));
};

export const getCachedMedia = async (url: string): Promise<Blob | undefined> => {
  const result: any = await dbAction(STORES.MEDIA, 'readonly', store => store.get(url));
  return result?.blob;
};
