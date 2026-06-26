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
    
    // Ensure candidates table exists
    await sql`
      CREATE TABLE IF NOT EXISTS candidates (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255),
          vote_count INTEGER DEFAULT 0,
          photo_url TEXT DEFAULT ''
      );
    `;
    
    // Ensure global_stats table exists
    await sql`
      CREATE TABLE IF NOT EXISTS global_stats (
          id INTEGER PRIMARY KEY,
          invalid_votes INTEGER DEFAULT 0
      );
    `;
    
    // Check if we have candidates
    const countRes = await sql`SELECT COUNT(*) as count FROM candidates;`;
    if (parseInt(countRes[0].count) === 0) {
      await sql`INSERT INTO candidates (name, vote_count, photo_url) VALUES ('Kandidat A', 0, ''), ('Kandidat B', 0, '');`;
    }
    
    // Check if global_stats exists
    const statsRes = await sql`SELECT COUNT(*) as count FROM global_stats;`;
    if (parseInt(statsRes[0].count) === 0) {
      await sql`INSERT INTO global_stats (id, invalid_votes) VALUES (1, 0);`;
    }
    
    // Fetch data
    const candidates = await sql`SELECT id, name, vote_count, photo_url FROM candidates ORDER BY id ASC;`;
    const stats = await sql`SELECT invalid_votes FROM global_stats WHERE id = 1;`;
    
    return response.status(200).json({ 
        candidates: candidates,
        invalid_votes: stats[0].invalid_votes
    });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
};
