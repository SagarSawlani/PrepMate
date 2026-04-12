'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, XCircle, LogOut, BookOpen } from 'lucide-react';

const EXAMS = ['JEE', 'NEET', 'GRE', 'CAT'];

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface TrackedFile {
  file: File;          // actual File object for FormData
  status: UploadStatus;
  message?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedExam, setSelectedExam] = useState(EXAMS[0]);
  const [files, setFiles] = useState<TrackedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleExamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedExam(e.target.value);
    setFiles([]);
  };

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const existing = new Set(files.map(f => f.file.name));
    const newEntries: TrackedFile[] = Array.from(fileList)
      .filter(f => !existing.has(f.name))
      .map(f => ({ file: f, status: 'idle' }));
    setFiles(prev => [...prev, ...newEntries]);
  };

  const handleUpload = async () => {
    const toUpload = files.filter(f => f.status === 'idle');
    if (toUpload.length === 0) return;

    setFiles(prev => prev.map(f => f.status === 'idle' ? { ...f, status: 'uploading' } : f));

    for (const entry of toUpload) {
      try {
        const formData = new FormData();
        formData.append('file', entry.file);
        // exam sent as query param to match FastAPI route signature
        const resp = await fetch(`http://localhost:8000/upload-documents?exam=${encodeURIComponent(selectedExam)}`, {
          method: 'POST',
          body: formData,
        });

        const ok = resp.ok;
        const data = await resp.json().catch(() => ({}));
        // Safely stringify detail — Pydantic may return an array of error objects
        const errMsg = Array.isArray(data.detail)
          ? data.detail.map((e: { msg?: string }) => e.msg || JSON.stringify(e)).join(', ')
          : (typeof data.detail === 'string' ? data.detail : 'Upload failed');
        setFiles(prev => prev.map(f =>
          f.file.name === entry.file.name
            ? { ...f, status: ok ? 'success' : 'error', message: ok ? 'Uploaded successfully' : errMsg }
            : f
        ));
      } catch {
        setFiles(prev => prev.map(f =>
          f.file.name === entry.file.name ? { ...f, status: 'error', message: 'Network error' } : f
        ));
      }
    }
  };

  const removeFile = (name: string) => setFiles(prev => prev.filter(f => f.file.name !== name));

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const statusIcon = (status: UploadStatus) => {
    if (status === 'success') return <CheckCircle size={16} className="text-green-500" />;
    if (status === 'error') return <XCircle size={16} className="text-destructive" />;
    if (status === 'uploading') return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
    return <FileText size={16} className="text-muted-foreground" />;
  };

  const idleCount = files.filter(f => f.status === 'idle').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Top bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">P</div>
            <span className="font-bold text-foreground">PrepMate</span>
            <span className="text-muted-foreground text-sm px-2 py-0.5 bg-muted rounded-full">Admin Portal</span>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-2"
            onClick={() => router.push('/login')}>
            <LogOut size={16} /> Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Portal</h1>
          <p className="text-muted-foreground mt-1">Manage exam documents and knowledge base</p>
        </div>

        {/* Exam selector */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-primary" />
              <CardTitle className="text-lg">Select Exam</CardTitle>
            </div>
            <CardDescription>Choose the exam you want to upload documents for</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              value={selectedExam}
              onChange={handleExamChange}
              className="w-full max-w-sm px-4 py-3 border-2 border-primary/30 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 hover:border-primary/50 cursor-pointer"
            >
              {EXAMS.map(exam => (
                <option key={exam} value={exam}>{exam}</option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Upload section */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload size={18} className="text-primary" />
              <CardTitle className="text-lg">Upload Documents</CardTitle>
            </div>
            <CardDescription>
              Upload PDFs, Word docs, or text files for <strong className="text-primary">{selectedExam}</strong>. These will be added to the knowledge base.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
            >
              <Upload size={32} className={`mx-auto mb-3 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="font-semibold text-foreground mb-1">Drop files here or click to browse</p>
              <p className="text-sm text-muted-foreground">Supports PDF, DOCX, TXT — up to 50 MB each</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
              />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((entry) => (
                  <div key={entry.file.name}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-muted/20 animate-in fade-in slide-in-from-left-2 duration-200">
                    <div className="shrink-0">{statusIcon(entry.status)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{entry.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtSize(entry.file.size)}
                        {entry.message && (
                          <span className={` • ${entry.status === 'error' ? 'text-destructive' : 'text-green-600'}`}>
                            {entry.message}
                          </span>
                        )}
                      </p>
                    </div>
                    {entry.status !== 'uploading' && (
                      <button onClick={() => removeFile(entry.file.name)}
                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={idleCount === 0}
                className="bg-primary hover:bg-primary/90 gap-2"
              >
                <Upload size={16} />
                Upload {idleCount > 0 ? `${idleCount} file${idleCount > 1 ? 's' : ''}` : 'Files'} to {selectedExam}
              </Button>
              {files.length > 0 && (
                <Button variant="outline" onClick={() => setFiles([])}>Clear All</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {files.length > 0 && (
          <div className="grid grid-cols-3 gap-4 animate-in fade-in duration-300">
            {[
              { label: 'Pending', count: files.filter(f => f.status === 'idle').length, color: 'text-muted-foreground' },
              { label: 'Uploaded', count: files.filter(f => f.status === 'success').length, color: 'text-green-600' },
              { label: 'Failed', count: files.filter(f => f.status === 'error').length, color: 'text-destructive' },
            ].map(stat => (
              <Card key={stat.label} className="border-border/60 text-center py-4">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
