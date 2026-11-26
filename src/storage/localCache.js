import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@sharp_crm_v3:';

export const TABLES = {
  TICKETS: `${PREFIX}tickets`,
  USERS: `${PREFIX}users`,
  SESSION: `${PREFIX}session`,
  NOTIFICATIONS: `${PREFIX}notifications`,
  META: `${PREFIX}meta`,
};

async function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (err) {
    console.warn('[LocalCache] Corrupted cache recovered with fallback:', err.message);
    return fallback;
  }
}

export const LocalCache = {
  // SQLite-style SELECT equivalent with optional filter predicate
  async select(tableKey, predicate = null, fallback = []) {
    try {
      const raw = await AsyncStorage.getItem(tableKey);
      const rows = await safeParse(raw, fallback);
      if (!Array.isArray(rows)) return fallback;
      return typeof predicate === 'function' ? rows.filter(predicate) : rows;
    } catch (err) {
      console.warn(`[LocalCache] SELECT failed on ${tableKey}:`, err.message);
      return fallback;
    }
  },

  // SQLite-style INSERT OR REPLACE (UPSERT) for a single record by `id`
  async upsertRow(tableKey, row, idField = 'id') {
    if (!row || !row[idField]) {
      throw new Error('Cannot cache record without a valid ID.');
    }
    const existing = await this.select(tableKey, null, []);
    const index = existing.findIndex(item => String(item[idField]) === String(row[idField]));
    const nextRows =
      index >= 0
        ? existing.map((item, idx) => (idx === index ? { ...item, ...row } : item))
        : [row, ...existing];

    await this.replaceAll(tableKey, nextRows);
    return nextRows;
  },

  // Atomic-style full table replacement + last-synced timestamp
  async replaceAll(tableKey, rows) {
    try {
      await AsyncStorage.setItem(tableKey, JSON.stringify(rows));
      await this.setMeta(tableKey, {
        lastUpdatedAt: new Date().toISOString(),
        recordCount: Array.isArray(rows) ? rows.length : 0,
      });
    } catch (err) {
      console.error(`[LocalCache] Write failed on ${tableKey}:`, err.message);
      throw new Error('Unable to save data to local storage.');
    }
  },

  async getObject(tableKey, fallback = null) {
    try {
      const raw = await AsyncStorage.getItem(tableKey);
      return await safeParse(raw, fallback);
    } catch (err) {
      return fallback;
    }
  },

  async setObject(tableKey, value) {
    await AsyncStorage.setItem(tableKey, JSON.stringify(value));
  },

  async remove(tableKey) {
    try {
      await AsyncStorage.removeItem(tableKey);
    } catch (err) {
      console.warn(`[LocalCache] Remove failed for ${tableKey}:`, err.message);
    }
  },

  async setMeta(tableKey, info) {
    const meta = (await this.getObject(TABLES.META, {})) || {};
    meta[tableKey] = { ...(meta[tableKey] || {}), ...info };
    await AsyncStorage.setItem(TABLES.META, JSON.stringify(meta));
  },

  async getMeta(tableKey) {
    const meta = (await this.getObject(TABLES.META, {})) || {};
    return meta[tableKey] || null;
  },
};