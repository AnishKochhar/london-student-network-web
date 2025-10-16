-- =========================================================================
-- Add US University .edu Domains for Email Verification
-- =========================================================================
-- Purpose: Allow US university students to verify their student status
--          giving them access to 'verified_students' events (but NOT
--          'university_exclusive' events which remain London-uni only)
--
-- Note: Does NOT add these universities to LondonUniversities array
--       (platform remains London-focused for society registration)
-- =========================================================================

-- Ivy League Universities
INSERT INTO university_email_domains (email_domain, university_code, university_name, is_active)
VALUES
  ('harvard.edu', 'harvard', 'Harvard University', true),
  ('yale.edu', 'yale', 'Yale University', true),
  ('princeton.edu', 'princeton', 'Princeton University', true),
  ('columbia.edu', 'columbia', 'Columbia University', true),
  ('upenn.edu', 'upenn', 'University of Pennsylvania', true),
  ('cornell.edu', 'cornell', 'Cornell University', true),
  ('brown.edu', 'brown', 'Brown University', true),
  ('dartmouth.edu', 'dartmouth', 'Dartmouth College', true)
ON CONFLICT (email_domain) DO NOTHING;

-- Top US Research Universities
INSERT INTO university_email_domains (email_domain, university_code, university_name, is_active)
VALUES
  ('stanford.edu', 'stanford', 'Stanford University', true),
  ('mit.edu', 'mit', 'Massachusetts Institute of Technology', true),
  ('caltech.edu', 'caltech', 'California Institute of Technology', true),
  ('berkeley.edu', 'berkeley', 'University of California, Berkeley', true),
  ('uchicago.edu', 'uchicago', 'University of Chicago', true),
  ('northwestern.edu', 'northwestern', 'Northwestern University', true),
  ('duke.edu', 'duke', 'Duke University', true),
  ('jhu.edu', 'jhu', 'Johns Hopkins University', true),
  ('nyu.edu', 'nyu', 'New York University', true),
  ('umich.edu', 'umich', 'University of Michigan', true),
  ('virginia.edu', 'virginia', 'University of Virginia', true),
  ('ucla.edu', 'ucla', 'University of California, Los Angeles', true),
  ('ucsd.edu', 'ucsd', 'University of California, San Diego', true),
  ('usc.edu', 'usc', 'University of Southern California', true),
  ('georgetown.edu', 'georgetown', 'Georgetown University', true),
  ('cmu.edu', 'cmu', 'Carnegie Mellon University', true),
  ('washington.edu', 'washington', 'University of Washington', true),
  ('rice.edu', 'rice', 'Rice University', true),
  ('vanderbilt.edu', 'vanderbilt', 'Vanderbilt University', true),
  ('nd.edu', 'nd', 'University of Notre Dame', true)
ON CONFLICT (email_domain) DO NOTHING;

-- Public Universities (Common for exchange students)
INSERT INTO university_email_domains (email_domain, university_code, university_name, is_active)
VALUES
  ('wisc.edu', 'wisc', 'University of Wisconsin-Madison', true),
  ('illinois.edu', 'illinois', 'University of Illinois Urbana-Champaign', true),
  ('utexas.edu', 'utexas', 'University of Texas at Austin', true),
  ('gatech.edu', 'gatech', 'Georgia Institute of Technology', true),
  ('unc.edu', 'unc', 'University of North Carolina at Chapel Hill', true),
  ('psu.edu', 'psu', 'Pennsylvania State University', true),
  ('osu.edu', 'osu', 'Ohio State University', true),
  ('ufl.edu', 'ufl', 'University of Florida', true),
  ('uw.edu', 'uw', 'University of Washington', true)
ON CONFLICT (email_domain) DO NOTHING;

-- Verify additions
SELECT
    COUNT(*) FILTER (WHERE email_domain LIKE '%.edu') as edu_domains_added,
    COUNT(*) FILTER (WHERE email_domain LIKE '%.ac.uk') as uk_domains,
    COUNT(*) as total_domains
FROM university_email_domains
WHERE is_active = true;

-- Show sample of .edu domains
SELECT email_domain, university_name
FROM university_email_domains
WHERE email_domain LIKE '%.edu'
  AND is_active = true
ORDER BY university_name
LIMIT 10;

-- =========================================================================
-- Notes:
-- =========================================================================
-- 1. Students with these emails can now verify as "verified students"
-- 2. They get access to 'verified_students' level events
-- 3. They do NOT get access to 'university_exclusive' events (London-only)
-- 4. Guest registration detection still works correctly (marks them external)
-- 5. No changes needed to LondonUniversities array or webapp code
--
-- Access levels after this change:
-- - public: Everyone (including .edu students)
-- - students_only: Verified students (including .edu students) ✓
-- - verified_students: Verified students (including .edu students) ✓
-- - university_exclusive: London uni students only (NOT .edu students) ✓
-- =========================================================================
