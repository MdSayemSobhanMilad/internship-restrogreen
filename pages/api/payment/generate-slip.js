import pool from '../../../lib/db';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { orderId, payment_method } = req.body;

    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });
    const order = orders[0];

    const [items] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

    // Update order status
    await pool.execute("UPDATE orders SET payment_status = 'paid', status = 'completed' WHERE id = ?", [orderId]);

    // Record in payment_slips
    const [slipResult] = await pool.execute(
      'INSERT INTO payment_slips (order_id, amount, payment_method, generated_by) VALUES (?, ?, ?, ?)',
      [orderId, order.total_amount, payment_method || 'cash', null]
    );

    // Record cash in
    await pool.execute(
      'INSERT INTO cash_inventory (amount, type, description) VALUES (?, ?, ?)',
      [order.total_amount, 'cash_in', `Payment for Order #${orderId}`]
    );

    // Generate PDF
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(200, 230, 201);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setFontSize(22);
    doc.setTextColor(46, 125, 50);
    doc.text('RestroGreen', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(76, 76, 76);
    doc.text('Payment Receipt', 105, 30, { align: 'center' });

    // Info
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 45);
    doc.text(`Slip No: ${slipResult.insertId}`, 14, 50);
    doc.text(`Table: ${order.table_number}`, 14, 55);

    // Items table
    const tableRows = items.map(item => [
      item.item_name,
      item.quantity,
      `Tk. ${parseFloat(item.price).toFixed(2)}`,
      `Tk. ${(item.quantity * item.price).toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 62,
      head: [['Item', 'Qty', 'Price', 'Total']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [200, 230, 201], textColor: [46, 125, 50], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(46, 125, 50);
    doc.setFont(undefined, 'bold');
    doc.text(`Total: Tk. ${parseFloat(order.total_amount).toFixed(2)}`, 150, finalY, { align: 'right' });
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text(`Payment Method: ${payment_method || 'cash'}`, 14, finalY + 8);
    
    // Footer
    doc.setFillColor(200, 230, 201);
    doc.rect(0, 275, 210, 22, 'F');
    doc.setFontSize(8);
    doc.setTextColor(76, 76, 76);
    doc.text('Thank you for dining with RestroGreen!', 105, 288, { align: 'center' });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payment-slip-${orderId}.pdf`);
    return res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({ error: error.message });
  }
}