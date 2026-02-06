'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Footer() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Left side - Logo and description */}
          <div className="flex flex-col gap-3 md:max-w-md">
            <div className="flex items-center gap-3">
              <Image
                src="/Find-co-logo-green.svg"
                alt="Find.co Logo"
                width={32}
                height={32}
                className="flex-shrink-0 rounded-md"
              />
              <span className="text-lg font-semibold text-foreground">Design Tools</span>
            </div>
            <p className="text-sm text-muted-foreground">
              A collection of web apps built by the design team to speed up our workflow, improve efficiency and experiment with AI.
            </p>
          </div>

          {/* Right side - Links */}
          <div className="flex flex-row flex-wrap gap-3 items-center">
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Admin tools
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Admin tools</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/admin/images">
                    <DropdownMenuItem asChild>
                      <span>Upload images</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/admin/brand-assets">
                    <DropdownMenuItem asChild>
                      <span>Brand assets admin</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/statistics">
                    <DropdownMenuItem asChild>
                      <span>Statistics</span>
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/admin/images">
                <Button variant="outline" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Admin tools
                </Button>
              </Link>
            )}

            <Link href="/submit-feedback">
              <Button variant="outline">Submit feedback</Button>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

