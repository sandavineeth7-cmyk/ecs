import pg from "pg";

const pool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false })
  : null;

const memory = new Map();

export async function initDb() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_titles (
      profile_id TEXT NOT NULL,
      title_id TEXT NOT NULL,
      in_watchlist BOOLEAN NOT NULL DEFAULT FALSE,
      progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (profile_id, title_id)
    )
  `);
}

export async function getLibrary(profileId) {
  if (pool) {
    const { rows } = await pool.query("SELECT title_id, in_watchlist, progress FROM user_titles WHERE profile_id = $1", [profileId]);
    return rows.map((row) => ({ titleId: row.title_id, inWatchlist: row.in_watchlist, progress: row.progress }));
  }
  return [...memory.values()].filter((item) => item.profileId === profileId);
}

export async function updateTitle(profileId, titleId, patch) {
  const current = (await getLibrary(profileId)).find((item) => item.titleId === titleId) || { inWatchlist: false, progress: 0 };
  const item = {
    profileId,
    titleId,
    inWatchlist: patch.inWatchlist ?? current.inWatchlist,
    progress: Math.max(0, Math.min(100, Number(patch.progress ?? current.progress)))
  };
  if (pool) {
    const { rows } = await pool.query(`
      INSERT INTO user_titles (profile_id, title_id, in_watchlist, progress)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (profile_id, title_id) DO UPDATE
      SET in_watchlist = EXCLUDED.in_watchlist, progress = EXCLUDED.progress, updated_at = NOW()
      RETURNING title_id, in_watchlist, progress
    `, [profileId, titleId, item.inWatchlist, item.progress]);
    return { titleId: rows[0].title_id, inWatchlist: rows[0].in_watchlist, progress: rows[0].progress };
  }
  memory.set(`${profileId}:${titleId}`, item);
  return item;
}

export async function checkDb() {
  if (!pool) return "memory";
  await pool.query("SELECT 1");
  return "postgres";
}

export async function closeDb() {
  if (pool) await pool.end();
}
