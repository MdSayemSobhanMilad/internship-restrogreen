// pages/api/inventory/update.js
import pool from '../../../lib/db';
import { verifyAuth, requireRole } from '../../../lib/auth';

export default verifyAuth(requireRole('chef', 'manager')(async function handler(req, res) {
  if (req.method !== 'PUT' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.user.id;
    
    if (req.method === 'POST') {
      const { item_name, category, quantity, unit, min_quantity } = req.body;
      
      await pool.execute(
        'INSERT INTO inventory (item_name, category, quantity, unit, min_quantity, updated_by) VALUES (?, ?, ?, ?, ?, ?)',
        [item_name, category, quantity, unit, min_quantity || 0, userId]
      );
      
      return res.status(201).json({ message: 'Inventory item added' });
    }

    if (req.method === 'PUT') {
      const { id, quantity, item_name, min_quantity } = req.body;
      
      if (quantity !== undefined) {
        await pool.execute(
          'UPDATE inventory SET quantity = ?, updated_by = ? WHERE id = ?',
          [quantity, userId, id]
        );
      } else {
        await pool.execute(
          'UPDATE inventory SET item_name = ?, min_quantity = ?, updated_by = ? WHERE id = ?',
          [item_name, min_quantity, userId, id]
        );
      }
      
      return res.status(200).json({ message: 'Inventory updated' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
}));