import pool from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { userId, month, year } = req.body;
    const [result] = await pool.execute(
      'UPDATE salaries SET status = ?, paid_date = NOW() WHERE user_id = ? AND month = ? AND year = ? AND status = ?',
      ['paid', userId, month, year, 'pending']
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'No pending salary found' });
    return res.status(200).json({ message: 'Salary marked as paid' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}