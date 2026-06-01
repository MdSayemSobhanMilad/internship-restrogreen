// pages/api/users/manage.js
import pool from '../../../lib/db';
import { verifyAuth, requireRole } from '../../../lib/auth';

export default verifyAuth(requireRole('admin')(async function handler(req, res) {
  try {
    const userId = req.user.id;

    if (req.method === 'POST') {
      const { name, email, password, role, salary_per_hour } = req.body;
      
      // Store the password as plain text (no hashing)
      const [result] = await pool.execute(
        'INSERT INTO users (name, email, password, role, salary_per_hour) VALUES (?, ?, ?, ?, ?)',
        [name, email, password, role, salary_per_hour || 0]
      );

      return res.status(201).json({ 
        message: 'User created', 
        userId: result.insertId 
      });
    }

    if (req.method === 'DELETE') {
      const { userId: targetUserId } = req.body;
      
      await pool.execute(
        'UPDATE users SET status = ? WHERE id = ?',
        ['inactive', targetUserId]
      );

      return res.status(200).json({ message: 'User deactivated' });
    }

    if (req.method === 'PUT') {
      const { userId: targetUserId, salary_per_hour, name } = req.body;
      
      if (salary_per_hour !== undefined) {
        await pool.execute(
          'UPDATE users SET salary_per_hour = ? WHERE id = ?',
          [salary_per_hour, targetUserId]
        );
      }
      
      if (name) {
        await pool.execute(
          'UPDATE users SET name = ? WHERE id = ?',
          [name, targetUserId]
        );
      }

      return res.status(200).json({ message: 'User updated' });
    }

    if (req.method === 'GET') {
      const [users] = await pool.execute(
        'SELECT id, name, email, role, salary_per_hour, status, created_at FROM users WHERE status = ?',
        ['active']
      );
      
      return res.status(200).json({ users });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
}));