// pages/api/cash/list.js
import pool from '../../../lib/db';
import { verifyAuth, requireRole } from '../../../lib/auth';

export default verifyAuth(requireRole('manager')(async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [entries] = await pool.execute(
      'SELECT * FROM cash_inventory ORDER BY created_at DESC LIMIT 100'
    );

    const [totals] = await pool.execute(
      `SELECT 
        COALESCE(SUM(CASE WHEN type = 'cash_in' THEN amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN type = 'cash_out' THEN amount ELSE 0 END), 0) as balance
       FROM cash_inventory`
    );

    return res.status(200).json({ 
      entries, 
      totalCash: totals[0].balance 
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
}));