import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ToastProvider } from '@/components/ui/toast';
import FlashToaster from '@/components/flash-toaster';
import AppSidebar from '@/components/app-sidebar';

const AppLayout = ({ children, title }) => {
    return (
        <ToastProvider>
            <FlashToaster />
            <TooltipProvider>
                <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset>
                        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
                            <SidebarTrigger className="-ml-1" />
                            <h1 className="min-w-0 truncate text-base-200 tracking-wide">
                                {title}
                            </h1>
                        </header>
                        <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
                    </SidebarInset>
                </SidebarProvider>
            </TooltipProvider>
        </ToastProvider>
    );
};

export default AppLayout;
