const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }
  
  try {
    const { pin } = request.body;
    const ADMIN_PIN = process.env.ADMIN_PIN || '123456';
    
    if (pin !== ADMIN_PIN) {
      return response.status(403).json({ error: 'PIN salah!' });
    }
    
    if (!process.env.DATABASE_URL) {
      return response.status(500).json({ error: 'DATABASE_URL is not set' });
    }

    const sql = neon(process.env.DATABASE_URL);
    
    // Reset all votes to 0
    await sql`UPDATE candidates SET vote_count = 0;`;
    await sql`UPDATE global_stats SET invalid_votes = 0 WHERE id = 1;`;
    
    return response.status(200).json({ success: true, message: 'Suara berhasil di-reset!' });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
};
