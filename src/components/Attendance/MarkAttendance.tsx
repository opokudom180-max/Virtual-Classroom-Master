'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import { db, analytics } from '@/lib/firebase';
import { User } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface MarkAttendanceProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export default function MarkAttendance({ onSuccess, onCancel }: MarkAttendanceProps) {
    const [interns, setInterns] = useState<User[]>([]);
    const [attendance, setAttendance] = useState<{ [key: string]: 'Present' | 'Absent' }>({});
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchInterns();
    }, []);

    const fetchInterns = async () => {
        try {
            setLoading(true);
            const internsQuery = query(collection(db, 'users'), where('role', '==', 'intern'));
            const internsSnapshot = await getDocs(internsQuery);
            const internsData = internsSnapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
            })) as User[];
            setInterns(internsData);

            const initialAttendance: { [key: string]: 'Present' | 'Absent' } = {};
            internsData.forEach(intern => {
                initialAttendance[intern.uid] = 'Present';
            });
            setAttendance(initialAttendance);
        } catch (error) {
            console.error('Error fetching interns:', error);
            toast.error('Failed to load interns');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSubmitting(true);

            for (const intern of interns) {
                await addDoc(collection(db, 'attendance'), {
                    internUid: intern.uid,
                    studentUid: intern.uid, // Backward compatibility
                    classDate: date,
                    status: attendance[intern.uid] || 'Absent',
                });
            }

            // Log analytics event for attendance marking
            const analyticsInstance = await analytics;
            if (analyticsInstance) {
                const presentCount = Object.values(attendance).filter(s => s === 'Present').length;
                logEvent(analyticsInstance, 'mark_attendance', {
                    date: date,
                    total_interns: interns.length,
                    present_count: presentCount,
                });
            }

            onSuccess();
        } catch (error) {
            console.error('Error marking attendance:', error);
            toast.error('Failed to mark attendance');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Mark Work Attendance</h2>
                <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                    <X className="h-5 w-5"/>
                </Button>
            </div>

            <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                    type="date"
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Interns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {interns.length === 0 ? (
                        <p className="text-center text-muted-foreground">No interns enrolled yet.</p>
                    ) : (
                        interns.map((intern) => (
                            <div key={intern.uid} className="flex items-center justify-between rounded-lg border border-border p-3">
                                <span className="font-medium">{intern.name}</span>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={attendance[intern.uid] === 'Present' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setAttendance({ ...attendance, [intern.uid]: 'Present' })}
                                    >
                                        Present
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={attendance[intern.uid] === 'Absent' ? 'destructive' : 'outline'}
                                        size="sm"
                                        onClick={() => setAttendance({ ...attendance, [intern.uid]: 'Absent' })}
                                    >
                                        Absent
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            <div className="flex gap-4">
                <Button type="submit" disabled={submitting || interns.length === 0} className="flex-1">
                    {submitting ? 'Submitting...' : 'Submit Attendance'}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}