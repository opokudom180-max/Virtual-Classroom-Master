import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { AuthListener } from '@/components/Auth/AuthListener';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Virtual Classroom - Online Learning Platform',
    description: 'Modern web application for online learning with role-based access for students and teachers',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthListener>
                {children}
            </AuthListener>
            <Toaster position="top-right" />
        </ThemeProvider>
        </body>
        </html>
    );
}