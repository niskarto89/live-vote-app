const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }
  
  try {
    if (!process.env.DATABASE_URL) {
      return response.status(500).json({ error: 'DATABASE_URL is not set' });
    }

    const sql = neon(process.env.DATABASE_URL);
    const { candidate_id } = request.body;
    
    if (!candidate_id) {
      return response.status(400).json({ error: 'candidate_id is required' });
    }
    
    // Increment vote count
    await sql`UPDATE candidates SET vote_count = vote_count + 1 WHERE id = ${candidate_id};`;
    
    return response.status(200).json({ success: true });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
};
