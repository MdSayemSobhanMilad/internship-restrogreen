// pages/api/orders/all-pending.js
import pool from '../../../lib/db';
import { verifyAuth, requireRole } from '../../../lib/auth';

export default verifyAuth(requireRole('chef')(async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [orders] = await pool.execute(
      "SELECT * FROM orders WHERE status IN ('pending', 'accepted', 'preparing', 'ready') ORDER BY created_at ASC"
    );

    for (const order of orders) {
      const [items] = await pool.execute(
        'SELECT * FROM order_items WHERE order_id = ?',
        [order.id]
      );
      order.items = items;
    }

    return res.status(200).json({ orders });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
}));