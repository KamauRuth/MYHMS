'use client';

import { ReactNode } from 'react';

export default function InpatientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">{children}</div>
    </div>
  );
}
