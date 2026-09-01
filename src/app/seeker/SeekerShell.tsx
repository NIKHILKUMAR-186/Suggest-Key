import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardShell } from '../layout/DashboardShell';
import { PrimarySegmentSwitcher } from '../../components/navigation/PrimarySegmentSwitcher';
import { seekerNavConfig } from '../layout/roleNavConfigs';
import { EscrowSidebarModule } from './EscrowSidebarModule';

export const SeekerShell: React.FC = () => {
  return (
    <DashboardShell
      config={seekerNavConfig}
      renderSidebarBottomContent={({ collapsed }) => <EscrowSidebarModule collapsed={collapsed} />}
      preContent={
        <div className="sticky top-0 z-20 bg-[#050507]/90 backdrop-blur-md">
          <PrimarySegmentSwitcher />
        </div>
      }
    >
      <Outlet />
    </DashboardShell>
  );
};
