'use client';

import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { logEvent } from 'firebase/analytics';
import { storage, auth, analytics } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface FileUploadProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export default function FileUpload({ onSuccess, onCancel }: FileUploadProps) {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !file) {
            toast.error('Please provide a title and select a file');
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

            // Log analytics event for technical document upload
            const analyticsInstance = await analytics;
            if (analyticsInstance) {
                logEvent(analyticsInstance, 'upload_technical_document', {
                    file_name: file.name,
                    file_size: file.size,
                    file_type: file.type,
                });
            }

            toast.success(`File uploaded! URL: ${downloadURL}`);
            onSuccess();
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Upload Technical Document</h2>
                <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                    <X className="h-5 w-5"/>
                </Button>
            </div>

            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="File title or description"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input
                    type="file"
                    id="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    required
                />
                <p className="text-sm text-muted-foreground">Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT</p>
            </div>

            <div className="flex gap-4">
                <Button type="submit" disabled={uploading} className="flex-1">
                    {uploading ? 'Uploading...' : 'Upload File'}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}