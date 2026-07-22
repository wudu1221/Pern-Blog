// FETCH PUBLIC PUBLISHER PROFILE PAYLOAD
exports.getPublisherProfile = async (req, res) => {
  const { id } = req.params;

  try {
    const userQuery = `
      SELECT id, full_name, profession, bio, profile_picture_url, website_url, social_links, created_at
      FROM users
      WHERE id = $1 AND role = 'publisher' AND is_active = true;
    `;

    const postsQuery = `
      SELECT id, title, slug, created_at
      FROM posts
      WHERE author_id = $1 AND status = 'published' AND deleted_at IS NULL
      ORDER BY created_at DESC;
    `;

    // Fire both queries simultaneously
    const [userResult, postsResult] = await Promise.all([
      db.query(userQuery, [id]),
      db.query(postsQuery, [id])
    ]);

    // Check if the user exists/is a publisher
    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Publisher profile not found or user is not a public content creator.' 
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        profile: userResult.rows[0],
        articles: postsResult.rows,
        totalPublished: postsResult.rows.length
      }
    });

  } catch (error) {
    // Log the actual error on your server so you can debug it later
    console.error(`Error in getPublisherProfile for ID ${id}:`, error);
    
    // Send a clean, generic message to the user
    res.status(500).json({ message: 'Error retrieving profile metadata.' });
  }
};
// backend/src/controllers/userController.js
const db = require('../../config/db');

// NEW: FETCH LOGGED-IN USER'S OWN PROFILE FOR DASHBOARD
exports.getMyProfile = async (req, res) => {
  // req.user.id is injected by your protect/auth middleware
  const userId = req.user.id; 

  try {
    const query = `
      SELECT bio, github_url, linkedin_url 
      FROM users 
      WHERE id = $1;
    `;
    const result = await db.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    // Return the database row wrapped in the structure your frontend expects
    res.status(200).json({
      status: 'success',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching dashboard profile:', error);
    res.status(500).json({ message: 'Server error retrieving dashboard configuration details.' });
  }
};
// backend/src/controllers/userController.js


// NEW: UPDATE LOGGED-IN USER'S PROFILE
exports.updateMyProfile = async (req, res) => {
  const userId = req.user.id; // From auth middleware
  const { bio, github_url, linkedin_url } = req.body; // From frontend form submission

  try {
    const query = `
      UPDATE users 
      SET bio = $1, github_url = $2, linkedin_url = $3 
      WHERE id = $4
      RETURNING bio, github_url, linkedin_url;
    `;
    
    const result = await db.query(query, [bio, github_url, linkedin_url, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully!',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating dashboard profile:', error);
    res.status(500).json({ message: 'Server error updating profile configuration details.' });
  }
};
