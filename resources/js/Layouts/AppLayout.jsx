import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/use-theme';
import AppSidebar from '@/components/app-sidebar';

const AppLayout = ({ children, title }) => {
    const { resolvedTheme, toggleTheme } = useTheme();

    return (
        <TooltipProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
                        <SidebarTrigger className="-ml-1" />
                        <h1 className="min-w-0 truncate text-base font-semibold tracking-tight">
                            {title}
                        </h1>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto"
                            onClick={toggleTheme}
                            aria-label="Toggle theme"
                        >
                            {resolvedTheme === 'dark' ? <Moon /> : <Sun />}
                        </Button>
                    </header>
                    <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
};

export default AppLayout;
