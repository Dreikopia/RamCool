import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeftRight, Boxes, LayoutDashboard, LogOutIcon, Package, Settings, ShoppingCart, Tag, TruckIcon, User, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from './ui/alert-dialog';

const navGroups = [
    {
        label: 'General',
        items: [
            { title: 'Dashboard', href: '/', icon: LayoutDashboard },
            { title: 'Sales', href: '/sales', icon: ShoppingCart },

        ],
    },
    {
        label: 'Catalog',
        items: [
            { title: 'Products', href: '/products', icon: Package },
            { title: 'category', href: '/categories', icon: Tag },
            { title: 'Suppliers', href: '/suppliers', icon: TruckIcon },

        ],
    },
    {
        label: 'Management',
        items: [
            { title: 'Inventory', href: '/inventories', icon: Boxes },
            { title: 'Movements', href: '/movements', icon: ArrowLeftRight },
        ],
    },
    {
        label: 'Administration',
        items: [
            { title: 'Users', href: '/users', icon: User },
        ],
    },
];

const isActivePath = (currentPath, href) =>
    href === '/' ? currentPath === '/' : currentPath.startsWith(href);

const AppSidebar = ({ ...props }) => {
    const { url, props: pageProps } = usePage();
    const isAdmin = pageProps.auth?.user?.role === 'admin';

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            render={<Link href="/" />}
                            className="gap-3"
                        >
                            <div className="bg-linear-to-br from-sidebar-primary to-purple-800 text-sidebar-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm">
                                <Wind className="size-5" />
                            </div>

                            <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
                                <span className="text-base font-bold tracking-wide">
                                    RAMCOOL
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    Inventory & Sales Management
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {navGroups.filter((group) => group.label !== 'Administration' || isAdmin).map((group) => (
                    <SidebarGroup key={group.label}>
                        <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            tooltip={item.title}
                                            isActive={isActivePath(url, item.href)}
                                            render={<Link href={item.href} />}
                                        >
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Settings" render={<Link href="/settings" />}>
                            <Settings />
                            <span>Settings</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                <SidebarMenu>
                    <SidebarMenuItem>

                        <AlertDialog>

                            <AlertDialogTrigger
                                render={
                                    <SidebarMenuButton tooltip="Logout" />
                                }
                            >
                                <LogOutIcon />
                                <span>Logout</span>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Log out?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        You will need to sign in again to continue
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => router.post('/logout', {}, { preserveScroll: true })}
                                        className="bg-red-600 text-white hover:bg-red-700 hover:text-white transition-colors"
                                    >
                                        Log out
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
};

export default AppSidebar;
