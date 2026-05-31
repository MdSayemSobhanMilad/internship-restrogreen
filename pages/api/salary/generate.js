import pool from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { month, year } = req.body;
    const [users] = await pool.execute("SELECT id, name, salary_per_hour FROM users WHERE role != 'admin' AND status = 'active'");
    const results = [];

    for (const user of users) {
      const [attendance] = await pool.execute(
        `SELECT SUM(hours_worked) as total_hours, COUNT(CASE WHEN status = 'present' THEN 1 END) as full_days, COUNT(CASE WHEN status = 'half_day' THEN 1 END) as half_days FROM attendance WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?`,
        [user.id, month, year]
      );
      const totalHours = attendance[0].total_hours || 0;
      const amount = totalHours * user.salary_per_hour;

      const [existing] = await pool.execute('SELECT id, status FROM salaries WHERE user_id = ? AND month = ? AND year = ?', [user.id, month, year]);

      if (existing.length > 0) {
        await pool.execute('UPDATE salaries SET total_hours = ?, total_days = ?, half_days = ?, amount = ? WHERE id = ?',
          [totalHours, attendance[0].full_days, attendance[0].half_days, amount, existing[0].id]);
        results.push({ user_id: user.id, name: user.name, total_hours: totalHours, full_days: attendance[0].full_days, half_days: attendance[0].half_days, amount, status: existing[0].status });
      } else {
        const [insert] = await pool.execute('INSERT INTO salaries (user_id, month, year, total_hours, total_days, half_days, amount) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [user.id, month, year, totalHours, attendance[0].full_days, attendance[0].half_days, amount]);
        results.push({ user_id: user.id, name: user.name, total_hours: totalHours, full_days: attendance[0].full_days, half_days: attendance[0].half_days, amount, status: 'pending', id: insert.insertId });
      }
    }
    return res.status(200).json({ data: results });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}