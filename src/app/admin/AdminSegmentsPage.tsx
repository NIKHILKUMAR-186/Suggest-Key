import React, { useState, useEffect } from 'react';
import { useToast } from '../../components/ui/Toast';
import { AdvisorySegment } from '../../domains/segment/SegmentTypes';
import { SegmentService } from '../../domains/segment/SegmentService';
import {
  Layers,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Heart,
  Briefcase,
  Brain,
  Coins,
  GraduationCap,
  Scale,
  Compass,
  Building2,
  TrendingUp,
  Globe,
  Users,
  Eye,
  AlertTriangle,
  X,
  Save,
  Check,
  ShieldCheck,
  Calendar,
  DollarSign,
  Tag,
} from 'lucide-react';

const ICON_OPTIONS = [
  { name: 'Sparkles', icon: Sparkles, label: 'Sparkles (General)' },
  { name: 'Heart', icon: Heart, label: 'Heart (Relationship/Wellness)' },
  { name: 'Briefcase', icon: Briefcase, label: 'Briefcase (Career/Work)' },
  { name: 'Brain', icon: Brain, label: 'Brain (Mental Health/Cognition)' },
  { name: 'Coins', icon: Coins, label: 'Coins (Finance/Wealth)' },
  { name: 'GraduationCap', icon: GraduationCap, label: 'Graduation Cap (Education)' },
  { name: 'Scale', icon: Scale, label: 'Scale (Legal/Compliance)' },
  { name: 'Compass', icon: Compass, label: 'Compass (Life Guidance)' },
  { name: 'Building2', icon: Building2, label: 'Building (Real Estate/Corporate)' },
  { name: 'TrendingUp', icon: TrendingUp, label: 'Trending Up (Startup/Growth)' },
  { name: 'Globe', icon: Globe, label: 'Globe (International/Language)' },
  { name: 'Users', icon: Users, label: 'Users (Community/Leadership)' },
];

const ICON_MAP: Record<string, React.ComponentType<any>> = Object.fromEntries(
  ICON_OPTIONS.map((opt) => [opt.name, opt.icon])
);

const PRESET_ACCENTS = [
  { label: 'Purple Accent', value: '#8052ff' },
  { label: 'Amber Gold', value: '#ffb829' },
  { label: 'Emerald Teal', value: '#15846e' },
  { label: 'Ocean Blue', value: '#3b82f6' },
  { label: 'Rose Pink', value: '#ec4899' },
  { label: 'Mint Green', value: '#10b981' },
  { label: 'Sunset Orange', value: '#f97316' },
  { label: 'Indigo', value: '#6366f1' },
];

