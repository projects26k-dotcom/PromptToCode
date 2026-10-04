import Dexie from 'dexie';

export const db = new Dexie('VibeForgeDB');

db.version(1).stores({
  projects: 'id, name, projectType, updatedAt, createdAt',
});

db.version(2).stores({
  projects: 'id, name, projectType, updatedAt, createdAt',
  snapshots: 'id, projectId, createdAt, label, source, messageId, fileCount',
});

// Check if IndexedDB is accessible
export let isIdbAvailable = true;
try {
  if (typeof window === 'undefined' || !window.indexedDB) {
    isIdbAvailable = false;
  }
} catch {
  isIdbAvailable = false;
}

const inMemoryStore = new Map();
export const inMemorySnapshots = new Map();

/**
 * Returns summary list of all projects sorted by last updated descending.
 */
export async function listProjects() {
  const mapProjectSummary = (p) => ({
    id: p.id,
    name: p.name,
    projectType: p.projectType || 'vanilla',
    updatedAt: p.updatedAt,
    createdAt: p.createdAt,
  });

  if (!isIdbAvailable) {
    return Array.from(inMemoryStore.values())
      .map(mapProjectSummary)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }
  try {
    const all = await db.projects.toArray();
    return all
      .map(mapProjectSummary)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (err) {
    console.warn('Dexie listProjects error, using memory fallback:', err);
    return Array.from(inMemoryStore.values())
      .map(mapProjectSummary)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }
}

/**
 * Retrieves a full project object by ID.
 */
export async function getProject(id) {
  if (!isIdbAvailable) {
    const p = inMemoryStore.get(id);
    return p ? { ...p, projectType: p.projectType || 'vanilla' } : null;
  }
  try {
    const proj = await db.projects.get(id);
    const p = proj || inMemoryStore.get(id) || null;
    return p ? { ...p, projectType: p.projectType || 'vanilla' } : null;
  } catch (err) {
    console.warn('Dexie getProject error:', err);
    const p = inMemoryStore.get(id) || null;
    return p ? { ...p, projectType: p.projectType || 'vanilla' } : null;
  }
}

/**
 * Saves or updates a project in the database.
 */
export async function saveProject(project) {
  if (!project || !project.id) return;
  const projectWithTimestamp = {
    ...project,
    projectType: project.projectType || 'vanilla',
    updatedAt: Date.now(),
  };

  inMemoryStore.set(project.id, projectWithTimestamp);

  if (isIdbAvailable) {
    try {
      await db.projects.put(projectWithTimestamp);
    } catch (err) {
      console.warn('Dexie saveProject error:', err);
    }
  }

  return projectWithTimestamp;
}

/**
 * Deletes a project from the database.
 */
export async function deleteProject(id) {
  inMemoryStore.delete(id);
  if (isIdbAvailable) {
    try {
      await db.projects.delete(id);
    } catch (err) {
      console.warn('Dexie deleteProject error:', err);
    }
  }
}

/**
 * Duplicates an existing project under a new ID and name.
 */
export async function duplicateProject(id) {
  const original = await getProject(id);
  if (!original) return null;

  const newId = 'proj-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  const copy = {
    ...original,
    id: newId,
    name: `(Copy) ${original.name}`,
    projectType: original.projectType || 'vanilla',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await saveProject(copy);
  return copy;
}
