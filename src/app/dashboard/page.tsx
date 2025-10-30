'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { logEvent } from 'firebase/analytics';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, analytics } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ThemeToggle';
import InternDashboard from '@/components/Dashboard/InternDashboard';
import SupervisorDashboard from '@/components/Dashboard/SupervisorDashboard';
import { LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
    const router = useRouter();
    const [userRole, setUserRole] = useState<'intern' | 'supervisor' | null>(null);
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push('/login');
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserRole(userData.role as 'intern' | 'supervisor');
                    setUserName(userData.name);

                    // Log analytics event for dashboard view
                    const analyticsInstance = await analytics;
                    if (analyticsInstance) {
                        logEvent(analyticsInstance, 'dashboard_view', {
                            user_role: userData.role,
                        });
                    }
                } else {
                    toast.error('User data not found');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                toast.error('Failed to load user data');
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        try {
            const analyticsInstance = await analytics;
            if (analyticsInstance) logEvent(analyticsInstance, 'logout');
            await signOut(auth);
            toast.success('Logged out successfully');
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Failed to logout');
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!userRole) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-gray-500">User role not found or unauthorized.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <nav className="border-b border-border">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
                            <span className="text-sm font-bold text-primary-foreground">DC</span>
                        </div>
                        <h1 className="text-xl font-bold">Data Center E-Learning</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">Welcome, {userName}</span>
                        <ThemeToggle />
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {userRole === 'intern' ? <InternDashboard /> : <SupervisorDashboard />}
            </main>
        </div>
    );
}
