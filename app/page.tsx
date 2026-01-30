'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import InteractiveDotsBackground from '@/components/interactive-dots-background';

export default function Home() {
  return (
    <>
      <InteractiveDotsBackground 
        dotSpacing={24}
        dotColor="rgba(207, 224, 45)"
        baseOpacity={0.12}
        hoverRadius={50}
        hoverScale={1.5}
        hoverOpacity={0.3}
      />
      <div className="flex flex-col items-center justify-center px-4 pt-16 pb-24 relative z-0">
      <div className="text-center max-w-[940px] w-full space-y-16">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-6 text-left w-full">
          {/* Small informational text */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full inline-flex">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>New from the design team: tools that save you hours</span>
          </div>
          
          {/* Main heading */}
          <h1 className="text-5xl font-bold text-white w-full text-center">
            Optimise quickly. Publish sooner.
          </h1>
          
          {/* Body text */}
          <p className="text-base text-muted-foreground max-w-2xl text-center">
            Save time on every story with quick, reliable tools that streamline image creation and optimisation. Built to make your workflow faster and more consistent, each tool helps you produce high quality visuals with far less effort.
          </p>
        </div>
        
        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 [&>*]:transition-transform [&>*]:duration-300 [&:has(>*:hover)>*]:scale-[0.98] [&>*:hover]:scale-[1.02]">
          <Card className="h-full gap-6 p-6 transition-all duration-300 hover:border-white/20">
            <div className="px-0">
              <Image
                src="/webo-cover.webp"
                alt="Webopedia News Image Generator Example"
                width={800}
                height={450}
                className="w-full h-auto rounded-lg"
                priority
              />
            </div>
            <CardHeader className="text-left pb-0 px-0">
              <CardTitle className="text-lg font-bold text-white">Webopedia News Overlay</CardTitle>
            </CardHeader>
            <CardContent className="text-left pt-0 px-0">
              <div className="text-muted-foreground text-sm">
                <p className="mb-3">
                  Turn any image into a Webopedia news visual in seconds.
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Converts your image to greyscale</li>
                  <li>Crops it to the site's 16:9 aspect ratio</li>
                  <li>Applies the branded overlay</li>
                  <li>Compresses the file for faster loading</li>
                  <li>Guides you to name it using SEO best practice</li>
                  <li>Exports a lightweight WEBP file ready to upload</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="text-left mt-auto pt-0 px-0">
              <Link href="/webo-news-overlay" className="w-full">
                <Button className="w-full">
                  Create Webopedia visual
                </Button>
              </Link>
            </CardFooter>
          </Card>
          <Card className="h-full gap-6 p-6 transition-all duration-300 hover:border-white/20">
            <div className="px-0">
              <Image
                src="/ccn-cover.webp"
                alt="CCN Image Optimiser Example"
                width={800}
                height={450}
                className="w-full h-auto rounded-lg"
                priority
              />
            </div>
            <CardHeader className="text-left pb-0 px-0">
              <CardTitle className="text-lg font-bold text-white">CCN Image Optimiser</CardTitle>
            </CardHeader>
            <CardContent className="text-left pt-0 px-0">
              <div className="text-muted-foreground text-sm">
                <p className="mb-3">
                  Crop and resize any image in seconds while meeting all CCN image guidelines.
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Follows all CCN image requirements</li>
                  <li>Compresses files for faster loading</li>
                  <li>Guides you to name images using SEO best practice</li>
                  <li>Exports lightweight WEBP files ready to upload</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="text-left mt-auto pt-0 px-0">
              <Link href="/ccn-image-optimiser" className="w-full">
                <Button className="w-full">
                  Optimise image for CCN
                </Button>
              </Link>
            </CardFooter>
          </Card>
          <Card className="h-full gap-6 p-6 transition-all duration-300 hover:border-white/20">
            <div className="px-0">
              <div className="w-full aspect-video bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                <div className="text-white text-4xl">▶</div>
              </div>
            </div>
            <CardHeader className="text-left pb-0 px-0">
              <CardTitle className="text-lg font-bold text-white">YouTube Video Thumbnail</CardTitle>
            </CardHeader>
            <CardContent className="text-left pt-0 px-0">
              <div className="text-muted-foreground text-sm">
                <p className="mb-3">
                  Create custom YouTube video thumbnails by combining backgrounds, foregrounds, and text.
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Choose from a variety of background options</li>
                  <li>Select foreground elements to layer</li>
                  <li>Add custom text with styling options</li>
                  <li>Export optimized thumbnails ready for YouTube</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="text-left mt-auto pt-0 px-0">
              <Button className="w-full" disabled>
                Coming soon
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      </div>
    </>
  );
}
