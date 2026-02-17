import { FeedContainer } from "@/components/feed/feed-container";
import { ThemeToggle } from "@/components/theme-toggle";
import { SourceManager } from "@/components/feed/source-manager";
import { BookmarkPanel } from "@/components/feed/bookmark-panel";
import { TutorialModal } from "@/components/tutorial-modal";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { Settings2, HelpCircle } from "lucide-react";

import { ViewModeToggle } from "@/components/feed/view-mode-toggle";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col overflow-hidden bg-background">
      <header className="w-full h-14 border-b border-border/60 flex items-center justify-between px-3 sm:px-5 bg-card/80 backdrop-blur-md z-50 shrink-0 relative">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative z-20">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">N</span>
          </div>
          <h1 className="text-base sm:text-lg font-semibold tracking-tight">NexusDeck</h1>
        </div>

        <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar mx-2 flex items-center justify-end sm:justify-end gap-1 sm:gap-3 px-1 relative z-10">
          <ViewModeToggle />
          <TutorialModal trigger={
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground shrink-0" aria-label="使い方">
              <HelpCircle className="h-5 w-5" />
            </Button>
          } />
          <SourceManager trigger={
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground shrink-0">
              <Settings2 className="h-5 w-5" />
            </Button>
          } />
          <BookmarkPanel />
          <ThemeToggle />
        </div>

        <div className="shrink-0 relative z-50">
          <UserMenu />
        </div>
      </header>
      <FeedContainer />
    </main>
  );
}