export const AdminSegmentsPage: React.FC = () => {
  const [segments, setSegments] = useState<AdvisorySegment[]>([]);
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingSegment, setEditingSegment] = useState<AdvisorySegment | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formFullDesc, setFormFullDesc] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formIcon, setFormIcon] = useState('Sparkles');
  const [formAccent, setFormAccent] = useState('#8052ff');
  const [formBadge, setFormBadge] = useState('');
  const [formAudience, setFormAudience] = useState('');
  const [formAdvisorTypes, setFormAdvisorTypes] = useState('');
  const [formUseCases, setFormUseCases] = useState<string[]>([]);
  const [newUseCaseInput, setNewUseCaseInput] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState(1);
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const all = await SegmentService.getAllSegments(true);
      setSegments(all);

      // Load metrics for each segment
      const metricsMap: Record<string, any> = {};
      for (const s of all) {
        metricsMap[s.id] = await SegmentService.getSegmentMetrics(s.id);
      }
      setMetrics(metricsMap);
    } catch (err) {
      console.error('Failed to load segments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingSegment(null);
    setFormName('');
    setFormSlug('');
    setFormShortDesc('');
    setFormFullDesc('');
    setFormTagline('');
    setFormIcon('Sparkles');
    setFormAccent('#8052ff');
    setFormBadge('');
    setFormAudience('');
    setFormAdvisorTypes('');
    setFormUseCases([
      'Strategic 1:1 guidance and problem decomposition',
      'Targeted action plans with actionable milestones',
      'Confidential domain review and credentialed feedback',
    ]);
    setNewUseCaseInput('');
    setFormDisplayOrder(segments.length + 1);
    setFormIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (segment: AdvisorySegment) => {
    setEditingSegment(segment);
    setFormName(segment.name);
    setFormSlug(segment.slug);
    setFormShortDesc(segment.short_description || '');
    setFormFullDesc(segment.description || segment.short_description || '');
    setFormTagline(segment.tagline || '');
    setFormIcon(segment.icon || 'Sparkles');
    setFormAccent(segment.accent || '#8052ff');
    setFormBadge(segment.badge || segment.credentialBadgeLabel || '');
    setFormAudience(segment.audience || '');
    setFormAdvisorTypes(segment.advisor_types || '');
    setFormUseCases(
      Array.isArray(segment.use_cases) && segment.use_cases.length > 0
        ? segment.use_cases
        : ['Targeted action plans with actionable milestones']
    );
    setNewUseCaseInput('');
    setFormDisplayOrder(segment.display_order ?? 0);
    setFormIsActive(segment.is_active);
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingSegment) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormSlug(generatedSlug);
    }
  };

  const handleAddUseCase = () => {
    if (newUseCaseInput.trim()) {
      setFormUseCases([...formUseCases, newUseCaseInput.trim()]);
      setNewUseCaseInput('');
    }
  };

  const handleRemoveUseCase = (index: number) => {
    setFormUseCases(formUseCases.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Segment Name and Slug are required.',
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingSegment) {
        const updated = await SegmentService.updateSegment(editingSegment.id, {
          name: formName.trim(),
          slug: formSlug.trim(),
          short_description: formShortDesc.trim(),
          description: formFullDesc.trim() || formShortDesc.trim(),
          tagline: formTagline.trim(),
          icon: formIcon,
          accent: formAccent,
          badge: formBadge.trim(),
          audience: formAudience.trim(),
          advisor_types: formAdvisorTypes.trim(),
          use_cases: formUseCases,
          display_order: Number(formDisplayOrder),
          is_active: formIsActive,
        });

        if (updated) {
          toast({
            title: 'Advisory Segment Updated',
            description: `"${updated.name}" changes saved to the platform database.`,
          });
        }
      } else {
        const created = await SegmentService.createSegment({
          name: formName.trim(),
          slug: formSlug.trim(),
          short_description: formShortDesc.trim(),
          description: formFullDesc.trim() || formShortDesc.trim(),
          tagline: formTagline.trim(),
          icon: formIcon,
          accent: formAccent,
          badge: formBadge.trim(),
          audience: formAudience.trim(),
          advisor_types: formAdvisorTypes.trim(),
          use_cases: formUseCases,
          display_order: Number(formDisplayOrder),
          is_active: formIsActive,
        });

        if (created) {
          toast({
            title: 'New Advisory Segment Created',
            description: `"${created.name}" is now live in the platform database.`,
          });
        }
      }

      setModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Error saving segment', err);
      toast({
        title: 'Save Failed',
        description: 'Could not write segment to database.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (segment: AdvisorySegment) => {
    const nextStatus = !segment.is_active;
     const updated = await SegmentService.toggleSegmentActive(segment.id);
    if (updated) {
      setSegments((prev) => prev.map((s) => (s.id === segment.id ? updated : s)));
      toast({
        title: nextStatus ? 'Segment Activated' : 'Segment Deactivated (Soft Archive)',
        description: nextStatus
          ? `"${segment.name}" is now active in discovery and seeker navigation.`
          : `"${segment.name}" hidden from discovery. All historical bookings & specialist profiles preserved safely.`,
      });
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === segments.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...segments];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    // Reassign display_order
    const updated = reordered.map((item, idx) => ({
      ...item,
      display_order: idx + 1,
    }));

    setSegments(updated);

    const orderedIds = updated.map((s) => s.id);
    await SegmentService.reorderSegments(orderedIds);

    toast({
      title: 'Segment Display Order Updated',
      description: 'The new order has been synced across seeker navigation.',
    });
  };

  const totalActive = segments.filter((s) => s.is_active).length;
  const totalSpecialistsCount = Object.values(metrics).reduce(
    (sum: number, m: any) => sum + (m?.totalAdvisorsCount || 0),
    0
  );
  const totalBookingsCount = Object.values(metrics).reduce(
    (sum: number, m: any) => sum + (m?.totalBookingsCount || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2 pb-6 border-b border-white/5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-widest text-[#8052ff] font-semibold px-2.5 py-0.5 rounded-full bg-[#8052ff]/10 border border-[#8052ff]/20">
              Taxonomy & Domain Engine
            </span>
            <span className="text-[11px] uppercase tracking-widest text-[#15846e] font-semibold px-2.5 py-0.5 rounded-full bg-[#15846e]/10 border border-[#15846e]/20">
              Database Source of Truth
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-normal text-white tracking-tight mt-2">
            Advisory Segments Management
          </h1>
          <p className="text-sm text-[#9a9a9a] max-w-3xl leading-relaxed">
            Create, edit, activate/deactivate, and reorder dynamic advisory domains in real time. The seeker segment switcher, educational introduction modules, and discovery carousels query directly from this live database schema.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-[#8052ff] hover:bg-[#6c3df0] text-white rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Advisory Segment</span>
        </button>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-2">
          <div className="flex items-center justify-between text-[#9a9a9a]">
            <span className="text-xs uppercase tracking-wider">Active Advisory Domains</span>
            <Layers className="w-4 h-4 text-[#8052ff]" />
          </div>
          <div className="text-3xl font-medium text-white">
            {totalActive} <span className="text-sm text-[#707070] font-normal">/ {segments.length} total</span>
          </div>
          <p className="text-[11px] text-[#9a9a9a]">Published live to seeker navigation</p>
        </div>

        <div className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-2">
          <div className="flex items-center justify-between text-[#9a9a9a]">
            <span className="text-xs uppercase tracking-wider">Assigned Specialists</span>
            <ShieldCheck className="w-4 h-4 text-[#15846e]" />
          </div>
          <div className="text-3xl font-medium text-[#15846e]">
            {totalSpecialistsCount}
          </div>
          <p className="text-[11px] text-[#9a9a9a]">Audited practitioners across segments</p>
        </div>

        <div className="p-6 rounded-[24px] border border-white/10 bg-white/[0.02] space-y-2">
          <div className="flex items-center justify-between text-[#9a9a9a]">
            <span className="text-xs uppercase tracking-wider">Total Segment Bookings</span>
            <Calendar className="w-4 h-4 text-[#ffb829]" />
          </div>
          <div className="text-3xl font-medium text-[#ffb829]">
            {totalBookingsCount}
          </div>
          <p className="text-[11px] text-[#9a9a9a]">Atomic completed and active sessions</p>
        </div>
      </div>

      {/* Segments Directory & Management Table */}
      <div className="rounded-[24px] border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.01]">
          <div>
            <h2 className="text-lg font-medium text-white">Live Advisory Segments</h2>
            <p className="text-xs text-[#9a9a9a]">
              Order controls determine tab ranking on the seeker workspace and discovery index.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#9a9a9a] flex items-center justify-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-[#8052ff] border-t-transparent animate-spin" />
            <span>Connecting to advisory segment records...</span>
          </div>
        ) : segments.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#9a9a9a] space-y-3">
            <p>No advisory segments found in the database.</p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-full bg-[#8052ff] text-white text-xs font-semibold uppercase"
            >
              Create Seed Segment
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {segments.map((segment, index) => {
              const segMetrics = metrics[segment.id] || {
                totalAdvisorsCount: 0,
                activeAdvisorsCount: 0,
                totalBookingsCount: 0,
                totalRevenueInr: 0,
              };

              const seg = SegmentService.getCachedSegmentBySlug(segment.slug);
              const IconComp = ICON_MAP[segment.icon || 'Sparkles'] || Sparkles;

              return (
                <div
                  key={segment.id}
                  className={`p-6 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                    segment.is_active ? 'hover:bg-white/[0.01]' : 'bg-white/[0.005] opacity-60'
                  }`}
                >
                  {/* Left Column: Reorder + Icon + Basic Info */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Order Controls */}
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <button
                        onClick={() => handleMoveOrder(index, 'up')}
                        disabled={index === 0}
                        title="Move Up"
                        className={`p-1.5 rounded-lg border border-white/5 transition-all ${
                          index === 0
                            ? 'text-white/20 cursor-not-allowed'
                            : 'text-[#9a9a9a] hover:text-white hover:bg-white/10 active:scale-95'
                        }`}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono text-[#707070] font-semibold">
                        #{index + 1}
                      </span>
                      <button
                        onClick={() => handleMoveOrder(index, 'down')}
                        disabled={index === segments.length - 1}
                        title="Move Down"
                        className={`p-1.5 rounded-lg border border-white/5 transition-all ${
                          index === segments.length - 1
                            ? 'text-white/20 cursor-not-allowed'
                            : 'text-[#9a9a9a] hover:text-white hover:bg-white/10 active:scale-95'
                        }`}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Segment Icon */}
                    <div
                      className="w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${segment.accent}15`,
                        borderColor: `${segment.accent}30`,
                      }}
                    >
                      <IconComp className="w-6 h-6" style={{ color: segment.accent }} />
                    </div>

                    {/* Name & Content */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-base font-medium text-white">{segment.name}</h3>
                        <span className="text-[11px] font-mono text-[#707070] px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                          slug: {segment.slug}
                        </span>

                        <span
                          className={`text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded-full border ${
                            segment.is_active
                              ? 'text-[#15846e] border-[#15846e]/30 bg-[#15846e]/10'
                              : 'text-[#9a9a9a] border-white/10 bg-white/5'
                          }`}
                        >
                          {segment.is_active ? 'Active' : 'Inactive / Archived'}
                        </span>

                        {segment.badge && (
                          <span
                            className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border"
                            style={{
                              color: segment.accent,
                              borderColor: `${segment.accent}40`,
                              backgroundColor: `${segment.accent}10`,
                            }}
                          >
                            {segment.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#bdbdbd] max-w-2xl leading-relaxed">
                        {segment.short_description}
                      </p>

                      {/* Use Cases tags */}
                      {Array.isArray(segment.use_cases) && segment.use_cases.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {segment.use_cases.slice(0, 3).map((uc, i) => (
                            <span
                              key={i}
                              className="text-[10px] text-[#9a9a9a] px-2 py-0.5 rounded-full bg-white/[0.02] border border-white/5"
                            >
                              • {uc}
                            </span>
                          ))}
                          {segment.use_cases.length > 3 && (
                            <span className="text-[10px] text-[#707070] px-2 py-0.5">
                              +{segment.use_cases.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Dynamic Metrics & Controls */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/5">
                    {/* Metrics Badges */}
                    <div className="flex items-center gap-4 text-xs bg-white/[0.02] px-4 py-2 rounded-xl border border-white/5">
                      <div>
                        <span className="text-[10px] text-[#707070] block uppercase">Specialists</span>
                        <span className="font-semibold text-white font-mono">
                          {segMetrics.totalAdvisorsCount}
                        </span>
                      </div>
                      <div className="h-6 w-px bg-white/10" />
                      <div>
                        <span className="text-[10px] text-[#707070] block uppercase">Bookings</span>
                        <span className="font-semibold text-white font-mono">
                          {segMetrics.totalBookingsCount}
                        </span>
                      </div>
                      <div className="h-6 w-px bg-white/10" />
                      <div>
                        <span className="text-[10px] text-[#707070] block uppercase">Revenue</span>
                        <span className="font-semibold text-[#15846e] font-mono">
                          ₹{(segMetrics.totalRevenueInr || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(segment)}
                        className="px-3.5 py-1.5 rounded-full border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-xs text-white font-medium flex items-center gap-1.5 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#8052ff]" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleToggleStatus(segment)}
                        className={`px-3.5 py-1.5 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all ${
                          segment.is_active
                            ? 'border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                            : 'border-[#15846e]/30 bg-[#15846e]/10 text-[#15846e] hover:bg-[#15846e]/20'
                        }`}
                      >
                        {segment.is_active ? (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Deactivate</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Activate</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Advisory Segment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#121212] border border-white/15 rounded-[28px] p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${formAccent}20` }}
                  >
                    <Sparkles className="w-3.5 h-3.5" style={{ color: formAccent }} />
                  </div>
                  <h2 className="text-xl font-normal text-white">
                    {editingSegment ? 'Edit Advisory Segment' : 'Create New Advisory Segment'}
                  </h2>
                </div>
                <p className="text-xs text-[#9a9a9a]">
                  This record is stored in Supabase table `advisory_segments` and drives all seeker UI flows dynamically.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full text-[#9a9a9a] hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Segment Name */}
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">
                    Segment Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Financial Planning"
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#707070] focus:outline-none focus:border-[#8052ff]"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">
                    Slug / URL Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. financial-planning"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#707070] font-mono focus:outline-none focus:border-[#8052ff]"
                  />
                </div>
              </div>

              {/* Tagline */}
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">
                  Tagline (One-sentence educational premise)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fiduciary wealth advisory, tax modeling, and capital allocation frameworks."
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#707070] focus:outline-none focus:border-[#8052ff]"
                />
              </div>

              {/* Short Description */}
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">
                  Short Description (Switcher & Discovery preview) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Concise educational summary explaining what this advisory segment covers..."
                  value={formShortDesc}
                  onChange={(e) => setFormShortDesc(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-[#707070] focus:outline-none focus:border-[#8052ff]"
                />
              </div>

              {/* Visual Icon & Accent Color Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Icon Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">
                    Domain Icon
                  </label>
                  <select
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#8052ff]"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.name} value={opt.name}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Accent Color */}
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">
                    Theme Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formAccent}
                      onChange={(e) => setFormAccent(e.target.value)}
                      className="w-9 h-9 rounded-lg bg-transparent border border-white/20 cursor-pointer p-0.5"
                    />
                    <select
                      value={formAccent}
                      onChange={(e) => setFormAccent(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      {PRESET_ACCENTS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label} ({p.value})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Audience & Advisor Types */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">
                    Target Audience / Who is it for?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Salaried tech professionals & founders"
                    value={formAudience}
                    onChange={(e) => setFormAudience(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#707070] focus:outline-none focus:border-[#8052ff]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">
                    Specialist Types / Required Licensing
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Certified Financial Planners (CFP), SEBI RIA"
                    value={formAdvisorTypes}
                    onChange={(e) => setFormAdvisorTypes(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#707070] focus:outline-none focus:border-[#8052ff]"
                  />
                </div>
              </div>

              {/* Badge Label */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">
                    Audit Badge Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SEBI & Fiduciary Audited"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#707070] focus:outline-none focus:border-[#8052ff]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">
                    Display Order Index
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#8052ff]"
                  />
                </div>
              </div>

              {/* Interactive Use Cases List */}
              <div className="space-y-2 pt-1">
                <label className="text-xs uppercase tracking-wider text-[#9a9a9a]">
                  What can this advisory segment help with? (Bullet points)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a problem or situation covered (e.g. Navigating dual-income tax brackets)"
                    value={newUseCaseInput}
                    onChange={(e) => setNewUseCaseInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddUseCase();
                      }
                    }}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-[#707070] focus:outline-none focus:border-[#8052ff]"
                  />
                  <button
                    type="button"
                    onClick={handleAddUseCase}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold uppercase"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {formUseCases.map((uc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-[#bdbdbd]"
                    >
                      <span>• {uc}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveUseCase(i)}
                        className="text-[#707070] hover:text-rose-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-white">Segment Publication Status</div>
                  <div className="text-[11px] text-[#9a9a9a]">
                    When active, this domain appears across seeker discovery and the segment switcher.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded bg-white/10 border-white/20 text-[#8052ff] focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-white/10 hover:bg-white/5 text-xs font-semibold text-[#9a9a9a] uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-full bg-[#8052ff] hover:bg-[#6c3df0] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? 'Saving to Database...' : editingSegment ? 'Save Changes' : 'Create Segment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
