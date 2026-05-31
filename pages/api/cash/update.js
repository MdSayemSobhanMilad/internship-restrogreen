// pages/api/cash/update.js
import pool from '../../../lib/db';
import { verifyAuth, requireRole } from '../../../lib/auth';

export default verifyAuth(requireRole('manager')(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, type, description } = req.body;
    const userId = req.user.id;

    await pool.execute(
      'INSERT INTO cash_inventory (amount, type, description, updated_by) VALUES (?, ?, ?, ?)',
      [amount, type, description || '', userId]
    );

    return res.status(201).json({ message: 'Cash inventory updated' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
}));