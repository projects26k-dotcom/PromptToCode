import { db, isIdbAvailable, inMemorySnapshots } from './db';
import { getDiffStats } from './diff';

/**
 * Checks if two file dictionaries are identical in keys and contents.
 */
export function areFilesIdentical(filesA = {}, filesB = {}) {
  const keysA = Object.keys(filesA || {});
  const keysB = Object.keys(filesB || {});
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (filesA[key] !== filesB[key]) return false;
  }
  return true;
}

/**
 * Creates a project snapshot if files have changed since the latest snapshot.
 */
export async function createSnapshot({ projectId, files, label, source = 'manual', messageId = null, force = false }) {
  if (!projectId || !files || typeof files !== 'object') return null;

  // Retrieve current snapshots to check if identical to latest
  if (!force) {
    const existing = await listSnapshots(projectId);
    if (existing.length > 0) {
      const latest = existing[0];
      if (areFilesIdentical(latest.files, files)) {
        return null; // Skip duplicate snapshot if files have not changed
      }
    }
  }

  const snapshot = {
    id: 'snap-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    projectId,
    createdAt: Date.now(),
    label: label || (source === 'manual' ? 'Manual Checkpoint' : 'Snapshot'),
    source, // 'initial' | 'before-ai' | 'after-ai' | 'fix' | 'manual' | 'restore'
    messageId: messageId || null,
    files: { ...files },
    fileCount: Object.keys(files).length,
  };

  inMemorySnapshots.set(snapshot.id, snapshot);

  if (isIdbAvailable) {
    try {
      await db.snapshots.put(snapshot);
    } catch (err) {
      console.warn('Failed to save snapshot to IndexedDB:', err);
    }
  }

  // Cleanup old non-manual snapshots, keeping latest 50
  try {
    await deleteOldSnapshots(projectId, 50);
  } catch {}

  return snapshot;
}

/**
 * Returns all snapshots for a project, sorted by createdAt descending.
 */
export async function listSnapshots(projectId) {
  if (!projectId) return [];

  if (!isIdbAvailable) {
    return Array.from(inMemorySnapshots.values())
      .filter((s) => s.projectId === projectId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  try {
    const items = await db.snapshots
      .where('projectId')
      .equals(projectId)
      .sortBy('createdAt');
    return items.reverse();
  } catch (err) {
    console.warn('Failed to list snapshots from IndexedDB:', err);
    return Array.from(inMemorySnapshots.values())
      .filter((s) => s.projectId === projectId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }
}

/**
 * Retrieves a single snapshot by ID.
 */
export async function getSnapshot(id) {
  if (!id) return null;

  if (!isIdbAvailable) {
    return inMemorySnapshots.get(id) || null;
  }

  try {
    const item = await db.snapshots.get(id);
    return item || inMemorySnapshots.get(id) || null;
  } catch (err) {
    console.warn('Failed to get snapshot from IndexedDB:', err);
    return inMemorySnapshots.get(id) || null;
  }
}

/**
 * Deletes a snapshot by ID.
 */
export async function deleteSnapshot(id) {
  if (!id) return;

  inMemorySnapshots.delete(id);

  if (isIdbAvailable) {
    try {
      await db.snapshots.delete(id);
    } catch (err) {
      console.warn('Failed to delete snapshot from IndexedDB:', err);
    }
  }
}

/**
 * Deletes all snapshots for a project.
 */
export async function deleteSnapshotsForProject(projectId) {
  if (!projectId) return;

  for (const [id, snap] of inMemorySnapshots.entries()) {
    if (snap.projectId === projectId) {
      inMemorySnapshots.delete(id);
    }
  }

  if (isIdbAvailable) {
    try {
      await db.snapshots.where('projectId').equals(projectId).delete();
    } catch (err) {
      console.warn('Failed to delete project snapshots from IndexedDB:', err);
    }
  }
}

/**
 * Retains latest N non-manual snapshots, never deleting manual checkpoints.
 */
export async function deleteOldSnapshots(projectId, keep = 50) {
  if (!projectId) return;

  const all = await listSnapshots(projectId);
  if (all.length <= keep) return;

  // Filter out manual snapshots (they are preserved permanently)
  const nonManual = all.filter((s) => s.source !== 'manual');
  if (nonManual.length <= keep) return;

  const toDelete = nonManual.slice(keep);
  for (const snap of toDelete) {
    await deleteSnapshot(snap.id);
  }
}

/**
 * Compares two snapshot file maps and computes changed files and diff stats.
 */
export function diffSnapshots(filesA = {}, filesB = {}) {
  const safeA = filesA || {};
  const safeB = filesB || {};

  const keysA = new Set(Object.keys(safeA));
  const keysB = new Set(Object.keys(safeB));
  const allKeys = Array.from(new Set([...keysA, ...keysB])).sort();

  const added = [];
  const removed = [];
  const modified = [];
  const stats = {};

  let totalAdded = 0;
  let totalRemoved = 0;

  for (const key of allKeys) {
    const hasA = keysA.has(key);
    const hasB = keysB.has(key);

    if (!hasA && hasB) {
      added.push(key);
      const fileStat = getDiffStats('', safeB[key] || '');
      stats[key] = fileStat;
      totalAdded += fileStat.added;
      totalRemoved += fileStat.removed;
    } else if (hasA && !hasB) {
      removed.push(key);
      const fileStat = getDiffStats(safeA[key] || '', '');
      stats[key] = fileStat;
      totalAdded += fileStat.added;
      totalRemoved += fileStat.removed;
    } else if (safeA[key] !== safeB[key]) {
      modified.push(key);
      const fileStat = getDiffStats(safeA[key] || '', safeB[key] || '');
      stats[key] = fileStat;
      totalAdded += fileStat.added;
      totalRemoved += fileStat.removed;
    }
  }

  return {
    added,
    removed,
    modified,
    stats,
    totalAdded,
    totalRemoved,
    hasChanges: added.length > 0 || removed.length > 0 || modified.length > 0,
  };
}
