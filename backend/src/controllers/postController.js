const db = require('../../config/db');

// 1. GET ALL PUBLISHED POSTS (Public - No Login Required with Search & Pagination)
exports.getAllPublishedPosts = async (req, res) => {
  try {
    const { search, category } = req.query;
    
    // Parse dynamic pagination parameters from the client URL query
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 6; // Default to 6 articles per layout grid window
    const offset = (page - 1) * limit;
    
    // Isolate base conditional clause strings to reuse them inside the count query execution block
    let baseConditions = `WHERE p.status = 'published' AND p.deleted_at IS NULL`;
    const queryParams = [];

    // Optional Search Filter
    if (search) {
      queryParams.push(`%${search}%`);
      baseConditions += ` AND (p.title ILIKE $${queryParams.length} OR p.content ILIKE $${queryParams.length})`;
    }

    // Optional Category Filter (Guard against 'All', then check slug or name)
    if (category && category !== 'All') {
      queryParams.push(category);
      baseConditions += ` AND (c.slug = $${queryParams.length} OR c.name ILIKE $${queryParams.length})`;
    }

    // A. Count query execution to compute dynamic upper limits of pagination indicators
    const countQuery = `
      SELECT COUNT(*) 
      FROM posts p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${baseConditions}
    `;
    const countResult = await db.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit) || 1;

    // B. Build out target pagination data select slice using Postgres LIMIT/OFFSET rules
    // Note: Added p.content (and p.summary if your schema has it) so Home.jsx can read it
    const queryText = `
      SELECT p.id, p.title, p.slug, p.content, p.summary, p.featured_image_url, p.created_at, p.author_id,
             u.full_name as author_name, c.name as category_name
      FROM posts p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${baseConditions}
      ORDER BY p.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    // Append numerical offset parameters directly into parameter injection mapping arrays
    const result = await db.query(queryText, [...queryParams, limit, offset]);
    
    // Sends structural indicators back safely matching frontend requirements
    res.status(200).json({ 
      status: 'success', 
      results: result.rows.length, 
      totalPages: totalPages,
      currentPage: page,
      posts: result.rows, // Maps directly onto Home.jsx logic configurations
      data: result.rows   // Retained explicitly for legacy routing backups
    });
  } catch (error) {
    console.error("🔥 Error fetching published posts:", error);
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
// backend/controllers/postController.js

exports.createPost = async (req, res) => {
  try {
    // Multer populates text fields inside req.body dynamically!
    const { title, content, categoryId } = req.body;
    
    // Safety guard: prevent crash if title wasn't filled out
    if (!title || !content) {
      return res.status(400).json({ status: 'fail', message: 'Title and Content are required fields.' });
    }

    // Generate clean lowercase base slug and append unique suffix
    const baseSlug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    const slug = `${baseSlug}-${uniqueSuffix}`;

    // ✅ FIX: Point to the unique disk filename instead of originalname
    const featuredImageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const query = `
      INSERT INTO posts (author_id, title, slug, content, category_id, featured_image_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'draft')
      RETURNING *;
    `;
    
    const result = await db.query(query, [
      req.user.id, 
      title,
      slug,
      content,
      categoryId ? parseInt(categoryId, 10) : null, // Ensure string numbers convert to integer
      featuredImageUrl
    ]);

    return res.status(201).json({ status: 'success', data: result.rows[0] });

  } catch (error) {
    console.error("🔥 Error creating post:", error); // Logs the exact issue to terminal
    
    if (error.code === '23505') {
      return res.status(400).json({ message: 'A post with an identical title or slug already exists.' });
    }
    return res.status(500).json({ message: 'Error creating post.', error: error.message });
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

// Fetch dashboard metrics for total reads, comments, and transaction history
exports.getMyAnalytics = async (req, res) => {
  try {
    const authorId = req.user.id;
    
    let totalArticles = 0;
    let totalReads = 0;
    let totalComments = 0;
    let settledFees = 0;

    // 1. Safe Fetch: Articles Count & Reads
    try {
      // We try to grab views, if 'views' column doesn't exist, the catch block handles it
      const statsResult = await db.query(
        `SELECT COUNT(id) as total_articles, COALESCE(SUM(views), 0) as total_reads 
         FROM posts WHERE author_id = $1 AND deleted_at IS NULL`, 
        [authorId]
      );
      totalArticles = parseInt(statsResult.rows[0].total_articles, 10);
      totalReads = parseInt(statsResult.rows[0].total_reads, 10);
    } catch (sqlError) {
      console.warn("⚠️ Column 'views' likely missing. Falling back to basic count. Error:", sqlError.message);
      
      // Fallback query without the views column
      const fallbackStats = await db.query(
        `SELECT COUNT(id) as total_articles FROM posts WHERE author_id = $1 AND deleted_at IS NULL`, 
        [authorId]
      );
      totalArticles = parseInt(fallbackStats.rows[0].total_articles, 10);
      totalReads = 0; // Mocked for now
    }

    // 2. Safe Fetch: Comments Count
    try {
      const commentsResult = await db.query(
        `SELECT COUNT(c.id) as total_comments
         FROM comments c
         JOIN posts p ON c.post_id = p.id
         WHERE p.author_id = $1 AND c.deleted_at IS NULL AND p.deleted_at IS NULL`,
        [authorId]
      );
      totalComments = parseInt(commentsResult.rows[0].total_comments, 10);
    } catch (sqlError) {
      console.warn("⚠️ Comments table query failed. Setting count to 0. Error:", sqlError.message);
      totalComments = 0;
    }

    // 3. Safe Fetch: Chapa Payments
    try {
      const paymentsResult = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total_fees 
         FROM billing_history WHERE author_id = $1 AND status = 'completed'`,
        [authorId]
      );
      settledFees = parseFloat(paymentsResult.rows[0].total_fees);
    } catch (sqlError) {
      console.warn("⚠️ Payments table query failed. Setting fees to 0. Error:", sqlError.message);
      settledFees = 0;
    }

    // 4. Send clean response back to client (Aligned perfectly with frontend expectations)
    return res.status(200).json({
      status: 'success',
      data: {
        totalReads: totalReads,     
        totalViews: totalReads,        // Maps to analytics.totalViews
        totalArticles: totalArticles,
        totalComments: totalComments,  // Maps to analytics.totalComments
        completedPayouts: settledFees  // Aligned with frontend structures
      }
    });

  } catch (error) {
    console.error("🔥 Top level analytics failure:", error.message);
    return res.status(500).json({ 
      message: 'Critical error computing dashboard metrics.', 
      error: error.message 
    });
  }
};