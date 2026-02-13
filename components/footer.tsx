'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sun, Moon, Settings, ImagePlus, Palette, BookOpen, BarChart3 } from 'lucide-react';
import { useTheme } from 'next-themes';
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
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (resolvedTheme ?? theme) === 'dark';
  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    // Ensure class is applied immediately (workaround for next-themes timing)
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(next);
  };

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

          {/* Right side - Theme switch and links */}
          <div className="flex flex-row flex-wrap gap-3 items-center">
            {mounted && (
              <Button
                variant="outline"
                size="default"
                className="flex items-center gap-2"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Light mode' : 'Dark mode'}
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4" />
                    Light
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    Dark
                  </>
                )}
              </Button>
            )}
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Admin tools
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Admin tools</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/admin/images">
                    <DropdownMenuItem asChild>
                      <span className="flex items-center gap-2">
                        <ImagePlus className="w-4 h-4" />
                        Upload images
                      </span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/admin/brand-assets">
                    <DropdownMenuItem asChild>
                      <span className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Brand assets admin
                      </span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/admin/style-guide">
                    <DropdownMenuItem asChild>
                      <span className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Style guide
                      </span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/statistics">
                    <DropdownMenuItem asChild>
                      <span className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Statistics
                      </span>
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/admin/images">
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Admin tools
                </Button>
              </Link>
            )}

          </div>
        </div>
      </div>
    </footer>
  );
}

