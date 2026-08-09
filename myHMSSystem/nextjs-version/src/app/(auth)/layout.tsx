import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Secure staff access to LifePoint Hospital Management System",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
