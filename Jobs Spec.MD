Yes — that changes the spec materially. Add these as core, not later:

Addendum to LSN Jobs Spec — Full Loop Version

Core Change

This Jobs feature should not be built as a passive jobs board.

It should be built as the first working version of the LSN autonomous opportunity loop:

Sources discovered
→ Jobs scraped/imported
→ Listings enriched/cleaned
→ Listings published
→ Students browse/save/apply
→ System learns what performs
→ Better listings and recommendations follow

Therefore, the first proper build should include:

1. scraping/import foundation
2. logged-in saved jobs
3. premium-quality UI/UX
4. admin review queue
5. analytics/events foundation

⸻

1. New Core Scope

Must Build Now

Public Jobs Experience

* /jobs
* elite visual design
* search
* filters
* featured jobs
* opportunity detail pages
* apply CTA
* save job button
* personalised logged-in state if available

Logged-In Student Features

* save job
* unsave job
* view saved jobs
* saved jobs count/state on cards
* login prompt if unauthenticated

Routes:

/jobs
/jobs/[slug]
/account/saved-jobs

or follow existing account/dashboard conventions.

Scraping / Import System

Build a real first version of the source ingestion pipeline.

This does not need to scrape every site perfectly tonight, but it should establish the architecture.

Must include:

* source registry
* scrape/import job records
* raw HTML/text storage
* parsed opportunity records
* review queue
* duplicate detection
* enrichment step
* status workflow

Admin Review Queue

Admin should be able to:

* see imported opportunities
* review AI/enriched suggestion
* edit before publishing
* reject
* mark duplicate
* publish

Routes:

/admin/jobs/imports
/admin/jobs/imports/[id]

⸻

2. Scraping System Spec

2.1 Core Idea

The scraper should support multiple source types.

export type OpportunitySourceType =
  | "company_careers_page"
  | "university_careers_page"
  | "student_union_page"
  | "society_page"
  | "event_platform"
  | "job_board"
  | "manual_url"
  | "rss"
  | "other";

2.2 Source Registry

Create an OpportunitySource model.

