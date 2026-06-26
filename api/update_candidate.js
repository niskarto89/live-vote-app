const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }
  
  try {
    const { pin, candidate_id, new_name, photo_url } = request.body;
    const ADMIN_PIN = process.env.ADMIN_PIN || '123456';
    
    if (pin !== ADMIN_PIN) {
      return response.status(403).json({ error: 'PIN salah!' });
    }
    
    if (!candidate_id || !new_name || new_name.trim() === '') {
      return response.status(400).json({ error: 'ID Kandidat dan Nama Baru harus diisi!' });
    }
    
    if (!process.env.DATABASE_URL) {
      return response.status(500).json({ error: 'DATABASE_URL is not set' });
    }

    const sql = neon(process.env.DATABASE_URL);
    const photo = photo_url || '';
    
    // Update candidate name and photo
    await sql`UPDATE candidates SET name = ${new_name.trim()}, photo_url = ${photo} WHERE id = ${candidate_id};`;
    
    return response.status(200).json({ success: true, message: 'Data kandidat berhasil diubah!' });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
};
