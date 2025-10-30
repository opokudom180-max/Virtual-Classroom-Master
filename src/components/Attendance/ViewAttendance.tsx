'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { WorkSchedule } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import toast from 'react-hot-toast';

export default function ViewAttendance() {
    const [attendance, setAttendance] = useState<WorkSchedule[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) return;

            const attendanceQuery = query(
                collection(db, 'attendance'),
                where('internUid', '==', user.uid),
                orderBy('classDate', 'desc')
            );
            const attendanceSnapshot = await getDocs(attendanceQuery);
            const attendanceData = attendanceSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as WorkSchedule[];
            setAttendance(attendanceData);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            toast.error('Failed to load work attendance');
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
                <CardTitle>Work Attendance</CardTitle>
                <CardDescription>Your work attendance record</CardDescription>
            </CardHeader>
            <CardContent>
                {attendance.length === 0 ? (
                    <p className="text-center text-muted-foreground">No work attendance records yet.</p>
                ) : (
                    <div className="space-y-2">
                        {attendance.slice(0, 10).map((record) => (
                            <div key={record.id}
                                 className="flex items-center justify-between rounded-lg border border-border p-3">
                <span>
                  {record.month} {record.year}
                </span>
                                <span
                                    className={`rounded px-2 py-1 text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100`}>
                  {record.assignment || 'Not Assigned'}
                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}