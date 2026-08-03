import { SITE_CONFIG } from '@/lib/site-config';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-primary">{SITE_CONFIG.name}</h1>
        <p className="text-sm text-muted-foreground">{SITE_CONFIG.description}</p>
      </div>
      {children}
    </div>
  );
}
