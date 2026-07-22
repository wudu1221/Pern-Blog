import { useState, useEffect } from 'react';
import API from '../services/api';
// 📊 Import Recharts visual engines
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [currentView, setCurrentView] = useState('overview'); // 'overview', 'payments', 'articles', 'comments', 'users'
  const [queue, setQueue] = useState([]);
  const [comments, setComments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [metrics, setMetrics] = useState({ totalRevenue: 0, activePublishers: 0 });
  const [loadingId, setLoadingId] = useState(null);
  const [users, setUsers] = useState([]);

  // 🔢 Pagination Configuration
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; 
  const [currentUsersPage, setCurrentUsersPage] = useState(1);
  const usersPerPage = 3; 

  // 🔍 Interactive Search & Filter States
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all'); // 'all', 'success', 'pending', 'failed'
  const [userSearch, setUserSearch] = useState('');

  // 📈 Analytics State Variables
  const [revenueChartData, setRevenueChartData] = useState([]);
  const [signupChartData, setSignupChartData] = useState([]);

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

  // 3. Fetch Chapa Payments Ledger
  const fetchPayments = async () => {
    try {
      const response = await API.get('payments/admin-ledger');
      setPayments(response.data.data || []);
      
      const total = response.data.data
        ?.filter(p => p.status === 'success')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setMetrics(prev => ({ ...prev, totalRevenue: total }));
    } catch (err) {
      console.error('Failed to load Chapa ledger transactions', err);
    }
  };

  // 4. Fetch Users Profiles List
  const fetchUsers = async () => {
    try {
      const response = await API.get('/admin/users');
      setUsers(response.data.data || []);
    } catch (err) {
      console.error('Failed to load users directory', err);
    }
  };

  // 📊 5. Unified Analytics Engine Loading
  const fetchAnalyticsData = async () => {
    try {
      const [revResponse, signupResponse] = await Promise.all([
        API.get('/admin/analytics/revenue-chart'),
        API.get('/admin/analytics/signup-chart')
      ]);
      setRevenueChartData(revResponse.data.data || []);
      setSignupChartData(signupResponse.data.data || []);
    } catch (err) {
      console.error('Analytics engine fetch failure', err);
    }
  };

  useEffect(() => {
    fetchReviewQueue();
    fetchComments();
    fetchUsers();
    fetchPayments();
    fetchAnalyticsData();
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

  // Handle Role Flipping
  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === 'reader' ? 'publisher' : 'reader';
    if (!window.confirm(`Switch this user's role to ${newRole.toUpperCase()}?`)) return;

    try {
      await API.patch(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers(); 
    } catch (err) {
      alert('Failed to update user role.');
    }
  };

  // Handle Account Suspension Status
  const handleToggleActive = async (userId, currentStatus) => {
    const nextStatus = !currentStatus;
    const confirmMsg = nextStatus 
      ? 'Reactivate this user account?' 
      : 'Suspend this user account? They will lose access immediately.';
      
    if (!window.confirm(confirmMsg)) return;

    try {
      await API.patch(`/admin/users/${userId}/toggle-active`, { is_active: nextStatus });
      fetchUsers();
    } catch (err) {
      alert('Failed to change user account state.');
    }
  };

  // ==================== 🛠️ DATA PROCESSING PIPELINES ====================

  // 1. Unified Payments Filter Engine (Search + Dropdown)
  const filteredPayments = payments.filter(tx => {
    const matchesSearch = 
      (tx.publisher_name && tx.publisher_name.toLowerCase().includes(paymentSearch.toLowerCase())) ||
      (tx.tx_ref && tx.tx_ref.toLowerCase().includes(paymentSearch.toLowerCase()));
    
    const matchesStatus = 
      paymentStatusFilter === 'all' || tx.status === paymentStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Payments Slicing Matrix
  const indexOfLastPayment = currentPage * itemsPerPage;
  const indexOfFirstPayment = indexOfLastPayment - itemsPerPage;
  const currentPayments = filteredPayments.slice(indexOfFirstPayment, indexOfLastPayment);
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  // 2. Users Filter Engine (Search Only)
  const filteredUsers = users.filter(u => 
    (u.full_name && u.full_name.toLowerCase().includes(userSearch.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  // Users Slicing Matrix
  const indexOfLastUser = currentUsersPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalUsersPages = Math.ceil(filteredUsers.length / usersPerPage);


  // ==================== 📥 SMART CSV EXPORT HANDLERS ====================

  const exportPaymentsToCSV = () => {
    if (filteredPayments.length === 0) return;
    const headers = ['Publisher Name', 'Amount (ETB)', 'Chapa TX Ref', 'Status', 'Date Created'];
    const rows = filteredPayments.map(tx => [
      `"${tx.publisher_name || 'System User'}"`,
      `"${tx.amount} ETB"`,
      `"${tx.tx_ref}"`,
      `"${tx.status.toUpperCase()}"`,
      `"${new Date(tx.created_at).toLocaleString()}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `chapa_filtered_payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportUsersToCSV = () => {
    if (filteredUsers.length === 0) return;
    const headers = ['Full Name', 'Email Address', 'Role', 'Status'];
    const rows = filteredUsers.map(u => [
      `"${u.full_name}"`,
      `"${u.email}"`,
      `"${u.role.toUpperCase()}"`,
      `"${u.is_active ? 'ACTIVE' : 'SUSPENDED'}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `filtered_user_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
      
      {/* ================= SIDEBAR NAVIGATION ================= */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between fixed h-full z-20">
        <div>
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-black text-white tracking-wider">TechStck Command</h2>
            <span className="text-xs text-indigo-400 font-semibold uppercase tracking-widest">Admin Panel</span>
          </div>

          <nav className="p-4 space-y-1">
            <button 
              onClick={() => setCurrentView('overview')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${currentView === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <span>📊 Control Overview</span>
            </button>
            <button 
              onClick={() => setCurrentView('users')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${currentView === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <span>👥 User Management</span>
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
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <a href="/" className="block text-center text-xs text-slate-500 hover:text-slate-300 font-medium py-2">
            ← Exit back to Blog Portal
          </a>
        </div>
      </aside>

      {/* ================= MAIN CONTENT CANVAS ================= */}
      <main className="flex-1 pl-64 min-h-screen">
        <div className="p-8 max-w-6xl mx-auto space-y-8">
          
          <div>
            <h1 className="text-3xl font-black text-slate-900 capitalize">{currentView} Command workspace</h1>
            <p className="text-sm text-slate-500">Real-time status controls and automated payment verification monitoring pipelines.</p>
          </div>

          {/* ================= VIEW 1: OVERVIEW DASHBOARD ================= */}
          {currentView === 'overview' && (
            <div className="space-y-8">
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-4 text-base">Weekly Financial Inflow (ETB)</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip />
                        <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-4 text-base">New User Accounts Registered</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={signupChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="signups" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={35} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white border p-8 rounded-2xl shadow-sm text-center">
                <h3 className="font-bold text-slate-800 text-lg">System Health Status</h3>
                <p className="text-sm text-slate-500 mt-1">All gateway integrations with Chapa payment engines are currently running normally.</p>
              </div>
            </div>
          )}

          {/* ================= VIEW 2: CHAPA PAYMENTS LEDGER ================= */}
          {currentView === 'payments' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Interactive Toolbar Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-lg">Chapa Transaction Ledger</h3>
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Field */}
                  <input
                    type="text"
                    placeholder="Search name or reference..."
                    value={paymentSearch}
                    onChange={(e) => {
                      setPaymentSearch(e.target.value);
                      setCurrentPage(1); 
                    }}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white w-48 shadow-sm"
                  />
                  
                  {/* Dropdown Menu Filter */}
                  <select
                    value={paymentStatusFilter}
                    onChange={(e) => {
                      setPaymentStatusFilter(e.target.value);
                      setCurrentPage(1); 
                    }}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm font-medium text-slate-700"
                  >
                    <option value="all">🌐 All Statuses</option>
                    <option value="success">✅ Success</option>
                    <option value="pending">⏳ Pending</option>
                    <option value="failed">❌ Failed</option>
                  </select>

                  {/* Scoped Export Action Button */}
                  <button
                    onClick={exportPaymentsToCSV}
                    disabled={filteredPayments.length === 0}
                    className="px-4 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition shadow-sm disabled:opacity-50"
                  >
                    📥 Export CSV
                  </button>
                </div>
              </div>

              {filteredPayments.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium">💰 No recorded transactions fit your filter parameters.</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider">
                          <th className="p-4">Publisher Profile</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Chapa Tx Reference</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Execution Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-sm text-slate-700">
                        {currentPayments.map((tx) => (
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

                  {/* Sliced Pagination Controls Footer */}
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      Showing <span className="font-bold text-slate-700">{filteredPayments.length === 0 ? 0 : indexOfFirstPayment + 1}</span> to{' '}
                      <span className="font-bold text-slate-700">
                        {Math.min(indexOfLastPayment, filteredPayments.length)}
                      </span>{' '}
                      of <span className="font-bold text-slate-700">{filteredPayments.length}</span> results
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border bg-white shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <div className="text-xs font-bold text-slate-700 px-3 py-1.5 bg-slate-200/60 rounded-md">
                        Page {currentPage} of {totalPages || 1}
                      </div>

                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border bg-white shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
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

          {/* ================= VIEW 5: USER MANAGEMENT ================= */}
          {currentView === 'users' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Interactive Toolbar Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
                <h3 className="font-bold text-slate-900 text-lg">User Directory Moderation</h3>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setCurrentUsersPage(1); 
                    }}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-56 shadow-sm"
                  />
                  <button
                    onClick={exportUsersToCSV}
                    disabled={filteredUsers.length === 0}
                    className="px-4 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition shadow-sm disabled:opacity-50 text-nowrap"
                  >
                    📥 Export Directory
                  </button>
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium">👥 No target users match that key string search query.</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider">
                          <th className="p-4">User Details</th>
                          <th className="p-4">Current Role</th>
                          <th className="p-4">Account Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-sm text-slate-700">
                        {currentUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-4">
                              <div className="font-bold text-slate-900">{u.full_name}</div>
                              <div className="text-xs text-slate-400">{u.email}</div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                                u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                u.role === 'publisher' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                {u.is_active ? 'Active' : 'Suspended'}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              {u.role !== 'admin' && (
                                <>
                                  <button
                                    onClick={() => handleRoleChange(u.id, u.role)}
                                    className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition"
                                  >
                                    {u.role === 'reader' ? '👑 Promote to Publisher' : '🔄 Demote to Reader'}
                                  </button>
                                  <button
                                    onClick={() => handleToggleActive(u.id, u.is_active)}
                                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                                      u.is_active 
                                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                    }`}
                                  >
                                    {u.is_active ? '🚫 Suspend' : '✅ Unban'}
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Sliced Pagination Controls Footer */}
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      Showing <span className="font-bold text-slate-700">{filteredUsers.length === 0 ? 0 : indexOfFirstUser + 1}</span> to{' '}
                      <span className="font-bold text-slate-700">
                        {Math.min(indexOfLastUser, filteredUsers.length)}
                      </span>{' '}
                      of <span className="font-bold text-slate-700">{filteredUsers.length}</span> records
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentUsersPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentUsersPage === 1}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border bg-white shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <div className="text-xs font-bold text-slate-700 px-3 py-1.5 bg-slate-200/60 rounded-md">
                        Page {currentUsersPage} of {totalUsersPages || 1}
                      </div>

                      <button
                        onClick={() => setCurrentUsersPage((prev) => Math.min(prev + 1, totalUsersPages))}
                        disabled={currentUsersPage === totalUsersPages || totalUsersPages === 0}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border bg-white shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}