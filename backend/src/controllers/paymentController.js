const db = require('../../config/db');
const axios = require('axios');

// 1. INITIALIZE CHAPA CHECKOUT SESSION (Protected - Publisher Only)
exports.initializeCheckout = async (req, res) => {
  const { postId } = req.body;

  try {
    // DEBUG LINE: Check if the key is loaded in memory right when the route is triggered
    console.log("DEBUG: Secret Key Loaded ->", process.env.CHAPA_SECRET_KEY ? "YES" : "NO");

    // Ownership & Existence Safeguard Verification
    const postQuery = `
      SELECT id, title, status, author_id 
      FROM posts 
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const postResult = await db.query(postQuery, [postId]);

    if (postResult.rows.length === 0) {
      return res.status(404).json({ message: 'Article asset not found.' });
    }

    const post = postResult.rows[0];

    if (post.author_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized action.' });
    }

    // State Machine Rule: Only drafts are allowed to request gateway routing
    if (post.status !== 'draft') {
      return res.status(400).json({ message: `Cannot process payment for articles marked: ${post.status}` });
    }

    // Define Transaction Parameters
    const listingAmount = 150.00; // Fixed pricing tier (e.g., 150 ETB)
    const transactionReference = `tx-pern-${Date.now()}-${postId.substring(0, 4)}`;

    // Split user full name safely into fields required by Chapa
    const nameParts = req.user.full_name ? req.user.full_name.split(' ') : ['Creator', 'User'];
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Platform';

    // Update local post status to block duplicate requests
    await db.query("UPDATE posts SET status = 'pending_payment' WHERE id = $1", [postId]);

    // Generate row record inside the local ledger history tracking table
    const billingQuery = `
      INSERT INTO billing_history (author_id, post_id, amount, reference, status)
      VALUES ($1, $2, $3, $4, 'pending')
    `;
    await db.query(billingQuery, [req.user.id, postId, listingAmount, transactionReference]);

    // Build the API Request Payload for Chapa (With Safe URL Sanitization)
    const targetCallback = process.env.CHAPA_CALLBACK_URL || 'https://httpbin.org/post';
    const baseReturnUrl = process.env.CHAPA_RETURN_URL || 'http://127.0.0.1:5173/publisher-dashboard';
    
    // Checks if the base URL already has a '?' to safely choose between '?' and '&'
    const querySeparator = baseReturnUrl.includes('?') ? '&' : '?';
    const targetReturn = `${baseReturnUrl}${querySeparator}status=success&ref=${transactionReference}`;

    const chapaPayload = {
      amount: listingAmount,
      currency: 'ETB',
      email: req.user.email || 'testuser@example.com',
      first_name: firstName,
      last_name: lastName,
      tx_ref: transactionReference,
      callback_url: targetCallback,
      return_url: targetReturn,
      "customization[title]": "PERN Article Listing Fee",
      "customization[description]": `Payment for publishing article: "${post.title.substring(0, 30)}..."`
    };

    // Initialize transaction with Chapa
    const chapaResponse = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      chapaPayload,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // If Chapa returns a valid transaction link, deliver it to front end
    if (chapaResponse.data && chapaResponse.data.status === 'success') {
      return res.status(200).json({
        status: 'success',
        checkoutUrl: chapaResponse.data.data.checkout_url,
        reference: transactionReference
      });
    } else {
      throw new Error('Chapa gateway rejected transaction parameters.');
    }

  } catch (error) {
    // CRITICAL DEBUG LOGGING: Prints the exact reason why Chapa rejected the request
    console.error("=== CHAPA INITIALIZATION ERROR ===");
    console.error(error.response?.data || error.message);

    // Fail-safe fallback: Reset post back to draft if the external gateway call crashes
    if (postId) {
      await db.query("UPDATE posts SET status = 'draft' WHERE id = $1", [postId]);
    }
    
    res.status(500).json({ 
      message: 'Failed to initialize Chapa gateway checkout transaction.', 
      error: error.response?.data?.message || error.message 
    });
  }
};

// 2. VERIFY CHAPA TRANSACTION SUCCESS (Public Webhook/Callback)
exports.verifyWebhook = async (req, res) => {
  const reference = req.body?.tx_ref || req.query?.ref;
  
  if (!reference) {
    return res.status(400).json({ message: 'Missing transaction reference tracking parameter.' });
  }

  try {
    // Ask Chapa's servers directly if this specific reference was truly paid
    const chapaVerifyResponse = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`
        }
      }
    );

    const chapaData = chapaVerifyResponse.data;

    // If Chapa confirms success, execute our publishing state transition
    if (chapaData.status === 'success' && chapaData.data.status === 'success') {
      
      // Look up which article belongs to this transaction reference
      const billingCheck = await db.query(
        "SELECT post_id, status FROM billing_history WHERE reference = $1",
        [reference]
      );

      if (billingCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Transaction reference not found in local records.' });
      }

      const { post_id, status: localPaymentStatus } = billingCheck.rows[0];

      // Prevent processing twice if it's a duplicate webhook ping
      if (localPaymentStatus === 'completed') {
        return res.status(200).json({ status: 'success', message: 'Transaction already logged.' });
      }

      // BEGIN TRANSACTION MULTI-WRITE IN POSTGRESQL
      await db.query('BEGIN');

      // Update ledger statement status to completed
      await db.query(
        "UPDATE billing_history SET status = 'completed' WHERE reference = $1",
        [reference]
      );

      // Advance our post status cleanly to 'pending_review' for administrators
      await db.query(
        "UPDATE posts SET status = 'pending_review' WHERE id = $1",
        [post_id]
      );

      await db.query('COMMIT');

      return res.status(200).json({
        status: 'success',
        message: 'Payment verified. Article promoted to pending_review queue.'
      });
    } else {
      // If Chapa returns a failed status, flag the ledger cleanly
      await db.query(
        "UPDATE billing_history SET status = 'failed' WHERE reference = $1",
        [reference]
      );
      return res.status(400).json({ message: 'Chapa reported a failed transaction status.' });
    }

  } catch (error) {
    console.error("=== CHAPA VERIFICATION ERROR ===");
    console.error(error.response?.data || error.message);

    if (res.headersSent) return;
    await db.query('ROLLBACK');
    res.status(500).json({ 
      message: 'Error verifying payment data transaction.', 
      error: error.response?.data?.message || error.message 
    });
  }
};

