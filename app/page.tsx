import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-[470px]">
        <div className="container mx-auto px-4 py-8 bg-card rounded-lg border shadow-lg">
          <div className="mb-6">
            <Image
              src="/webo-cover.webp"
              alt="Webopedia News Image Generator Example"
              width={800}
              height={450}
              className="w-full h-auto rounded-lg mx-auto"
              priority
            />
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold">Webopedia News Overlay</h1>
            <p className="text-muted-foreground text-lg">
              Turn any image into a Webopedia news visual in seconds. The tool converts your image to greyscale, lets you crop it to the site's 16:9 aspect ratio and applies our branded overlay. It also compresses the file for faster loading, helps you name it using SEO best practices and exports it as a lightweight WEBP file ready to upload.
            </p>
            <div className="pt-4">
              <Link href="/webo-news-overlay">
                <Button size="lg" variant="default">
                  Open Webo News Overlay
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
