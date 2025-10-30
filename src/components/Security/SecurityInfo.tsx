'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { SecurityInfo as SecurityInfoType } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Shield, Plus, X, Phone, Key, AlertTriangle, Eye, EyeOff, Copy, Lock } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface SecurityInfoProps {
    userRole: 'intern' | 'supervisor';
    onClose?: () => void;
}

export default function SecurityInfo({ userRole, onClose }: SecurityInfoProps) {
    const [securityItems, setSecurityItems] = useState<SecurityInfoType[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
    const [title, setTitle] = useState('');
    const [type, setType] = useState<'Emergency Contact' | 'Password' | 'Procedure'>('Emergency Contact');
    const [contact, setContact] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<'Emergency' | 'Systems' | 'Network' | 'General'>('Emergency');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const categories = ['All', 'Emergency', 'Systems', 'Network', 'General'];

    useEffect(() => {
        fetchSecurityInfo();
    }, []);

    const fetchSecurityInfo = async () => {
        try {
            setLoading(true);
            const securityQuery = query(collection(db, 'securityInfo'), orderBy('lastUpdated', 'desc'));
            const securitySnapshot = await getDocs(securityQuery);
            const securityData = securitySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                lastUpdated: doc.data().lastUpdated?.toDate(),
            })) as SecurityInfoType[];
            setSecurityItems(securityData);
        } catch (error) {
            console.error('Error fetching security info:', error);
            toast.error('Failed to load security information');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !description.trim()) {
            toast.error('Please fill out required fields');
            return;
        }

        if (type === 'Emergency Contact' && !contact.trim()) {
            toast.error('Please provide contact information');
            return;
        }

        if (type === 'Password' && (!username.trim() || !password.trim())) {
            toast.error('Please provide username and password');
            return;
        }

        try {
            setSubmitting(true);
            const user = auth.currentUser;
            if (!user) throw new Error('Not authenticated');

            await addDoc(collection(db, 'securityInfo'), {
                supervisorUid: user.uid,
                title: title.trim(),
                type,
                contact: contact.trim() || null,
                username: username.trim() || null,
                password: password.trim() || null,
                description: description.trim(),
                category,
                lastUpdated: serverTimestamp(),
            });

            // Reset form
            setTitle('');
            setContact('');
            setUsername('');
            setPassword('');
            setDescription('');
            setType('Emergency Contact');
            setCategory('Emergency');
            setShowForm(false);

            fetchSecurityInfo();
            toast.success('Security information added successfully!');
        } catch (error) {
            console.error('Error adding security info:', error);
            toast.error('Failed to add security information');
        } finally {
            setSubmitting(false);
        }
    };

    const togglePasswordVisibility = (itemId: string) => {
        setShowPasswords(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${type} copied to clipboard!`);
        } catch {
            toast.error('Failed to copy to clipboard');
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Emergency Contact': return <Phone className="h-5 w-5 text-red-600" />;
            case 'Password': return <Key className="h-5 w-5 text-blue-600" />;
            case 'Procedure': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
            default: return <Shield className="h-5 w-5" />;
        }
    };

    const getCategoryGradient = (category: string) => {
        switch (category) {
            case 'Emergency': return 'bg-gradient-to-r from-red-500 to-red-600';
            case 'Systems': return 'bg-gradient-to-r from-blue-500 to-blue-600';
            case 'Network': return 'bg-gradient-to-r from-green-500 to-green-600';
            default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
        }
    };

    const filteredItems = selectedCategory === 'All'
        ? securityItems
        : securityItems.filter(item => item.category === selectedCategory);

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
        <Card className="shadow-xl border-2 border-primary/20">
            <CardHeader className="bg-gradient-to-r from-red-500/10 to-orange-500/10">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Shield className="h-6 w-6 text-red-600" />
                            Security Center
                        </CardTitle>
                        <CardDescription className="text-base">
                            Emergency contacts, system passwords, and security procedures
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {userRole === 'supervisor' && (
                            <Button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-700 hover:shadow-lg hover:scale-105 transition-all duration-200">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Security Item
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
                                className={`hover:shadow-lg hover:scale-105 transition-all duration-200 ${
                                    selectedCategory === cat ? 'bg-red-600 hover:bg-red-700' : 'hover:border-red-300'
                                }`}
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                </div>

                {showForm && userRole === 'supervisor' && (
                    <form onSubmit={handleSubmit} className="space-y-6 mb-8 p-6 border-2 border-red-200 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 shadow-lg">
                        <h3 className="text-xl font-bold text-red-700 dark:text-red-400">Add Security Information</h3>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="type" className="font-semibold">Type</Label>
                                <Select
                                    id="type"
                                    value={type}
                                    onChange={(e) => setType(e.target.value as 'Emergency Contact' | 'Password' | 'Procedure')}
                                    className="hover:shadow-md transition-shadow"
                                >
                                    <option value="Emergency Contact">Emergency Contact</option>
                                    <option value="Password">Password</option>
                                    <option value="Procedure">Procedure</option>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category" className="font-semibold">Category</Label>
                                <Select
                                    id="category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as 'Emergency' | 'Systems' | 'Network' | 'General')}
                                    className="hover:shadow-md transition-shadow"
                                >
                                    <option value="Emergency">Emergency</option>
                                    <option value="Systems">Systems</option>
                                    <option value="Network">Network</option>
                                    <option value="General">General</option>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title" className="font-semibold">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Data Center Emergency Hotline"
                                className="hover:shadow-md transition-shadow"
                                required
                            />
                        </div>

                        {type === 'Emergency Contact' && (
                            <div className="space-y-2">
                                <Label htmlFor="contact" className="font-semibold">Contact Information</Label>
                                <Input
                                    id="contact"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    placeholder="Phone number or email"
                                    className="hover:shadow-md transition-shadow"
                                    required
                                />
                            </div>
                        )}

                        {type === 'Password' && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="font-semibold">Username</Label>
                                    <Input
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="System username"
                                        className="hover:shadow-md transition-shadow"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="font-semibold">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="System password"
                                        className="hover:shadow-md transition-shadow"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="description" className="font-semibold">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="When and how to use this information..."
                                rows={4}
                                className="hover:shadow-md transition-shadow"
                                required
                            />
                        </div>

                        <div className="flex gap-4">
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 bg-red-600 hover:bg-red-700 hover:shadow-xl hover:scale-105 transition-all duration-200"
                            >
                                {submitting ? 'Adding...' : 'Add Security Item'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => {
                                setShowForm(false);
                                setTitle('');
                                setContact('');
                                setUsername('');
                                setPassword('');
                                setDescription('');
                            }} className="hover:shadow-md transition-shadow">
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}

                <div className="grid gap-6 md:grid-cols-1">
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-12">
                            <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg text-muted-foreground">
                                {selectedCategory === 'All'
                                    ? 'No security information available yet.'
                                    : `No ${selectedCategory.toLowerCase()} items available yet.`}
                            </p>
                        </div>
                    ) : (
                        filteredItems.map((item) => (
                            <Card key={item.id} className="hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-2 hover:border-red-300">
                                <CardHeader className={`${getCategoryGradient(item.category)} text-white rounded-t-lg`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {getTypeIcon(item.type)}
                                            <div>
                                                <CardTitle className="text-white">{item.title}</CardTitle>
                                                <CardDescription className="text-white/90">
                                                    {item.type} • Last updated: {format(item.lastUpdated, 'MMM dd, yyyy')}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <span className="bg-white/20 text-white px-2 py-1 rounded text-xs font-medium">
                      {item.category}
                    </span>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-6 bg-gradient-to-br from-background to-muted/20">
                                    <div className="space-y-4">
                                        <p className="text-sm leading-relaxed">{item.description}</p>

                                        {item.contact && (
                                            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-sm font-medium text-red-800 dark:text-red-200">Emergency Contact:</span>
                                                        <p className="text-lg font-mono text-red-900 dark:text-red-100">{item.contact}</p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => copyToClipboard(item.contact!, 'Contact')}
                                                        className="hover:shadow-md transition-shadow"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {item.username && item.password && (
                                            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200">
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Username:</span>
                                                            <p className="text-lg font-mono text-blue-900 dark:text-blue-100">{item.username}</p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => copyToClipboard(item.username!, 'Username')}
                                                            className="hover:shadow-md transition-shadow"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Password:</span>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-lg font-mono text-blue-900 dark:text-blue-100">
                                                                    {showPasswords[item.id] ? item.password : '••••••••'}
                                                                </p>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => togglePasswordVisibility(item.id)}
                                                                    className="hover:shadow-md transition-shadow"
                                                                >
                                                                    {showPasswords[item.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => copyToClipboard(item.password!, 'Password')}
                                                            className="hover:shadow-md transition-shadow"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
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