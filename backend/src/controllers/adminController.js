// backend/src/controllers/adminController.js
const db = require('../../config/db');

// 1. Fetch all articles waiting for approval
exports.getPendingReviews = async (req, res) => {
  try {
    const query = `
      SELECT p.id, p.title, p.content, p.updated_at, u.full_name as author_name 
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.status = 'pending_review' AND p.deleted_at IS NULL
      ORDER BY p.updated_at ASC
    `;
    const result = await db.query(query);
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving review queue.', error: error.message });
  }
};

// 2. MILESTONE 5 SPECIFIC: Update post status (Approval or Rejection)
exports.updatePostStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Expects 'published' or 'draft'

  if (!['published', 'draft'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Choose published or draft.' });
  }

  try {
    const query = `
      UPDATE posts 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 AND status = 'pending_review' AND deleted_at IS NULL
      RETURNING id, title, status
    `;
    const result = await db.query(query, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Article not found or not in pending review state.' });
    }

    const message = status === 'published' 
      ? `"${result.rows[0].title}" is now officially live on the homepage!` 
      : `Submission rejected. Item returned to author's drafts safely.`;

    res.status(200).json({ status: 'success', message });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update post status.', error: error.message });
  }
};

// 3. Fetch all active comments across the platform for moderation
exports.getAllCommentsForModeration = async (req, res) => {
  try {
    const query = `
      SELECT c.id, c.content, c.is_approved, c.created_at, u.full_name as author_name, p.title as post_title
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN posts p ON c.post_id = p.id
      WHERE c.deleted_at IS NULL
      ORDER BY c.created_at DESC;
    `;
    const result = await db.query(query);
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch comments archive.', error: error.message });
  }
};

// 4. Approve a reader's comment so it clears your c.is_approved filter
exports.approveComment = async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'UPDATE comments SET is_approved = true WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Comment not found.' });
    
    res.status(200).json({ status: 'success', message: 'Comment approved and visible to the public.' });
  } catch (error) {
    res.status(500).json({ message: 'Error approving comment.', error: error.message });
  }
};
// 5. GET ALL USERS (Admin Only)
exports.getAdminUsers = async (req, res) => {
  try {
    const query = `
      SELECT id, full_name, email, role, is_active, created_at 
      FROM users 
      ORDER BY created_at DESC;
    `;
    const result = await db.query(query);
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users directory.', error: error.message });
  }
};

// 6. UPDATE USER ROLE (e.g., Reader -> Publisher)
exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // 'reader', 'publisher', or 'admin'

  try {
    await db.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    res.status(200).json({ status: 'success', message: `User role successfully updated to ${role}.` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user role.', error: error.message });
  }
};

// 7. TOGGLE ACCOUNT ACTIVE STATUS (Deactivate/Reactivate)
exports.toggleUserActive = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body; // true or false

  try {
    await db.query('UPDATE users SET is_active = $1 WHERE id = $2', [is_active, id]);
    const msg = is_active ? 'Account reactivated.' : 'Account deactivated/suspended.';
    res.status(200).json({ status: 'success', message: msg });
  } catch (error) {
    res.status(500).json({ message: 'Failed to alter user account state.', error: error.message });
  }
};
exports.getRevenueChartData = async (req, res) => {
  try {
    const query = `
      SELECT 
        TO_CHAR(created_at, 'Mon DD') AS date, 
        SUM(amount)::NUMERIC AS revenue
      FROM billing_history
      WHERE status = 'completed'
      GROUP BY TO_CHAR(created_at, 'Mon DD'), DATE(created_at)
      ORDER BY DATE(created_at) ASC
      LIMIT 7; -- Returns the last 7 active days
    `;
    const result = await db.query(query);
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch chart data.', error: error.message });
  }
};
exports.getSignupChartData = async (req, res) => {
  try {
    const query = `
      SELECT 
        TO_CHAR(created_at, 'Mon DD') AS date, 
        COUNT(id)::INT AS signups
      FROM users
      GROUP BY TO_CHAR(created_at, 'Mon DD'), DATE(created_at)
      ORDER BY DATE(created_at) ASC
      LIMIT 7;
    `;
    const result = await db.query(query);
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch signup analytics.', error: error.message });
  }
};