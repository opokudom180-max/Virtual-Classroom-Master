'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { LearningModule } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { BookOpen, Plus, X, Wifi, Phone, Camera, Network, Settings, Clock, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface LearningForumProps {
    userRole: 'intern' | 'supervisor';
    onClose?: () => void;
}

export default function LearningForum({ userRole, onClose }: LearningForumProps) {
    const [modules, setModules] = useState<LearningModule[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<'WIFI' | 'VoIP' | 'CCTV' | 'LAN' | 'Operations' | 'Security'>('WIFI');
    const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
    const [estimatedTime, setEstimatedTime] = useState(30);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const categories = ['All', 'WIFI', 'VoIP', 'CCTV', 'LAN', 'Operations', 'Security'];

    useEffect(() => {
        fetchModules();
    }, []);

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'WIFI': return <Wifi className="h-5 w-5 text-blue-600" />;
            case 'VoIP': return <Phone className="h-5 w-5 text-green-600" />;
            case 'CCTV': return <Camera className="h-5 w-5 text-purple-600" />;
            case 'LAN': return <Network className="h-5 w-5 text-orange-600" />;
            case 'Operations': return <Settings className="h-5 w-5 text-gray-600" />;
            case 'Security': return <GraduationCap className="h-5 w-5 text-red-600" />;
            default: return <BookOpen className="h-5 w-5" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'WIFI': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
            case 'VoIP': return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
            case 'CCTV': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
            case 'LAN': return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
            case 'Operations': return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
            case 'Security': return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
            default: return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
        }
    };

    const fetchModules = async () => {
        try {
            setLoading(true);
            const modulesQuery = query(collection(db, 'learningModules'), orderBy('createdAt', 'desc'));
            const modulesSnapshot = await getDocs(modulesQuery);
            const modulesData = modulesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
            })) as LearningModule[];
            setModules(modulesData);
        } catch (error) {
            console.error('Error fetching modules:', error);
            toast.error('Failed to load learning modules');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !description.trim() || !content.trim()) {
            toast.error('Please fill out all fields');
            return;
        }

        try {
            setSubmitting(true);
            const user = auth.currentUser;
            if (!user) throw new Error('Not authenticated');

            await addDoc(collection(db, 'learningModules'), {
                supervisorUid: user.uid,
                title: title.trim(),
                description: description.trim(),
                content: content.trim(),
                category,
                difficulty,
                estimatedTime,
                createdAt: serverTimestamp(),
            });

            setTitle('');
            setDescription('');
            setContent('');
            setCategory('WIFI');
            setDifficulty('Beginner');
            setEstimatedTime(30);
            setShowForm(false);
            fetchModules();
            toast.success('Learning module created successfully!');
        } catch (error) {
            console.error('Error creating module:', error);
            toast.error('Failed to create module');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredModules = selectedCategory === 'All'
        ? modules
        : modules.filter(module => module.category === selectedCategory);

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
        <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <GraduationCap className="h-6 w-6 text-primary" />
                            Learning Forum
                        </CardTitle>
                        <CardDescription className="text-base">
                            {userRole === 'intern' ? 'Access introductory lectures and training materials' : 'Create and manage learning content for interns'}
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {userRole === 'supervisor' && (
                            <Button onClick={() => setShowForm(true)} className="hover:shadow-lg hover:scale-105 transition-all duration-200">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Module
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

            <CardContent className="p-6">
                {/* Category Filter */}
                <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <Button
                                key={cat}
                                variant={selectedCategory === cat ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedCategory(cat)}
                                className="hover:shadow-md hover:scale-105 transition-all duration-200"
                            >
                                {cat !== 'All' && getCategoryIcon(cat)}
                                <span className={cat !== 'All' ? 'ml-2' : ''}>{cat}</span>
                            </Button>
                        ))}
                    </div>
                </div>

                {showForm && userRole === 'supervisor' && (
                    <form onSubmit={handleSubmit} className="space-y-6 mb-8 p-6 border-2 border-primary/20 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg">
                        <h3 className="text-xl font-bold text-primary">Create Learning Module</h3>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="category" className="font-semibold">Category</Label>
                                <Select
                                    id="category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as 'WIFI' | 'VoIP' | 'CCTV' | 'LAN' | 'Operations' | 'Security')}
                                    className="hover:shadow-md transition-shadow"
                                >
                                    <option value="WIFI">WIFI</option>
                                    <option value="VoIP">VoIP</option>
                                    <option value="CCTV">CCTV</option>
                                    <option value="LAN">LAN</option>
                                    <option value="Operations">Operations</option>
                                    <option value="Security">Security</option>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="difficulty" className="font-semibold">Difficulty</Label>
                                <Select
                                    id="difficulty"
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value as 'Beginner' | 'Intermediate' | 'Advanced')}
                                    className="hover:shadow-md transition-shadow"
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="estimatedTime" className="font-semibold">Estimated Time (minutes)</Label>
                                <Input
                                    type="number"
                                    id="estimatedTime"
                                    value={estimatedTime}
                                    onChange={(e) => setEstimatedTime(Number(e.target.value))}
                                    min="5"
                                    max="180"
                                    className="hover:shadow-md transition-shadow"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title" className="font-semibold">Module Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Introduction to WIFI Configuration"
                                className="hover:shadow-md transition-shadow"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="font-semibold">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief overview of what this module covers..."
                                rows={2}
                                className="hover:shadow-md transition-shadow"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content" className="font-semibold">Module Content</Label>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Detailed learning content, step-by-step instructions, key concepts..."
                                rows={8}
                                className="hover:shadow-md transition-shadow"
                                required
                            />
                        </div>

                        <div className="flex gap-4">
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 hover:shadow-xl hover:scale-105 transition-all duration-200 bg-gradient-to-r from-primary to-primary/80"
                            >
                                {submitting ? 'Creating...' : 'Create Module'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => {
                                setShowForm(false);
                                setTitle('');
                                setDescription('');
                                setContent('');
                            }} className="hover:shadow-md transition-shadow">
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}

                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    {filteredModules.length === 0 ? (
                        <div className="text-center py-12 col-span-full">
                            <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg text-muted-foreground">
                                {selectedCategory === 'All'
                                    ? 'No learning modules available yet.'
                                    : `No ${selectedCategory} modules available yet.`}
                            </p>
                        </div>
                    ) : (
                        filteredModules.map((module) => (
                            <Card key={module.id} className="hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 hover:border-primary/30">
                                <CardHeader className={`${getCategoryColor(module.category)} rounded-t-lg`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {getCategoryIcon(module.category)}
                                            <div>
                                                <CardTitle className="text-white text-lg">{module.title}</CardTitle>
                                                <CardDescription className="text-white/90 text-sm">
                                                    {module.description}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 mt-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium bg-white/20 text-white`}>
                      {module.difficulty}
                    </span>
                                        <div className="flex items-center gap-1 text-white/90">
                                            <Clock className="h-4 w-4" />
                                            <span className="text-sm">{module.estimatedTime} min</span>
                                        </div>
                                        <span className="text-xs text-white/80">
                      {format(module.createdAt, 'MMM dd, yyyy')}
                    </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 bg-gradient-to-br from-background to-muted/30">
                                    <div className="prose prose-sm max-w-none dark:prose-invert">
                                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                            {module.content}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}