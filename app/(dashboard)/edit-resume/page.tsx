'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading-spinner';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { ResumeData } from '@/types';

export default function EditResumePage() {
  const [user] = useAuthState(auth!);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);

  useEffect(() => {
    const fetchResumeData = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/resume-data?userId=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setResumeData(data.resumeData || getEmptyResumeData());
        } else {
          setResumeData(getEmptyResumeData());
        }
      } catch (error) {
        console.error('Error fetching resume data:', error);
        setResumeData(getEmptyResumeData());
      } finally {
        setLoading(false);
      }
    };

    fetchResumeData();
  }, [user]);

  const getEmptyResumeData = (): ResumeData => ({
    contactInfo: { name: '', email: '', phone: '', location: '', socialLinks: [] },
    summary: '',
    experience: [],
    education: [],
    projects: [],
    skills: { technical: [], soft: [] },
    achievements: [],
    certifications: [],
    languages: [],
    interests: [],
  });

  const handleSave = async () => {
    if (!user || !resumeData) return;

    setSaving(true);
    try {
      const response = await fetch('/api/resume-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          resumeData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save resume data');
      }

      alert('Resume data saved successfully!');
    } catch (error) {
      console.error('Error saving resume data:', error);
      alert('Failed to save resume data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addExperience = () => {
    if (!resumeData) return;
    setResumeData({
      ...resumeData,
      experience: [
        ...(resumeData.experience || []),
        {
          company: '',
          title: '',
          date: '',
          location: '',
          industry: '',
          points: [''],
          achievements: [],
        },
      ],
    });
  };

  const removeExperience = (index: number) => {
    if (!resumeData) return;
    setResumeData({
      ...resumeData,
      experience: resumeData.experience?.filter((_, i) => i !== index) || [],
    });
  };

  const updateExperience = (index: number, field: string, value: any) => {
    if (!resumeData || !resumeData.experience) return;
    const updated = [...resumeData.experience];
    (updated[index] as any)[field] = value;
    setResumeData({ ...resumeData, experience: updated });
  };

  const addEducation = () => {
    if (!resumeData) return;
    setResumeData({
      ...resumeData,
      education: [
        ...(resumeData.education || []),
        {
          school: '',
          degree: '',
          date: '',
          location: '',
          details: '',
          grade: '',
        },
      ],
    });
  };

  const removeEducation = (index: number) => {
    if (!resumeData) return;
    setResumeData({
      ...resumeData,
      education: resumeData.education?.filter((_, i) => i !== index) || [],
    });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    if (!resumeData || !resumeData.education) return;
    const updated = [...resumeData.education];
    (updated[index] as any)[field] = value;
    setResumeData({ ...resumeData, education: updated });
  };

  if (loading) {
    return <Loading text="Loading resume data..." />;
  }

  if (!resumeData) {
    return <div>Error loading resume data</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Resume Data</h1>
          <p className="text-muted-foreground mt-2">
            Manage your resume information. This data will be reused when generating new resumes.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                value={resumeData.contactInfo?.name || ''}
                onChange={(e) =>
                  setResumeData({
                    ...resumeData,
                    contactInfo: { ...resumeData.contactInfo!, name: e.target.value },
                  })
                }
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={resumeData.contactInfo?.email || ''}
                onChange={(e) =>
                  setResumeData({
                    ...resumeData,
                    contactInfo: { ...resumeData.contactInfo!, email: e.target.value },
                  })
                }
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={resumeData.contactInfo?.phone || ''}
                onChange={(e) =>
                  setResumeData({
                    ...resumeData,
                    contactInfo: { ...resumeData.contactInfo!, phone: e.target.value },
                  })
                }
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                value={resumeData.contactInfo?.location || ''}
                onChange={(e) =>
                  setResumeData({
                    ...resumeData,
                    contactInfo: { ...resumeData.contactInfo!, location: e.target.value },
                  })
                }
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={resumeData.summary || ''}
            onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
            placeholder="Write a brief professional summary..."
            className="w-full min-h-[100px] p-3 border rounded-md"
          />
        </CardContent>
      </Card>

      {/* Experience */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Work Experience</span>
            <Button onClick={addExperience} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Experience
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {resumeData.experience?.map((exp, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Experience #{index + 1}</h4>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeExperience(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Job Title"
                  value={exp.title}
                  onChange={(e) => updateExperience(index, 'title', e.target.value)}
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={exp.company}
                  onChange={(e) => updateExperience(index, 'company', e.target.value)}
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Date (e.g., Jan 2020 - Present)"
                  value={exp.date}
                  onChange={(e) => updateExperience(index, 'date', e.target.value)}
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={exp.location}
                  onChange={(e) => updateExperience(index, 'location', e.target.value)}
                  className="p-2 border rounded-md"
                />
              </div>
              <textarea
                placeholder="Responsibilities and achievements (one per line)"
                value={exp.points?.join('\n') || ''}
                onChange={(e) =>
                  updateExperience(index, 'points', e.target.value.split('\n'))
                }
                className="w-full min-h-[100px] p-3 border rounded-md"
              />
            </div>
          ))}
          {(!resumeData.experience || resumeData.experience.length === 0) && (
            <p className="text-center text-muted-foreground py-8">
              No work experience added yet. Click "Add Experience" to get started.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Education</span>
            <Button onClick={addEducation} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Education
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {resumeData.education?.map((edu, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Education #{index + 1}</h4>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeEducation(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Degree"
                  value={edu.degree}
                  onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="School"
                  value={edu.school}
                  onChange={(e) => updateEducation(index, 'school', e.target.value)}
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Date (e.g., 2016-2020)"
                  value={edu.date}
                  onChange={(e) => updateEducation(index, 'date', e.target.value)}
                  className="p-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={edu.location}
                  onChange={(e) => updateEducation(index, 'location', e.target.value)}
                  className="p-2 border rounded-md"
                />
              </div>
            </div>
          ))}
          {(!resumeData.education || resumeData.education.length === 0) && (
            <p className="text-center text-muted-foreground py-8">
              No education added yet. Click "Add Education" to get started.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Technical Skills (comma-separated)
            </label>
            <input
              type="text"
              value={resumeData.skills?.technical?.join(', ') || ''}
              onChange={(e) =>
                setResumeData({
                  ...resumeData,
                  skills: {
                    ...resumeData.skills!,
                    technical: e.target.value.split(',').map((s) => s.trim()),
                  },
                })
              }
              placeholder="React, Node.js, Python, AWS, etc."
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Soft Skills (comma-separated)
            </label>
            <input
              type="text"
              value={resumeData.skills?.soft?.join(', ') || ''}
              onChange={(e) =>
                setResumeData({
                  ...resumeData,
                  skills: {
                    ...resumeData.skills!,
                    soft: e.target.value.split(',').map((s) => s.trim()),
                  },
                })
              }
              placeholder="Leadership, Communication, Problem Solving, etc."
              className="w-full p-2 border rounded-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loading text="" />
              <span className="ml-2">Saving...</span>
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Resume Data
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
