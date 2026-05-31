import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'restrogreen_secret_key_2024');
    const userId = decoded.id;
    const month = req.query.month || new Date().getMonth() + 1;
    const year = req.query.year || new Date().getFullYear();

    const [salaries] = await pool.execute(
      'SELECT * FROM salaries WHERE user_id = ? AND month = ? AND year = ?',
      [userId, month, year]
    );
    return res.status(200).json({ salary: salaries[0] || null });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}