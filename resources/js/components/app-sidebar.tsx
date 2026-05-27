import { Link, usePage } from '@inertiajs/react';
import { BookOpen, FolderGit2, LayoutGrid, Package, Calendar, BarChart3, Settings, User } from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

const navItems = [
    { label: 'Orders',    href: '/jobs',          icon: '◈', badge: true  },
    { label: 'Due Dates', href: '/jobs/due-dates',       icon: '◷', badge: false },
    { label: 'Reports',   href: '/jobs/reports',   icon: '◎', badge: false },
    { label: 'Completed', href: '/jobs/completed', icon: '✓', badge: false },
    { label: 'Settings',  href: '/jobs/settings',  icon: '◉', badge: false },
    { label: 'Profile',  href: '/settings/profile',  icon: '◉', badge: false },
    { label: 'Users', href: '/settings/users', icon: '◉', badge: false },
];

export function AppSidebar({ stats }: { stats?: { active?: number } }) {
    const { url } = usePage();

    const isActive = (href: string) => {
        if (href === '/jobs') return url === '/jobs' || url.startsWith('/jobs?');
        return url.startsWith(href);
    };

    return (
        <Sidebar collapsible="offcanvas" className="border-r-0" style={{ backgroundColor: 'var(--ink)', width: '220px' }}>

            {/* Logo */}
            <SidebarHeader style={{ padding: '28px 20px 20px' }}>
                <div>
                    <div style={{
                        fontFamily: 'Cormorant Garamond, serif',
                        fontSize: '20px',
                        fontWeight: 500,
                        color: 'var(--gold-light)',
                        lineHeight: 1.2,
                        marginBottom: '4px',
                    }}>
                        Diamond Gallery
                    </div>
                    <div style={{
                        fontSize: '9px',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: 'var(--menu)',
                    }}>
                        Order Management
                    </div>
                </div>
            </SidebarHeader>

            {/* Nav */}
            <SidebarContent style={{ padding: '8px 12px' }}>
                <SidebarMenu>
                    {navItems.map((item) => {
                        const active = isActive(item.href);

                        return (
                            <SidebarMenuItem key={item.label}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={active}
                                    className="relative"
                                    style={{
                                        backgroundColor: active ? 'var(--menu-bg)' : 'transparent',
                                        color:           active ? 'var(--gold-light)' : 'var(--menu)',
                                        borderRadius:    '8px',
                                        padding:         '10px 12px',
                                        fontSize:        '13px',
                                        fontWeight:      active ? 500 : 400,
                                        transition:      'all 0.15s',
                                    }}
                                >
                                    <Link href={item.href}>
                                        <span style={{ fontSize: '14px', marginRight: '10px' }}>{item.icon}</span>
                                        <span>{item.label}</span>

                                        {/* Active left bar indicator */}
                                        {active && (
                                            <span style={{
                                                position:        'absolute',
                                                left:            '-12px',
                                                top:             '50%',
                                                transform:       'translateY(-50%)',
                                                width:           '3px',
                                                height:          '60%',
                                                backgroundColor: 'var(--gold)',
                                                borderRadius:    '0 2px 2px 0',
                                            }} />
                                        )}
                                    </Link>
                                </SidebarMenuButton>

                                {/* Active jobs badge */}
                                {item.badge && stats?.active !== undefined && stats.active > 0 && (
                                    <SidebarMenuBadge style={{
                                        backgroundColor: 'var(--gold)',
                                        color:           'white',
                                        fontSize:        '10px',
                                        fontWeight:      600,
                                        borderRadius:    '20px',
                                        padding:         '0 7px',
                                        minWidth:        '20px',
                                        height:          '20px',
                                    }}>
                                        {stats.active}
                                    </SidebarMenuBadge>
                                )}
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    );
}