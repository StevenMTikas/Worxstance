import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Trash2, ChevronDown, Plus, X, Loader2, ExternalLink, FileText, Mail } from 'lucide-react';
import { useJobTracker } from '../contexts/JobTrackerContext';
import { useGemini } from '../hooks/useGemini';
import { useMasterProfile } from '../contexts/MasterProfileContext';
import { extractJobDetailsFromUrl } from '../features/01_job_discovery/extractJobFromUrl';
import type { JobDetails } from '../lib/types';

// Map JobDetails status to display status
type DisplayStatus = 'open' | 'applied' | 'interview' | 'offer' | 'reject';

const mapJobStatus = (status: JobDetails['status']): DisplayStatus => {
  switch (status) {
    case 'saved':
      return 'open';
    case 'applied':
      return 'applied';
    case 'interviewing':
      return 'interview';
    case 'offer':
      return 'offer';
    case 'rejected':
      return 'reject';
    case 'archived':
      return 'reject'; // Treat archived as rejected for display
    default:
      return 'open';
  }
};

// Map display status back to JobDetails status
const mapDisplayStatusToJobStatus = (displayStatus: DisplayStatus): JobDetails['status'] => {
  switch (displayStatus) {
    case 'open':
      return 'saved';
    case 'applied':
      return 'applied';
    case 'interview':
      return 'interviewing';
    case 'offer':
      return 'offer';
    case 'reject':
      return 'rejected';
    default:
      return 'saved';
  }
};

const getStatusColor = (status: DisplayStatus): string => {
  switch (status) {
    case 'open':
      return 'bg-slate-100 text-slate-700 border-slate-300';
    case 'applied':
      return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'interview':
      return 'bg-amber-100 text-amber-700 border-amber-300';
    case 'offer':
      return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    case 'reject':
      return 'bg-red-100 text-red-700 border-red-300';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-300';
  }
};

const getScoreColor = (score: number | undefined): string => {
  if (score === undefined || score === null) {
    return 'text-slate-600 bg-slate-50 border-slate-200';
  }
  if (score >= 80) {
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  } else if (score >= 60) {
    return 'text-blue-700 bg-blue-50 border-blue-200';
  } else if (score >= 40) {
    return 'text-amber-700 bg-amber-50 border-amber-200';
  } else {
    return 'text-rose-700 bg-rose-50 border-rose-200';
  }
};

