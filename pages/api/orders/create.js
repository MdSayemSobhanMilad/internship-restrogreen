// pages/api/orders/create.js
import pool from '../../../lib/db';
import { verifyAuth, requireRole } from '../../../lib/auth';

export default verifyAuth(requireRole('waiter')(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { table_number, items, notes } = req.body;
    const waiterId = req.user.id;

    const [result] = await pool.execute(
      'INSERT INTO orders (table_number, waiter_id, status, notes) VALUES (?, ?, ?, ?)',
      [table_number, waiterId, 'pending', notes || '']
    );

    const orderId = result.insertId;

    for (const item of items) {
      await pool.execute(
        'INSERT INTO order_items (order_id, item_name, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.item_name, item.quantity, item.price]
      );
    }

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    await pool.execute(
      'UPDATE orders SET total_amount = ? WHERE id = ?',
      [total, orderId]
    );

    return res.status(201).json({ 
      message: 'Order created successfully', 
      orderId,
      total 
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
}));