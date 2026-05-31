// pages/api/attendance/report.js
import pool from '../../../lib/db';
import { verifyAuth, requireRole } from '../../../lib/auth';

export default verifyAuth(requireRole('admin')(async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { month, year } = req.query;
    
    const [attendance] = await pool.execute(
      `SELECT u.id, u.name, u.role, 
              COUNT(CASE WHEN a.status = 'present' THEN 1 END) as full_days,
              COUNT(CASE WHEN a.status = 'half_day' THEN 1 END) as half_days,
              COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absences,
              SUM(a.hours_worked) as total_hours
       FROM users u
       LEFT JOIN attendance a ON u.id = a.user_id 
         AND MONTH(a.date) = ? AND YEAR(a.date) = ?
       WHERE u.status = 'active' AND u.role != 'admin'
       GROUP BY u.id, u.name, u.role`,
      [month || new Date().getMonth() + 1, year || new Date().getFullYear()]
    );

    return res.status(200).json({ attendance });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
}));