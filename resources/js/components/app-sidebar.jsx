import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeftRight, Boxes, LayoutDashboard, LogOutIcon, Package, Settings, ShoppingCart, Tag, TruckIcon, Wind } from 'lucide-react';
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
];

const isActivePath = (currentPath, href) =>
    href === '/' ? currentPath === '/' : currentPath.startsWith(href);

const AppSidebar = ({ ...props }) => {
    const { url } = usePage();

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" render={<Link href="/" />}>
                            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                <Wind className="size-4" />
                            </div>
                            <span className="truncate font-semibold">AirCare</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {navGroups.map((group) => (
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
                        <SidebarMenuButton
                            tooltip="Logout"
                            onClick={() => router.post('/logout', {}, { preserveScroll: true })}
                        >
                            <LogOutIcon />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
};

export default AppSidebar;
