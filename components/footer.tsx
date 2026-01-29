import Link from 'next/link';
import Image from 'next/image';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Footer() {
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
          <div className="flex flex-row gap-4">
            <Link href="/admin/images">
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Images
              </Button>
            </Link>
            <Link href="/submit-feedback">
              <Button variant="outline">Submit feedback</Button>
            </Link>
            <Link href="/statistics">
              <Button variant="ghost">Statistics</Button>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