// 3. GET PUBLISHER'S BILLING HISTORY (Protected - Publisher Only)
exports.getBillingHistory = async (req, res) => {
  try {
    const query = `
      SELECT bh.id, bh.amount, bh.reference, bh.status, bh.created_at, p.title as post_title
      FROM billing_history bh
      LEFT JOIN posts p ON bh.post_id = p.id
      WHERE bh.author_id = $1
      ORDER BY bh.created_at DESC;
    `;
    const result = await db.query(query, [req.user.id]);
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving billing records.', error: error.message });
  }
};

// 4. GET ALL PLATFORM TRANSACTIONS (Protected - Admin Only)
exports.getAdminPaymentsLedger = async (req, res) => {
  try {
    const query = `
      SELECT 
        bh.id, 
        bh.amount, 
        bh.reference AS tx_ref, 
        CASE 
          WHEN bh.status = 'completed' THEN 'success' 
          ELSE bh.status 
        END AS status, 
        bh.created_at, 
        u.full_name AS publisher_name,
        p.title AS post_title
      FROM billing_history bh
      LEFT JOIN users u ON bh.author_id = u.id
      LEFT JOIN posts p ON bh.post_id = p.id
      ORDER BY bh.created_at DESC;
    `;
    
    const result = await db.query(query);
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve admin transaction ledger.', error: error.message });
  }
};