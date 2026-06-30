const db = require('../../config/db');

// 1. GET ALL PUBLISHED POSTS (Public - No Login Required)
exports.getAllPublishedPosts = async (req, res) => {
  try {
    const { search, category } = req.query;
    
    let queryText = `
      SELECT p.id, p.title, p.slug, p.featured_image_url, p.created_at, p.author_id,
             u.full_name as author_name, c.name as category_name
      FROM posts p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published' AND p.deleted_at IS NULL
    `;
    const queryParams = [];

    // Optional Search Filter
    if (search) {
      queryParams.push(`%${search}%`);
      queryText += ` AND (p.title ILIKE $${queryParams.length} OR p.content ILIKE $${queryParams.length})`;
    }

    // Optional Category Filter
    if (category) {
      queryParams.push(category);
      queryText += ` AND c.slug = $${queryParams.length}`;
    }

    queryText += ` ORDER BY p.created_at DESC`;

    const result = await db.query(queryText, queryParams);
    res.status(200).json({ status: 'success', results: result.rows.length, data: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts.', error: error.message });
  }
};

// 2. GET SINGLE POST BY SLUG (Public - No Login Required)
exports.getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const query = `
      SELECT p.*, u.full_name as author_name, u.bio as author_bio, u.profile_picture_url
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.slug = $1 AND p.status = 'published' AND p.deleted_at IS NULL
    `;
    const result = await db.query(query, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching post.', error: error.message });
  }
};

// 3. CREATE POST DRAFT (Protected - Publisher/Admin Only)
exports.createPost = async (req, res) => {
  try {
    const { title, content, categoryId, featuredImageUrl } = req.body;
    
    // Generate clean lowercase base slug and append unique suffix to prevent collisions
    const baseSlug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    const slug = `${baseSlug}-${uniqueSuffix}`;

    const query = `
      INSERT INTO posts (author_id, title, slug, content, category_id, featured_image_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'draft')
      RETURNING *;
    `;
    
    const result = await db.query(query, [
      req.user.id, // Injected by protect middleware
      title,
      slug,
      content,
      categoryId || null,
      featuredImageUrl || null
    ]);

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'A post with an identical title or slug already exists.' });
    }
    res.status(500).json({ message: 'Error creating post.', error: error.message });
  }
};

// 4. GET PUBLISHER'S OWN POSTS (Protected - Publisher Dashboard)
// exports.getPublisherPosts = async (req, res) => {
//   try {
//     const query = `
//       SELECT p.id, p.title, p.status, p.created_at, p.updated_at,
//              COUNT(c.id) FILTER (WHERE c.deleted_at IS NULL) as comment_count
//       FROM posts p
//       LEFT JOIN comments c ON p.id = c.post_id
//       WHERE p.author_id = $1 AND p.deleted_at IS NULL
//       GROUP BY p.id
//       ORDER BY p.updated_at DESC;
//     `;
//     const result = await db.query(query, [req.user.id]);
//     res.status(200).json({ status: 'success', data: result.rows });
//   } catch (error) {
//     res.status(500).json({ message: 'Error retrieving your dashboard articles.', error: error.message });
//   }
// };

// 5. UPDATE POST (Protected - Owner Only)
exports.updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, content, categoryId, featuredImageUrl } = req.body;

  try {
    // Ownership and existence confirmation check
    const checkQuery = "SELECT author_id, status FROM posts WHERE id = $1 AND deleted_at IS NULL";
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    if (checkResult.rows[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to modify this article.' });
    }

    // Safely generate an updated unique slug if title is modified
    let slug = undefined;
    if (title) {
      const baseSlug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const uniqueSuffix = Math.random().toString(36).substring(2, 7);
      slug = `${baseSlug}-${uniqueSuffix}`;
    }

    const updateQuery = `
      UPDATE posts
      SET title = COALESCE($1, title),
          slug = COALESCE($2, slug),
          content = COALESCE($3, content),
          category_id = COALESCE($4, category_id),
          featured_image_url = COALESCE($5, featured_image_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *;
    `;

    const result = await db.query(updateQuery, [title, slug, content, categoryId, featuredImageUrl, id]);
    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'An article update triggered a naming conflict with another slug.' });
    }
    res.status(500).json({ message: 'Error updating post.', error: error.message });
  }
};

// 6. DELETE POST (Protected - Soft Delete)
exports.deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    const checkQuery = "SELECT author_id FROM posts WHERE id = $1 AND deleted_at IS NULL";
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    if (checkResult.rows[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized permission.' });
    }

    await db.query("UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
    res.status(200).json({ status: 'success', message: 'Article successfully removed.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting post.', error: error.message });
  }
};
// Fetch only the articles belonging to the logged-in publisher
exports.getMyArticles = async (req, res) => {
  try {
    // 1. Get the authenticated user's ID from the protect middleware
    const authorId = req.user.id;

    // 2. Write the SQL query to filter by author_id and exclude soft-deleted posts
    const query = `
      SELECT id, title, status, created_at, updated_at 
      FROM posts 
      WHERE author_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC;
    `;

    // 3. Execute the parameterized query safely
    const result = await db.query(query, [authorId]);

    // 4. Return the rows to the client
    res.status(200).json({
      status: 'success',
      results: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error retrieving your articles.', 
      error: error.message 
    });
  }
};