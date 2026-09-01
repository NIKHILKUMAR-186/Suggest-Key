import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PublicNav } from '../../components/navigation/PublicNav';
import { AdvisorService } from '../../domains/advisor/AdvisorService';
import { Category } from '../../lib/supabase/types';
import { AdvisorDetail } from '../../domains/advisor/AdvisorService';
import { AdvisorEditorialCard } from '../../components/advisor/AdvisorEditorialCard';
import { SegmentIntroduction } from '../../components/segment/SegmentIntroduction';
import {
  ArrowLeft,
  ShieldCheck,
  Brain,
  Briefcase,
  Heart,
  Compass,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export const CategoryExplorePage: React.FC = () => {
  const { category: categorySlug } = useParams<{ category: string }>();
  const navigate = useNavigate();

  const [category, setCategory] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [advisors, setAdvisors] = useState<AdvisorDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategoryData = async () => {
      setLoading(true);
      if (!categorySlug) return;

      const [cat, allCats, advs] = await Promise.all([
        AdvisorService.getCategoryBySlug(categorySlug),
        AdvisorService.getCategories(),
        AdvisorService.getAdvisors({ categoryId: categorySlug }),
      ]);

      setCategory(cat);
      setAllCategories(allCats);
      setAdvisors(advs);
      setLoading(false);
    };

    loadCategoryData();
  }, [categorySlug]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#8052ff] selection:text-white flex flex-col justify-between">
      <PublicNav />

      <main className="w-full pt-28 pb-24 px-6 max-w-[1280px] mx-auto flex-1 space-y-12">
        {/* Back Link */}
        <div>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#9a9a9a] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Domains</span>
          </Link>
        </div>

        {/* Educational Domain Introduction & Context */}
        <SegmentIntroduction segment={categorySlug || 'all'} showTransitionBanner={false} />

        {/* Category Navigation Pills */}
        <div className="space-y-3 pt-2">
          <span className="text-[11px] uppercase tracking-widest text-[#9a9a9a] font-semibold block">
            Switch Advisory Domain
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {allCategories.map((c) => {
              const isCurrent = c.slug === categorySlug;
              return (
                <Link
                  key={c.id}
                  to={`/explore/${c.slug}`}
                  className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shrink-0 ${
                    isCurrent
                      ? 'bg-[#8052ff] text-white shadow-sm shadow-[#8052ff]/30'
                      : 'bg-white/5 hover:bg-white/10 text-[#9a9a9a] hover:text-white border border-white/5'
                  }`}
                >
                  {c.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Advisors in Category Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/5 text-xs text-[#9a9a9a]">
            <span>
              Showing <strong className="text-white">{advisors.length}</strong> audited advisors in{' '}
              <span className="text-white font-medium">{category?.name}</span>
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#8052ff] border-t-transparent animate-spin mx-auto" />
              <p className="text-xs uppercase tracking-wider text-[#9a9a9a]">Loading Specialists...</p>
            </div>
          ) : advisors.length === 0 ? (
            <div className="p-12 rounded-[28px] border border-white/10 bg-white/[0.015] text-center space-y-4">
              <h3 className="text-lg font-medium text-white">No advisors currently listed in this category</h3>
              <p className="text-xs text-[#9a9a9a] max-w-sm mx-auto">
                Our operations team is actively auditing candidates for this domain.
              </p>
              <Link
                to="/explore"
                className="inline-block px-6 py-2.5 bg-[#8052ff] hover:bg-[#6c3df0] text-white rounded-full text-xs font-semibold uppercase tracking-wider"
              >
                Browse Other Domains
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advisors.map((adv) => (
                <AdvisorEditorialCard key={adv.id} advisor={adv} categorySlug={categorySlug} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-xs text-[#9a9a9a]">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>Suggest Key • Audited 1:1 Human Intelligence Directory</span>
          <div className="flex items-center gap-3">
            <Link to="/explore" className="hover:text-white">All Domains</Link>
            <span>•</span>
            <Link to="/signup?role=mentor" className="hover:text-white">Become an Advisor</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
