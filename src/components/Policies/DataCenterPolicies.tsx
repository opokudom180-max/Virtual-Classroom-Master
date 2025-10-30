'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { DataCenterPolicy } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Shield, Plus, AlertTriangle, Info, X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface DataCenterPoliciesProps {
    userRole: 'intern' | 'supervisor';
    onClose?: () => void;
}

export default function DataCenterPolicies({ userRole, onClose }: DataCenterPoliciesProps) {
    const [policies, setPolicies] = useState<DataCenterPolicy[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<'Safety' | 'Security' | 'Operations' | 'General'>('General');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
    const [effectiveDate, setEffectiveDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            setLoading(true);
            const policiesQuery = query(collection(db, 'policies'), orderBy('createdAt', 'desc'));
            const policiesSnapshot = await getDocs(policiesQuery);
            const policiesData = policiesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                effectiveDate: doc.data().effectiveDate?.toDate(),
                createdAt: doc.data().createdAt?.toDate(),
            })) as DataCenterPolicy[];
            setPolicies(policiesData);
        } catch (error) {
            console.error('Error fetching policies:', error);
            toast.error('Failed to load policies');
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

            await addDoc(collection(db, 'policies'), {
                supervisorUid: user.uid,
                title: title.trim(),
                content: content.trim(),
                category,
                priority,
                effectiveDate: new Date(effectiveDate),
                createdAt: serverTimestamp(),
            });

            setTitle('');
            setContent('');
            setCategory('General');
            setPriority('Medium');
            setShowForm(false);
            fetchPolicies();
            toast.success('Policy added successfully!');
        } catch (error) {
            console.error('Error adding policy:', error);
            toast.error('Failed to add policy');
        } finally {
            setSubmitting(false);
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'Critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
            case 'High': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
            case 'Medium': return <Info className="h-4 w-4 text-blue-600" />;
            default: return <Info className="h-4 w-4 text-gray-600" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border-red-200';
            case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-orange-200';
            case 'Medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 border-gray-200';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Safety': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
            case 'Security': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
            case 'Operations': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
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
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-6 w-6 text-primary" />
                            Data Center Policies & Regulations
                        </CardTitle>
                        <CardDescription>
                            {userRole === 'intern' ? 'Important policies and regulations to follow' : 'Manage data center policies and regulations'}
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {userRole === 'supervisor' && (
                            <Button onClick={() => setShowForm(true)} className="hover:shadow-lg transition-shadow">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Policy
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
                {showForm && userRole === 'supervisor' && (
                    <form onSubmit={handleSubmit} className="space-y-6 mb-6 p-4 border border-border rounded-lg bg-muted/30">
                        <h3 className="text-lg font-semibold">Add New Policy</h3>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    id="category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as 'Safety' | 'Security' | 'Operations' | 'General')}
                                >
                                    <option value="Safety">Safety</option>
                                    <option value="Security">Security</option>
                                    <option value="Operations">Operations</option>
                                    <option value="General">General</option>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select
                                    id="priority"
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as 'Low' | 'Medium' | 'High' | 'Critical')}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="effectiveDate">Effective Date</Label>
                                <Input
                                    type="date"
                                    id="effectiveDate"
                                    value={effectiveDate}
                                    onChange={(e) => setEffectiveDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Policy Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Server Room Access Protocol"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content">Policy Content</Label>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Detailed policy description, rules, and procedures..."
                                rows={6}
                                required
                            />
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit" disabled={submitting} className="flex-1 hover:shadow-lg transition-shadow">
                                {submitting ? 'Adding...' : 'Add Policy'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => {
                                setShowForm(false);
                                setTitle('');
                                setContent('');
                            }}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}

                <div className="space-y-4">
                    {policies.length === 0 ? (
                        <div className="text-center py-8">
                            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No policies published yet.</p>
                        </div>
                    ) : (
                        policies.map((policy) => (
                            <div key={policy.id} className={`rounded-lg border p-4 hover:shadow-md transition-shadow ${getPriorityColor(policy.priority)}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-3">
                                        {getPriorityIcon(policy.priority)}
                                        <div>
                                            <h4 className="font-semibold">{policy.title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(policy.category)}`}>
                          {policy.category}
                        </span>
                                                <span className="text-xs text-muted-foreground">
                          Effective: {format(policy.effectiveDate, 'MMM dd, yyyy')}
                        </span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${getPriorityColor(policy.priority)}`}>
                    {policy.priority}
                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{policy.content}</p>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}