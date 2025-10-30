'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { WeeklyReport } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Star, X, FileText, Send } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface WeeklyReportsProps {
    userRole: 'intern' | 'supervisor';
    onClose?: () => void;
}

export default function WeeklyReports({ userRole, onClose }: WeeklyReportsProps) {
    const [reports, setReports] = useState<WeeklyReport[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [week, setWeek] = useState(1);
    const [month, setMonth] = useState('September');
    const [year] = useState(new Date().getFullYear());
    const [teamAssignment, setTeamAssignment] = useState('');
    const [learnings, setLearnings] = useState('');
    const [difficulties, setDifficulties] = useState('');
    const [teamLeadRating, setTeamLeadRating] = useState(5);
    const [additionalComments, setAdditionalComments] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const months = ['September', 'October', 'November', 'December'];
    const weeks = [1, 2, 3, 4];

    useEffect(() => {
        fetchReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) return;

            let reportsQuery;
            if (userRole === 'intern') {
                reportsQuery = query(
                    collection(db, 'weeklyReports'),
                    where('internUid', '==', user.uid),
                    orderBy('submittedAt', 'desc')
                );
            } else {
                reportsQuery = query(
                    collection(db, 'weeklyReports'),
                    orderBy('submittedAt', 'desc')
                );
            }

            const reportsSnapshot = await getDocs(reportsQuery);
            const reportsData = reportsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    internUid: data.internUid || '',
                    week: data.week || 1,
                    month: data.month || '',
                    year: data.year || new Date().getFullYear(),
                    teamAssignment: data.teamAssignment || '',
                    learnings: data.learnings || '',
                    difficulties: data.difficulties || '',
                    teamLeadRating: data.teamLeadRating || 1,
                    additionalComments: data.additionalComments || '',
                    submittedAt: data.submittedAt?.toDate() || new Date(),
                } as WeeklyReport;
            });

            setReports(reportsData);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!teamAssignment || !learnings.trim() || !difficulties.trim()) {
            toast.error('Please fill out all required fields');
            return;
        }

        try {
            setSubmitting(true);
            const user = auth.currentUser;
            if (!user) throw new Error('Not authenticated');

            await addDoc(collection(db, 'weeklyReports'), {
                internUid: user.uid,
                week,
                month,
                year,
                teamAssignment,
                learnings: learnings.trim(),
                difficulties: difficulties.trim(),
                teamLeadRating,
                additionalComments: additionalComments.trim() || null,
                submittedAt: serverTimestamp(),
            });

            // Reset form
            setWeek(1);
            setTeamAssignment('');
            setLearnings('');
            setDifficulties('');
            setTeamLeadRating(5);
            setAdditionalComments('');
            setShowForm(false);

            fetchReports();
            toast.success('Weekly report submitted successfully!');
        } catch (error) {
            console.error('Error submitting report:', error);
            toast.error('Failed to submit report');
        } finally {
            setSubmitting(false);
        }
    };

    const StarRating = ({ rating }: { rating: number }) => (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
                <Star
                    key={star}
                    className={`h-4 w-4 ${
                        star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                    }`}
                />
            ))}
        </div>
    );

    const getRatingColor = (rating: number) => {
        if (rating >= 4) return 'text-green-600';
        if (rating >= 3) return 'text-blue-600';
        if (rating >= 2) return 'text-yellow-600';
        return 'text-red-600';
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
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Weekly Reports</CardTitle>
                        <CardDescription>
                            {userRole === 'intern' ? 'Submit your weekly team experience reports' : 'Review intern weekly reports'}
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {userRole === 'intern' && (
                            <Button onClick={() => setShowForm(true)} className="hover:shadow-lg transition-shadow">
                                <Send className="mr-2 h-4 w-4" />
                                New Report
                            </Button>
                        )}
                        {onClose && (
                            <Button variant="ghost" size="sm" onClick={onClose}>
                                <X className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {showForm && userRole === 'intern' && (
                    <form onSubmit={handleSubmit} className="space-y-6 mb-6 p-4 border border-border rounded-lg bg-muted/30">
                        <h3 className="text-lg font-semibold">Submit Weekly Report</h3>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="week">Week</Label>
                                <Select
                                    id="week"
                                    value={week.toString()}
                                    onChange={(e) => setWeek(Number(e.target.value))}
                                >
                                    {weeks.map(w => (
                                        <option key={w} value={w}>Week {w}</option>
                                    ))}
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="month">Month</Label>
                                <Select
                                    id="month"
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                >
                                    {months.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="teamAssignment">Team Assignment</Label>
                                <Select
                                    id="teamAssignment"
                                    value={teamAssignment}
                                    onChange={(e) => setTeamAssignment(e.target.value)}
                                    required
                                >
                                    <option value="">Select Team</option>
                                    <option value="WIFI">WIFI</option>
                                    <option value="VoIP">VoIP</option>
                                    <option value="CCTV">CCTV</option>
                                    <option value="LAN">LAN</option>
                                    <option value="Operations">Operations</option>
                                    <option value="WIFI/CCTV">WIFI/CCTV</option>
                                    <option value="VoIP/LAN">VoIP/LAN</option>
                                    <option value="CCTV/LAN">CCTV/LAN</option>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="learnings">What did you learn this week?</Label>
                            <Textarea
                                id="learnings"
                                value={learnings}
                                onChange={(e) => setLearnings(e.target.value)}
                                placeholder="Describe the key concepts, skills, and knowledge you gained..."
                                rows={4}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="difficulties">What difficulties did you face?</Label>
                            <Textarea
                                id="difficulties"
                                value={difficulties}
                                onChange={(e) => setDifficulties(e.target.value)}
                                placeholder="Describe any challenges, problems, or areas where you struggled..."
                                rows={4}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="teamLeadRating">Rate your relationship with your team lead (1-5)</Label>
                            <div className="flex items-center gap-4">
                                <Select
                                    id="teamLeadRating"
                                    value={teamLeadRating.toString()}
                                    onChange={(e) => setTeamLeadRating(Number(e.target.value))}
                                >
                                    <option value="1">1 - Poor</option>
                                    <option value="2">2 - Fair</option>
                                    <option value="3">3 - Good</option>
                                    <option value="4">4 - Very Good</option>
                                    <option value="5">5 - Excellent</option>
                                </Select>
                                <StarRating rating={teamLeadRating} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="additionalComments">Additional Comments (Optional)</Label>
                            <Textarea
                                id="additionalComments"
                                value={additionalComments}
                                onChange={(e) => setAdditionalComments(e.target.value)}
                                placeholder="Any additional feedback, suggestions, or observations..."
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit" disabled={submitting} className="flex-1 hover:shadow-lg transition-shadow">
                                {submitting ? 'Submitting...' : 'Submit Report'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => {
                                setShowForm(false);
                                setLearnings('');
                                setDifficulties('');
                                setAdditionalComments('');
                            }}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}

                <div className="space-y-4">
                    {reports.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                                {userRole === 'intern' ? 'No reports submitted yet.' : 'No reports available yet.'}
                            </p>
                        </div>
                    ) : (
                        reports.map((report) => (
                            <div key={report.id} className="rounded-lg border border-border p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="font-semibold">
                                            Week {report.week} - {report.month} {report.year}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Team: {report.teamAssignment}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-muted-foreground">
                                            {format(report.submittedAt, 'MMM dd, yyyy')}
                                        </div>
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="text-sm">Team Lead:</span>
                                            <StarRating rating={report.teamLeadRating} />
                                            <span className={`text-sm font-medium ${getRatingColor(report.teamLeadRating)}`}>
                        {report.teamLeadRating}/5
                      </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <h5 className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">Learnings</h5>
                                        <p className="text-sm text-muted-foreground">{report.learnings}</p>
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-1">Difficulties</h5>
                                        <p className="text-sm text-muted-foreground">{report.difficulties}</p>
                                    </div>
                                </div>

                                {report.additionalComments && (
                                    <div className="mt-4 pt-4 border-t border-border">
                                        <h5 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Additional Comments</h5>
                                        <p className="text-sm text-muted-foreground">{report.additionalComments}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}