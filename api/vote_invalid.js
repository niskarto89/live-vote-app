const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }
  
  try {
    const { pin, action } = request.body; // action can be 'increment' or 'decrement'
    const ADMIN_PIN = process.env.ADMIN_PIN || '123456';
    
    if (pin !== ADMIN_PIN) {
        return response.status(403).json({ error: 'PIN salah! Anda tidak memiliki akses.' });
    }
    
    if (!process.env.DATABASE_URL) {
      return response.status(500).json({ error: 'DATABASE_URL is not set' });
    }

    const sql = neon(process.env.DATABASE_URL);
    
    if (action === 'decrement') {
      await sql`UPDATE global_stats SET invalid_votes = GREATEST(invalid_votes - 1, 0) WHERE id = 1;`;
    } else {
      await sql`UPDATE global_stats SET invalid_votes = invalid_votes + 1 WHERE id = 1;`;
    }
    
    return response.status(200).json({ success: true });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
};
