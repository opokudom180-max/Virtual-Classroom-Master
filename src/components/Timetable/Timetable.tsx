'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, TeamScheduleEntry } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import toast from 'react-hot-toast';

interface ScheduleData {
    id: string;
    internUid?: string;
    studentUid?: string;
    month?: string;
    year?: number;
    assignment?: string;
    classDate?: string;
    status?: string;
}

const getCategoryColor = (category: string) => {
    if (!category) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    if (category.includes('WIFI')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    if (category.includes('VoIP')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    if (category.includes('CCTV')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
    if (category.includes('LAN')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
    if (category.includes('Operations')) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
};

export default function TeamSchedule() {
    const [teamSchedule, setTeamSchedule] = useState<TeamScheduleEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeamSchedule();
    }, []);

    const fetchTeamSchedule = async () => {
        try {
            setLoading(true);

            // Fetch all interns
            const internsQuery = query(collection(db, 'users'), where('role', '==', 'intern'));
            const internsSnapshot = await getDocs(internsQuery);
            const interns = internsSnapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data(),
            })) as User[];

            // Fetch all schedules from attendance collection
            const schedulesSnapshot = await getDocs(collection(db, 'attendance'));
            const schedules = schedulesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as ScheduleData[];

            // Build team schedule entries
            const teamEntries: TeamScheduleEntry[] = interns.map(intern => {
                const internSchedules = schedules.filter(s =>
                    s.internUid === intern.uid || s.studentUid === intern.uid
                );

                const entry: TeamScheduleEntry = {
                    internUid: intern.uid,
                    internName: intern.name,
                };

                internSchedules.forEach(schedule => {
                    if (schedule.month && schedule.assignment) {
                        const month = schedule.month.toLowerCase();
                        if (month === 'september') entry.september = schedule.assignment;
                        else if (month === 'october') entry.october = schedule.assignment;
                        else if (month === 'november') entry.november = schedule.assignment;
                    }
                });

                return entry;
            });

            setTeamSchedule(teamEntries);
        } catch (error) {
            console.error('Error fetching team schedule:', error);
            toast.error('Failed to load team schedule');
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
                <CardTitle>Team Assignment Schedule</CardTitle>
                <CardDescription>Monthly rotation across networking domains</CardDescription>
            </CardHeader>
            <CardContent>
                {teamSchedule.length === 0 ? (
                    <p className="text-center text-muted-foreground">No team assignments found. Supervisor needs to create schedules.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-border">
                                <th className="p-3 text-left font-medium">Name</th>
                                <th className="p-3 text-left font-medium">September</th>
                                <th className="p-3 text-left font-medium">October</th>
                                <th className="p-3 text-left font-medium">November</th>
                            </tr>
                            </thead>
                            <tbody>
                            {teamSchedule.map((member) => (
                                <tr key={member.internUid} className="border-b border-border hover:bg-muted/50">
                                    <td className="p-3 font-medium">{member.internName}</td>
                                    <td className="p-3">
                                        {member.september ? (
                                            <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(member.september)}`}>
                          {member.september}
                        </span>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">Not assigned</span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        {member.october ? (
                                            <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(member.october)}`}>
                          {member.october}
                        </span>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">Not assigned</span>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        {member.november ? (
                                            <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(member.november)}`}>
                          {member.november}
                        </span>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">Not assigned</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                    <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                        <span className="text-xs text-muted-foreground">WIFI</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="text-xs text-muted-foreground">VoIP</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                        <span className="text-xs text-muted-foreground">CCTV</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                        <span className="text-xs text-muted-foreground">LAN</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="h-3 w-3 rounded-full bg-gray-500"></div>
                        <span className="text-xs text-muted-foreground">Operations</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}