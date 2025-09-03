'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';

export default function Header() {
  return (
    <header className="border-b px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo/Brand */}
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold">
            Copy Tool
          </Link>
        </div>

        {/* Navigation Buttons */}
        <nav className="flex items-center space-x-4">
          <Link href="/new">
            <Button variant="default">
              Generate New
            </Button>
          </Link>
          <Link href="/campaigns">
            <Button variant="outline">
              View Campaigns
            </Button>
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
