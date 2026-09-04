import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PublicNav } from '../../components/navigation/PublicNav';
import { AdvisorService } from '../../domains/advisor/AdvisorService';
import { useAuth } from '../../domains/auth/AuthContext';

export const AdvisorProfilePage: React.FC = () => {
  const { advisorId } = useParams<{ advisorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!advisorId) return;

    const redirect = async () => {
      if (user) {
        const advisor = await AdvisorService.getAdvisorById(advisorId);
        if (!advisor) {
          navigate('/explore', { replace: true });
          return;
        }
      }

      navigate(`/mentor/${advisorId}`, { replace: true });
    };

    redirect();
  }, [advisorId, navigate, user]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between">
      <PublicNav />
      <div className="flex-1 flex items-center justify-center pt-24">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#8052ff] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-wider text-[#9a9a9a]">
            Redirecting to profile…
          </p>
        </div>
      </div>
    </div>
  );
};
