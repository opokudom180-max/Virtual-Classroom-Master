'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { WorkSchedule as WorkScheduleType } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Calendar, Wifi, Phone, Camera, Network, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WorkSchedule() {
    const [schedules, setSchedules] = useState<WorkScheduleType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSchedule();
    }, []);

    const getCategoryIcon = (assignment: string) => {
        if (assignment.includes('WIFI')) return <Wifi className="h-4 w-4" />;
        if (assignment.includes('VoIP')) return <Phone className="h-4 w-4" />;
        if (assignment.includes('CCTV')) return <Camera className="h-4 w-4" />;
        if (assignment.includes('LAN')) return <Network className="h-4 w-4" />;
        if (assignment.includes('Operations')) return <Settings className="h-4 w-4" />;
        return <Calendar className="h-4 w-4" />;
    };

    const getCategoryColor = (assignment: string) => {
        if (assignment.includes('WIFI')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
        if (assignment.includes('VoIP')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
        if (assignment.includes('CCTV')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
        if (assignment.includes('LAN')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
        if (assignment.includes('Operations')) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    };

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) return;

            // Query attendance collection for work schedules
            const scheduleQuery = query(
                collection(db, 'attendance'),
                where('internUid', '==', user.uid)
            );
            const scheduleSnapshot = await getDocs(scheduleQuery);
            const scheduleData = scheduleSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
            })) as WorkScheduleType[];

            setSchedules(scheduleData);
        } catch (error) {
            console.error('Error fetching schedule:', error);
            toast.error('Failed to load work schedule');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Work Schedule</CardTitle>
                <CardDescription>Your monthly team assignments</CardDescription>
            </CardHeader>
            <CardContent>
                {schedules.length === 0 ? (
                    <p className="text-center text-muted-foreground">No schedule assigned yet. Contact your supervisor.</p>
                ) : (
                    <div className="space-y-3">
                        {schedules.map((schedule) => (
                            <div key={schedule.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                                <div className="flex items-center gap-3">
                                    {getCategoryIcon(schedule.assignment)}
                                    <div>
                                        <div className="font-medium">{schedule.month} {schedule.year}</div>
                                        <div className="text-sm text-muted-foreground">Team Assignment</div>
                                    </div>
                                </div>
                                <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${getCategoryColor(schedule.assignment)}`}>
                  {schedule.assignment}
                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}