Here’s the actual Society Ingestion Engine.md to hand to Claude Code.

Society Ingestion Engine.md

0. Purpose

Build the first ambitious version of the LSN Society Intelligence Network.

This is not just a society directory.

It is the core ingestion, enrichment, review and publishing engine for mapping the London student ecosystem.

The system should:

Find societies
→ ingest source data
→ enrich profiles
→ detect duplicates
→ review quality
→ publish high-confidence profiles
→ prepare future claiming/outreach
→ prepare future student recommendations
→ prepare future event discovery

Important restriction:

DO NOT SEND ANY OUTGOING EMAILS, DMS, NOTIFICATIONS OR CLAIM MESSAGES.

The system should build the plumbing for these later, but all outbound activity must remain disabled/internal/testing only.

⸻

1. Strategic Goal

London Student Network should become the canonical live database of London student societies.

The first target universities are:

1. King’s College London
2. University College London
3. London School of Economics
4. Imperial College London
5. Queen Mary University of London

The system must handle:

* official Students’ Union societies
* departmental societies
* independent student organisations linked to a university
* LSN-known societies from old CRM data
* society profiles already on londonstudentnetwork.com

The goal is to create useful society profiles before societies claim them.

This follows a Google Business Profile-style model:

LSN discovers profile
→ LSN creates useful profile
→ society later claims profile
→ society improves data

But v1 must stop before actual external outreach.

⸻

2. Non-Negotiable Safety Rules

2.1 No Outbound Communication

The system must not send:

* emails
* Instagram DMs
* LinkedIn messages
* WhatsApp messages
* push notifications
* automated claim invites
* anything external

Allowed:

* generate draft outreach messages
* store draft claim links internally
* store contact candidates
* preview email templates in admin
* mark “ready for outreach”
* simulate sending in logs

Disallowed:

* real sending
* background sending
* connecting to external messaging APIs for live dispatch
* auto-DM tools
* scraping private pages or logged-in-only data

2.2 Public Source Only

Only use public or official sources:

* SU websites
* society public websites
* public Instagram profile data where accessible
* public Linktree/bio links
* public event pages
* existing LSN CRM/imported data
* existing LSN website data

Do not use private student data.

2.3 Review Gates

Nothing should become public unless:

* source confidence is high
* duplicate risk is low
* university match is clear
* society appears legitimate
* profile passes quality threshold

Initial publishing should be conservative.

⸻

3. Primary Loop

The core loop is:

Source registry
→ source scrape/import
→ raw society candidates
→ canonical society matching
→ enrichment
→ duplicate detection
→ review queue
→ publish profile
→ internal claim-readiness
→ analytics and scoring

Later loops should plug into this:

Published society profile
→ event extraction
→ student discovery
→ saved/followed societies
→ recommendation engine
→ society claim flow
→ employer/sponsor matching

Do not build all later loops fully, but create the data structure and route foundations.

⸻

4. Source Hierarchy

4.1 Tier 1 — Official SU Directories

These are the most authoritative source for official societies.

Use for:

* society name
* university
* official category
* official description
* membership link
* official email/contact if available
* official society URL
* official status

Target SU sources:

* KCLSU societies directory
* UCL Students’ Union clubs/societies directory
* LSESU clubs and societies directory
* Imperial College Union clubs/societies directory
* Queen Mary Students’ Union societies directory

4.2 Tier 2 — Existing LSN Data

Use the uploaded old CRM spreadsheet as a seed source if available in the project files.

Expected file:

LSN SOC outreach CRM.xlsx

Likely fields include:

* Society Name
* University
* SU URL
* Email
* Instagram
* Category
* Member count
* Status/outreach notes

Also ingest any existing society data already on:

www.londonstudentnetwork.com

4.3 Tier 3 — Society Socials

Use to enrich, not to create canonical identity unless confidence is high.

Sources:

* Instagram
* Linktree
* Beacons
* society websites
* TikTok
* LinkedIn pages

Use for:

* logo/profile image
* bio
* recent activity
* events
* contact links
* committee references
* activity signal

