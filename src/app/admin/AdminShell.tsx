import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardShell } from '../layout/DashboardShell';
import { adminNavConfig } from '../layout/roleNavConfigs';

export const AdminShell: React.FC = () => {
  return (
    <DashboardShell config={adminNavConfig}>
      <Outlet />
    </DashboardShell>
  );
};
