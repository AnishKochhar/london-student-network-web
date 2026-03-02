// ============================================
// Email Campaign System Types
// ============================================

export interface EmailCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string | null;
  color: string;
  icon: string;
  sortOrder: number;
  contactCount?: number;
  children?: EmailCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface EmailContact {
  id: string;
  email: string;
  name: string | null;
  organization: string | null;
  categories: { id: string; name: string; slug: string }[];
  metadata: ContactMetadata;
  tags: string[];
  notes: string | null;
  status: ContactStatus;
  unsubscribedAt: string | null;
  bounceCount: number;
  lastEmailedAt: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMetadata {
  memberCount?: number;
  website?: string;
  instagram?: string;
  linkedin?: string;
  relevanceScore?: number;
  outreachPriority?: 'high' | 'medium' | 'low';
  targetAudience?: string[];
  [key: string]: unknown;
}

export type ContactStatus = 'active' | 'unsubscribed' | 'bounced' | 'complained' | 'deleted';

export interface EmailSignature {
  id: string;
  name: string;
  description: string | null;
  html: string;
  isDefault: boolean;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  variables: string[];
  signatureId: string | null;
  signature?: EmailSignature;
  category: string | null;
  isActive: boolean;
  previewText: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  description: string | null;
  templateId: string | null;
  template?: EmailTemplate;
  subjectOverride: string | null;
  bodyOverride: string | null;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  recipientType: RecipientType;
  recipientCategoryIds: string[];
  recipientFilter: RecipientFilter;
  status: CampaignStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  stats: CampaignStats;
  trackOpens: boolean;
  trackClicks: boolean;
  batchSize: number;
  delayBetweenMs: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RecipientType = 'category' | 'custom' | 'all';

export interface RecipientFilter {
  tags?: string[];
  status?: ContactStatus;
  excludeIds?: string[];
}

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';

export interface CampaignStats {
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  unsubscribed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export interface EmailSend {
  id: string;
  campaignId: string;
  contactId: string | null;
  toEmail: string;
  toName: string | null;
  toOrganization: string | null;
  subject: string;
  sendgridMessageId: string | null;
  status: SendStatus;
  sentAt: string | null;
  deliveredAt: string | null;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  firstClickedAt: string | null;
  openCount: number;
  clickCount: number;
  errorMessage: string | null;
  bounceType: string | null;
  createdAt: string;
}

export type SendStatus =
  | 'pending'
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'dropped'
  | 'spam'
  | 'unsubscribed';

export interface EmailEvent {
  id: string;
  sendId: string;
  eventType: string;
  timestamp: string;
  ipAddress: string | null;
  userAgent: string | null;
  url: string | null;
  reason: string | null;
  createdAt: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ContactsQueryParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  status?: ContactStatus;
  search?: string;
  sortBy?: 'name' | 'email' | 'createdAt' | 'lastEmailedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ImportContactsRequest {
  contacts: ImportContact[];
  categoryId?: string;
  source?: string;
  duplicateHandling?: 'skip' | 'update' | 'create';
}

export interface ImportContact {
  email: string;
  name?: string;
  organization?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  email?: string;
  message: string;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  templateId?: string;
  subjectOverride?: string;
  bodyOverride?: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  recipientType: RecipientType;
  recipientCategoryIds?: string[];
  recipientFilter?: RecipientFilter;
  trackOpens?: boolean;
  trackClicks?: boolean;
  batchSize?: number;
  delayBetweenMs?: number;
}

export interface SendCampaignRequest {
  campaignId: string;
  scheduledAt?: string;
}

// ============================================
// UI State Types
// ============================================

export interface CategoryTreeItem extends EmailCategory {
  children: CategoryTreeItem[];
  isExpanded?: boolean;
  isLoading?: boolean;
}

export interface ContactSelection {
  selectedIds: Set<string>;
  selectAll: boolean;
}

export interface SlideInPanelState {
  isOpen: boolean;
  contactId: string | null;
}

export interface CampaignBuilderState {
  step: number;
  recipients: {
    type: RecipientType;
    categoryIds: string[];
    customFilter: RecipientFilter;
    previewCount: number;
  };
  template: {
    templateId: string | null;
    customSubject: string;
    customBody: string;
  };
  settings: {
    name: string;
    fromEmail: string;
    fromName: string;
    replyTo: string;
    trackOpens: boolean;
    trackClicks: boolean;
  };
}

// ============================================
// Analytics Types
// ============================================

export interface CampaignAnalytics {
  campaign: EmailCampaign;
  hourlyData: TimeSeriesData[];
  topLinks: LinkClickData[];
  recipientBreakdown: RecipientBreakdown[];
}

export interface TimeSeriesData {
  timestamp: string;
  opens: number;
  clicks: number;
  delivered: number;
}

export interface LinkClickData {
  url: string;
  clicks: number;
  uniqueClicks: number;
}

export interface RecipientBreakdown {
  status: SendStatus;
  count: number;
  percentage: number;
}

export interface OverallAnalytics {
  totalCampaigns: number;
  totalEmailsSent: number;
  averageOpenRate: number;
  averageClickRate: number;
  recentCampaigns: EmailCampaign[];
  trendData: TimeSeriesData[];
}

// ============================================
// History Types
// ============================================

export interface EmailHistoryItem {
  id: string;
  campaignId: string;
  campaignName: string;
  toEmail: string;
  toName: string | null;
  toOrganization: string | null;
  subject: string;
  status: SendStatus;
  sentAt: string;
  openCount: number;
  clickCount: number;
}

export interface HistoryGroupedByDate {
  date: string;
  label: string; // "Today", "Yesterday", "Jan 10, 2025"
  items: EmailHistoryItem[];
}
