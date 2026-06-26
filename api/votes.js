const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(request, response) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    if (!process.env.DATABASE_URL) {
      return response.status(500).json({ error: 'DATABASE_URL is not set' });
    }

    const sql = neon(process.env.DATABASE_URL);
    
    // 1. Ensure table exists
    await sql`
      CREATE TABLE IF NOT EXISTS candidates (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255),
          vote_count INTEGER DEFAULT 0
      );
    `;
    
    // Ensure photo_url column exists (Migration)
    await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT '';`;
    
    // 2. Check if we have candidates, if not insert default 2 candidates
    const countRes = await sql`SELECT COUNT(*) as count FROM candidates;`;
    if (parseInt(countRes[0].count) === 0) {
      await sql`INSERT INTO candidates (name, vote_count, photo_url) VALUES ('Kandidat A', 0, ''), ('Kandidat B', 0, '');`;
    }
    
    // 3. Fetch candidates
    const rows = await sql`SELECT id, name, vote_count, photo_url FROM candidates ORDER BY id ASC;`;
    
    return response.status(200).json({ candidates: rows });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
};
