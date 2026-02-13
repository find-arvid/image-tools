'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Newspaper,
  Crop,
  Video,
  Palette,
  ChevronRight,
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
}[] = [
  { label: 'Webopedia News Overlay', href: '/webo-news-overlay', description: 'Turn images into Webopedia news visuals', icon: Newspaper },
  { label: 'CCN Image Optimiser', href: '/ccn-image-optimiser', description: 'Crop and resize for CCN guidelines', icon: Crop },
  { label: 'YouTube Video Thumbnail', href: '/youtube-thumbnail', description: 'Create YouTube thumbnails', icon: Video },
];

const BRAND_MENU_ITEMS: {
  brandId: 'find' | 'webopedia' | 'ccn' | 'cryptomaniaks';
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
  disabled?: boolean;
}[] = [
  { brandId: 'find', label: 'Find.co', href: '/brand-assets?brand=find', description: 'Logos, colours, fonts and icons', icon: Palette },
  { brandId: 'webopedia', label: 'Webopedia', href: '/brand-assets?brand=webopedia', description: 'Coming soon', icon: Palette, disabled: true },
  { brandId: 'ccn', label: 'CCN', href: '/brand-assets?brand=ccn', description: 'Coming soon', icon: Palette, disabled: true },
  { brandId: 'cryptomaniaks', label: 'CryptoManiaks', href: '/brand-assets?brand=cryptomaniaks', description: 'Coming soon', icon: Palette, disabled: true },
];

function MegaMenuItem({
  href,
  label,
  description,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  isActive: boolean;
}) {
  return (
    <NavigationMenuLink asChild>
      <Link
        href={href}
        aria-current={isActive ? 'page' : undefined}
        className={`flex flex-row items-center justify-start gap-3 rounded-lg border border-transparent p-3 text-left outline-none transition-colors hover:border-slate-blue hover:bg-slate-blue/10 focus:border-slate-blue focus:bg-slate-blue/10 ${isActive ? 'border-slate-blue bg-slate-blue text-inverse-foreground' : ''}`}
      >
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${isActive ? 'bg-inverse-foreground/20' : 'bg-muted/50'}`}>
          <Icon className={`h-4 w-4 ${isActive ? 'text-inverse-foreground' : 'text-muted-foreground'}`} />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className={`text-sm font-medium ${isActive ? 'text-inverse-foreground' : 'text-foreground'}`}>{label}</p>
          <p className={`text-xs ${isActive ? 'text-inverse-foreground/80' : 'text-muted-foreground'}`}>{description}</p>
        </div>
      </Link>
    </NavigationMenuLink>
  );
}

function BrandMegaMenuItem({
  href,
  label,
  description,
  icon: Icon,
  isActive,
  disabled,
  menuLogoUrl,
}: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  isActive: boolean;
  disabled?: boolean;
  menuLogoUrl?: string | null;
}) {
  const logoSrc = menuLogoUrl ?? (label === 'Find.co' ? '/Find-co-logo-green.svg' : null);
  const showImg = logoSrc && !disabled;

  const iconBox = (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md overflow-hidden ${!showImg ? 'bg-muted/50' : ''} ${isActive && !showImg ? 'bg-inverse-foreground/20' : ''}`}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoSrc}
          alt=""
          className="h-full w-full object-contain"
          width={36}
          height={36}
        />
      ) : (
        <Icon className={`h-4 w-4 ${isActive ? 'text-inverse-foreground' : 'text-muted-foreground'}`} />
      )}
    </div>
  );

  if (disabled) {
    return (
      <div className="flex flex-row items-center justify-start gap-3 rounded-lg p-3 text-left opacity-60">
        {iconBox}
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <NavigationMenuLink asChild>
      <Link
        href={href}
        aria-current={isActive ? 'page' : undefined}
        className={`flex flex-row items-center justify-start gap-3 rounded-lg border border-transparent p-3 text-left outline-none transition-colors hover:border-slate-blue hover:bg-slate-blue/10 focus:border-slate-blue focus:bg-slate-blue/10 ${isActive ? 'border-slate-blue bg-slate-blue text-inverse-foreground' : ''}`}
      >
        {iconBox}
        <div className="min-w-0 flex-1 text-left">
          <p className={`text-sm font-medium ${isActive ? 'text-inverse-foreground' : 'text-foreground'}`}>{label}</p>
          <p className={`text-xs ${isActive ? 'text-inverse-foreground/80' : 'text-muted-foreground'}`}>{description}</p>
        </div>
      </Link>
    </NavigationMenuLink>
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const [menuLogos, setMenuLogos] = useState<Record<string, string | null>>({});

  useEffect(() => {
    fetch('/api/brand-assets/menu-logos')
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => setMenuLogos(data ?? {}))
      .catch(() => {});
  }, []);

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
                    <Link
                      href="/"
                      className="mb-2 inline-flex items-center gap-1 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                    >
                      All tools
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                    <ul className="grid gap-1 text-left">
                      {imageTools.map((item) => (
                        <li key={item.href}>
                          <MegaMenuItem
                            href={item.href}
                            label={item.label}
                            description={item.description}
                            icon={item.icon}
                            isActive={pathname === item.href}
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
                    <Link
                      href="/brand-assets"
                      className="mb-2 inline-flex items-center gap-1 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                    >
                      All brands
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                    <ul className="grid gap-1 text-left">
                      {BRAND_MENU_ITEMS.map((item) => (
                        <li key={item.href}>
                          <BrandMegaMenuItem
                            href={item.href}
                            label={item.label}
                            description={item.description}
                            icon={item.icon}
                            isActive={!item.disabled && pathname.startsWith('/brand-assets')}
                            disabled={item.disabled}
                            menuLogoUrl={menuLogos[item.brandId] ?? null}
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
