import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">CRM SaaS</h1>
        <p className="text-muted-foreground mt-2 text-lg">A production-grade CRM platform</p>
      </div>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </div>
    </div>
  );
}
