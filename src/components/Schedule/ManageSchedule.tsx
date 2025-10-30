'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface ManageScheduleProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export default function ManageSchedule({ onSuccess, onCancel }: ManageScheduleProps) {
    const [interns, setInterns] = useState<User[]>([]);
    const [selectedMonth, setSelectedMonth] = useState('September');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [assignments, setAssignments] = useState<{ [internId: string]: string }>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const months = ['September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August'];
    const assignmentOptions = [
        'WIFI',
        'VoIP',
        'CCTV',
        'LAN',
        'Operations',
        'WIFI/CCTV',
        'VoIP/LAN',
        'CCTV/LAN',
        'WIFI/VoIP',
        'LAN/Operations',
    ];

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    const fetchData = async () => {
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

            // Initialize assignments with empty values
            const initialAssignments: { [internId: string]: string } = {};
            internsData.forEach(intern => {
                initialAssignments[intern.uid] = '';
            });
            setAssignments(initialAssignments);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load schedule data');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSchedules = async () => {
        try {
            setSubmitting(true);

            for (const internId of Object.keys(assignments)) {
                if (assignments[internId]) {
                    await addDoc(collection(db, 'attendance'), {
                        internUid: internId,
                        studentUid: internId, // Backward compatibility
                        month: selectedMonth,
                        year: selectedYear,
                        assignment: assignments[internId],
                        classDate: `${selectedYear}-${String(months.indexOf(selectedMonth) + 1).padStart(2, '0')}-01`,
                        status: 'Scheduled',
                    });
                }
            }

            toast.success('Schedules saved successfully!');
            onSuccess();
        } catch (error) {
            console.error('Error saving schedules:', error);
            toast.error('Failed to save schedules');
        } finally {
            setSubmitting(false);
        }
    };

    const getTeamAssignmentFromImage = (internName: string) => {
        // Based on the image you provided, here are the assignments
        const teamSchedule: { [key: string]: { [key: string]: string } } = {
            'Rosina': { 'September': 'WIFI', 'October': 'VoIP', 'November': 'Operations' },
            'Pinamang': { 'September': 'VoIP', 'October': 'Operations', 'November': 'CCTV' },
            'Dim': { 'September': 'CCTV', 'October': 'CCTV', 'November': 'Operations' },
            'Dominic': { 'September': 'CCTV', 'October': 'Operations', 'November': 'LAN' },
            'Sean': { 'September': 'Operations', 'October': 'LAN', 'November': 'WIFI' },
            'Stephen': { 'September': 'LAN', 'October': 'WIFI', 'November': 'VoIP' },
            'Abraham': { 'September': 'Operations', 'October': 'WIFI', 'November': 'CCTV' },
            'Ibrahim': { 'September': 'VoIP', 'October': 'LAN', 'November': 'CCTV' },
            'Brian': { 'September': 'WIFI', 'October': 'CCTV', 'November': 'LAN' },
            'Kennedy': { 'September': 'WIFI/CCTV', 'October': 'VoIP/LAN', 'November': 'CCTV/LAN' },
            'Nelson': { 'September': 'VoIP/LAN', 'October': 'WIFI/CCTV', 'November': 'CCTV/LAN' },
            'Christian': { 'September': 'CCTV/LAN', 'October': 'VoIP/LAN', 'November': 'WIFI/CCTV' },
            'Melissa': { 'September': 'VoIP/LAN', 'October': 'Operations', 'November': 'WIFI/CCTV' },
            'Rodney': { 'September': 'CCTV/LAN', 'October': 'WIFI/CCTV', 'November': 'VoIP/LAN' },
            'Nana B': { 'September': 'WIFI/CCTV', 'October': 'VoIP/LAN', 'November': 'CCTV/LAN' },
            'Samuels': { 'September': 'WIFI/CCTV', 'October': 'CCTV/LAN', 'November': 'VoIP/LAN' },
            'Edward': { 'September': 'VoIP/LAN', 'October': 'WIFI/CCTV', 'November': 'CCTV/LAN' },
            'Francis': { 'September': 'CCTV/LAN', 'October': 'VoIP/LAN', 'November': 'WIFI/CCTV' },
        };

        return teamSchedule[internName]?.[selectedMonth] || '';
    };

    const loadPredefinedSchedule = () => {
        const newAssignments: { [internId: string]: string } = {};
        interns.forEach(intern => {
            const assignment = getTeamAssignmentFromImage(intern.name);
            newAssignments[intern.uid] = assignment;
        });
        setAssignments(newAssignments);
        toast.success('Predefined schedule loaded from KNUST Data Center plan');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Manage Team Schedule</h2>
                <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                    <X className="h-5 w-5" />
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="month">Month</Label>
                    <Select
                        id="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        {months.map(month => (
                            <option key={month} value={month}>{month}</option>
                        ))}
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Select
                        id="year"
                        value={selectedYear.toString()}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                    >
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                    </Select>
                </div>

                <div className="flex items-end">
                    <Button type="button" variant="outline" onClick={loadPredefinedSchedule} className="w-full">
                        Load KNUST Schedule
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Assign Interns to Teams - {selectedMonth} {selectedYear}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {interns.length === 0 ? (
                        <p className="text-center text-muted-foreground">No interns found.</p>
                    ) : (
                        interns.map((intern) => (
                            <div key={intern.uid} className="flex items-center justify-between rounded-lg border border-border p-4">
                                <div>
                                    <div className="font-medium">{intern.name}</div>
                                    <div className="text-sm text-muted-foreground">{intern.email}</div>
                                </div>
                                <div className="min-w-48">
                                    <Select
                                        value={assignments[intern.uid] || ''}
                                        onChange={(e) => setAssignments({
                                            ...assignments,
                                            [intern.uid]: e.target.value
                                        })}
                                    >
                                        <option value="">Select Assignment</option>
                                        {assignmentOptions.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </Select>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            <div className="flex gap-4">
                <Button onClick={handleSaveSchedules} disabled={submitting} className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    {submitting ? 'Saving...' : 'Save Schedules'}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}