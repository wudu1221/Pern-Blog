// backend/src/controllers/categoryController.js
const db = require('../../config/db'); // Adjust path to your db file

exports.getAllCategories = async (req, res) => {
  try {
    // ✅ Fix: Uses db.query and includes post counts per category
    const query = `
      SELECT c.id, c.name, c.slug, COUNT(p.id) AS post_count
      FROM categories c
      LEFT JOIN posts p ON c.id = p.category_id AND p.status = 'published' AND p.deleted_at IS NULL
      GROUP BY c.id, c.name, c.slug
      ORDER BY c.name ASC
    `;

    const result = await db.query(query);

    res.status(200).json({
      status: 'success',
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Server error while fetching categories' });
  }
};