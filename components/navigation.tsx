'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  Newspaper,
  Crop,
  Video,
  Palette,
  type LucideIcon,
} from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from '@/components/ui/navigation-menu';

const imageTools: {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
  isHome?: boolean;
}[] = [
  { label: 'All tools', href: '/', description: 'Overview of all design tools', icon: Home, isHome: true },
  { label: 'Webopedia News Overlay', href: '/webo-news-overlay', description: 'Turn images into Webopedia news visuals', icon: Newspaper },
  { label: 'CCN Image Optimiser', href: '/ccn-image-optimiser', description: 'Crop and resize for CCN guidelines', icon: Crop },
  { label: 'YouTube Video Thumbnail', href: '/youtube-thumbnail', description: 'Create YouTube thumbnails', icon: Video },
];

const brandAssets: {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
  disabled?: boolean;
}[] = [
  { label: 'Find.co', href: '/brand-assets?brand=find', description: 'Logos, colours, fonts and icons', icon: Palette },
  { label: 'Webopedia', href: '/brand-assets?brand=webopedia', description: 'Coming soon', icon: Palette, disabled: true },
  { label: 'CCN', href: '/brand-assets?brand=ccn', description: 'Coming soon', icon: Palette, disabled: true },
  { label: 'CryptoManiaks', href: '/brand-assets?brand=cryptomaniaks', description: 'Coming soon', icon: Palette, disabled: true },
];

function MegaMenuItem({
  href,
  label,
  description,
  icon: Icon,
  isActive,
  disabled,
  isHome,
}: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  isActive: boolean;
  disabled?: boolean;
  isHome?: boolean;
}) {
  if (disabled) {
    return (
      <div className="flex flex-row items-center justify-start gap-3 rounded-lg p-3 text-left opacity-60">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted/50">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    );
  }

  if (isHome) {
    return (
      <NavigationMenuLink asChild>
        <Link
          href={href}
          aria-current={isActive ? 'page' : undefined}
          className={`mb-2 flex flex-row items-center justify-start gap-3 rounded-lg border border-transparent p-3 text-left outline-none transition-colors hover:border-slate-blue hover:bg-slate-blue/10 focus:border-slate-blue focus:bg-slate-blue/10 ${isActive ? 'border-slate-blue bg-slate-blue text-white' : ''}`}
        >
          <span className="w-9 shrink-0" aria-hidden />
          <p className={`min-w-0 flex-1 text-left text-sm font-medium ${isActive ? 'text-white' : 'text-foreground'}`}>{label}</p>
        </Link>
      </NavigationMenuLink>
    );
  }

  return (
    <NavigationMenuLink asChild>
      <Link
        href={href}
        aria-current={isActive ? 'page' : undefined}
        className={`flex flex-row items-center justify-start gap-3 rounded-lg border border-transparent p-3 text-left outline-none transition-colors hover:border-slate-blue hover:bg-slate-blue/10 focus:border-slate-blue focus:bg-slate-blue/10 ${isActive ? 'border-slate-blue bg-slate-blue text-white' : ''}`}
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted/50 ${isActive ? 'bg-white/20' : ''}`}
        >
          <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-foreground'}`}>{label}</p>
          <p className={`text-xs ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>{description}</p>
        </div>
      </Link>
    </NavigationMenuLink>
  );
}

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-background relative">
      <div className="container mx-auto px-4 flex items-center h-16 gap-8">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0 flex items-center">
          <Image
            src="/Find-co-logo-green.svg"
            alt="Find.co Logo"
            width={32}
            height={32}
            className="rounded-md"
          />
        </Link>

        {/* Centered nav: Image creation tools + Brand assets */}
        <div className="flex-1 flex justify-center">
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <NavigationMenuTrigger>Image creation tools</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[360px] p-3 text-left">
                    <p className="mb-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Image tools
                    </p>
                    <ul className="grid gap-1 text-left">
                      {imageTools.map((item) => (
                        <li key={item.href}>
                          <MegaMenuItem
                            href={item.href}
                            label={item.label}
                            description={item.description}
                            icon={item.icon}
                            isActive={pathname === item.href}
                            isHome={item.isHome}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Brand assets</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[360px] p-3 text-left">
                    <p className="mb-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Brand assets
                    </p>
                    <ul className="grid gap-1 text-left">
                      {brandAssets.map((item) => (
                        <li key={item.href}>
                          <MegaMenuItem
                            href={item.href}
                            label={item.label}
                            description={item.description}
                            icon={item.icon}
                            isActive={!item.disabled && pathname.startsWith('/brand-assets')}
                            disabled={item.disabled}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right spacer for balance */}
        <div className="w-8 flex-shrink-0" aria-hidden />
      </div>
    </nav>
  );
}
