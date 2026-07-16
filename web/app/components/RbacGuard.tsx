'use client';

import React from 'react';

export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';

interface RbacGuardProps {
  currentRole: UserRole;
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RbacGuard: React.FC<RbacGuardProps> = ({
  currentRole,
  allowedRoles,
  children,
  fallback = null,
}) => {
  const isAuthorized = allowedRoles.includes(currentRole);

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Simple visual fallback placeholder when access is restricted
export const RbacBlockedNotice: React.FC = () => (
  <div className="p-4 border border-slate-800/80 bg-slate-950/40 rounded-lg text-slate-500 text-xs font-mono italic">
    🔒 Interactive workflow mutations restricted for your role profile.
  </div>
);