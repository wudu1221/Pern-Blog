import { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

// --- Sub-Component for Individual Comments ---
function CommentItem({ comment, postAuthorId, currentUser, onRefresh }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isCommentOwner = currentUser?.id === comment.user_id;
  const isPostPublisher = currentUser?.id === postAuthorId;
  const isAdmin = currentUser?.role === 'admin';

  const handleEditSubmit = async () => {
    if (!editContent.trim()) return;
    try {
      await API.put(`/comments/${comment.id}`, { content: editContent });
      setIsEditing(false);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating comment text.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove this comment permanently?')) return;
    try {
      await API.delete(`/comments/${comment.id}`);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete comment.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-700 p-4 rounded-xl border border-gray-100 dark:border-slate-600 shadow-sm space-y-2">
      <div className="flex justify-between items-center">
        <div>
          <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">{comment.author_name}</span>
          <span className="text-xs text-gray-400 dark:text-gray-400 block">{new Date(comment.created_at).toLocaleDateString()}</span>
        </div>

        <div className="flex gap-3 text-xs font-semibold">
          {isCommentOwner && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="text-blue-600 dark:text-blue-400 hover:underline">
              Edit
            </button>
          )}
          {(isCommentOwner || isPostPublisher || isAdmin) && (
            <button onClick={handleDelete} className="text-red-600 dark:text-red-400 hover:underline">
              Delete
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2 mt-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full text-sm p-2 border dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="2"
          />
          <div className="flex gap-2">
            <button onClick={handleEditSubmit} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition">
              Save
            </button>
            <button onClick={() => { setIsEditing(false); setEditContent(comment.content); }} className="bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-200 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-500 transition">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{comment.content}</p>
      )}
    </div>
  );
}

// --- Main Post Detail Component ---
export default function PostDetail() {
  const { slug } = useParams();
  const { user } = useContext(AuthContext);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');
  
  const [imageError, setImageError] = useState(false);
  const BACKEND_URL = 'http://localhost:5000';

  const refreshComments = (postId) => {
    API.get(`/comments/post/${postId}`)
      .then(res => setComments(res.data.data))
      .catch(err => console.error('Failed to reload comments:', err));
  };

  useEffect(() => {
    API.get(`/posts/${slug}`)
      .then(res => {
        setPost(res.data.data);
        refreshComments(res.data.data.id);
        setImageError(false); // Reset image load tracking on post switches
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load article.'));
  }, [slug]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await API.post('/comments', {
        postId: post.id,
        content: newComment
      });
      setNewComment('');
      refreshComments(post.id);
    } catch (err) {
      alert(err.response?.data?.message || 'Error posting comment.');
    }
  };

  if (error) return <div className="p-8 text-center text-red-600 font-medium">{error}</div>;
  if (!post) return <div className="p-8 text-center text-gray-500">Loading article content...</div>;

  // --- FIXED COVER IMAGE RESOLVER ---
  const getCoverImageUrl = () => {
    // 1. Fallback stack matching your precise 'featured_image_url' database column
    const rawImageFile = post.featured_image_url || post.cover_image || post.coverImage || post.featured_image || post.image;
    
    if (!rawImageFile) return null;

    // 2. Return absolute URLs as is
    if (rawImageFile.startsWith('http://') || rawImageFile.startsWith('https://')) {
      return rawImageFile;
    }

    // 3. Clean string forward slash formats safely
    const normalizedPath = rawImageFile.startsWith('/') ? rawImageFile : `/${rawImageFile}`;
    
    // 4. If path already has '/uploads', combine it cleanly to prevent doubling up
    if (normalizedPath.startsWith('/uploads/')) {
      return `${BACKEND_URL}${normalizedPath}`;
    }
    
    return `${BACKEND_URL}/uploads${normalizedPath}`;
  };

  const coverImageUrl = getCoverImageUrl();
  const showActualImage = coverImageUrl && !imageError;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 w-full overflow-x-hidden">
      
      <style>{`
        .article-content {
          word-wrap: break-word !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
        }
        .article-content img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 0.75rem;
        }
        .article-content pre, .article-content code {
          white-space: pre-wrap !important;
          word-break: break-all !important;
          max-width: 100% !important;
          overflow-x: auto !important;
        }
        .article-content table {
          display: block;
          width: 100% !important;
          overflow-x: auto !important;
        }
      `}</style>

      <Link to="/" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
        ← Back to Homepage
      </Link>
      
      <article className="mt-6 w-full max-w-full">
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-gray-100 leading-tight mb-4 break-words">
          {post.title}
        </h1>
        
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-8 border-b dark:border-slate-800 pb-4">
          By <span className="font-semibold text-gray-700 dark:text-gray-300">{post.author_name}</span> • {new Date(post.created_at).toLocaleDateString()}
        </div>

        {/* --- HERO COVER IMAGE BANNER --- */}
        <div className="relative w-full h-[240px] sm:h-[380px] md:h-[440px] rounded-2xl overflow-hidden shadow-md mb-8 bg-gray-100 dark:bg-slate-800 group">
          {showActualImage ? (
            <img 
              src={coverImageUrl} 
              alt={post.title} 
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              onError={() => setImageError(true)}
            />
          ) : (
            /* Visual Gradient Fallback */
            <div className="w-full h-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-6">
              <span className="text-white/80 font-extrabold text-xl md:text-2xl text-center tracking-wide leading-snug max-w-lg">
                {post.title}
              </span>
            </div>
          )}
        </div>

        {/* Article Body Content */}
        <div 
          className="article-content prose dark:prose-invert max-w-full text-gray-800 dark:text-gray-200 leading-relaxed space-y-4 break-words overflow-x-hidden"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      <hr className="my-12 border-gray-200 dark:border-slate-800" />

      {/* Comments Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Discussion ({comments.length})</h2>

        {/* Comment Entry Box */}
        {user ? (
          <form onSubmit={handleCommentSubmit} className="space-y-3">
            <textarea
              rows="3"
              required
              placeholder="Join the conversation..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full px-4 py-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition">
              Post Comment
            </button>
          </form>
        ) : (
          <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 text-sm text-gray-600 dark:text-gray-300 text-center">
            You must be <Link to="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">logged in</Link> to post a comment.
          </div>
        )}

        {/* Comments Feed List */}
        <div className="space-y-4 pt-4">
          {comments.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 italic text-sm">No comments yet. Be the first to share your thoughts!</p>
          ) : (
            comments.map(comment => (
              <CommentItem 
                key={comment.id}
                comment={comment}
                postAuthorId={post.author_id}
                currentUser={user}
                onRefresh={() => refreshComments(post.id)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}