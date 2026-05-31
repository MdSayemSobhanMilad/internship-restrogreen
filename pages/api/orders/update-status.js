// pages/api/orders/update-status.js
import pool from '../../../lib/db';
import { verifyAuth, requireRole } from '../../../lib/auth';

export default verifyAuth(async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, status, chefId } = req.body;
    const userRole = req.user.role;
    const userId = req.user.id;

    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
    
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Validate status transitions based on role
    if (userRole === 'chef') {
      const allowedStatuses = ['accepted', 'preparing', 'ready'];
      if (!allowedStatuses.includes(status)) {
        return res.status(403).json({ error: 'Invalid status for chef' });
      }
      
      await pool.execute(
        'UPDATE orders SET status = ?, chef_id = ? WHERE id = ?',
        [status, userId, orderId]
      );
    } else if (userRole === 'waiter') {
      if (status !== 'served') {
        return res.status(403).json({ error: 'Waiter can only mark as served' });
      }
      
      await pool.execute(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, orderId]
      );
    } else if (userRole === 'manager') {
      if (status !== 'completed') {
        return res.status(403).json({ error: 'Manager can only mark as completed' });
      }
      
      await pool.execute(
        'UPDATE orders SET status = ?, payment_status = ? WHERE id = ?',
        [status, 'paid', orderId]
      );
    }

    return res.status(200).json({ message: 'Order status updated' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});