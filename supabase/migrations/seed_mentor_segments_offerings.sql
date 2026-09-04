-- ==============================================================================
-- SEED DATA: mentor_segments (multi-segment mentor associations)
-- Description: Seeds the many-to-many mentor_segments join table from existing
--              mentor-segments data. Creates both primary and secondary segment
--              associations for mentors who work across multiple categories.
-- ==============================================================================

-- Clear existing seed data (for re-runs)
DELETE FROM public.mentor_segments WHERE mentor_id IN (
    SELECT id FROM public.mentors WHERE is_demo = true
) ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 1. MENTAL HEALTH ADVISORS -> MENTAL HEALTH SEGMENT
-- ==============================================================================
INSERT INTO public.mentor_segments (id, mentor_id, segment_id, status, display_order, created_at, updated_at) VALUES
('ms-evelyn-mental', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000003', 'active', 0, '2025-01-15T10:00:00Z', '2025-01-15T10:00:00Z'),
('ms-vikram-mental', '88888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000003', 'active', 0, '2025-01-20T10:00:00Z', '2025-01-20T10:00:00Z'),
('ms-charlotte-mental', '13131313-1313-1313-1313-131313131313', '00000000-0000-0000-0000-000000000003', 'active', 0, '2025-01-09T10:00:00Z', '2025-01-09T10:00:00Z'),
('ms-aravind-mental', '14141414-1414-1414-1414-141414141414', '00000000-0000-0000-0000-000000000003', 'active', 0, '2025-01-13T10:00:00Z', '2025-01-13T10:00:00Z'),
('ms-leila-mental', '15151515-1515-1515-1515-151515151515', '00000000-0000-0000-0000-000000000003', 'active', 0, '2025-01-21T10:00:00Z', '2025-01-21T10:00:00Z'),
('ms-marcus-b-mental', '16161616-1616-1616-1616-161616161616', '00000000-0000-0000-0000-000000000003', 'active', 0, '2025-01-18T10:00:00Z', '2025-01-18T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 2. RELATIONSHIP ADVISORS -> RELATIONSHIP SEGMENT
-- ==============================================================================
INSERT INTO public.mentor_segments (id, mentor_id, segment_id, status, display_order, created_at, updated_at) VALUES
('ms-alistair-rel', '66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000001', 'active', 0, '2025-01-10T11:00:00Z', '2025-01-10T11:00:00Z'),
('ms-priya-rel', '77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000001', 'active', 0, '2025-01-18T14:00:00Z', '2025-01-18T14:00:00Z'),
('ms-elena-r-rel', '99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000001', 'active', 0, '2025-01-22T08:00:00Z', '2025-01-22T08:00:00Z'),
('ms-rahul-rel', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001', 'active', 0, '2025-01-14T09:00:00Z', '2025-01-14T09:00:00Z'),
('ms-sophia-rel', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000001', 'active', 0, '2025-01-05T12:00:00Z', '2025-01-05T12:00:00Z'),
('ms-maya-rel', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000001', 'active', 0, '2025-01-19T11:00:00Z', '2025-01-19T11:00:00Z'),
('ms-david-rel', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '00000000-0000-0000-0000-000000000001', 'active', 0, '2025-01-08T10:00:00Z', '2025-01-08T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 3. CAREER ADVISORS -> CAREER SEGMENT
-- ==============================================================================
INSERT INTO public.mentor_segments (id, mentor_id, segment_id, status, display_order, created_at, updated_at) VALUES
('ms-marcus-t-carr', '44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000002', 'active', 0, '2025-01-10T14:00:00Z', '2025-01-10T14:00:00Z'),
('ms-sarah-carr', '55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000002', 'active', 0, '2025-01-08T09:30:00Z', '2025-01-08T09:30:00Z'),
('ms-arjun-carr', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '00000000-0000-0000-0000-000000000002', 'active', 0, '2025-01-11T10:00:00Z', '2025-01-11T10:00:00Z'),
('ms-rachel-carr', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '00000000-0000-0000-0000-000000000002', 'active', 0, '2025-01-16T12:00:00Z', '2025-01-16T12:00:00Z'),
('ms-vikram-s-carr', '10101010-1010-1010-1010-101010101010', '00000000-0000-0000-0000-000000000002', 'active', 0, '2025-01-12T14:00:00Z', '2025-01-12T14:00:00Z'),
('ms-elena-m-carr', '12121212-1212-1212-1212-121212121212', '00000000-0000-0000-0000-000000000002', 'active', 0, '2025-01-14T10:00:00Z', '2025-01-14T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 4. MULTI-SEGMENT MENTORS (bonus data to demonstrate cross-segment capability)
-- ==============================================================================
-- Dr. Priya Sharma already works in Relationship; add Career as a secondary segment
INSERT INTO public.mentor_segments (id, mentor_id, segment_id, status, display_order, created_at, updated_at) VALUES
('ms-priya-carr', '77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000002', 'active', 1, '2025-03-01T10:00:00Z', '2025-03-01T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- SEED DATA: offerings (new offerings table populated from existing gigs data)
-- ==============================================================================

-- Clear existing seed data (for re-runs)
DELETE FROM public.offerings WHERE mentor_segment_id IN (
    SELECT id FROM public.mentor_segments WHERE mentor_id IN (
        SELECT id FROM public.mentors WHERE is_demo = true
    )
) ON CONFLICT DO NOTHING;

-- Evelyn Vasquez Offerings (Mental Health)
INSERT INTO public.offerings (id, mentor_segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_available, created_at, updated_at) VALUES
('of-evelyn-001', 'ms-evelyn-mental', 'Executive Crossroads & Burnout Diagnostics', 'executive-crossroads-burnout-diagnostics', 'A 45-minute structured clinical advisory session designed to pinpoint the physiological and cognitive root causes of executive burnout, evaluate active decision fatigue, and construct an actionable 30-day psychological recovery protocol.', 45, 3500, ARRAY['45-minute confidential 1:1 video consultation via encrypted stream', 'Clinical Burnout & Cognitive Load Assessment Matrix (PDF)', 'Personalized 30-day cognitive restructuring & boundary roadmap', 'Asynchronous follow-up messaging access for 7 days post-session'], true, '2024-11-05T09:00:00Z', '2024-11-05T09:00:00Z'),
('of-evelyn-002', 'ms-evelyn-mental', 'High-Cognitive-Load Stress Modulation Protocol', 'high-cognitive-load-stress-modulation', 'Targeted psychological calibration before high-stakes board reviews, restructuring periods, or sustained operational sprints. Protect executive cognitive stamina.', 45, 4000, ARRAY['45-minute tactical behavioral rehearsal session', 'Cognitive reframing playbook for high-pressure situations', 'Stress-response modulation exercises and sleep hygiene framework'], true, '2024-11-12T14:00:00Z', '2024-11-12T14:00:00Z');

-- Dr. Alistair Chen Offerings (Relationship)
INSERT INTO public.offerings (id, mentor_segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_available, created_at, updated_at) VALUES
('of-alistair-001', 'ms-alistair-rel', 'High-Stakes Partnership Conflict Calibration & De-escalation', 'partnership-conflict-calibration-de-escalation', 'A 50-minute structured relationship session using the Gottman repair protocol to de-escalate recurring gridlock, unpack underlying needs, and rebuild emotional alignment during high-stress life transitions.', 45, 4500, ARRAY['45-minute confidential 1:1 or couples video consultation', 'Gottman Sound Relationship House Diagnostic Summary', 'Custom Conflict De-escalation Playbook & Language Guide', 'Post-session structured conversational exercises'], true, '2024-10-15T09:00:00Z', '2024-10-15T09:00:00Z'),
('of-alistair-002', 'ms-alistair-rel', 'Pre-Commitment & Life Alignment Strategic Roadmap', 'pre-commitment-life-alignment-roadmap', 'Comprehensive evaluation of core values, financial expectations, family boundaries, and communication architecture before major commitment milestones.', 45, 4000, ARRAY['45-minute alignment assessment consultation', 'Core Values & Boundaries Compatibility Matrix', 'Long-term family and career balance roadmap'], true, '2024-10-20T10:00:00Z', '2024-10-20T10:00:00Z');

-- Priya Sharma Offerings (Relationship)
INSERT INTO public.offerings (id, mentor_segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_available, created_at, updated_at) VALUES
('of-priya-001', 'ms-priya-rel', 'Interpersonal Boundaries & High-Stress Family Dynamics', 'interpersonal-boundaries-family-dynamics', 'Establish healthy, non-reactive boundaries with extended family, in-laws, and demanding social circles while preserving mutual respect and personal peace.', 45, 3200, ARRAY['45-minute private 1:1 strategy consultation', 'Boundary script template library for high-conflict conversations', 'Emotional de-triggering behavioral exercise sheet'], true, '2024-11-10T10:00:00Z', '2024-11-10T10:00:00Z');

-- Marcus Thorne Offerings (Career)
INSERT INTO public.offerings (id, mentor_segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_available, created_at, updated_at) VALUES
('of-marcus-001', 'ms-marcus-t-carr', 'Staff+ Engineering Promotion & Organizational Influence', 'staff-plus-engineering-promotion-influence', 'Navigate the nebulous transition from Senior Engineer to Staff/Principal. Learn how to write compelling RFCs, drive cross-org architectural alignment, and build executive sponsorship.', 45, 4200, ARRAY['45-minute strategic career calibration call', 'RFC review & technical communication critique', 'Staff+ promotion packet framework'], true, '2024-10-25T11:00:00Z', '2024-10-25T11:00:00Z'),
('of-marcus-002', 'ms-marcus-t-carr', 'Executive Architecture Teardown & Leadership Strategy', 'executive-architecture-teardown-leadership', 'Live architectural review and leadership strategy for high-scale distributed backend systems, database scaling, and engineering organization structure.', 45, 4500, ARRAY['45-minute live architecture review & whiteboard teardown', 'Annotated system diagram with failure domain analysis', 'Capacity planning formula & resilience checklist'], true, '2024-10-20T10:00:00Z', '2024-10-20T10:00:00Z');

-- Sarah Jenkins Offerings (Career)
INSERT INTO public.offerings (id, mentor_segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_available, created_at, updated_at) VALUES
('of-sarah-001', 'ms-sarah-carr', 'Executive Offer & Equity Package Negotiation Strategy', 'executive-offer-equity-negotiation-strategy', 'Maximize your total compensation leverage for VP/Director/C-level offers. Audit base, bonus multipliers, RSUs/options vesting cliffs, and severance clauses.', 45, 5000, ARRAY['45-minute live term sheet analysis & counter-offer strategy', 'Equity Valuation & Liquidity Assessment Spreadsheet', 'Negotiation talk tracks and email response scripts'], true, '2024-09-15T10:00:00Z', '2024-09-15T10:00:00Z'),
('of-sarah-002', 'ms-sarah-carr', 'Strategic Career Pivot & Board Positioning Blueprint', 'strategic-career-pivot-board-positioning', 'Position your executive track record for board seats, founder transitions, or strategic industry pivots with structured authority.', 45, 4500, ARRAY['45-minute executive narrative teardown', 'Executive one-pager narrative template', 'Target board and leadership outreach framework'], true, '2024-09-22T13:00:00Z', '2024-09-22T13:00:00Z');

-- Dr. Vikram Patel Offerings (Mental Health)
INSERT INTO public.offerings (id, mentor_segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_available, created_at, updated_at) VALUES
('of-vikram-001', 'ms-vikram-mental', 'Executive Neuro-Resilience & Acute Anxiety Protocol', 'executive-neuro-resilience-anxiety-protocol', 'Evidence-based cognitive neuroscience protocols to regulate sympathetic nervous system overactivation, manage imposter anxiety, and sustain peak mental performance.', 45, 3600, ARRAY['45-minute clinical neuropsychology assessment', 'Vagal nerve & sympathetic tone regulation guide', 'Daily cognitive stamina & focus optimization protocol'], true, '2024-11-20T09:00:00Z', '2024-11-20T09:00:00Z');

-- Dr. Elena Rostova Offerings (Relationship)
INSERT INTO public.offerings (id, mentor_segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_available, created_at, updated_at) VALUES
('of-elena-r-001', 'ms-elena-r-rel', 'Post-Rupture Trust Rebuild & Relational Recovery', 'post-rupture-trust-rebuild-recovery', 'Structured therapeutic framework to de-escalate resentment, rebuild emotional safety, and construct transparent communication agreements.', 45, 3800, ARRAY['45-min guided conflict mediation', 'Transparency contract framework', 'Emergency de-escalation protocol'], true, '2024-11-20T09:00:00Z', '2024-11-20T09:00:00Z');

-- Rahul Mehta Offerings (Relationship)
INSERT INTO public.offerings (id, mentor_segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_available, created_at, updated_at) VALUES
('of-rahul-001', 'ms-rahul-rel', 'Intercultural Couple Alignment & Boundary Architecture', 'intercultural-couple-alignment-roadmap', 'Navigate tradition, family expectations, and personal values without compromising personal sovereignty.', 45, 3400, ARRAY['45-min strategic alignment consultation', 'Values conflict matrix', 'Family communication guide'], true, '2024-11-01T10:00:00Z', '2024-11-01T10:00:00Z');

-- Dr. Sophia Vance Offerings (Relationship)
INSERT INTO public.offerings (id, mentor_segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_available, created_at, updated_at) VALUES
('of-sophia-001', 'ms-sophia-rel', 'Anxious-Avoidant Trap Resolution & Attachment Calibration', 'anxious-avoidant-trap-resolution', 'Understand how nervous system activation drives withdraw-pursue cycles and rewire your relational response.', 45, 4200, ARRAY['45-min attachment breakdown', 'De-triggering audio playbook', 'Secure communication scripts'], true, '2024-09-20T10:00:00Z', '2024-09-20T10:00:00Z');

-- Maya Sen Offerings (Relationship)
INSERT INTO public.offerings (id, mentor_segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_available, created_at, updated_at) VALUES
('of-maya-001', 'ms-maya-rel', 'High-Stakes Family & Estate Communication Protocol', 'high-stakes-family-estate-protocol', 'Empirical mediation for complex interpersonal dynamics, family business governance, and legacy alignment.', 45, 3600, ARRAY['45-min family systems audit', 'Communication agenda protocol', 'Neutral negotiation rules'], true, '2024-11-15T12:00:00Z', '2024-11-15T12:00:00Z');

-- David Kaufman Offerings (Relationship)
INSERT INTO public.offerings (id, mentor_segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_available, created_at, updated_at) VALUES
('of-david-001', 'ms-david-rel', 'Collaborative Co-Parenting & Transition Architecture', 'collaborative-co-parenting-transition', 'Design child-centered schedules, mutual conflict rules, and friction-free communication routines.', 45, 4000, ARRAY['45-min strategy session', 'Co-parenting calendar protocol', 'Direct communication template'], true, '2024-10-05T09:00:00Z', '2024-10-05T09:00:00Z');

-- Arjun Kapoor Offerings (Career)
INSERT INTO public.offerings (id, mentor_segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_available, created_at, updated_at) VALUES
('of-arjun-001', 'ms-arjun-carr', 'Director to VP of Engineering Leadership Roadmap', 'director-to-vp-engineering-roadmap', 'Transition from managing managers to driving company-level technology strategy and executive presence.', 45, 4500, ARRAY['45-min executive teardown', 'Org structure matrix', 'Executive presentation blueprint'], true, '2024-10-22T10:00:00Z', '2024-10-22T10:00:00Z');

-- Rachel Zhao Offerings (Career)
INSERT INTO public.offerings (id, mentor_segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_available, created_at, updated_at) VALUES
('of-rachel-001', 'ms-rachel-carr', 'Product Leadership Strategy & C-Suite Narrative Calibration', 'product-leadership-csuite-narrative', 'Audit your product vision, metrics deck, and cross-functional influence to break into VP of Product roles.', 45, 4400, ARRAY['45-min product strategy teardown', 'Product narrative template', 'Executive stakeholder rubric'], true, '2024-10-10T10:00:00Z', '2024-10-10T10:00:00Z');

-- Vikram Singh Offerings (Career)
INSERT INTO public.offerings (id, mentor_segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_available, created_at, updated_at) VALUES
('of-vikram-s-001', 'ms-vikram-s-carr', 'First-Time Founder to High-Performance CEO Strategy', 'founder-to-ceo-performance-strategy', 'Establish executive delegation systems, board reporting frameworks, and sustainable CEO operating cadences.', 45, 3900, ARRAY['45-min operational teardown', 'CEO weekly operating template', 'Board memo rubric'], true, '2024-11-06T10:00:00Z', '2024-11-06T10:00:00Z');

-- Elena Moreno Offerings (Career)
INSERT INTO public.offerings (id, mentor_segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_available, created_at, updated_at) VALUES
('of-elena-m-001', 'ms-elena-m-carr', 'Chief of Staff Mastery & C-Suite Leverage Acceleration', 'chief-of-staff-mastery-acceleration', 'Level up your impact as the CEO strategic right hand and build a launchpad for GM/VP roles.', 45, 3500, ARRAY['45-min strategic leverage audit', 'Executive operating cadence doc', 'Strategic project prioritization framework'], true, '2024-11-15T09:00:00Z', '2024-11-15T09:00:00Z');

-- Dr. Charlotte Weber Offerings (Mental Health)
INSERT INTO public.offerings (id, mentor_segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_available, created_at, updated_at) VALUES
('of-charlotte-001', 'ms-charlotte-mental', 'Acute Anxiety De-escalation & Nervous System Reset', 'acute-anxiety-deescalation-reset', 'Clinically proven interoceptive and cognitive tools to neutralize acute panic triggers and reclaim cognitive calm.', 45, 4100, ARRAY['45-min clinical reset session', 'Cognitive distortion reframe sheet', 'Emergency grounding audio track'], true, '2024-09-25T10:00:00Z', '2024-09-25T10:00:00Z');

-- Dr. Aravind Nair Offerings (Mental Health)
INSERT INTO public.offerings (id, mentor_segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_available, created_at, updated_at) VALUES
('of-aravind-001', 'ms-aravind-mental', 'Somatic Nervous System Calibration & Circadian Reset', 'somatic-nervous-system-calibration', 'Comprehensive assessment of nervous system fatigue markers and personalized biological sleep/recovery protocol.', 45, 4500, ARRAY['45-min clinical psychiatric consult', 'Circadian & sleep architecture blueprint', 'HRV & autonomic recovery guide'], true, '2024-10-20T10:00:00Z', '2024-10-20T10:00:00Z');

-- Dr. Leila Kassir Offerings (Mental Health)
INSERT INTO public.offerings (id, mentor_segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_available, created_at, updated_at) VALUES
('of-leila-001', 'ms-leila-mental', 'Executive Focus Restoration & Dopaminergic Reset Protocol', 'executive-focus-restoration-reset', 'Rebuild sustained deep focus capacity and eliminate compulsive attention switching in high-stress work.', 45, 3700, ARRAY['45-min cognitive focus assessment', 'Dopamine detox roadmap', '30-day deep work block architecture'], true, '2024-11-08T10:00:00Z', '2024-11-08T10:00:00Z');

-- Dr. Marcus Brooks Offerings (Mental Health)
INSERT INTO public.offerings (id, mentor_segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_available, created_at, updated_at) VALUES
('of-marcus-b-001', 'ms-marcus-b-mental', 'Imposter Syndrome & Perfectionism Deconstruction', 'imposter-syndrome-perfectionism-deconstruction', 'Empirical psychotherapy protocols to unpack deep-seated imposter phenomenon and perfectionistic paralysis.', 45, 3900, ARRAY['45-min clinical psychology session', 'Cognitive restructuring worksheet', 'Behavioral activation protocol'], true, '2024-10-28T11:00:00Z', '2024-10-28T11:00:00Z');

-- ==============================================================================
-- SEED DATA: booking_requests (demo data with various states)
-- ==============================================================================

-- Clear existing seed data (for re-runs)
DELETE FROM public.booking_requests WHERE seeker_id = '11111111-1111-1111-1111-111111111111' ON CONFLICT DO NOTHING;
DELETE FROM public.booking_audit_log WHERE booking_request_id IN (
    SELECT id FROM public.booking_requests WHERE seeker_id = '11111111-1111-1111-1111-111111111111'
) ON CONFLICT DO NOTHING;

-- Booking Request 1: Pending request from Alex Rivera to Dr. Evelyn Vasquez
INSERT INTO public.booking_requests (id, offering_id, mentor_id, seeker_id, status, proposed_start_time, proposed_end_time, message, amount_inr, platform_fee_inr, mentor_payout_inr, created_at, updated_at) VALUES
('br-001', 'of-evelyn-001', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'pending', '2026-09-15T10:00:00Z', '2026-09-15T10:45:00Z', 'Looking forward to our session on burnout recovery.', 3500, 525, 2975, '2026-09-02T08:00:00Z', '2026-09-02T08:00:00Z');

-- Booking Request 2: Accepted request from Alex Rivera to Dr. Marcus Thorne
INSERT INTO public.booking_requests (id, offering_id, mentor_id, seeker_id, status, proposed_start_time, proposed_end_time, confirmed_start_time, confirmed_end_time, meeting_url, message, amount_inr, platform_fee_inr, mentor_payout_inr, created_at, updated_at) VALUES
('br-002', 'of-marcus-001', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'accepted', '2026-09-20T14:00:00Z', '2026-09-20T14:45:00Z', '2026-09-20T14:00:00Z', '2026-09-20T14:45:00Z', 'https://meet.suggestkey.com/sk-booking-br002', 'Ready for the Staff+ promotion strategy session.', 4200, 630, 3570, '2026-09-01T10:00:00Z', '2026-09-01T11:00:00Z');

-- Booking Request 3: Declined request from Alex Rivera to Dr. Alistair Chen
INSERT INTO public.booking_requests (id, offering_id, mentor_id, seeker_id, status, proposed_start_time, proposed_end_time, message, amount_inr, platform_fee_inr, mentor_payout_inr, created_at, updated_at) VALUES
('br-003', 'of-alistair-001', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'declined', '2026-09-18T11:00:00Z', '2026-09-18T11:45:00Z', 'Needed advice on partnership conflict.', 4500, 675, 3825, '2026-09-01T12:00:00Z', '2026-09-01T15:00:00Z');

-- Booking Request 4: Cancelled request
INSERT INTO public.booking_requests (id, offering_id, mentor_id, seeker_id, status, proposed_start_time, proposed_end_time, message, amount_inr, platform_fee_inr, mentor_payout_inr, created_at, updated_at) VALUES
('br-004', 'of-sarah-001', '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'cancelled', '2026-09-22T09:00:00Z', '2026-09-22T09:45:00Z', 'Need to reschedule my equity negotiation session.', 5000, 750, 4250, '2026-09-02T07:00:00Z', '2026-09-02T08:30:00Z');

-- ==============================================================================
-- AUDIT LOG ENTRIES
-- ==============================================================================

INSERT INTO public.booking_audit_log (id, booking_request_id, action, actor_id, from_status, to_status, metadata, created_at) VALUES
('bal-001', 'br-001', 'created', '11111111-1111-1111-1111-111111111111', NULL, 'pending', '{"source": "seeker_portal"}', '2026-09-02T08:00:00Z'),

('bal-002', 'br-002', 'created', '11111111-1111-1111-1111-111111111111', NULL, 'pending', '{"source": "seeker_portal"}', '2026-09-01T10:00:00Z'),
('bal-003', 'br-002', 'accepted', '44444444-4444-4444-4444-444444444444', 'pending', 'accepted', '{"meeting_url": "https://meet.suggestkey.com/sk-booking-br002"}', '2026-09-01T11:00:00Z'),

('bal-004', 'br-003', 'created', '11111111-1111-1111-1111-111111111111', NULL, 'pending', '{"source": "seeker_portal"}', '2026-09-01T12:00:00Z'),
('bal-005', 'br-003', 'declined', '66666666-6666-6666-6666-666666666666', 'pending', 'declined', '{"reason": "Mentor unavailable for requested time"}', '2026-09-01T15:00:00Z'),

('bal-006', 'br-004', 'created', '11111111-1111-1111-1111-111111111111', NULL, 'pending', '{"source": "seeker_portal"}', '2026-09-02T07:00:00Z'),
('bal-007', 'br-004', 'cancelled', '11111111-1111-1111-1111-111111111111', 'pending', 'cancelled', '{"reason": "seeker requested reschedule"}', '2026-09-02T08:30:00Z');