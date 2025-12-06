'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { label: 'All tools', href: '/' },
    { label: 'Webo news', href: '/webo-news-overlay' },
    { label: 'CCN cover', href: '/ccn-image-optimiser' },
  ];

  return (
    <nav className="border-b border-border bg-background relative">
      <Link href="/" className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center">
        <Image
          src="/Find-co-logo-green.svg"
          alt="Find.co Logo"
          width={32}
          height={32}
          className="rounded-md"
        />
      </Link>
      <div className="container mx-auto px-4 flex items-center h-16 relative">
        <div className="absolute left-1/2 -translate-x-1/2">
          <NavigationMenu viewport={false}>
            <NavigationMenuList>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <NavigationMenuItem key={item.href}>
                    <NavigationMenuLink asChild active={isActive}>
                      <Link href={item.href} className="h-9">
                        {item.label}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </nav>
  );
}

