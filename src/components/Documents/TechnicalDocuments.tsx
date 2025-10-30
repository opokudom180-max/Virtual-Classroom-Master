'use client';

import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { logEvent } from 'firebase/analytics';
import { storage, auth, analytics } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { X, FileText, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface TechnicalDocumentsProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export default function TechnicalDocuments({ onSuccess, onCancel }: TechnicalDocumentsProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<'Manual' | 'Procedure' | 'Troubleshooting' | 'Reference'>('Manual');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !description.trim() || !file) {
            toast.error('Please fill out all fields and select a file');
            return;
        }

        try {
            setUploading(true);
            const user = auth.currentUser;
            if (!user) throw new Error('Not authenticated');

            const timestamp = Date.now();
            const fileName = `${timestamp}_${file.name}`;
            const storageRef = ref(storage, `technical-docs/${fileName}`);

            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // Log analytics event for document upload
            const analyticsInstance = await analytics;
            if (analyticsInstance) {
                logEvent(analyticsInstance, 'upload_technical_document', {
                    title: title.trim(),
                    category: category,
                    file_name: file.name,
                    file_size: file.size,
                    file_type: file.type,
                });
            }

            toast.success(`Technical document uploaded successfully! URL: ${downloadURL}`);
            onSuccess();
        } catch (error) {
            console.error('Error uploading document:', error);
            toast.error('Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Upload Technical Document</h2>
                <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                    <X className="h-5 w-5" />
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="title">Document Title</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., WIFI Configuration Manual"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as 'Manual' | 'Procedure' | 'Troubleshooting' | 'Reference')}
                    >
                        <option value="Manual">Manual</option>
                        <option value="Procedure">Procedure</option>
                        <option value="Troubleshooting">Troubleshooting</option>
                        <option value="Reference">Reference</option>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the document content..."
                    rows={3}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="file">Document File</Label>
                <div className="flex items-center gap-4">
                    <Input
                        type="file"
                        id="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md"
                        required
                        className="flex-1"
                    />
                    {file && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            {file.name}
                        </div>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">
                    Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT, MD
                </p>
            </div>

            <div className="flex gap-4">
                <Button type="submit" disabled={uploading} className="flex-1">
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Upload Document'}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}