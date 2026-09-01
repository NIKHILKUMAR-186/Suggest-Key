-- ==============================================================================
-- SEED DATA PART 3: Bookings, Conversations, Messages, Reviews
-- Description: Contains all demo booking, messaging, and review data.
-- ==============================================================================

-- ==============================================================================
-- BOOKINGS (Demo bookings)
-- ==============================================================================
INSERT INTO public.bookings (id, gig_id, mentor_id, seeker_id, segment_id, start_time, end_time, status, amount_inr, platform_fee_inr, mentor_payout_inr, meeting_url, notes, is_anonymous, is_demo, created_at) VALUES
('bk-001', 'gig-evelyn-001', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000003', '2026-09-02T10:00:00Z', '2026-09-02T10:45:00Z', 'confirmed', 3500, 525, 2975, 'https://meet.google.com/xyz-eval-burnout', 'Facing acute decision fatigue after Series A close. Need empirical cognitive restructuring protocol before board meeting next week.', false, true, '2026-08-28T14:30:00Z'),
('bk-002', 'gig-marcus-002', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', '2026-09-05T14:30:00Z', '2026-09-05T15:15:00Z', 'confirmed', 4500, 675, 3825, 'https://meet.google.com/abc-arch-stream', 'Validating our event-driven stream partitioning before 10x traffic spike. Need distributed lock audit.', true, true, '2026-08-29T09:15:00Z'),
('bk-003', 'gig-sarah-001', '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', '2026-08-20T16:00:00Z', '2026-08-20T16:45:00Z', 'completed', 5000, 750, 4250, 'https://meet.google.com/vc-pitch-review', 'Pre-seed deck audit for B2B AI observability tool.', false, true, '2026-08-15T11:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- CONVERSATIONS (Demo conversations linked to bookings)
-- ==============================================================================
INSERT INTO public.conversations (id, booking_id, seeker_id, mentor_id, segment_id, last_message_at, is_demo, created_at) VALUES
('conv-001', 'bk-001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000003', '2026-08-30T14:15:00Z', true, '2026-08-28T14:30:00Z'),
('conv-002', 'bk-002', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000002', '2026-08-29T18:00:00Z', true, '2026-08-29T09:15:00Z'),
('conv-003', 'bk-003', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000002', '2026-08-21T10:30:00Z', true, '2026-08-15T11:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- MESSAGES (Demo messages)
-- ==============================================================================

-- Conversation 1: Evelyn Vasquez & Alex Rivera
INSERT INTO public.messages (id, conversation_id, sender_id, content, attachments, created_at) VALUES
('msg-001', 'conv-001', '11111111-1111-1111-1111-111111111111', 'Hi Dr. Vasquez, I booked the 45m Executive Crossroads session for tomorrow. Looking forward to structuring actionable mental recovery steps.', '[]'::jsonb, '2026-08-30T11:20:00Z'),
('msg-002', 'conv-001', '22222222-2222-2222-2222-222222222222', 'Hello Alex. Welcome. I have prepared our clinical framework. I have attached the cognitive restructuring matrix ahead of our 10 AM session tomorrow.', '[{"name": "Burnout_Cognitive_Assessment_Matrix.pdf", "url": "#", "size": "1.4 MB"}]'::jsonb, '2026-08-30T14:15:00Z')
ON CONFLICT (id) DO NOTHING;

-- Conversation 2: Marcus Thorne & Alex Rivera (Anonymous)
INSERT INTO public.messages (id, conversation_id, sender_id, content, attachments, created_at) VALUES
('msg-003', 'conv-002', '11111111-1111-1111-1111-111111111111', 'Hi Marcus, excited for our architecture teardown on Friday. We are dealing with high tail latency during peak message ingestion.', '[]'::jsonb, '2026-08-29T16:00:00Z'),
('msg-004', 'conv-002', '44444444-4444-4444-4444-444444444444', 'Please send over your partition topology diagram before Friday so I can prepare notes.', '[]'::jsonb, '2026-08-29T18:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Conversation 3: Sarah Jenkins & Alex Rivera
INSERT public.messages (id, conversation_id, sender_id, content, attachments, created_at) VALUES
('msg-005', 'conv-003', '55555555-5555-5555-5555-555555555555', 'Great session last week! Let me know if you need an intro to the fintech syndicate.', '[]'::jsonb, '2026-08-21T10:30:00Z')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- REVIEWS (Demo reviews)
-- ==============================================================================
INSERT INTO public.reviews (id, booking_id, seeker_id, mentor_id, gig_id, rating, rating_expertise, rating_communication, rating_actionability, comment, mentor_response, mentor_response_at, is_anonymous, is_demo, created_at) VALUES
('rev-001', 'bk-003', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'gig-sarah-001', 5, 5, 5, 5, 'Sarah dismantled our series A deck structure in the first 15 minutes and restructured our unit economics narrative. Her critique of our customer acquisition cohorts gave us complete conviction before meeting institutional investors.', 'Thank you Alex! Your retention curves were already world-class; you just needed to lead with net dollar expansion. Best of luck closing the round.', '2026-08-21T14:30:00Z', false, true, '2026-08-21T11:00:00Z'),
('rev-002', 'bk-002', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'gig-marcus-002', 5, 5, 4, 5, 'Marcus identified an insidious distributed deadlock risk in our Kafka consumer group rebalance logic that had evaded two internal audits. Highest signal-to-noise consultation I have experienced.', NULL, NULL, true, true, '2026-08-18T16:20:00Z'),
('rev-003', 'bk-001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'gig-evelyn-001', 5, 5, 5, 5, 'Dr. Vasquez operates at a rare intersection of clinical rigor and practical executive reality. She provided a structured cognitive restructuring protocol that stopped a spiral of chronic decision fatigue within 48 hours.', NULL, NULL, false, true, '2026-08-10T09:45:00Z')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- Additional reviews for other advisors (from seedData.ts)
-- ==============================================================================
INSERT INTO public.reviews (id, booking_id, seeker_id, mentor_id, gig_id, rating, rating_expertise, rating_communication, rating_actionability, comment, is_anonymous, is_demo, created_at) VALUES
('rev-004', 'bk-prev-001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'gig-evelyn-001', 5, 5, 5, 5, 'Dr. Vasquez cut through 6 months of mental fog in 45 minutes. Her clinical grounding made every minute actionable. I walked away with clarity on my executive exit roadmap that saved my sanity.', false, true, '2025-02-14T18:30:00Z'),
('rev-005', 'bk-prev-002', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'gig-evelyn-002', 5, 5, 5, 5, 'Zero superficial coaching fluff. She immediately identified where my decision fatigue was coming from and gave me concrete behavioral frameworks for boundary enforcement.', false, true, '2025-02-02T11:15:00Z'),
('rev-006', 'bk-prev-003', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'gig-alistair-001', 5, 5, 5, 5, 'Dr. Chen transformed our communication patterns in two sessions. His Gottman-backed framework gave us exact language to stop escalating arguments.', false, true, '2025-02-16T17:00:00Z'),
('rev-007', 'bk-prev-004', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'gig-alistair-002', 5, 5, 5, 5, 'Incredible depth and zero judgment. He helped us navigate severe relocation and career friction while strengthening our bond.', false, true, '2025-01-25T14:30:00Z'),
('rev-008', 'bk-prev-005', '11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'gig-priya-001', 5, 5, 5, 5, 'Priya gave me the exact scripts I needed to navigate high-friction family demands without causing an explosion. Life-changing session.', false, true, '2025-02-10T11:00:00Z'),
('rev-009', 'bk-prev-006', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'gig-marcus-001', 5, 5, 5, 5, 'Marcus helped me structure my Staff+ promotion packet and navigate cross-team alignment. I got promoted to Principal Engineer the following cycle.', false, true, '2025-02-18T14:20:00Z'),
('rev-010', 'bk-prev-007', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'gig-sarah-002', 5, 5, 5, 5, 'Sarah negotiation scripts helped me negotiate an additional 25% in equity and a favorable acceleration clause on my VP offer.', false, true, '2025-02-12T15:40:00Z'),
('rev-011', 'bk-prev-008', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'gig-vikram-001', 5, 5, 5, 5, 'Dr. Patel gave me practical neuro-cognitive techniques that eliminated my panic response during high-stakes presentations.', false, true, '2025-02-15T09:40:00Z')
ON CONFLICT (id) DO NOTHING;
