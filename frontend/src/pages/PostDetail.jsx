// frontend/src/pages/PostDetail.jsx
import { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

// --- Sub-Component for Individual Comments ---
function CommentItem({ comment, postAuthorId, currentUser, onRefresh }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  // Authorization Flags
  const isCommentOwner = currentUser?.id === comment.user_id;
  const isPostPublisher = currentUser?.id === postAuthorId;
  const isAdmin = currentUser?.role === 'admin';

  const handleEditSubmit = async () => {
    if (!editContent.trim()) return;
    try {
      await API.put(`/comments/${comment.id}`, { content: editContent });
      setIsEditing(false);
      onRefresh(); // Trigger a reload of the comment stream
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating comment text.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove this comment permanently?')) return;
    try {
      await API.delete(`/comments/${comment.id}`);
      onRefresh(); // Trigger a reload of the comment stream
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete comment.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-700 p-4 rounded-xl border shadow-sm space-y-2">
      <div className="flex justify-between items-center">
        <div>
          <span className="font-bold text-gray-900 text-sm">{comment.author_name}</span>
          <span className="text-xs text-gray-400 block">{new Date(comment.created_at).toLocaleDateString()}</span>
        </div>

        {/* Action Controls Panel */}
        <div className="flex gap-3 text-xs font-semibold">
          {/* Commenter can edit their own text */}
          {isCommentOwner && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:underline">
              Edit
            </button>
          )}

          {/* Commenter, Publisher, or Admin can delete */}
          {(isCommentOwner || isPostPublisher || isAdmin) && (
            <button onClick={handleDelete} className="text-red-600 hover:underline">
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
            className="w-full text-sm p-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="2"
          />
          <div className="flex gap-2">
            <button onClick={handleEditSubmit} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition">
              Save
            </button>
            <button onClick={() => { setIsEditing(false); setEditContent(comment.content); }} className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
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

  // Reusable helper function to fetch fresh comment data
  const refreshComments = (postId) => {
    API.get(`/comments/post/${postId}`)
      .then(res => setComments(res.data.data))
      .catch(err => console.error('Failed to reload comments:', err));
  };

  // Fetch post and comments together initially
  useEffect(() => {
    API.get(`/posts/${slug}`)
      .then(res => {
        setPost(res.data.data);
        refreshComments(res.data.data.id);
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
      refreshComments(post.id); // Pull clean data from backend to sync instantly
    } catch (err) {
      alert(err.response?.data?.message || 'Error posting comment.');
    }
  };

  if (error) return <div className="p-8 text-center text-red-600 font-medium">{error}</div>;
  if (!post) return <div className="p-8 text-center text-gray-500">Loading article content...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link to="/" className="text-sm font-semibold text-blue-600 hover:underline">← Back to Homepage</Link>
      
      {/* Article Header */}
      <article className="mt-6">
        <h1 className="text-4xl font-black text-gray-900 leading-tight mb-4">{post.title}</h1>
        <div className="text-sm text-gray-500 mb-8 border-b pb-4">
          By <span className="font-semibold text-gray-700">{post.author_name}</span> • {new Date(post.created_at).toLocaleDateString()}
        </div>

        {/* Article Body Content */}
        <div 
          className="prose max-w-none text-gray-800 leading-relaxed space-y-4"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      <hr className="my-12 border-gray-200" />

      {/* Comments Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Discussion ({comments.length})</h2>

        {/* Comment Entry Box */}
        {user ? (
          <form onSubmit={handleCommentSubmit} className="space-y-3">
            <textarea
              rows="3"
              required
              placeholder="Join the conversation..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition">
              Post Comment
            </button>
          </form>
        ) : (
          <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border text-sm text-gray-600 text-center">
            You must be <Link to="/login" className="text-blue-600 font-bold hover:underline">logged in</Link> to post a comment.
          </div>
        )}

        {/* Comments Feed List */}
        <div className="space-y-4 pt-4 ">
          {comments.length === 0 ? (
            <p className="text-gray-500 dark:bg-slate-800  italic text-sm">No comments yet. Be the first to share your thoughts!</p>
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