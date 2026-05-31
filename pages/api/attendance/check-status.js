import pool from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    // Get user from cookie
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    
    const jwt = (await import('jsonwebtoken')).default;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'restrogreen_secret_key_2024');
    const userId = decoded.id;
    const today = new Date().toISOString().split('T')[0];

    const [records] = await pool.execute(
      'SELECT * FROM attendance WHERE user_id = ? AND date = ?',
      [userId, today]
    );

    if (records.length === 0) {
      return res.status(200).json({ checkedIn: false, hours: 0 });
    }

    const record = records[0];
    if (record.check_out) {
      return res.status(200).json({ checkedIn: false, hours: record.hours_worked });
    }

    return res.status(200).json({ checkedIn: true, hours: record.hours_worked, checkInTime: record.check_in });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}