4.4 Tier 4 — Event Platforms

Use for activity/event extraction.

Sources:

* FIXR
* Eventbrite
* TicketTailor
* Fatsoma
* Dice
* SU event pages
* society websites

4.5 Tier 5 — Search Discovery

Use only as fallback.

Search examples:

site:kcl.ac.uk "society" "International Security Studies"
"KCL International Security Studies Society"
"UCL [society name] Instagram"

Search results should create candidates requiring review, not auto-published profiles.

⸻

5. Core Data Models

Adapt to the existing project database setup.

If the codebase uses Supabase, create tables/types accordingly.

If the codebase uses another database, follow existing conventions.

If no database exists, create local structured data first but isolate it in /lib/societies.

⸻

5.1 University

export type University = {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  city: string;
  country: string;
  officialWebsiteUrl?: string | null;
  suWebsiteUrl?: string | null;
  societyDirectoryUrl?: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

Seed universities:

kcl
ucl
lse
imperial
qmul

⸻

5.2 Society

export type SocietyStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "needs_review"
  | "rejected"
  | "duplicate"
  | "archived";
export type SocietyClaimStatus =
  | "unclaimed"
  | "claim_ready"
  | "claim_drafted"
  | "claim_sent_disabled"
  | "claimed"
  | "verified"
  | "rejected";
export type SocietyType =
  | "official_su_society"
  | "departmental_society"
  | "independent_student_org"
  | "sports_club"
  | "student_media"
  | "campaign_group"
  | "unknown";
export type Society = {
  id: string;
  slug: string;
  name: string;
  normalisedName: string;
  universityId: string;
  universityName: string;
  universityShortName: string;
  type: SocietyType;
  category?: string | null;
  subcategory?: string | null;
  tags: string[];
  shortDescription?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  suProfileUrl?: string | null;
  membershipUrl?: string | null;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  linkedinUrl?: string | null;
  linktreeUrl?: string | null;
  publicContactEmail?: string | null;
  contactEmails: string[];
  followerCount?: number | null;
  memberCount?: number | null;
  activityScore?: number | null;
  profileCompletenessScore?: number | null;
  sourceConfidenceScore?: number | null;
  duplicateRiskScore?: number | null;
  publishConfidenceScore?: number | null;
  latestActivityAt?: string | null;
  lastEnrichedAt?: string | null;
  lastReviewedAt?: string | null;
  status: SocietyStatus;
  claimStatus: SocietyClaimStatus;
  isPublic: boolean;
  isFeatured: boolean;
  primarySourceId?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
};

⸻

5.3 Society Source

Every claim about a society should be traceable to a source.

export type SocietySourceType =
  | "su_directory"
  | "su_profile"
  | "lsn_crm"
  | "lsn_existing_site"
  | "instagram"
  | "linktree"
  | "website"
  | "event_platform"
  | "manual"
  | "search_result"
  | "other";
export type SocietySource = {
  id: string;
  societyId?: string | null;
  universityId?: string | null;
  sourceType: SocietySourceType;
  sourceName: string;
  sourceUrl?: string | null;
  rawTitle?: string | null;
  rawText?: string | null;
  rawHtml?: string | null;
  extractedJson?: Record<string, unknown> | null;
  trustLevel: "high" | "medium" | "low";
  confidenceScore?: number | null;
  lastFetchedAt?: string | null;
  fetchStatus: "new" | "queued" | "fetched" | "failed" | "ignored";
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
};

⸻

5.4 Society Import Candidate

Before a canonical society is created, scraped/imported records should become candidates.

export type SocietyImportStatus =
  | "new"
  | "parsed"
  | "matched_existing"
  | "created_draft"
  | "needs_review"
  | "rejected"
  | "duplicate"
  | "failed";
export type SocietyImportCandidate = {
  id: string;
  sourceId?: string | null;
  universityId?: string | null;
  rawName: string;
  rawUniversity?: string | null;
  rawCategory?: string | null;
  rawDescription?: string | null;
  rawEmail?: string | null;
  rawInstagram?: string | null;
  rawMembershipUrl?: string | null;
  rawSuProfileUrl?: string | null;
  extractedData?: Partial<Society> | null;
  matchedSocietyId?: string | null;
  duplicateOfSocietyId?: string | null;
  confidenceScore?: number | null;
  duplicateRiskScore?: number | null;
  status: SocietyImportStatus;
  reviewNotes?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
};

⸻

5.5 Society Contact

Only store public society-facing contacts.

export type SocietyContactType =
  | "generic_society_email"
  | "committee_email"
  | "instagram"
  | "website_contact_form"
  | "other_public_contact";
export type SocietyContact = {
  id: string;
  societyId: string;
  contactType: SocietyContactType;
  name?: string | null;
  role?: string | null;
  email?: string | null;
  instagramHandle?: string | null;
  contactUrl?: string | null;
  sourceUrl?: string | null;
  confidenceScore?: number | null;
  isPrimary: boolean;
  isPubliclyListed: boolean;
  createdAt: string;
  updatedAt: string;
};

⸻

5.6 Society Event Candidate

This prepares the later event engine.

export type SocietyEventCandidateStatus =
  | "new"
  | "pending_review"
  | "published"
  | "rejected"
  | "duplicate"
  | "expired";
export type SocietyEventCandidate = {
  id: string;
  societyId?: string | null;
  universityId?: string | null;
  title: string;
  description?: string | null;
  eventDate?: string | null;
  eventTime?: string | null;
  location?: string | null;
  sourceUrl?: string | null;
  ticketUrl?: string | null;
  imageUrl?: string | null;
  extractedFromSourceId?: string | null;
  confidenceScore?: number | null;
  status: SocietyEventCandidateStatus;
  createdAt: string;
  updatedAt: string;
};

⸻

5.7 Society Review Item

Everything uncertain should route here.

export type ReviewEntityType =
  | "society"
  | "society_import_candidate"
  | "society_source"
  | "society_contact"
  | "society_event_candidate"
  | "duplicate_match"
  | "instagram_match";
export type ReviewItemStatus =
  | "open"
  | "approved"
  | "rejected"
  | "merged"
  | "needs_more_info"
  | "ignored";
export type SocietyReviewItem = {
  id: string;
  entityType: ReviewEntityType;
  entityId: string;
  title: string;
  summary?: string | null;
  reason:
    | "low_confidence"
    | "possible_duplicate"
    | "unclear_university"
    | "unclear_instagram_match"
    | "missing_core_data"
    | "publish_threshold_not_met"
    | "manual_spot_check"
    | "other";
  priority: "low" | "medium" | "high" | "critical";
  confidenceScore?: number | null;
  riskScore?: number | null;
  recommendedAction:
    | "approve"
    | "reject"
    | "merge"
    | "edit"
    | "ignore"
    | "investigate";
  status: ReviewItemStatus;
  reviewerNotes?: string | null;
  createdAt: string;
  updatedAt: string;
};

⸻

5.8 Claim Plumbing

Build the infrastructure, but do not send anything.

export type SocietyClaimInviteStatus =
  | "draft"
  | "ready"
  | "sending_disabled"
  | "sent"
  | "expired"
  | "claimed"
  | "cancelled";
export type SocietyClaimInvite = {
  id: string;
  societyId: string;
  contactId?: string | null;
  email?: string | null;
  claimTokenHash?: string | null;
  claimUrlPreview?: string | null;
  subjectDraft?: string | null;
  bodyDraft?: string | null;
  status: SocietyClaimInviteStatus;
  sendDisabled: true;
  createdAt: string;
  updatedAt: string;
};

Important:

sendDisabled must always be true in this phase.

⸻

5.9 Society Analytics Foundation

export type SocietyInteractionType =
  | "profile_view"
  | "membership_click"
  | "instagram_click"
  | "website_click"
  | "event_click"
  | "save"
  | "unsave"
  | "share"
  | "search_result_click";
export type SocietyInteraction = {
  id: string;
  societyId: string;
  userId?: string | null;
  interactionType: SocietyInteractionType;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

⸻

5.10 Saved / Followed Societies

Prepare student recommendation loops.

export type SavedSociety = {
  id: string;
  userId: string;
  societyId: string;
  createdAt: string;
};

If auth already exists, wire this up.

If not, create the model and defer UI.

⸻

6. Agent / Service Architecture

Do not implement as actual autonomous agents initially if that is too complex.

Instead, build modular service functions named as agents.

Each agent should be callable manually from admin.

⸻

6.1 Source Registry Agent

Goal:

Maintain known source URLs.

Functions:

seedUniversitySources()
createSocietySource()
updateSocietySource()
getSocietySources()
queueSourceFetch()

Sources to seed:

* KCL society directory
* UCL society directory
* LSE society directory
* Imperial society directory
* QMUL society directory
* uploaded LSN CRM
* existing LSN site society pages if present

⸻

6.2 SU Directory Ingestion Agent

Goal:

Scrape or import societies from official SU directories.

Functions:

ingestSuDirectory(universityId)
parseSuDirectoryHtml(html, universityId)
createSocietyImportCandidatesFromDirectory()

Outputs:

* SocietyImportCandidate records
* SocietySource records
* raw fetched source data

Rules:

* SU directory data has high trust.
* Candidates from SU directory may create draft societies automatically if duplicate risk is low.
* Do not publish directly without review threshold.

⸻

6.3 LSN CRM Import Agent

Goal:

Import the old spreadsheet CRM as a seed source.

Functions:

importSocietiesFromCrm(filePath)
mapCrmRowToSocietyImportCandidate(row)
matchCrmCandidateToExistingSociety(candidate)

Expected mapping:

Society Name → rawName
University → rawUniversity
SU URL → rawSuProfileUrl
Email → rawEmail
Instagram → rawInstagram
Category → rawCategory
Member Count → memberCount
Status/Notes → reviewNotes

If column names differ, Claude should inspect and infer.

Do not overwrite better current data with old CRM data.

Use CRM as enrichment and matching support.

⸻

6.4 Existing LSN Site Ingestion Agent

Goal:

Ingest any society data already published on londonstudentnetwork.com.

Functions:

ingestExistingLsnSocieties()
parseExistingLsnSocietyPages()
createCandidatesFromExistingLsnData()

Existing LSN data should be trusted as medium/high depending on completeness.

⸻

6.5 Society Matching Agent

Goal:

Prevent duplicates.

Functions:

normaliseSocietyName()
generateSocietyFingerprint()
findPotentialSocietyMatches()
scoreSocietyMatch()
mergeSocietyCandidates()

Matching signals:

* normalised name
* university
* SU URL
* Instagram URL
* email
* acronym similarity
* category similarity

Examples needing careful handling:

KCL Politics Society
King's Politics Society
KCLSU Politics Society

Likely same.

KCL International Relations Society
KCL International Security Studies Society

Likely different.

⸻

6.6 Social Enrichment Agent

Goal:

Find and attach socials.

Functions:

findInstagramForSociety()
extractSocialLinksFromSuPage()
extractLinksFromInstagramBio()
enrichSocietySocials()

Priority:

1. SU page outbound social links
2. existing CRM Instagram
3. existing LSN site Instagram
4. society website social links
5. search fallback

Instagram matching should require high confidence.

If uncertain, create review item.

⸻

6.7 Profile Enrichment Agent

Goal:

Create useful profile content.

Functions:

enrichSocietyProfile()
generateShortDescription()
generateTags()
classifySocietyCategory()
calculateProfileCompleteness()

Rules:

* Prefer official description.
* AI summaries must not invent claims.
* If missing data, leave null.
* Tags should be useful for discovery.

⸻

6.8 Event Discovery Agent

Goal:

Prepare event extraction from society sources.

Functions:

discoverSocietyEventCandidates()
extractEventCandidatesFromSource()
linkEventCandidateToSociety()

Do not build full event publishing if too much.

But create:

* data model
* candidate extraction structure
* review queue link

Sources:

* SU society event pages
* Instagram captions if accessible
* Linktree event links
* Eventbrite/FIXR/TicketTailor pages

⸻

6.9 Activity Scoring Agent

Goal:

Estimate whether a society is active.

Functions:

calculateActivityScore(society)
calculateProfileCompletenessScore(society)
calculatePublishConfidenceScore(society)

Activity score inputs:

* official SU listing exists
* Instagram exists
* recent posts if available
* upcoming events
* website/membership links active
* contact email exists
* LSN profile engagement later

Do not display raw activity score publicly yet unless explicitly enabled.

⸻

6.10 Review Agent

Goal:

Protect quality.

Functions:

createReviewItem()
runSocietyQualityReview()
runDuplicateReview()
runInstagramMatchReview()
recommendPublishAction()

A review item should be created if:

* confidence below threshold
* possible duplicate
* Instagram match uncertain
* university uncertain
* source conflict
* missing name/university
* profile likely stale

⸻

6.11 Publishing Agent

Goal:

Publish only high-confidence profiles.

Functions:

publishSocietyProfile()
unpublishSocietyProfile()
setSocietyPublicStatus()
bulkPublishHighConfidenceSocieties()

Initial auto-publish rule:

publishConfidenceScore >= 95
duplicateRiskScore <= 10
sourceConfidenceScore >= 90
university is one of target 5
name is present
description or official source is present

Everything else goes to review.

⸻

6.12 Claim Preparation Agent

Goal:

Prepare future claim loop without sending.

Functions:

generateClaimInviteDraft()
generateClaimUrlPreview()
markSocietyClaimReady()

Must not send.

Claim readiness criteria:

* public profile exists
* contact email exists
* profile completeness >= 60
* source confidence >= 85
* no open critical review items

Store claim invite as draft only.

⸻

7. Routes / Admin UI

Build internal admin routes.

Adapt to existing app routing.

Suggested routes:

/admin/societies
/admin/societies/imports
/admin/societies/sources
/admin/societies/review
/admin/societies/[id]
/admin/societies/[id]/edit
/admin/societies/[id]/claim-preview

Public routes:

/societies
/societies/[universitySlug]
/societies/[universitySlug]/[societySlug]

If public routes already exist, integrate rather than duplicate.

⸻

8. Admin UI Requirements

8.1 Society Admin Dashboard

Show:

* total societies
* published
* pending review
* duplicates
* draft
* per university count
* profile completeness average
* source coverage
* claim-ready count
* outgoing disabled badge

Critical visible banner:

Outbound messaging is disabled. No emails or DMs will be sent.

⸻

8.2 Source Registry Page

Show:

* source name
* university
* type
* URL
* trust level
* last fetched
* fetch status
* actions

Actions:

* fetch source
* parse source
* view raw data
* disable source

⸻

8.3 Imports Page

Show candidates with:

* raw name
* university
* source
* confidence
* duplicate risk
* suggested match
* status
* actions

Actions:

* create draft society
* match existing
* reject
* mark duplicate
* send to review

⸻

8.4 Review Queue

This is the most important internal page.

Show:

* priority
* entity type
* reason
* confidence
* risk
* recommended action
* created date

Review actions:

* approve
* reject
* merge
* edit
* ignore
* needs more info

No review action should send anything externally.

⸻

8.5 Society Detail Admin Page

Show:

* profile data
* sources
* contacts
* events candidates
* review items
* duplicate candidates
* claim readiness
* draft claim preview
* public preview link

⸻

8.6 Claim Preview Page

Show:

* society name
* contact email
* claim URL preview
* email subject draft
* email body draft

Big warning:

Sending is disabled. This is an internal preview only.

No send button.

⸻

9. Public Society UI

The public side should feel much better than the current LSN UI.

Build polished society profiles if time allows.

9.1 Society Directory

Route:

/societies

Sections:

* hero
* search
* filters
* university tabs
* featured / active societies
* society cards
* “claim your society” CTA disabled or internal-only for now

Filters:

* university
* category
* society type
* has upcoming events
* active recently
* official/departmental/independent

9.2 Society Card

Include:

* logo
* name
* university
* category
* short description
* tags
* Instagram icon if present
* upcoming events count
* profile completeness if internal only
* view profile CTA

9.3 Society Profile

Route:

/societies/[universitySlug]/[societySlug]

Include:

* hero
* logo
* name
* university
* category
* description
* socials
* membership link
* upcoming events
* similar societies
* source/disclaimer
* unclaimed profile badge

Public disclaimer:

This profile is built from public and official sources to help students discover societies. Society details may change — check official links before joining or attending events.

⸻

10. Scoring Rules

10.1 Source Confidence

Suggested scoring:

Official SU page: +50
Existing LSN CRM match: +15
Existing LSN site match: +15
Instagram match confirmed: +15
Public email found: +10
Website/membership link found: +10
Conflicting university/name data: -30
Possible duplicate: -30

Cap at 100.

10.2 Profile Completeness

Name: +15
University: +15
Category: +10
Description: +15
Logo: +10
Instagram: +10
Membership link: +10
Email/contact: +10
Upcoming event: +10
Tags: +5

Cap at 100.

10.3 Publish Confidence

Use combined score:

publishConfidence =
sourceConfidence * 0.45
+ profileCompleteness * 0.25
+ duplicateSafety * 0.20
+ universityConfidence * 0.10

Initial publish threshold:

95

⸻

11. Quality Thresholds

Initial behaviour:

95+ publishConfidence → eligible for publish
80–94 → review
60–79 → needs more info
below 60 → reject or hold as draft

Duplicate risk:

0–10 → safe
11–35 → review
36+ → do not publish

Instagram match confidence:

90+ → attach
70–89 → attach but review
below 70 → do not attach

⸻

12. Implementation Phases

Phase 1 — Inspect Codebase

Claude must first inspect:

* framework
* routes
* database
* auth
* admin conventions
* existing society pages
* existing LSN data structures
* styling system
* uploaded CRM file availability

No coding until plan is produced.

Output:

Implementation plan
Existing architecture summary
Files to create/modify
Risks
Recommended simplifications

⸻

Phase 2 — Core Models and Seeds

Build:

* University model
* Society model
* SocietySource
* SocietyImportCandidate
* SocietyContact
* SocietyReviewItem
* SocietyClaimInvite
* SavedSociety
* SocietyInteraction
* SocietyEventCandidate

Seed:

* KCL
* UCL
* LSE
* Imperial
* QMUL

Acceptance criteria:

* all types compile
* seed universities exist
* society records can be created/fetched
* no public UI required yet

⸻

Phase 3 — Source Registry

Build:

* source registry data layer
* admin source list
* seed target university source placeholders
* source fetch status fields

Acceptance criteria:

* admin can see sources
* admin can add/edit/disable source
* sources have trust levels
* source fetch can be mocked if live fetch is not ready

⸻

Phase 4 — CRM Import

Build:

* import parser for LSN SOC outreach CRM.xlsx
* map rows to SocietyImportCandidate
* preserve original raw row data
* do not overwrite existing societies blindly
* create review items for uncertain rows

Acceptance criteria:

* CRM rows become import candidates
* candidates include university/name/contact/socials where available
* duplicates are detected
* import summary is shown

⸻

Phase 5 — SU Directory Ingestion

Build for the 5 target universities.

Start with one university working well, then generalise.

Acceptance criteria:

* fetch or manually import directory HTML/data
* parse society candidates
* create SocietyImportCandidate records
* attach SocietySource records
* calculate confidence
* route uncertain candidates to review

If live scraping is blocked by site structure, build manual HTML/text import fallback.

⸻

Phase 6 — Matching and Deduplication

Build:

* normalisation
* fingerprinting
* similarity scoring
* potential duplicate UI
* merge/reject flow

Acceptance criteria:

* obvious duplicates are flagged
* different similarly named societies are not automatically merged
* duplicate review items are created

⸻

Phase 7 — Profile Creation

Build:

* candidate → draft society
* draft society → published society
* profile completeness scoring
* publish confidence scoring

Acceptance criteria:

* high-confidence candidates create draft societies
* publish-ready societies can be reviewed
* public status remains controlled

⸻

Phase 8 — Social Enrichment

Build:

* attach social links from CRM/SU/source data
* link extraction from source HTML
* Instagram/linktree fields
* uncertain match review items

Acceptance criteria:

* known Instagram URLs attach
* unknown/uncertain socials do not attach automatically
* enrichment improves profile completeness

⸻

Phase 9 — Review Queue

Build full internal review queue.

Acceptance criteria:

* review items are generated
* admin can approve/reject/merge/edit/ignore
* decisions update underlying entities
* no outgoing actions occur

⸻

Phase 10 — Public Society Directory

Build:

* /societies
* university filters
* society cards
* search
* category filters
* public profile pages for published societies

Acceptance criteria:

* only isPublic: true and status: published societies appear
* profiles include source disclaimer
* UI is polished and mobile-friendly

⸻

Phase 11 — Claim Plumbing

Build:

* claim readiness checks
* claim invite draft creation
* claim URL preview
* claim preview admin page

Acceptance criteria:

* claim drafts can be generated
* sendDisabled is always true
* no send button exists
* no email/DM API is called

⸻

Phase 12 — Event Candidate Foundation

Build:

* SocietyEventCandidate model
* source-to-event candidate helper
* admin event candidate tab

Acceptance criteria:

* event candidates can be stored
* linked to society
* not publicly published unless later approved

⸻

Phase 13 — Analytics Foundation

Build:

* SocietyInteraction model
* profile view logging if easy
* membership/social click tracking if easy
* admin metrics foundation

Acceptance criteria:

* interactions can be recorded
* society profile has counters/analytics fields
* data can later feed recommendations

⸻

13. Helper Functions

Create these or equivalents.

normaliseSocietyName(name)
generateSocietySlug(name, university)
generateSocietyFingerprint(society)
calculateSocietyMatchScore(candidate, society)
findPotentialDuplicateSocieties(candidate)
calculateSourceConfidence(society)
calculateProfileCompleteness(society)
calculateDuplicateRisk(candidate)
calculatePublishConfidence(society)
createReviewItemForEntity(entity)
candidateToDraftSociety(candidate)
mergeSocietyData(existing, incoming)
extractLinksFromHtml(html)
classifySocietyCategory(text)
generateSocietyTags(society)
isSocietyPublishEligible(society)
isSocietyClaimReady(society)
generateClaimInviteDraft(society)

⸻

14. AI Prompt for Enrichment

Store this prompt in code comments or /lib/societies/prompts.ts.

You are a society intelligence agent for London Student Network.
Your job is to convert public source data into accurate structured society profile data.
Rules:
- Do not invent facts.
- Use null where information is missing.
- Prefer official Students’ Union sources over social media.
- Treat Instagram and social media as freshness/activity signals, not canonical identity unless clearly matched.
- Be careful with similar society names.
- Preserve source URLs.
- Flag uncertainty rather than guessing.
- Do not generate or send outreach.
- Do not include private personal data.
- Only use publicly available contact details.
- Produce student-friendly summaries and tags.

Output structure:

{
  "name": "",
  "university": "",
  "category": "",
  "description": "",
  "shortDescription": "",
  "tags": [],
  "contactEmails": [],
  "instagramUrl": null,
  "websiteUrl": null,
  "membershipUrl": null,
  "confidenceScore": 0,
  "duplicateRiskNotes": "",
  "reviewRequired": true,
  "reviewReason": ""
}

⸻

15. Claude Operating Instructions

When working on this spec:

1. Inspect the codebase first.
2. Do not code immediately.
3. Produce an implementation plan.
4. Build incrementally by phase.
5. Do not create outbound sending functionality.
6. Do not connect live email/DM APIs.
7. Keep all source-derived facts traceable.
8. Use review queues for uncertainty.
9. Make the public UI polished but do not sacrifice data integrity.
10. Prioritise the ingestion/review engine over cosmetic perfection if time is tight.
11. Keep all society logic isolated in /lib/societies or equivalent.
12. Use existing auth/admin/database patterns.
13. Add clear internal warnings wherever claim/outreach plumbing appears.

⸻

16. Initial Claude Prompt

Use this first:

Read Society Ingestion Engine.md carefully.
We are building the Society Intelligence Network for LSN.
Important:
- Target universities: KCL, UCL, LSE, Imperial, Queen Mary.
- Include official SU societies, departmental societies and independent student organisations.
- Build ambitious plumbing for source ingestion, enrichment, review, publishing, claim readiness, event candidates and analytics.
- Do NOT send any outgoing emails, DMs, notifications or claim messages.
- Outbound communication must remain disabled/internal-preview only.
- Review agents and review queues are essential.
First inspect the existing codebase and produce an implementation plan only. Do not code yet.
Tell me:
1. Current framework/routing/database/auth/admin setup.
2. Existing society-related routes/components/data.
3. How you will implement the phases.
4. What files you will create or modify.
5. How you will handle the uploaded old CRM spreadsheet.
6. How you will prevent any outgoing communication.
7. Risks and recommended simplifications.

⸻

17. First Build Prompt After Plan Approval

Implement Phase 2 and Phase 3 only.
Build the core Society Intelligence data models/types and source registry foundation.
Include:
- University
- Society
- SocietySource
- SocietyImportCandidate
- SocietyContact
- SocietyReviewItem
- SocietyClaimInvite with sendDisabled always true
- SocietyEventCandidate
- SocietyInteraction
- SavedSociety
- seeded universities for KCL, UCL, LSE, Imperial, QMUL
- source registry helpers
- admin source registry page if admin routing exists
Do not build public pages yet.
Do not build any outgoing messaging.

⸻

18. Second Build Prompt

Implement CRM import and import candidates.
Use the uploaded file LSN SOC outreach CRM.xlsx if available.
Map spreadsheet rows into SocietyImportCandidate records.
Preserve raw row data.
Do not overwrite existing societies.
Run duplicate detection where possible.
Create review items for uncertain candidates.
Show an import summary in admin:
- rows imported
- candidates created
- possible duplicates
- failed rows
- review required

⸻

19. Third Build Prompt

Implement SU directory ingestion foundation for the five target universities.
Start with one working source if necessary, then generalise.
Build:
- source fetch/manual import
- parse source into SocietyImportCandidate records
- source confidence scoring
- review item creation
- fallback manual paste HTML/text import if live scraping fails
Do not auto-publish without passing threshold.

⸻

20. Fourth Build Prompt

Implement matching, deduplication, review queue and candidate-to-society creation.
Build:
- name normalisation
- fingerprint generation
- duplicate scoring
- review queue UI
- approve/reject/merge/edit actions
- candidate to draft society flow
- publish confidence scoring
No outgoing communication.

⸻

21. Fifth Build Prompt

Implement public society directory and profile pages for published societies only.
Build:
- /societies
- university filters
- search
- category filters
- society cards
- /societies/[universitySlug]/[societySlug]
- source disclaimer
- unclaimed profile badge
- polished mobile-first UI
Only show societies where status = published and isPublic = true.

⸻

22. Sixth Build Prompt

Implement claim-readiness plumbing and internal claim preview.
Build:
- claim readiness checks
- draft claim invite generation
- claim URL preview
- admin claim preview page
- clear disabled sending warnings
- sendDisabled always true
Do not add a send button.
Do not connect email APIs.
Do not send anything.

⸻

23. Final Acceptance Criteria

This project is successful when:

* the system can ingest society data from multiple sources
* the old CRM can be imported
* the five target universities are seeded
* society candidates can be created
* duplicates are detected
* uncertain data goes to review
* high-confidence societies can be published
* public society pages exist
* claim-readiness plumbing exists but cannot send
* event candidate plumbing exists
* analytics foundation exists
* no outgoing communication is possible
* the system is ready for future autonomous society onboarding

The deeper success criterion:

LSN can create value before societies sign up.