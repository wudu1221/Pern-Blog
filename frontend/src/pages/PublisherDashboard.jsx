// frontend/src/pages/PublisherDashboard.jsx
import { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

export default function PublisherDashboard() {
  const { logout } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [billing, setBilling] = useState([]); 
  const [editingPost, setEditingPost] = useState(null);
  const [loadingId, setLoadingId] = useState(null); 
  
  // Comment moderation states
  const [moderatingPost, setModeratingPost] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Editor form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Unified pull for dashboard assets
  const fetchDashboardData = async () => {
    try {
      const postsRes = await API.get('/posts/my-articles');
      setPosts(postsRes.data.data);
      
      const billingRes = await API.get('/payments/billing-history');
      setBilling(billingRes.data.data);
    } catch (err) {
      console.error("Dashboard asset loading failure", err);
    }
  };

  useEffect(() => { 
    fetchDashboardData(); 
  }, []);

  // AUTOMATIC CHAPA REDIRECT VERIFICATION HANDLER
  useEffect(() => {
    const status = searchParams.get('status');
    const transactionRef = searchParams.get('ref') || searchParams.get('amp;ref');

    if (status === 'success' && transactionRef) {
      const verifyIncomingPayment = async () => {
        try {
          const response = await API.post('/payments/verify', { tx_ref: transactionRef });
          if (response.data.status === 'success') {
            alert('Payment verified successfully! Your article has been moved to pending review.');
            window.history.replaceState({}, document.title, window.location.pathname);
            fetchDashboardData();
          }
        } catch (err) {
          console.error("Payment verification failure:", err);
          alert(err.response?.data?.message || "Verification failed. Please contact support.");
        }
      };
      verifyIncomingPayment();
    }
  }, [searchParams]);

  // COMMENT MODERATION HANDLERS
  const handleOpenComments = async (post) => {
    setModeratingPost(post);
    setLoadingComments(true);
    try {
      const res = await API.get(`/comments/post/${post.id}`);
      setPostComments(res.data.data);
    } catch (err) {
      console.error("Failed to load article comments", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleModeratorDeleteComment = async (commentId) => {
    if (!window.confirm("Remove this comment from your article?")) return;
    try {
      await API.delete(`/comments/${commentId}`);
      // Refresh list directly from backend following deletion
      const res = await API.get(`/comments/post/${moderatingPost.id}`);
      setPostComments(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove comment.");
    }
  };

  const handleOpenCreate = () => {
    setEditingPost(null);
    setTitle('');
    setContent('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (post) => {
    API.get(`/posts/${post.slug}`).then(res => {
      setEditingPost(post);
      setTitle(res.data.data.title);
      setContent(res.data.data.content);
      setIsFormOpen(true);
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingPost) {
        await API.put(`/posts/${editingPost.id}`, { title, content });
      } else {
        await API.post('/posts', { title, content });
      }
      setIsFormOpen(false);
      fetchDashboardData(); 
    } catch (err) {
      alert(err.response?.data?.message || "Error saving post");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you certain you want to remove this article?")) return;
    try {
      await API.delete(`/posts/${id}`);
      fetchDashboardData(); 
    } catch (err) {
      console.error(err);
    }
  };

  const handlePaymentInitiation = async (postId) => {
    setLoadingId(postId);
    try {
      const response = await API.post('/payments/checkout', { postId });
      if (response.data?.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to establish a payment gateway route.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Side Navigation Control Column */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between p-6 shrink-0">
        <div>
          <h2 className="text-xl font-black text-blue-400 mb-8">Studio Workspace</h2>
          <button onClick={handleOpenCreate} className="w-full bg-blue-600 hover:bg-blue-700 py-2.5 rounded-lg font-bold transition mb-4">
            + New Article Draft
          </button>
        </div>
        <button onClick={logout} className="text-left text-gray-400 hover:text-white font-medium text-sm">
          ← System Logout
        </button>
      </aside>

      {/* Main Content Workspace viewport */}
      <main className="flex-1 p-8 overflow-y-auto max-w-5xl">
        {isFormOpen ? (
          <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border space-y-4 max-w-3xl shadow-sm">
            <h2 className="text-lg font-bold text-gray-700">{editingPost ? "Modify Draft" : "Compose Fresh Content"}</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Article Title</label>
              <input 
                type="text" required value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Body Text Content</label>
              <ReactQuill theme="snow" value={content} onChange={setContent} className="bg-white h-64 mb-12 rounded-b-lg" />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="submit" className="bg-green-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-green-700 transition">
                Save Content Change
              </button>
              <button type="button" onClick={() => setIsFormOpen(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-12">
            
            {/* SUB-SECTION A: ARTICLES MANAGEMENT ENGINE */}
            <div>
              <h1 className="text-2xl font-black text-gray-800 mb-6">My Articles</h1>
              <div className="bg-white rounded-xl border shadow-sm divide-y overflow-hidden">
                {posts.length === 0 ? (
                  <p className="p-6 text-gray-500 text-center">No articles managed here yet. Click 'New Article Draft' to start writing.</p>
                ) : (
                  posts.map(post => (
                    <div key={post.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                      <div>
                        <h3 className="font-bold text-gray-900">{post.title}</h3>
                        <div className="flex gap-3 items-center mt-1">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                            post.status === 'published' ? 'bg-green-50 text-green-700' : 
                            post.status === 'pending_review' ? 'bg-amber-50 text-amber-700' :
                            post.status === 'pending_payment' ? 'bg-blue-50 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {post.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-400">Last updated: {new Date(post.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 items-center">
                        {/* CONDITIONAL BILLING GATEWAY TRIGGER */}
                        {post.status === 'draft' && (
                          <button 
                            onClick={() => handlePaymentInitiation(post.id)}
                            disabled={loadingId === post.id}
                            className="text-xs font-black bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg shadow-sm transition disabled:bg-gray-200"
                          >
                            {loadingId === post.id ? 'Connecting...' : 'Pay Fee & Publish'}
                          </button>
                        )}
                        
                        {/* MODERATION ACCESS CONTROL ACTION BUTTON */}
                        <button onClick={() => handleOpenComments(post)} className="text-blue-600 hover:text-blue-800 text-xs font-bold bg-blue-50 px-3 py-2 rounded-lg transition">
                          Comments
                        </button>
                        
                        <button onClick={() => handleOpenEdit(post)} className="text-gray-600 hover:text-blue-600 text-xs font-bold bg-gray-100 px-3 py-2 rounded-lg transition">Edit</button>
                        <button onClick={() => handleDelete(post.id)} className="text-red-600 hover:text-red-800 text-xs font-bold bg-red-50 px-3 py-2 rounded-lg transition">Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* SUB-SECTION B: PLATFORM RECEIPT ARCHIVE LEDGER */}
            <div>
              <h2 className="text-xl font-black text-gray-800 mb-1">Billing & Invoices</h2>
              <p className="text-xs text-gray-500 mb-6">Track your dynamic publication transaction history logs generated via Chapa.</p>
              
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                {billing.length === 0 ? (
                  <p className="p-8 text-center text-sm text-gray-400 font-medium">No system transactional history records found.</p>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <th className="p-4">Reference No.</th>
                        <th className="p-4">Article Target</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Settled Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs text-gray-600">
                      {billing.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/40 transition">
                          <td className="p-4 font-mono text-gray-400 select-all">{log.reference}</td>
                          <td className="p-4 font-semibold text-gray-800">{log.post_title || 'Deleted Article'}</td>
                          <td className="p-4 font-bold text-gray-900">{log.amount} ETB</td>
                          <td className="p-4">
                            <span className={`font-bold ${
                              log.status === 'completed' ? 'text-green-600' :
                              log.status === 'failed' ? 'text-red-600' : 'text-amber-500'
                            }`}>
                              ● {log.status}
                            </span>
                          </td>
                          <td className="p-4 text-gray-400">
                            {new Date(log.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* OVERLAY PANEL: DYNAMIC INTERACTIVE MODERATION DISPLAY */}
      {moderatingPost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            
            {/* Moderation Panel Header */}
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-black text-lg text-gray-900">Moderate Comments</h3>
                <p className="text-xs text-gray-500 truncate max-w-md">Article: {moderatingPost.title}</p>
              </div>
              <button 
                onClick={() => setModeratingPost(null)}
                className="text-gray-500 hover:text-gray-800 font-bold text-xs bg-white border shadow-sm px-3 py-2 rounded-lg transition"
              >
                Close Window
              </button>
            </div>
            
            {/* Moderation List Stream */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-gray-50/50">
              {loadingComments ? (
                <p className="text-center text-sm text-gray-400 py-8">Loading discussion stream...</p>
              ) : postComments.length === 0 ? (
                <p className="text-center text-sm text-gray-400 italic py-8">No comments found on this article.</p>
              ) : (
                postComments.map(comment => (
                  <div key={comment.id} className="bg-white p-4 rounded-xl border shadow-sm flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{comment.author_name}</span>
                        <span className="text-[10px] text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
                    </div>
                    
                    {/* Publisher Action Flag */}
                    <button
                      onClick={() => handleModeratorDeleteComment(comment.id)}
                      className="text-red-600 hover:text-red-800 text-xs font-bold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}