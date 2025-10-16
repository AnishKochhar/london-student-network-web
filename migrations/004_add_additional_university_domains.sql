-- Migration: Add additional London university email domains
-- Created: 2025-10-04
-- Purpose: Add all alternative email domains for London universities (legacy, staff, alumni, etc.)

-- ============================================================================
-- Add alternative domains for existing universities
-- ============================================================================

-- Imperial College London - Add legacy/staff domain @ic.ac.uk
-- Note: @imperial.ac.uk is current standard, @ic.ac.uk is legacy/login domain
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('imperial', 'Imperial College London', 'ic.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- King's College London - Add alternative domain
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('kcl', 'King''s College London', 'kings.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- UCL - Add alternative domains
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('ucl', 'University College London', 'uclglobal.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- LSE - Add alternative domains
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('lse', 'London School of Economics', 'carr.ac.uk'),
    ('lse', 'London School of Economics', 'economics.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- City University - Add alternative domain
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('city', 'City, University of London', 'castle.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- Birkbeck - Add alternative domain
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('birkbeck', 'Birkbeck, University of London', 'birkbeck.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- London Metropolitan University - Add alternative domain
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('london-met', 'London Metropolitan University', 'londonmetropolitan.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- University of the Arts London - Add alternative domain
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('arts', 'University of the Arts London', 'cltad.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- Royal Holloway - Add alternative domain
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('royal-holloway', 'Royal Holloway, University of London', 'rhbnc.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- University of Greenwich - Add alternative domain
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('greenwich', 'University of Greenwich', 'gre.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- ============================================================================
-- Add missing London universities
-- ============================================================================

-- London Business School
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('lbs', 'London Business School', 'lbs.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- Royal Veterinary College
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('rvc', 'Royal Veterinary College', 'rvc.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- London School of Hygiene & Tropical Medicine
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('lshtm', 'London School of Hygiene & Tropical Medicine', 'lshtm.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- Institute of Cancer Research
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('icr', 'Institute of Cancer Research', 'icr.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- Courtauld Institute of Art
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('courtauld', 'Courtauld Institute of Art', 'courtauld.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- Royal Academy of Music
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('ram', 'Royal Academy of Music', 'ram.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- Royal Central School of Speech and Drama
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('cssd', 'Royal Central School of Speech and Drama', 'cssd.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- London South Bank University - Add alternative domain
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('southbank', 'London South Bank University', 'southbank.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- Regent's University London
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('regents', 'Regent''s University London', 'regents.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- University of East London
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('uel', 'University of East London', 'uel.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- University of West London
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('uwl', 'University of West London', 'uwl.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- Ravensbourne University London
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('ravensbourne', 'Ravensbourne University London', 'ravensbourne.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- London Institute of Banking & Finance
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('libf', 'London Institute of Banking & Finance', 'libf.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- ============================================================================
-- Add specialized London institutions
-- ============================================================================

-- Royal College of Art
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('rca', 'Royal College of Art', 'rca.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- Royal College of Music
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('rcm', 'Royal College of Music', 'rcm.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- Guildhall School of Music and Drama
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('gsmd', 'Guildhall School of Music and Drama', 'gsmd.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- Trinity Laban Conservatoire of Music and Dance
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('trinitylaban', 'Trinity Laban Conservatoire', 'trinitylaban.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- ============================================================================
-- Add City St George's University (2024 merger)
-- ============================================================================

-- City St George's, University of London (merged 2024)
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('city-st-georges', 'City St George''s, University of London', 'citystgeorges.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- ============================================================================
-- Update comments
-- ============================================================================

COMMENT ON TABLE university_email_domains IS 'Comprehensive mapping of London university .ac.uk email domains including legacy, staff, and alternative domains';

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Summary:
-- - Added @ic.ac.uk for Imperial (legacy/staff domain)
-- - Added 10+ alternative domains for existing universities
-- - Added 15+ missing London universities and specialized institutions
-- - Total London universities covered: 35+
