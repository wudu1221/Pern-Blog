// backend/src/controllers/commentController.js
const db = require('../../config/db');

// 1. GET COMMENTS FOR A SPECIFIC POST (Public - No Login Required)
exports.getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    
    // 💡 FIXED: Added c.user_id to the SELECT statement below so the frontend can see who owns the comment
    const query = `
      SELECT c.id, c.user_id, c.content, c.created_at, u.full_name as author_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1 AND c.is_approved = true AND c.deleted_at IS NULL
      ORDER BY c.created_at ASC;
    `;
    const result = await db.query(query, [postId]);
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving comments.', error: error.message });
  }
};

// 2. ADD A NEW COMMENT (Protected - Login Required)
exports.createComment = async (req, res) => {
  try {
    const { postId, content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Comment text content cannot be blank.' });
    }

    const query = `
      INSERT INTO comments (post_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, content, created_at;
    `;
    const result = await db.query(query, [postId, req.user.id, content]);
    
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to post your comment.', error: error.message });
  }
};

// 3. UPDATE A COMMENT (Comment Owner Only)
exports.updateComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const currentUserId = req.user.id;

  try {
    const checkQuery = 'SELECT user_id FROM comments WHERE id = $1 AND deleted_at IS NULL';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    if (checkResult.rows[0].user_id !== currentUserId) {
      return res.status(403).json({ message: 'Authorization denied. You can only edit your own comments.' });
    }

    const updateQuery = 'UPDATE comments SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
    const result = await db.query(updateQuery, [content, id]);

    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update comment.', error: error.message });
  }
};

// 4. DELETE A COMMENT (Commenter, Publisher, or Admin)
exports.deleteComment = async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  try {
    const targetQuery = `
      SELECT c.user_id AS commenter_id, p.author_id AS publisher_id 
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      WHERE c.id = $1 AND c.deleted_at IS NULL
    `;
    const targetResult = await db.query(targetQuery, [id]);

    if (targetResult.rows.length === 0) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    const { commenter_id, publisher_id } = targetResult.rows[0];

    const isCommenter = currentUserId === commenter_id;
    const isPublisher = currentUserId === publisher_id;
    const isAdmin = currentUserRole === 'admin';

    if (!isCommenter && !isPublisher && !isAdmin) {
      return res.status(403).json({ message: 'You do not have permission to delete this comment.' });
    }

    const deleteQuery = 'UPDATE comments SET deleted_at = NOW() WHERE id = $1';
    await db.query(deleteQuery, [id]);

    res.status(200).json({ status: 'success', message: 'Comment successfully removed.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete comment.', error: error.message });
  }
};