// frontend/src/pages/PublisherDashboard.jsx
import { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

// Defined Category Options for Tech Content Profiles
const AVAILABLE_CATEGORIES = [
  'Web Development',
  'Mobile Apps',
  'Database Management',
  'UI/UX Design',
  //'DevOps & Cloud',
  //'Tech Industry & Insights'
  'Artificial Intelligence',
  'Cybersecurity',
  'Cloud Computing'

];

export default function PublisherDashboard() {
  const { logout } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Core Asset Arrays
  const [posts, setPosts] = useState([]);
  const [billing, setBilling] = useState([]); 
  const [editingPost, setEditingPost] = useState(null);
  const [loadingId, setLoadingId] = useState(null); 
  
  // Creator Analytics State
  const [analytics, setAnalytics] = useState({ totalViews: 0, totalComments: 0, completedPayouts: 0 });

  // Comment Moderation States
  const [moderatingPost, setModeratingPost] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Layout View Control
  const [activeView, setActiveView] = useState('dashboard');

  // Editor Form Fields
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState(''); 
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState(null); 
  const [selectedCategory, setSelectedCategory] = useState('');
  const [imagePreview, setImagePreview] = useState(''); 

  // Public Profile State Fields
  const [bio, setBio] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // ----------------------------------------------------------------
  // SEARCH, FILTER, AND PAGINATION CONTROLS
  // ----------------------------------------------------------------
  const ITEMS_PER_PAGE = 3;

  // Articles View States
  const [articleSearch, setArticleSearch] = useState('');
  const [articleFilter, setArticleFilter] = useState('all');
  const [articlePage, setArticlePage] = useState(1);

  // Billing View States
  const [billingSearch, setBillingSearch] = useState('');
  const [billingFilter, setBillingFilter] = useState('all');
  const [billingPage, setBillingPage] = useState(1);

  // Reset page position to 1 when active modifications occur
  useEffect(() => { setArticlePage(1); }, [articleSearch, articleFilter]);
  useEffect(() => { setBillingPage(1); }, [billingSearch, billingFilter]);

  // ISOLATED DATA FETCHERS (Prevents one 404 from crashing the dashboard)
  const fetchDashboardData = async () => {
    // 1. Fetch Articles
    try {
      const postsRes = await API.get('/posts/my-articles');
      setPosts(postsRes.data?.data || []);
    } catch (err) {
      console.error("Failed to load articles:", err);
    }
    
    // 2. Fetch Billing Ledger
    try {
      const billingRes = await API.get('/payments/billing-history');
      setBilling(billingRes.data?.data || []);
    } catch (err) {
      console.error("Failed to load billing metrics:", err);
    }

    // 3. Fetch Analytics Core
    try {
      const analyticsRes = await API.get('/posts/my-analytics');
      setAnalytics(analyticsRes.data?.data || { totalViews: 0, totalComments: 0, completedPayouts: 0 });
    } catch (err) {
      console.error("Failed to load analytics data:", err);
    }

    // 4. Fetch Profile Configuration (Handled gracefully if it 404s)
    try {
      const profileRes = await API.get('/users/profile');
      if (profileRes.data?.data) {
        setBio(profileRes.data.data.bio || '');
        setGithubUrl(profileRes.data.data.github_url || '');
        setLinkedinUrl(profileRes.data.data.linkedin_url || '');
      }
    } catch (err) {
      console.warn("Profile route returned 404. Check your Express server routes mapping for /users/profile:", err);
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
    text: setLoadingComments(true);
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
      const res = await API.get(`/comments/post/${moderatingPost.id}`);
      setPostComments(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove comment.");
    }
  };

  // FORM ACTION SWITCHES
  const handleOpenCreate = () => {
    setEditingPost(null);
    setTitle('');
    setSummary('');
    setContent('');
    setCoverImage(null);
    setSelectedCategory('');
    setImagePreview('');
    setActiveView('editor');
  };

  const handleOpenEdit = (post) => {
    API.get(`/posts/${post.slug}`).then(res => {
      setEditingPost(post);
      setTitle(res.data.data.title);
      setSummary(res.data.data.summary || '');
      setContent(res.data.data.content);
      setCoverImage(null);
      setSelectedCategory(res.data.data.category || '');
      setImagePreview(res.data.data.cover_image_url || '');
      setActiveView('editor');
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // MULTIPART-FORM DATA SAVE TRIGGER (Create / Update Post)
  const handleSave = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('summary', summary);
    formData.append('content', content);
    formData.append('category', selectedCategory);
    
    if (coverImage) {
      formData.append('coverImage', coverImage); 
    }

    try {
      if (editingPost) {
        await API.put(`/posts/${editingPost.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' } 
        });
      } else {
        await API.post('/posts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      setActiveView('dashboard');
      fetchDashboardData(); 
      
    } catch (err) {
      alert(err.response?.data?.message || "Error saving post");
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      await API.put('/users/profile', { bio, github_url: githubUrl, linkedin_url: linkedinUrl });
      alert("Public profile configuration updated successfully!");
      setActiveView('dashboard');
    } catch (err) {
      alert(err.response?.data?.message || "Error updating profile details");
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

  // ----------------------------------------------------------------
  // LOCAL DATA FILTERING COMPUTATION
  // ----------------------------------------------------------------
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(articleSearch.toLowerCase()) ||
                          (post.summary && post.summary.toLowerCase().includes(articleSearch.toLowerCase()));
    const matchesFilter = articleFilter === 'all' || post.status === articleFilter;
    return matchesSearch && matchesFilter;
  });

  const displayedPosts = filteredPosts.slice(
    (articlePage - 1) * ITEMS_PER_PAGE,
    articlePage * ITEMS_PER_PAGE
  );
  const totalArticlePages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE) || 1;

  const filteredBilling = billing.filter(log => {
    const matchesSearch = log.reference.toLowerCase().includes(billingSearch.toLowerCase()) ||
                          (log.post_title && log.post_title.toLowerCase().includes(billingSearch.toLowerCase()));
    const matchesFilter = billingFilter === 'all' || log.status === billingFilter;
    return matchesSearch && matchesFilter;
  });

  const displayedBilling = filteredBilling.slice(
    (billingPage - 1) * ITEMS_PER_PAGE,
    billingPage * ITEMS_PER_PAGE
  );
  const totalBillingPages = Math.ceil(filteredBilling.length / ITEMS_PER_PAGE) || 1;

  // ----------------------------------------------------------------
  // GENERIC CSV EXPORT PIPELINE
  // ----------------------------------------------------------------
  const triggerCSVDownload = (dataArray, fileName, keysMapping) => {
    if (!dataArray.length) {
      alert("No printable datasets available to extract.");
      return;
    }
    const headers = Object.keys(keysMapping);
    const csvContent = [
      headers.join(','), 
      ...dataArray.map(item => 
        headers.map(header => {
          const rawValue = keysMapping[header](item) ?? '';
          const escapedString = String(rawValue).replace(/"/g, '""');
          return `"${escapedString}"`;
        }).join(',')
      )
    ].join('\n');

    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const clientUrl = URL.createObjectURL(dataBlob);
    const linkHook = document.createElement('a');
    linkHook.href = clientUrl;
    linkHook.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(linkHook);
    linkHook.click();
    document.body.removeChild(linkHook);
  };

  const downloadArticlesReport = () => {
    triggerCSVDownload(filteredPosts, 'my_articles_report', {
      'Article ID': item => item.id,
      'Title': item => item.title,
      'Category': item => item.category || 'Unassigned',
      'Status': item => item.status,
      'Views Record': item => item.views_count || 0,
      'Modification Date': item => new Date(item.updated_at).toLocaleDateString()
    });
  };

  const downloadBillingReport = () => {
    triggerCSVDownload(filteredBilling, 'invoice_billing_ledger', {
      'Transaction Reference': item => item.reference,
      'Target Title': item => item.post_title || 'Deleted Title Ref',
      'Settled Amount (ETB)': item => item.amount,
      'Transaction Status': item => item.status,
      'Payment Gateway timestamp': item => new Date(item.created_at).toLocaleDateString()
    });
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
          
          <nav className="space-y-2 mt-8">
            <button 
              onClick={() => setActiveView('dashboard')}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-semibold transition ${activeView === 'dashboard' ? 'bg-slate-800 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              📊 Publications Grid
            </button>
            <button 
              onClick={() => setActiveView('profile')}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-semibold transition ${activeView === 'profile' ? 'bg-slate-800 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              👤 Author Profile
            </button>
          </nav>
        </div>
        <button onClick={logout} className="text-left text-gray-400 hover:text-white font-medium text-sm">
          ← System Logout
        </button>
      </aside>

      {/* Main Content Workspace Viewport */}
      <main className="flex-1 p-8 overflow-y-auto max-w-5xl">
        
        {/* VIEW ENGINE 1: ARTICLE REWRITE & COMPOSE ENGINE */}
        {activeView === 'editor' && (
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
              <label className="block text-sm font-semibold text-gray-600 mb-1">Thematic Category</label>
              <select 
                required
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-700"
              >
                <option value="" disabled>Choose a category configuration...</option>
                {AVAILABLE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Short Summary / Excerpt</label>
              <textarea 
                required rows="2" value={summary} onChange={e => setSummary(e.target.value)}
                placeholder="Write a brief catchphrase or summary card excerpt for your homepage readers..."
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Article Cover Image</label>
              <div className="flex items-center gap-4 border p-3 rounded-lg bg-gray-50/50">
                <input 
                  type="file" accept="image/*" onChange={handleImageChange}
                  className="text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Asset layout Preview" className="w-14 h-14 object-cover rounded-lg border shadow-xs" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Body Text Content</label>
              <ReactQuill theme="snow" value={content} onChange={setContent} className="bg-white h-64 mb-12 rounded-b-lg" />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="bg-green-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-green-700 transition">
                Save Content Change
              </button>
              <button type="button" onClick={() => setActiveView('dashboard')} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* VIEW ENGINE 2: AUTHOR PUBLIC BIO PROFILES */}
        {activeView === 'profile' && (
          <form onSubmit={handleProfileSave} className="bg-white p-6 rounded-xl border space-y-4 max-w-2xl shadow-sm">
            <h2 className="text-lg font-bold text-gray-700">Public Creator Persona Settings</h2>
            <p className="text-xs text-gray-400">This metadata directly binds to the author attribution cards rendered at the footer of your live blog posts.</p>
            
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Author Bio</label>
              <textarea 
                rows="4" value={bio} onChange={e => setBio(e.target.value)}
                placeholder="Tell your readers a bit about your professional background or technology domain focus..."
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">GitHub Profile Link</label>
                <input 
                  type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">LinkedIn Profile Link</label>
                <input 
                  type="url" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="bg-blue-600 text-white font-bold px-5 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
                Update Profile Configuration
              </button>
              <button type="button" onClick={() => setActiveView('dashboard')} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 text-sm">
                Back to Dashboard
              </button>
            </div>
          </form>
        )}

        {/* VIEW ENGINE 3: THE COMPREHENSIVE WORKSPACE HUB */}
        {activeView === 'dashboard' && (
          <div className="space-y-12">
            
            {/* Analytics Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Article Reads</span>
                <span className="text-3xl font-black text-slate-800 mt-2">
                  {analytics?.total_views ?? analytics?.totalViews ?? 0}
                </span>
                <span className="text-[11px] text-green-600 font-semibold mt-1">↑ Traffic details update dynamically</span>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Community Comments</span>
                <span className="text-3xl font-black text-slate-800 mt-2">
                  {analytics?.total_comments ?? analytics?.totalComments ?? 0}
                </span>
                <span className="text-[11px] text-blue-600 font-semibold mt-1">Active thread engagement entries</span>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Settled Fees (Chapa)</span>
                <span className="text-3xl font-black text-green-600 mt-2">
                  {analytics?.completed_payouts ?? analytics?.completedPayouts ?? 0} ETB
                </span>
                <span className="text-[11px] text-gray-400 mt-1">Paid verification validation metrics</span>
              </div>
            </div>
            
            {/* SUB-SECTION A: ARTICLES MANAGEMENT ENGINE */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h1 className="text-2xl font-black text-gray-800">My Articles</h1>
                
                {/* Search, Filter, and Download Toolbars */}
                <div className="flex flex-wrap items-center gap-2">
                  <input 
                    type="text"
                    placeholder="Search articles..."
                    value={articleSearch}
                    onChange={e => setArticleSearch(e.target.value)}
                    className="px-3 py-1.5 border text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
                  />
                  <select
                    value={articleFilter}
                    onChange={e => setArticleFilter(e.target.value)}
                    className="px-3 py-1.5 border text-xs rounded-lg bg-white font-medium text-gray-600 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="pending_payment">Pending Payment</option>
                  </select>
                  <button 
                    onClick={downloadArticlesReport}
                    className="bg-gray-800 hover:bg-slate-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                  >
                    📥 Download CSV
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border shadow-sm divide-y overflow-hidden">
                {displayedPosts.length === 0 ? (
                  <p className="p-6 text-gray-500 text-center text-sm">No matched articles located here.</p>
                ) : (
                  displayedPosts.map(post => (
                    <div key={post.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{post.title}</h3>
                        <div className="flex flex-wrap gap-2 items-center mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                            post.status === 'published' ? 'bg-green-50 text-green-700' : 
                            post.status === 'pending_review' ? 'bg-amber-50 text-amber-700' :
                            post.status === 'pending_payment' ? 'bg-blue-50 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {post.status.replace('_', ' ')}
                          </span>
                          {post.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 tracking-wide">
                              {post.category}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">Last updated: {new Date(post.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 items-center">
                        {post.status === 'draft' && (
                          <button 
                            onClick={() => handlePaymentInitiation(post.id)}
                            disabled={loadingId === post.id}
                            className="text-xs font-black bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg shadow-sm transition disabled:bg-gray-200"
                          >
                            {loadingId === post.id ? 'Connecting...' : 'Pay Fee & Publish'}
                          </button>
                        )}
                        
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

              {/* Dynamic Pagination Footer Control for Posts */}
              {totalArticlePages > 1 && (
                <div className="flex justify-end items-center gap-2 mt-3">
                  <button
                    disabled={articlePage === 1}
                    onClick={() => setArticlePage(prev => prev - 1)}
                    className="px-3 py-1 bg-white border rounded-md text-xs font-semibold hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-500 font-medium">Page {articlePage} of {totalArticlePages}</span>
                  <button
                    disabled={articlePage === totalArticlePages}
                    onClick={() => setArticlePage(prev => prev + 1)}
                    className="px-3 py-1 bg-white border rounded-md text-xs font-semibold hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            <hr className="border-gray-200" />

            {/* SUB-SECTION B: PLATFORM RECEIPT ARCHIVE LEDGER */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-xl font-black text-gray-800">Billing & Invoices</h2>
                  <p className="text-xs text-gray-500">Track your dynamic publication transaction history logs generated via Chapa.</p>
                </div>

                {/* Billing Custom Context Filtering Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <input 
                    type="text"
                    placeholder="Search invoices..."
                    value={billingSearch}
                    onChange={e => setBillingSearch(e.target.value)}
                    className="px-3 py-1.5 border text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
                  />
                  <select
                    value={billingFilter}
                    onChange={e => setBillingFilter(e.target.value)}
                    className="px-3 py-1.5 border text-xs rounded-lg bg-white font-medium text-gray-600 focus:outline-none"
                  >
                    <option value="all">All Payments</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                  <button 
                    onClick={downloadBillingReport}
                    className="bg-gray-800 hover:bg-slate-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                  >
                    📥 Download CSV
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden mt-4">
                {displayedBilling.length === 0 ? (
                  <p className="p-8 text-center text-sm text-gray-400 font-medium">No matched ledger profiles found.</p>
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
                      {displayedBilling.map((log) => (
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

              {/* Dynamic Pagination Footer Control for Billing */}
              {totalBillingPages > 1 && (
                <div className="flex justify-end items-center gap-2 mt-3">
                  <button
                    disabled={billingPage === 1}
                    onClick={() => setBillingPage(prev => prev - 1)}
                    className="px-3 py-1 bg-white border rounded-md text-xs font-semibold hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-500 font-medium">Page {billingPage} of {totalBillingPages}</span>
                  <button
                    disabled={billingPage === totalBillingPages}
                    onClick={() => setBillingPage(prev => prev + 1)}
                    className="px-3 py-1 bg-white border rounded-md text-xs font-semibold hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      {/* OVERLAY PANEL: DYNAMIC INTERACTIVE MODERATION DISPLAY */}
      {moderatingPost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-black text-lg text-gray-900">Moderate Comments</h3>
                <p className="text-xs text-gray-500 truncate max-w-md">Article: {moderatingPost.title}</p>
              </div>
              <button 
                onClick={() => setModeratingPost(null)} 
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {loadingComments ? (
                <p className="text-center text-gray-500 text-sm py-8">Loading comments...</p>
              ) : postComments.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No comments found for this article.</p>
              ) : (
                postComments.map(comment => (
                  <div key={comment.id} className="p-4 bg-gray-50 rounded-lg border flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-800">{comment.user_name || 'Anonymous'}</span>
                        <span className="text-[10px] text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-600 break-words">{comment.content}</p>
                    </div>
                    <button 
                      onClick={() => handleModeratorDeleteComment(comment.id)}
                      className="text-red-600 hover:text-red-800 text-xs font-bold bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button 
                onClick={() => setModeratingPost(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}