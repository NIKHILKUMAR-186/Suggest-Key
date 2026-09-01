import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardShell } from '../layout/DashboardShell';
import { mentorNavConfig } from '../layout/roleNavConfigs';

export const MentorShell: React.FC = () => {
  return (
    <DashboardShell config={mentorNavConfig}>
      <Outlet />
    </DashboardShell>
  );
};
