import { useState, useEffect } from 'react';
import API from '../services/api';

export default function AdminDashboard() {
  const [currentView, setCurrentView] = useState('overview'); // 'overview', 'payments', 'articles', 'comments'
  const [queue, setQueue] = useState([]);
  const [comments, setComments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [metrics, setMetrics] = useState({ totalRevenue: 0, activePublishers: 0 });
  const [loadingId, setLoadingId] = useState(null);

  // 1. Fetch Articles Awaiting Moderation
  const fetchReviewQueue = async () => {
    try {
      const response = await API.get('/admin/pending-reviews');
      setQueue(response.data.data || []);
    } catch (err) {
      console.error('Failed to load admin queue', err);
    }
  };

  // 2. Fetch All Platform Comments
  const fetchComments = async () => {
    try {
      const response = await API.get('/admin/comments');
      setComments(response.data.data || []);
    } catch (err) {
      console.error('Failed to load platform comments', err);
    }
  };

  // 3. NEW: Fetch Chapa Payments Ledger
  const fetchPayments = async () => {
    try {
      const response = await API.get('/admin/payments');
      setPayments(response.data.data || []);
      
      // Calculate high-level summary metrics directly from payments
      const total = response.data.data
        ?.filter(p => p.status === 'success')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setMetrics(prev => ({ ...prev, totalRevenue: total }));
    } catch (err) {
      console.error('Failed to load Chapa ledger transactions', err);
    }
  };

  // Load everything on component mounting
  useEffect(() => {
    fetchReviewQueue();
    fetchComments();
    fetchPayments();
  }, []);

  // Handle Post Status Approval/Rejection
  const handleStatusUpdate = async (postId, statusValue) => {
    const confirmationText = statusValue === 'published' 
      ? 'Approve this article and publish it live?' 
      : 'Reject this article and send it back to drafts?';
      
    if (!window.confirm(confirmationText)) return;
    setLoadingId(postId);
    
    try {
      const response = await API.patch(`/admin/posts/${postId}/status`, { status: statusValue });
      alert(response.data.message);
      fetchReviewQueue();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating post status.');
    } finally {
      setLoadingId(null);
    }
  };

  // Handle Comment Approval
  const handleApproveComment = async (commentId) => {
    try {
      const response = await API.patch(`/admin/comments/${commentId}/approve`);
      alert(response.data.message);
      fetchComments();
    } catch (err) {
      alert('Failed to authorize comment status.');
    }
  };

  // Handle Comment Soft Deletion
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to soft-delete this comment?')) return;
    try {
      await API.delete(`/comments/${commentId}`);
      alert('Comment removed from stream.');
      fetchComments();
    } catch (err) {
      alert('Error scrubbing target comment.');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
      
      {/* ================= SIDEBAR NAVIGATION ================= */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between fixed h-full z-20">
        <div>
          {/* Dashboard Header Branding */}
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-black text-white tracking-wider">TechStck Command</h2>
            <span className="text-xs text-indigo-400 font-semibold uppercase tracking-widest">Admin Panel</span>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1">
            <button 
              onClick={() => setCurrentView('overview')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${currentView === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <span>📊 Control Overview</span>
            </button>

            <button 
              onClick={() => setCurrentView('payments')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition ${currentView === 'payments' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <div className="flex items-center space-x-3">
                <span>💰 Chapa Payments</span>
              </div>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">ETB</span>
            </button>

            <button 
              onClick={() => setCurrentView('articles')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition ${currentView === 'articles' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <div className="flex items-center space-x-3">
                <span>📝 Pending Articles</span>
              </div>
              {queue.length > 0 && (
                <span className="text-xs bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-bold">{queue.length}</span>
              )}
            </button>

            <button 
              onClick={() => setCurrentView('comments')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition ${currentView === 'comments' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <div className="flex items-center space-x-3">
                <span>💬 Comment Stream</span>
              </div>
              {comments.filter(c => !c.is_approved).length > 0 && (
                <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full font-bold">
                  {comments.filter(c => !c.is_approved).length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Option */}
        <div className="p-4 border-t border-slate-800">
          <a href="/" className="block text-center text-xs text-slate-500 hover:text-slate-300 font-medium py-2">
            ← Exit back to Blog Portal
          </a>
        </div>
      </aside>

      {/* ================= MAIN CONTENT CANVAS ================= */}
      <main className="flex-1 pl-64 min-h-screen">
        <div className="p-8 max-w-6xl mx-auto space-y-8">
          
          {/* Dynamic Section Header Greeting */}
          <div>
            <h1 className="text-3xl font-black text-slate-900 capitalize">{currentView} Command workspace</h1>
            <p className="text-sm text-slate-500">Real-time status controls and automated payment verification monitoring pipelines.</p>
          </div>

          {/* ================= VIEW 1: OVERVIEW DASHBOARD ================= */}
          {currentView === 'overview' && (
            <div className="space-y-8">
              {/* Financial Metrics Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Platform Revenue</span>
                  <p className="text-3xl font-black text-slate-900">{metrics.totalRevenue.toLocaleString()} <span className="text-sm text-slate-400 font-medium">ETB</span></p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Awaiting Verification Review</span>
                  <p className="text-3xl font-black text-amber-600">{queue.length} <span className="text-sm text-slate-400 font-medium">articles</span></p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Discussion Comments</span>
                  <p className="text-3xl font-black text-indigo-600">{comments.filter(c => !c.is_approved).length} <span className="text-sm text-slate-400 font-medium">unapproved</span></p>
                </div>
              </div>

              {/* Quick Status Greeting */}
              <div className="bg-white border p-8 rounded-2xl shadow-sm text-center">
                <h3 className="font-bold text-slate-800 text-lg">System Health Status</h3>
                <p className="text-sm text-slate-500 mt-1">All gateway integrations with Chapa payment engines are currently running normally.</p>
              </div>
            </div>
          )}

          {/* ================= VIEW 2: CHAPA PAYMENTS LEDGER ================= */}
          {currentView === 'payments' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg">Chapa Transaction Ledger</h3>
              </div>
              {payments.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium">💰 No recorded Chapa checkout transactions found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider">
                        <th className="p-4">Publisher Profile</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Chapa Tx Reference</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Execution Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm text-slate-700">
                      {payments.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4 font-bold text-slate-900">{tx.publisher_name || 'System User'}</td>
                          <td className="p-4 font-semibold text-slate-800">{Number(tx.amount).toFixed(2)} ETB</td>
                          <td className="p-4 font-mono text-xs text-slate-500">{tx.tx_ref}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                              tx.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              tx.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-slate-400">{new Date(tx.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ================= VIEW 3: ARTICLES QUEUE ================= */}
          {currentView === 'articles' && (
            queue.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center text-slate-400 font-medium shadow-sm">
                🎉 The review queue is empty! No content is awaiting review.
              </div>
            ) : (
              <div className="space-y-4">
                {queue.map((article) => (
                  <div key={article.id} className="bg-white rounded-xl border p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-slate-300 transition">
                    <div className="space-y-1 flex-1">
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                        Awaiting Moderation
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 pt-1">{article.title}</h3>
                      <p className="text-xs text-slate-400">By <span className="font-semibold text-slate-600">{article.author_name}</span> • Submitted {new Date(article.updated_at).toLocaleDateString()}</p>
                      <div className="text-sm text-slate-600 line-clamp-2 mt-3 pt-2 border-t border-slate-100 italic" dangerouslySetInnerHTML={{ __html: article.content }} />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto shrink-0">
                      <button
                        onClick={() => handleStatusUpdate(article.id, 'published')}
                        disabled={loadingId === article.id}
                        className="flex-1 md:flex-none text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(article.id, 'draft')}
                        disabled={loadingId === article.id}
                        className="flex-1 md:flex-none text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 py-2.5 rounded-lg transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ================= VIEW 4: COMMENT STREAM MODERATION ================= */}
          {currentView === 'comments' && (
            comments.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center text-slate-400 font-medium shadow-sm">
                💬 No user discussion comments logged on the platform yet.
              </div>
            ) : (
              <div className="bg-white rounded-xl border shadow-sm divide-y overflow-hidden">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-gray-50/50 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm text-slate-900">{comment.author_name}</strong>
                        <span className="text-xs text-slate-400">on "{comment.post_title}"</span>
                        {!comment.is_approved && (
                          <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border border-blue-100">Pending Review</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">{comment.content}</p>
                      <span className="block text-[10px] text-slate-400">{new Date(comment.created_at).toLocaleString()}</span>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
                      {!comment.is_approved && (
                        <button
                          onClick={() => handleApproveComment(comment.id)}
                          className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

        </div>
      </main>
    </div>
  );
}