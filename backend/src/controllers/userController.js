// backend/src/controllers/userController.js
const db = require('../../config/db');

// FETCH PUBLIC PUBLISHER PROFILE PAYLOAD
exports.getPublisherProfile = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Grab foundational profile metrics
    const userQuery = `
      SELECT id, full_name, profession, bio, profile_picture_url, website_url, social_links, created_at
      FROM users
      WHERE id = $1 AND role = 'publisher' AND is_active = true;
    `;
    const userResult = await db.query(userQuery, [id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Publisher profile not found or user is not a public content creator.' });
    }

    const profile = userResult.rows[0];

    // 2. Fetch all public articles specifically mapped to this user
    const postsQuery = `
      SELECT id, title, slug, created_at
      FROM posts
      WHERE author_id = $1 AND status = 'published' AND deleted_at IS NULL
      ORDER BY created_at DESC;
    `;
    const postsResult = await db.query(postsQuery, [id]);

    res.status(200).json({
      status: 'success',
      data: {
        profile,
        articles: postsResult.rows,
        totalPublished: postsResult.rows.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving profile metadata.', error: error.message });
  }
};