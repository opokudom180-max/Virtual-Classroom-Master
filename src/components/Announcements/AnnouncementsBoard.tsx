'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, orderBy, query, doc, getDoc } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import { db, auth, analytics } from '@/lib/firebase';
import { Announcement } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AnnouncementsBoard() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [userRole, setUserRole] = useState<'intern' | 'supervisor' | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) return;

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                setUserRole(userDoc.data().role as 'intern' | 'supervisor');
            }

            const announcementsQuery = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
            const announcementsSnapshot = await getDocs(announcementsQuery);
            const announcementsData = announcementsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
            })) as Announcement[];
            setAnnouncements(announcementsData);
        } catch (error) {
            console.error('Error fetching announcements:', error);
            toast.error('Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            toast.error('Please fill out all fields');
            return;
        }

        try {
            setSubmitting(true);
            const user = auth.currentUser;
            if (!user) throw new Error('Not authenticated');

            if (editingId) {
                // Update existing announcement
                await updateDoc(doc(db, 'announcements', editingId), {
                    title: title.trim(),
                    content: content.trim(),
                });
                toast.success('Announcement updated successfully!');
            } else {
                // Create new announcement
                await addDoc(collection(db, 'announcements'), {
                    supervisorUid: user.uid,
                    teacherUid: user.uid, // Backward compatibility
                    title: title.trim(),
                    content: content.trim(),
                    priority: 'Medium',
                    category: 'General',
                    createdAt: serverTimestamp(),
                });

                // Log analytics event for announcement posting
                const analyticsInstance = await analytics;
                if (analyticsInstance) {
                    logEvent(analyticsInstance, 'post_announcement', {
                        title_length: title.trim().length,
                        content_length: content.trim().length,
                    });
                }
                toast.success('Announcement posted successfully!');
            }

            setTitle('');
            setContent('');
            setShowForm(false);
            setEditingId(null);
            fetchData();
        } catch (error) {
            console.error('Error saving announcement:', error);
            toast.error('Failed to save announcement');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (announcement: Announcement) => {
        setEditingId(announcement.id);
        setTitle(announcement.title);
        setContent(announcement.content);
        setShowForm(true);
    };

    const handleDelete = async (announcementId: string) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;

        try {
            await deleteDoc(doc(db, 'announcements', announcementId));
            fetchData();
            toast.success('Announcement deleted successfully!');
        } catch (error) {
            console.error('Error deleting announcement:', error);
            toast.error('Failed to delete announcement');
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setTitle('');
        setContent('');
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
                        <CardTitle>Announcements</CardTitle>
                        <CardDescription>Latest updates and notices</CardDescription>
                    </div>
                    {userRole === 'supervisor' && !showForm && (
                        <Button onClick={() => setShowForm(true)}>Post Announcement</Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {showForm && userRole === 'supervisor' && (
                    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border p-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Announcement title"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="content">Content</Label>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Announcement content"
                                rows={4}
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={submitting}>
                                {submitting ? (editingId ? 'Updating...' : 'Posting...') : (editingId ? 'Update' : 'Post')}
                            </Button>
                            <Button type="button" variant="outline" onClick={handleCancel}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}

                {announcements.length === 0 ? (
                    <p className="text-center text-muted-foreground">No announcements yet.</p>
                ) : (
                    <div className="space-y-4">
                        {announcements.map((announcement) => (
                            <div key={announcement.id} className="rounded-lg border border-border p-4">
                                <div className="flex items-start justify-between">
                                    <h4 className="font-semibold">{announcement.title}</h4>
                                    <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {announcement.createdAt ? format(announcement.createdAt, 'MMM dd, yyyy') : 'N/A'}
                    </span>
                                        {userRole === 'supervisor' && (
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(announcement)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(announcement.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">{announcement.content}</p>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}