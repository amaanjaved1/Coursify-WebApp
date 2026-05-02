"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  message: string;
}

export default function UploadDistribution() {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    message: ''
  });
  const [formData, setFormData] = useState({
    courseCode: '',
    semester: '',
    year: '',
    professor: '',
    notes: '',
    file: null as File | null
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file || !formData.courseCode || !formData.semester || !formData.year) {
      setUploadState({
        status: 'error',
        message: 'Please fill in all required fields and select a file.'
      });
      return;
    }

    setUploadState({ status: 'uploading', message: '' });

    try {
      const submitData = new FormData();
      submitData.append('file', formData.file);
      submitData.append('courseCode', formData.courseCode);
      submitData.append('semester', formData.semester);
      submitData.append('year', formData.year);
      submitData.append('professor', formData.professor);
      submitData.append('notes', formData.notes);

      const response = await fetch('/api/upload-distribution', {
        method: 'POST',
        body: submitData
      });

      if (response.ok) {
        setUploadState({
          status: 'success',
          message: 'Grade distribution uploaded successfully! Our team will review it shortly.'
        });
        // Reset form
        setFormData({
          courseCode: '',
          semester: '',
          year: '',
          professor: '',
          notes: '',
          file: null
        });
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        const error = await response.text();
        setUploadState({
          status: 'error',
          message: error || 'Failed to upload distribution. Please try again.'
        });
      }
    } catch (error) {
      setUploadState({
        status: 'error',
        message: 'Network error. Please check your connection and try again.'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Grade Distribution
        </CardTitle>
        <CardDescription>
          Help expand our database by uploading grade distribution data you have access to.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="courseCode">Course Code *</Label>
              <Input
                id="courseCode"
                placeholder="e.g., CISC 124"
                value={formData.courseCode}
                onChange={(e) => handleInputChange('courseCode', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="semester">Semester *</Label>
              <Input
                id="semester"
                placeholder="e.g., Fall, Winter, Summer"
                value={formData.semester}
                onChange={(e) => handleInputChange('semester', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                placeholder="e.g., 2024"
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="professor">Professor (Optional)</Label>
            <Input
              id="professor"
              placeholder="e.g., Dr. Smith"
              value={formData.professor}
              onChange={(e) => handleInputChange('professor', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="file">Grade Distribution File *</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.xlsx,.csv"
              onChange={handleFileChange}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Accepted formats: PDF, Images (PNG, JPG), Excel, CSV
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional context about this grade distribution..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          {uploadState.status !== 'idle' && (
            <Alert className={uploadState.status === 'error' ? 'border-red-200 bg-red-50' : uploadState.status === 'success' ? 'border-green-200 bg-green-50' : ''}>
              {uploadState.status === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
              {uploadState.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {uploadState.status === 'uploading' && <FileText className="h-4 w-4 text-blue-600" />}
              <AlertDescription className={uploadState.status === 'error' ? 'text-red-700' : uploadState.status === 'success' ? 'text-green-700' : 'text-blue-700'}>
                {uploadState.status === 'uploading' ? 'Uploading...' : uploadState.message}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            disabled={uploadState.status === 'uploading'}
            className="w-full"
          >
            {uploadState.status === 'uploading' ? 'Uploading...' : 'Upload Distribution'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}