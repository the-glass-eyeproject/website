'use client';

import Gallery from "@/components/Gallery";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 transition-colors">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-12 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-light text-zinc-900 dark:text-zinc-100 mb-2 transition-colors">
              The Glass Eye Project
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm transition-colors">
              A minimalistic photo gallery with intelligent tagging
            </p>
          </div>
          <ThemeToggle />
        </header>

        <Gallery />
      </div>
    </main>
  );
}
