import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'CampusJob · Việc làm & thực tập cho sinh viên',
  description: 'Tìm việc làm thêm, thực tập và kết nối với doanh nghiệp được xác thực. Dự án Nhóm 11.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>
          <Toaster richColors position="top-right" />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
