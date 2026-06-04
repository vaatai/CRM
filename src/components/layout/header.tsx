import { UserButton } from '@clerk/nextjs';

export function Header() {
  return (
    <header className="bg-card flex h-14 items-center justify-between border-b px-6">
      <div>
        <h2 className="text-lg font-semibold">CRM SaaS</h2>
      </div>
      <div className="flex items-center gap-4">
        <UserButton />
      </div>
    </header>
  );
}
