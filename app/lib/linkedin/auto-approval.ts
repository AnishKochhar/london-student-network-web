import { sql } from '@vercel/postgres';

interface AutoApprovalConfig {
	enabled: boolean;
	minimumApprovedPosts: number;
	maximumRejectionRate: number;
}

const DEFAULT_CONFIG: AutoApprovalConfig = {
	enabled: true,
	minimumApprovedPosts: 5, // After 5 successful approvals
	maximumRejectionRate: 0.1, // Max 10% rejection rate
};

/**
 * Check if auto-approval should be enabled based on historical performance
 */
export async function shouldAutoApprove(): Promise<boolean> {
	try {
		// Check if auto-approval is enabled in config (could move to DB setting later)
		if (!DEFAULT_CONFIG.enabled) {
			return false;
		}

		// Get stats from previous posts
		const stats = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'approved' OR status = 'published') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected
      FROM linkedin_post_queue
      WHERE status IN ('approved', 'rejected', 'published')
    `;

		const { total, approved, rejected } = stats.rows[0];
		const totalNum = parseInt(total);
		const approvedNum = parseInt(approved);
		const rejectedNum = parseInt(rejected);

		// Need minimum number of approved posts
		if (approvedNum < DEFAULT_CONFIG.minimumApprovedPosts) {
			console.log(`[AutoApproval] Not enough approved posts yet: ${approvedNum}/${DEFAULT_CONFIG.minimumApprovedPosts}`);
			return false;
		}

		// Check rejection rate
		const rejectionRate = totalNum > 0 ? rejectedNum / totalNum : 0;
		if (rejectionRate > DEFAULT_CONFIG.maximumRejectionRate) {
			console.log(`[AutoApproval] Rejection rate too high: ${(rejectionRate * 100).toFixed(1)}%`);
			return false;
		}

		console.log(`[AutoApproval] ✅ Auto-approval enabled (${approvedNum} approved, ${rejectedNum} rejected)`);
		return true;
	} catch (error) {
		console.error('[AutoApproval] Error checking approval status:', error);
		return false; // Fail safe: require manual approval on error
	}
}

/**
 * Get auto-approval statistics
 */
export async function getAutoApprovalStats() {
	try {
		const stats = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'approved' OR status = 'published') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE auto_approved = true) as auto_approved
      FROM linkedin_post_queue
    `;

		const row = stats.rows[0];
		const total = parseInt(row.total);
		const approved = parseInt(row.approved);
		const rejected = parseInt(row.rejected);
		const autoApproved = parseInt(row.auto_approved);

		return {
			total,
			approved,
			rejected,
			autoApproved,
			rejectionRate: total > 0 ? (rejected / total) : 0,
			autoApprovalRate: total > 0 ? (autoApproved / total) : 0,
			canAutoApprove: await shouldAutoApprove(),
		};
	} catch (error) {
		console.error('[AutoApproval] Error getting stats:', error);
		return null;
	}
}
