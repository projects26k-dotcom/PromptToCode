import Dexie from 'dexie';

/**
 * One-time safe data migration from VibeForge to PromptToCode.
 * Copies localStorage keys and IndexedDB database without destroying legacy backups.
 */
export async function runMigration() {
  const MIGRATION_FLAG = 'prompttocode_migrated_v1';

  try {
    // 1. LocalStorage migration
    const legacyKeys = [
      { oldKey: 'vibeforge-settings', newKey: 'prompttocode-settings' },
      { oldKey: 'vibeforge_current_project_id', newKey: 'prompttocode_current_project_id' },
      { oldKey: 'vibeforge_todos', newKey: 'prompttocode_todos' },
    ];

    for (const { oldKey, newKey } of legacyKeys) {
      const oldVal = localStorage.getItem(oldKey);
      const newVal = localStorage.getItem(newKey);
      if (oldVal !== null && newVal === null) {
        localStorage.setItem(newKey, oldVal);
      }
    }

    // Also migrate any other keys starting with vibeforge_
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('vibeforge_')) {
        const newKey = key.replace(/^vibeforge_/, 'prompttocode_');
        if (localStorage.getItem(newKey) === null) {
          const val = localStorage.getItem(key);
          if (val !== null) {
            localStorage.setItem(newKey, val);
          }
        }
      }
    }

    // 2. IndexedDB database migration (VibeForgeDB -> PromptToCodeDB)
    const isDbMigrated = localStorage.getItem(MIGRATION_FLAG);
    if (!isDbMigrated) {
      const dbExists = await Dexie.exists('VibeForgeDB');
      if (dbExists) {
        const oldDb = new Dexie('VibeForgeDB');
        oldDb.version(1).stores({
          projects: 'id, name, createdAt, updatedAt',
          snapshots: 'id, projectId, createdAt, label, source',
        });

        const newDb = new Dexie('PromptToCodeDB');
        newDb.version(1).stores({
          projects: 'id, name, createdAt, updatedAt',
          snapshots: 'id, projectId, createdAt, label, source',
        });

        await oldDb.open();
        await newDb.open();

        const newProjectsCount = await newDb.projects.count();
        if (newProjectsCount === 0) {
          const oldProjects = await oldDb.projects.toArray();
          if (oldProjects && oldProjects.length > 0) {
            await newDb.projects.bulkPut(oldProjects);
          }

          const oldSnapshots = await oldDb.snapshots.toArray();
          if (oldSnapshots && oldSnapshots.length > 0) {
            await newDb.snapshots.bulkPut(oldSnapshots);
          }
        }

        oldDb.close();
        newDb.close();
      }

      localStorage.setItem(MIGRATION_FLAG, 'true');
    }
  } catch (err) {
    // Migration must never block application initialization
    console.warn('[PromptToCode] Data migration notice:', err);
  }
}
