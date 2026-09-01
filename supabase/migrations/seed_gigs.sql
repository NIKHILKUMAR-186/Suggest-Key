-- ==============================================================================
-- SEED DATA PART 2: Gigs/Offerings
-- Description: Contains all demo gig/seed data for the Suggest Key platform.
-- ==============================================================================

-- ==============================================================================
-- GIGS (All demo offerings)
-- ==============================================================================

-- Evelyn Vasquez Gigs (Mental Health)
INSERT INTO public.gigs (id, mentor_id, category_id, segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_published, created_at) VALUES
('gig-evelyn-001', '22222222-2222-2222-2222-222222222222', 'mental-health', '00000000-0000-0000-0000-000000000003', 'Executive Crossroads & Burnout Diagnostics', 'executive-crossroads-burnout-diagnostics', 'A 45-minute structured clinical advisory session designed to pinpoint the physiological and cognitive root causes of executive burnout, evaluate active decision fatigue, and construct an actionable 30-day psychological recovery protocol.', 45, 3500, ARRAY['45-minute confidential 1:1 video consultation via encrypted stream', 'Clinical Burnout & Cognitive Load Assessment Matrix (PDF)', 'Personalized 30-day cognitive restructuring & boundary roadmap', 'Asynchronous follow-up messaging access for 7 days post-session'], true, '2024-11-05T09:00:00Z'),
('gig-evelyn-002', '22222222-2222-2222-2222-222222222222', 'mental-health', '00000000-0000-0000-0000-000000000003', 'High-Cognitive-Load Stress Modulation Protocol', 'high-cognitive-load-stress-modulation', 'Targeted psychological calibration before high-stakes board reviews, restructuring periods, or sustained operational sprints. Protect executive cognitive stamina.', 45, 4000, ARRAY['45-minute tactical behavioral rehearsal session', 'Cognitive reframing playbook for high-pressure situations', 'Stress-response modulation exercises and sleep hygiene framework'], true, '2024-11-12T14:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Dr. Alistair Chen Gigs (Relationship)
INSERT INTO public.gigs (id, mentor_id, category_id, segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_published, created_at) VALUES
('gig-alistair-001', '66666666-6666-6666-6666-666666666666', 'relationship', '00000000-0000-0000-0000-000000000001', 'High-Stakes Partnership Conflict Calibration & De-escalation', 'partnership-conflict-calibration-de-escalation', 'A 50-minute structured relationship session using the Gottman repair protocol to de-escalate recurring gridlock, unpack underlying needs, and rebuild emotional alignment during high-stress life transitions.', 45, 4500, ARRAY['45-minute confidential 1:1 or couples video consultation', 'Gottman Sound Relationship House Diagnostic Summary', 'Custom Conflict De-escalation Playbook & Language Guide', 'Post-session structured conversational exercises'], true, '2024-10-15T09:00:00Z'),
('gig-alistair-002', '66666666-6666-6666-6666-666666666666', 'relationship', '00000000-0000-0000-0000-000000000001', 'Pre-Commitment & Life Alignment Strategic Roadmap', 'pre-commitment-life-alignment-roadmap', 'Comprehensive evaluation of core values, financial expectations, family boundaries, and communication architecture before major commitment milestones.', 45, 4000, ARRAY['45-minute alignment assessment consultation', 'Core Values & Boundaries Compatibility Matrix', 'Long-term family and career balance roadmap'], true, '2024-10-20T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Priya Sharma Gigs (Relationship)
INSERT INTO public.gigs (id, mentor_id, category_id, segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_published, created_at) VALUES
('gig-priya-001', '77777777-7777-7777-7777-777777777777', 'relationship', '00000000-0000-0000-0000-000000000001', 'Interpersonal Boundaries & High-Stress Family Dynamics', 'interpersonal-boundaries-family-dynamics', 'Establish healthy, non-reactive boundaries with extended family, in-laws, and demanding social circles while preserving mutual respect and personal peace.', 45, 3200, ARRAY['45-minute private 1:1 strategy consultation', 'Boundary script template library for high-conflict conversations', 'Emotional de-triggering behavioral exercise sheet'], true, '2024-11-10T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Marcus Thorne Gigs (Career)
INSERT INTO public.gigs (id, mentor_id, category_id, segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_published, created_at) VALUES
('gig-marcus-001', '44444444-4444-4444-4444-444444444444', 'career', '00000000-0000-0000-0000-000000000002', 'Staff+ Engineering Promotion & Organizational Influence', 'staff-plus-engineering-promotion-influence', 'Navigate the nebulous transition from Senior Engineer to Staff/Principal. Learn how to write compelling RFCs, drive cross-org architectural alignment, and build executive sponsorship.', 45, 4200, ARRAY['45-minute strategic career calibration call', 'RFC review & technical communication critique', 'Staff+ promotion packet framework'], true, '2024-10-25T11:00:00Z'),
('gig-marcus-002', '44444444-4444-4444-4444-444444444444', 'career', '00000000-0000-0000-0000-000000000002', 'Executive Architecture Teardown & Leadership Strategy', 'executive-architecture-teardown-leadership', 'Live architectural review and leadership strategy for high-scale distributed backend systems, database scaling, and engineering organization structure.', 45, 4500, ARRAY['45-minute live architecture review & whiteboard teardown', 'Annotated system diagram with failure domain analysis', 'Capacity planning formula & resilience checklist'], true, '2024-10-20T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Sarah Jenkins Gigs (Career)
INSERT INTO public.gigs (id, mentor_id, category_id, segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_published, created_at) VALUES
('gig-sarah-001', '55555555-5555-5555-5555-555555555555', 'career', '00000000-0000-0000-0000-000000000002', 'Executive Offer & Equity Package Negotiation Strategy', 'executive-offer-equity-negotiation-strategy', 'Maximize your total compensation leverage for VP/Director/C-level offers. Audit base, bonus multipliers, RSUs/options vesting cliffs, and severance clauses.', 45, 5000, ARRAY['45-minute live term sheet analysis & counter-offer strategy', 'Equity Valuation & Liquidity Assessment Spreadsheet', 'Negotiation talk tracks and email response scripts'], true, '2024-09-15T10:00:00Z'),
('gig-sarah-002', '55555555-5555-5555-5555-555555555555', 'career', '00000000-0000-0000-0000-000000000002', 'Strategic Career Pivot & Board Positioning Blueprint', 'strategic-career-pivot-board-positioning', 'Position your executive track record for board seats, founder transitions, or strategic industry pivots with structured authority.', 45, 4500, ARRAY['45-minute executive narrative teardown', 'Executive one-pager narrative template', 'Target board and leadership outreach framework'], true, '2024-09-22T13:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Dr. Vikram Patel Gigs (Mental Health)
INSERT INTO public.gigs (id, mentor_id, category_id, segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_published, created_at) VALUES
('gig-vikram-001', '88888888-8888-8888-8888-888888888888', 'mental-health', '00000000-0000-0000-0000-000000000003', 'Executive Neuro-Resilience & Acute Anxiety Protocol', 'executive-neuro-resilience-anxiety-protocol', 'Evidence-based cognitive neuroscience protocols to regulate sympathetic nervous system overactivation, manage imposter anxiety, and sustain peak mental performance.', 45, 3600, ARRAY['45-minute clinical neuropsychology assessment', 'Vagal nerve & sympathetic tone regulation guide', 'Daily cognitive stamina & focus optimization protocol'], true, '2024-11-20T09:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Dr. Elena Rostova Gigs (Relationship)
INSERT INTO public.gigs (id, mentor_id, category_id, segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_published, created_at) VALUES
('gig-elena-001', '99999999-9999-9999-9999-999999999999', 'relationship', '00000000-0000-0000-0000-000000000001', 'Post-Rupture Trust Rebuild & Relational Recovery', 'post-rupture-trust-rebuild-recovery', 'Structured therapeutic framework to de-escalate resentment, rebuild emotional safety, and construct transparent communication agreements.', 45, 3800, ARRAY['45-min guided conflict mediation', 'Transparency contract framework', 'Emergency de-escalation protocol'], true, '2024-11-20T09:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Rahul Mehta Gigs (Relationship)
INSERT INTO public.gigs (id, mentor_id, category_id, segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_published, created_at) VALUES
('gig-rahul-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'relationship', '00000000-0000-0000-0000-000000000001', 'Intercultural Couple Alignment & Boundary Architecture', 'intercultural-couple-alignment-roadmap', 'Navigate tradition, family expectations, and personal values without compromising personal sovereignty.', 45, 3400, ARRAY['45-min strategic alignment consultation', 'Values conflict matrix', 'Family communication guide'], true, '2024-11-01T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Dr. Sophia Vance Gigs (Relationship)
INSERT INTO public.gigs (id, mentor_id, category_id, segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_published, created_at) VALUES
('gig-sophia-001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'relationship', '00000000-0000-0000-0000-000000000001', 'Anxious-Avoidant Trap Resolution & Attachment Calibration', 'anxious-avoidant-trap-resolution', 'Understand how nervous system activation drives withdraw-pursue cycles and rewire your relational response.', 45, 4200, ARRAY['45-min attachment breakdown', 'De-triggering audio playbook', 'Secure communication scripts'], true, '2024-09-20T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Maya Sen Gigs (Relationship)
INSERT INTO public.gigs (id, mentor_id, category_id, segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_published, created_at) VALUES
('gig-maya-001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'relationship', '00000000-0000-0000-0000-000000000001', 'High-Stakes Family & Estate Communication Protocol', 'high-stakes-family-estate-protocol', 'Empirical mediation for complex interpersonal dynamics, family business governance, and legacy alignment.', 45, 3600, ARRAY['45-min family systems audit', 'Communication agenda protocol', 'Neutral negotiation rules'], true, '2024-11-15T12:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- David Kaufman Gigs (Relationship)
INSERT INTO public.gigs (id, mentor_id, category_id, segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_published, created_at) VALUES
('gig-david-001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'relationship', '00000000-0000-0000-0000-000000000001', 'Collaborative Co-Parenting & Transition Architecture', 'collaborative-co-parenting-transition', 'Design child-centered schedules, mutual conflict rules, and friction-free communication routines.', 45, 4000, ARRAY['45-min strategy session', 'Co-parenting calendar protocol', 'Direct communication template'], true, '2024-10-05T09:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Arjun Kapoor Gigs (Career)
INSERT INTO public.gigs (id, mentor_id, category_id, segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_published, created_at) VALUES
('gig-arjun-001', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'career', '00000000-0000-0000-0000-000000000002', 'Director to VP of Engineering Leadership Roadmap', 'director-to-vp-engineering-roadmap', 'Transition from managing managers to driving company-level technology strategy and executive presence.', 45, 4500, ARRAY['45-min executive teardown', 'Org structure matrix', 'Executive presentation blueprint'], true, '2024-10-22T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Rachel Zhao Gigs (Career)
INSERT INTO public.gigs (id, mentor_id, category_id, segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_published, created_at) VALUES
('gig-rachel-001', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'career', '00000000-0000-0000-0000-000000000002', 'Product Leadership Strategy & C-Suite Narrative Calibration', 'product-leadership-csuite-narrative', 'Audit your product vision, metrics deck, and cross-functional influence to break into VP of Product roles.', 45, 4400, ARRAY['45-min product strategy teardown', 'Product narrative template', 'Executive stakeholder rubric'], true, '2024-10-10T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Vikram Singh Gigs (Career)
INSERT INTO public.gigs (id, mentor_id, category_id, segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_published, created_at) VALUES
('gig-vikram-s-001', '10101010-1010-1010-1010-101010101010', 'career', '00000000-0000-0000-0000-000000000002', 'First-Time Founder to High-Performance CEO Strategy', 'founder-to-ceo-performance-strategy', 'Establish executive delegation systems, board reporting frameworks, and sustainable CEO operating cadences.', 45, 3900, ARRAY['45-min operational teardown', 'CEO weekly operating template', 'Board memo rubric'], true, '2024-11-06T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Elena Moreno Gigs (Career)
INSERT INTO public.gigs (id, mentor_id, category_id, segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_published, created_at) VALUES
('gig-elena-m-001', '12121212-1212-1212-1212-121212121212', 'career', '00000000-0000-0000-0000-000000000002', 'Chief of Staff Mastery & C-Suite Leverage Acceleration', 'chief-of-staff-mastery-acceleration', 'Level up your impact as the CEO strategic right hand and build a launchpad for GM/VP roles.', 45, 3500, ARRAY['45-min strategic leverage audit', 'Executive operating cadence doc', 'Strategic project prioritization framework'], true, '2024-11-15T09:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Dr. Charlotte Weber Gigs (Mental Health)
INSERT INTO public.gigs (id, mentor_id, category_id, segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_published, created_at) VALUES
('gig-charlotte-001', '13131313-1313-1313-1313-131313131313', 'mental-health', '00000000-0000-0000-0000-000000000003', 'Acute Anxiety De-escalation & Nervous System Reset', 'acute-anxiety-deescalation-reset', 'Clinically proven interoceptive and cognitive tools to neutralize acute panic triggers and reclaim cognitive calm.', 45, 4100, ARRAY['45-min clinical reset session', 'Cognitive distortion reframe sheet', 'Emergency grounding audio track'], true, '2024-09-25T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Dr. Aravind Nair Gigs (Mental Health)
INSERT INTO public.gigs (id, mentor_id, category_id, segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_published, created_at) VALUES
('gig-aravind-001', '14141414-1414-1414-1414-141414141414', 'mental-health', '00000000-0000-0000-0000-000000000003', 'Somatic Nervous System Calibration & Circadian Reset', 'somatic-nervous-system-calibration', 'Comprehensive assessment of nervous system fatigue markers and personalized biological sleep/recovery protocol.', 45, 4500, ARRAY['45-min clinical psychiatric consult', 'Circadian & sleep architecture blueprint', 'HRV & autonomic recovery guide'], true, '2024-10-20T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Dr. Leila Kassir Gigs (Mental Health)
INSERT INTO public.gigs (id, mentor_id, category_id, segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_published, created_at) VALUES
('gig-leila-001', '15151515-1515-1515-1515-151515151515', 'mental-health', '00000000-0000-0000-0000-000000000003', 'Executive Focus Restoration & Dopaminergic Reset Protocol', 'executive-focus-restoration-reset', 'Rebuild sustained deep focus capacity and eliminate compulsive attention switching in high-stress work.', 45, 3700, ARRAY['45-min cognitive focus assessment', 'Dopamine detox roadmap', '30-day deep work block architecture'], true, '2024-11-08T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Dr. Marcus Brooks Gigs (Mental Health)
INSERT INTO public.gigs (id, mentor_id, category_id, segment_id, title, slug, description, duration_minutes, price_inr, deliverables, is_published, created_at) VALUES
('gig-marcus-b-001', '16161616-1616-1616-1616-161616161616', 'mental-health', '00000000-0000-0000-0000-000000000003', 'Imposter Syndrome & Perfectionism Deconstruction', 'imposter-syndrome-perfectionism-deconstruction', 'Empirical psychotherapy protocols to unpack deep-seated imposter phenomenon and perfectionistic paralysis.', 45, 3900, ARRAY['45-min clinical psychology session', 'Cognitive restructuring worksheet', 'Behavioral activation protocol'], true, '2024-10-28T11:00:00Z')
ON CONFLICT (id) DO NOTHING;
