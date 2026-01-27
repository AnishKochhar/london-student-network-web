// ============================================
// Campaign Status Types
// ============================================

export interface CampaignStatusResponse {
    id: string;
    name: string;
    status: string;
    progress: number;
    totalRecipients: number;
    sentCount: number;
    startedAt: string | null;
    completedAt: string | null;
    statusBreakdown: Record<string, number>;
}
