// pages/api/inventory/list.js
import pool from '../../../lib/db';
import { verifyAuth } from '../../../lib/auth';

export default verifyAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [inventory] = await pool.execute('SELECT * FROM inventory ORDER BY item_name');
    return res.status(200).json({ inventory });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});