const JobTrackingDashboard: React.FC = () => {
  const { savedJobs, loading, removeJob, updateJobStatus, saveJob } = useJobTracker();
  const { callModel } = useGemini();
  const { profile } = useMasterProfile();
  const navigate = useNavigate();
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingJob, setAddingJob] = useState(false);
  const [addJobError, setAddJobError] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [jobSalary, setJobSalary] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [internalNote, setInternalNote] = useState('');

  const resetAddJobForm = () => {
    setJobTitle('');
    setJobCompany('');
    setJobUrl('');
    setJobSalary('');
    setJobDescription('');
    setInternalNote('');
    setAddJobError(null);
  };

  // Show only the most recent 8 jobs
  const displayJobs = savedJobs.slice(0, 8);

  const handleDelete = async (jobId: string, jobTitle: string) => {
    if (!window.confirm(`Are you sure you want to remove "${jobTitle}" from your job applications?`)) {
      return;
    }

    setDeletingJobId(jobId);
    try {
      await removeJob(jobId);
    } catch (error) {
      console.error('Failed to delete job:', error);
      alert('Failed to delete job. Please try again.');
    } finally {
      setDeletingJobId(null);
    }
  };

  const handleStatusChange = async (jobId: string, newDisplayStatus: DisplayStatus) => {
    setUpdatingJobId(jobId);
    
    // Safety timeout - clear loading state after 10 seconds
    const timeoutId = setTimeout(() => {
      console.warn('Status update taking longer than expected, clearing loading state');
      setUpdatingJobId(null);
    }, 10000);
    
    try {
      const newStatus = mapDisplayStatusToJobStatus(newDisplayStatus);
      console.log('Changing job status:', jobId, 'from current to', newStatus);
      await updateJobStatus(jobId, newStatus);
      console.log('Job status updated successfully');
      clearTimeout(timeoutId); // Clear timeout on success
    } catch (error) {
      console.error('Failed to update job status:', error);
      alert('Failed to update job status. Please try again.');
      clearTimeout(timeoutId); // Clear timeout on error
    } finally {
      setUpdatingJobId(null);
      clearTimeout(timeoutId); // Ensure timeout is cleared
    }
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = jobTitle.trim();
    const trimmedUrl = jobUrl.trim();
    const trimmedDescription = jobDescription.trim();

    if (!trimmedTitle || !trimmedUrl) {
      setAddJobError('Please provide both job title and URL');
      return;
    }

    if (!trimmedDescription) {
      setAddJobError('Please provide the full job description so we can tailor assets later.');
      return;
    }

    // Validate URL format
    try {
      new URL(trimmedUrl);
    } catch {
      setAddJobError('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    setAddingJob(true);
    setAddJobError(null);

    let extractedJob: Awaited<ReturnType<typeof extractJobDetailsFromUrl>> | null = null;

    try {
      // Extract job details from URL using AI
      extractedJob = await extractJobDetailsFromUrl({
        url: trimmedUrl,
        userProvidedTitle: jobTitle,
        callModel,
        profile
      });
    } catch (error) {
      console.warn('Unable to auto-extract job details, falling back to manual entry.', error);
    }

    try {
      const finalCompany =
        jobCompany.trim() ||
        extractedJob?.company ||
        'Company not specified';

      const finalSalary = jobSalary.trim() || extractedJob?.salaryRange;
      const manualDescription = trimmedDescription || extractedJob?.description || 'Description not provided';
      const noteValue = internalNote.trim() || undefined;

      // Save the job
      await saveJob({
        title: trimmedTitle,
        company: finalCompany,
        location: extractedJob?.location,
        salaryRange: finalSalary || undefined,
        description: manualDescription,
        url: trimmedUrl,
        matchScore: extractedJob?.matchScore,
        keywords: [],
        internalNote: noteValue
      });

      // Reset form and close modal
      resetAddJobForm();
      setShowAddModal(false);
    } catch (error: any) {
      console.error('Failed to add job:', error);
      setAddJobError(error.message || 'Failed to save job. Please try again.');
    } finally {
      setAddingJob(false);
    }
  };

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-800">Job Applications</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Job
          </button>
          <Link 
            to="/job-discovery" 
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            View All →
          </Link>
        </div>
      </div>

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Add Job Manually</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetAddJobForm();
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                disabled={addingJob}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddJob} className="space-y-4">
              <div>
                <label htmlFor="job-title" className="block text-sm font-medium text-slate-700 mb-1">
                  Job Title *
                </label>
                <input
                  id="job-title"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                  disabled={addingJob}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>

              <div>
                <label htmlFor="job-company" className="block text-sm font-medium text-slate-700 mb-1">
                  Company (optional)
                </label>
                <input
                  id="job-company"
                  type="text"
                  value={jobCompany}
                  onChange={(e) => setJobCompany(e.target.value)}
                  disabled={addingJob}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div>
                <label htmlFor="job-url" className="block text-sm font-medium text-slate-700 mb-1">
                  Job Posting URL *
                </label>
                <input
                  id="job-url"
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  required
                  disabled={addingJob}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  placeholder="https://linkedin.com/jobs/view/..."
                />
                <p className="mt-1 text-xs text-slate-500">
                  Optional enrichment: we'll attempt to pull location, salary, and other context from the posting if reachable.
                </p>
              </div>

              <div>
                <label htmlFor="job-salary" className="block text-sm font-medium text-slate-700 mb-1">
                  Salary / Compensation (optional)
                </label>
                <input
                  id="job-salary"
                  type="text"
                  value={jobSalary}
                  onChange={(e) => setJobSalary(e.target.value)}
                  disabled={addingJob}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  placeholder="$140K base + bonus"
                />
              </div>

              <div>
                <label htmlFor="job-description" className="block text-sm font-medium text-slate-700 mb-1">
                  Full Job Description *
                </label>
                <textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  required
                  disabled={addingJob}
                  rows={5}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  placeholder="Paste the responsibilities, requirements, and any other details you want to track."
                />
                <p className="mt-1 text-xs text-slate-500">
                  This text powers resume tailoring, cover letters, and Skill Gap analysis.
                </p>
              </div>

              <div>
                <label htmlFor="internal-note" className="block text-sm font-medium text-slate-700 mb-1">
                  Internal Note (optional)
                </label>
                <textarea
                  id="internal-note"
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  disabled={addingJob}
                  rows={3}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  placeholder="e.g. Followed up with recruiter on 11/20, referral from Alex."
                />
              </div>

              {addJobError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
                  {addJobError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetAddJobForm();
                  }}
                  disabled={addingJob}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    addingJob ||
                    !jobTitle.trim() ||
                    !jobUrl.trim() ||
                    !jobDescription.trim()
                  }
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addingJob ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Extracting Details...
                    </>
                  ) : (
                    'Save Job'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="text-slate-500">Loading jobs...</div>
        </div>
      ) : displayJobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 mb-2">No jobs tracked yet</p>
          <p className="text-sm text-slate-500">Start by saving jobs from Job Discovery</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Match Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {displayJobs.map((job) => {
                  const displayStatus = mapJobStatus(job.status);
                  return (
                    <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div 
                          className="text-sm font-medium text-slate-900 truncate max-w-[200px]" 
                          title={job.title}
                        >
                          {job.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div 
                          className="text-sm text-slate-600 truncate max-w-[150px]" 
                          title={job.company}
                        >
                          {job.company}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-slate-600">
                          <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                          {job.location || 'Not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getScoreColor(
                              job.matchScore
                            )}`}
                            title={job.matchScore !== undefined ? `Match Score: ${job.matchScore}%` : 'Match score not available'}
                          >
                            {job.matchScore !== undefined ? `${job.matchScore}%` : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative inline-block min-w-[120px]">
                          <select
                            value={displayStatus}
                            onChange={(e) => handleStatusChange(job.id, e.target.value as DisplayStatus)}
                            disabled={updatingJobId === job.id}
                            className={`appearance-none w-full px-3 py-1.5 pr-8 rounded-full text-xs font-medium border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${getStatusColor(
                              displayStatus
                            )} ${updatingJobId === job.id ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 hover:shadow-sm'}`}
                            title="Change job status"
                          >
                            <option value="open">Open</option>
                            <option value="applied">Applied</option>
                            <option value="interview">Interview</option>
                            <option value="offer">Offer</option>
                            <option value="reject">Rejected</option>
                          </select>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
                            {updatingJobId === job.id ? (
                              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate('/resume-tailor', { 
                              state: { 
                                jobTitle: job.title,
                                jobCompany: job.company,
                                jobDescription: job.description,
                                jobUrl: job.url
                              } 
                            })}
                            className="inline-flex items-center px-2 py-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Build custom resume for this job"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate('/cover-letter', { 
                              state: { 
                                jobTitle: job.title,
                                jobCompany: job.company,
                                jobDescription: job.description,
                                jobUrl: job.url
                              } 
                            })}
                            className="inline-flex items-center px-2 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Build cover letter for this job"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          {job.url && (
                            <button
                              onClick={() => window.open(job.url, '_blank', 'noopener,noreferrer')}
                              className="inline-flex items-center px-2 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="View job posting"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(job.id, job.title)}
                            disabled={deletingJobId === job.id}
                            className="inline-flex items-center px-2 py-1.5 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove job from dashboard"
                          >
                            {deletingJobId === job.id ? (
                              <span className="w-4 h-4 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default JobTrackingDashboard;

