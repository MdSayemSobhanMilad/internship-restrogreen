// pages/api/attendance/checkout.js
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

    const [records] = await pool.execute(
      'SELECT * FROM attendance WHERE user_id = ? AND date = ?',
      [userId, today]
    );

    if (records.length === 0 || !records[0].check_in) {
      return res.status(400).json({ error: 'No check-in record found for today' });
    }

    const record = records[0];
    
    if (record.check_out) {
      return res.status(400).json({ error: 'Already checked out today' });
    }

    const checkInTime = new Date(record.check_in);
    const hoursWorked = (now - checkInTime) / (1000 * 60 * 60);
    
    let status = 'present';
    if (hoursWorked < 8 && hoursWorked >= 4) {
      status = 'half_day';
    } else if (hoursWorked < 4) {
      status = 'absent';
    }

    await pool.execute(
      'UPDATE attendance SET check_out = ?, hours_worked = ?, status = ? WHERE id = ?',
      [now, Math.round(hoursWorked * 100) / 100, status, record.id]
    );

    return res.status(200).json({ 
      message: 'Check-out successful', 
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      status 
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});