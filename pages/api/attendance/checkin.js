// pages/api/attendance/checkin.js
import pool from '../../../lib/db';
import { verifyAuth } from '../../../lib/auth';

export default verifyAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Check if already checked in today
    const [existing] = await pool.execute(
      'SELECT * FROM attendance WHERE user_id = ? AND date = ?',
      [userId, today]
    );

    if (existing.length > 0 && existing[0].check_in) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    if (existing.length > 0) {
      await pool.execute(
        'UPDATE attendance SET check_in = ? WHERE id = ?',
        [now, existing[0].id]
      );
    } else {
      await pool.execute(
        'INSERT INTO attendance (user_id, date, check_in, status) VALUES (?, ?, ?, ?)',
        [userId, today, now, 'present']
      );
    }

    return res.status(200).json({ message: 'Check-in successful', time: now });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});