export type OpportunitySource = {
  id: string;
  name: string;
  url: string;
  type: OpportunitySourceType;
  enabled: boolean;
  scrapeFrequency: "manual" | "daily" | "weekly" | "monthly";
  lastScrapedAt?: string | null;
  nextScrapeAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

2.3 Scrape Run Model

Each scrape attempt should be stored.

export type OpportunityScrapeRun = {
  id: string;
  sourceId: string;
  status: "queued" | "running" | "completed" | "failed";
  startedAt?: string | null;
  completedAt?: string | null;
  itemsFound: number;
  itemsImported: number;
  duplicatesFound: number;
  errorsCount: number;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
};

2.4 Imported Opportunity Model

export type OpportunityImport = {
  id: string;
  sourceId?: string | null;
  scrapeRunId?: string | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
  rawTitle?: string | null;
  rawText: string;
  rawHtml?: string | null;
  extractedData?: Partial<Opportunity> | null;
  status:
    | "new"
    | "enriched"
    | "pending_review"
    | "published"
    | "rejected"
    | "duplicate"
    | "failed";
  duplicateOfOpportunityId?: string | null;
  createdOpportunityId?: string | null;
  aiSummary?: string | null;
  aiQualityScore?: number | null;
  aiRelevanceScore?: number | null;
  aiReasoning?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
};

⸻

3. Scraper Implementation Approach

Tonight’s Practical Version

Do not attempt a perfect universal scraper.

Build a flexible architecture with one or two working source examples.

Scraping modes

1. Manual URL import
    * admin pastes URL
    * system fetches page
    * extracts text
    * stores as import
    * mock/AI enrichment turns it into draft opportunity
2. Source scrape
    * admin adds source URL
    * admin clicks “Run scrape”
    * system fetches page
    * extracts possible opportunity blocks/links
    * creates imports for review
3. Future scheduled scraping
    * architecture supports cron later
    * no need to fully automate scheduling tonight unless easy

Recommended Libraries

Use whatever already exists in the codebase.

If available:

* cheerio for HTML parsing
* fetch for page retrieval
* existing server actions/API routes
* existing database/auth setup

Avoid brittle over-engineering.

⸻

4. Scraper Functions

Create:

createOpportunitySource(data)
updateOpportunitySource(id, data)
deleteOpportunitySource(id)
getOpportunitySources()
getOpportunitySourceById(id)
runOpportunitySourceScrape(sourceId)
createManualOpportunityImport(url)
extractTextFromHtml(html)
extractOpportunityLinks(html, baseUrl)
createOpportunityImportFromUrl(url)
enrichOpportunityImport(importId)
publishImportAsOpportunity(importId, editedData)
rejectOpportunityImport(importId)
markImportAsDuplicate(importId, duplicateOpportunityId)

⸻

5. Saved Jobs

5.1 Data Model

export type SavedOpportunity = {
  id: string;
  userId: string;
  opportunityId: string;
  createdAt: string;
};

5.2 Behaviour

Students can save jobs from:

* opportunity card
* opportunity detail page

If logged out:

* clicking save opens login/signup prompt
* after login, ideally return to the job

If logged in:

* save/unsave instantly
* card state updates
* saved jobs page shows saved listings

5.3 Routes

/account/saved-jobs

or match existing dashboard naming.

5.4 Saved Jobs Page

Include:

* saved opportunities list
* empty state
* search/filter if easy
* CTA back to jobs

Empty state copy:

No saved opportunities yet.
Save internships, jobs and student opportunities here so you can come back to them later.

⸻

6. User Interaction Analytics

Track core events from day one if reasonably possible.

export type OpportunityInteraction = {
  id: string;
  userId?: string | null;
  opportunityId: string;
  eventType:
    | "view"
    | "apply_click"
    | "save"
    | "unsave"
    | "share"
    | "filter_used"
    | "search_used";
  metadata?: Record<string, unknown>;
  createdAt: string;
};

At minimum:

* increment views
* increment apply clicks
* track saves

This is vital because the learning engine needs behaviour data.

⸻

7. Incredible UI/UX Requirement

This feature should visibly exceed the current LSN UI standard.

The Jobs page should feel like a premium student discovery product, not a standard database page.

Design Feel

Aim for:

Linear + Notion + modern startup careers page + student energy

It should feel:

* fast
* beautiful
* highly usable
* editorial
* trustworthy
* alive
* much more premium than current LSN

UI Principles

* big confident hero
* strong search experience
* beautiful cards
* useful badges
* clean filters
* smooth empty states
* saved-job microinteractions
* clear deadlines
* mobile excellent
* no clutter
* no ugly admin feeling on public side

Jobs Page Sections

Hero
Search/filter command area
Featured opportunities
Closing soon
Recommended/latest opportunities
Browse all
Newsletter CTA
Employer CTA

Card UX

Cards should include:

* logo/avatar
* title
* organisation
* type badge
* deadline urgency
* location type
* salary/pay
* 2-line summary
* tags
* save icon
* view details
* apply quick action if appropriate

Deadline urgency examples:

Closes in 3 days
Closes this week
Deadline not listed
Recently added

Detail Page UX

Detail pages should feel like premium landing pages.

Include:

* sticky apply/save panel on desktop
* strong top summary
* “Good for” section
* requirements
* benefits
* source/disclaimer
* related opportunities
* back navigation

⸻

8. Updated Build Phases

Phase 1 — Architecture Inspection

Claude should inspect:

* auth system
* database
* routes
* existing UI components
* styling
* user model
* admin conventions

No coding first.

Phase 2 — Data Models

Build:

* Opportunity
* OpportunitySource
* OpportunityScrapeRun
* OpportunityImport
* SavedOpportunity
* OpportunityInteraction

Phase 3 — Public Jobs UI

Build a beautiful /jobs page with seed data.

Phase 4 — Detail Pages + Save Jobs

Build:

* /jobs/[slug]
* save/unsave
* logged-out prompt
* saved jobs page

Phase 5 — Admin Jobs

Build:

* create/edit/delete/publish
* feature/unfeature
* status management

Phase 6 — Scraping / Import Loop

Build:

* source registry
* manual URL import
* scrape run
* import queue
* enrichment mock/AI function
* review → publish flow

Phase 7 — Analytics Foundation

Build:

* apply click tracking
* view tracking
* save tracking
* simple admin stats if easy

⸻

9. Claude Prompt for This Version

Use this with Claude:

Read spec.md carefully. We are now building the full-loop version of LSN Jobs, not just a static jobs board.
The core loop is:
Sources discovered
→ jobs scraped/imported
→ listings enriched/cleaned
→ listings published
→ students browse/save/apply
→ system learns what performs
Important priorities:
1. Use the existing login/auth system.
2. Saved jobs should be included from the start.
3. Build a scraping/import foundation, including source registry, manual URL import, import queue and review-to-publish flow.
4. Put serious effort into UI/UX. The public Jobs experience should be dramatically better than the current LSN UI.
5. Do not overbuild employer dashboards or payments yet.
6. Keep architecture clean and agent-ready.
First inspect the codebase and produce an implementation plan before coding. Specifically tell me:
- what auth/login system exists
- what database/data layer exists
- how admin currently works
- what routes/components already exist
- what files you will create or modify
- what you recommend building tonight versus later
- any risks with scraping or saved jobs
Do not code until I approve the implementation plan.

⸻

10. Build Priority for Tonight

If time is tight, prioritise in this order:

1. beautiful public /jobs
2. strong opportunity data model
3. logged-in saved jobs
4. admin create/edit/publish
5. manual URL import
6. import review queue
7. source scraper
8. analytics

The reason:

* without beautiful UI, nobody uses it
* without saved jobs, login has no value
* without import/scrape, the autonomous loop is not proven
* without admin review, scraped data becomes dangerous
* without analytics, the learning engine cannot learn

⸻

11. Final Success Definition

This version is successful when:

* a student can browse a beautiful opportunities page
* a logged-in student can save jobs
* admin can create and publish opportunities
* admin can paste a source URL and create an import
* imported opportunities can be reviewed and published
* the system is ready for automated scraping
* the UX feels like a genuine product leap for LSN

The test is:

Could this become the first autonomous LSN vertical?

If yes, the build is on the right track.