import { ReactNode } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  Key, 
  BarChart3 
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  params: Promise<{}>;
}

const menuItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/vouchers', icon: Ticket, label: 'Vouchers' },
  { href: '/admin/apikeys', icon: Key, label: 'API Keys' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
];

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  await params; // Consume params for Next.js 16
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-800 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">GenovaAI</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Admin Dashboard</p>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all mb-1 group"
              >
                <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden ml-64">
        <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-800 transition-colors duration-300">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
