import React, { useState, useEffect, useMemo } from 'react';
import { Search, UploadCloud, X, Users, Briefcase, Sparkles, LogOut } from 'lucide-react';
import * as api from './api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [credentials, setCredentials] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('candidates'); // 'candidates', 'jobs', 'analytics'
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [scoringCandidateId, setScoringCandidateId] = useState(null);
  const [scoreResult, setScoreResult] = useState(null);
  const [candidateScores, setCandidateScores] = useState({}); // { candidateId_jobId: scoreData }

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('all'); // 'all', '1', '3', '5'
  const [sortBy, setSortBy] = useState('score'); // 'score', 'experience', 'name'

  // Job Form State
  const [newJob, setNewJob] = useState({ title: '', industry_category: 'Software', description: '' });
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  // Quick Templates for Demo & Testing
  const jobTemplates = [
    {
      title: "Senior Full-Stack AI Engineer",
      industry_category: "Software",
      description: "Looking for an experienced engineer skilled in Python, FastAPI, React, PostgreSQL, Docker, and Machine Learning pipelines. Experience in microservices and NLP is a huge plus."
    },
    {
      title: "Healthcare Specialist / Medical Officer",
      industry_category: "Healthcare",
      description: "Seeking a medical professional with expertise in surgery, patient care, diagnosis, radiology, and clinical healthcare operations."
    },
    {
      title: "Growth & Performance Marketing Lead",
      industry_category: "Marketing",
      description: "Need a strategic marketer proficient in SEO, digital marketing, content writing, Google Analytics, social media marketing, and lead acquisition."
    }
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      fetchJobs();
      fetchCandidates();
    }
  }, [isAuthenticated]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authMode === 'register') {
        await api.register({ email: credentials.email, password: credentials.password, name: credentials.name });
        setAuthMode('login');
        alert('Account registered successfully! You can now sign in.');
      } else {
        const res = await api.login(credentials.email, credentials.password);
        localStorage.setItem('token', res.data.access_token);
        setIsAuthenticated(true);
      }
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Authentication failed. Please verify your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  const fetchJobs = async () => {
    try {
      const res = await api.getJobs();
      setJobs(res.data);
      if (res.data.length > 0 && !selectedJobId) {
        setSelectedJobId(String(res.data[0].id));
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await api.getCandidates();
      setCandidates(res.data);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setIsCreatingJob(true);
    try {
      await api.createJob(newJob);
      setNewJob({ title: '', industry_category: 'Software', description: '' });
      await fetchJobs();
      setActiveTab('jobs');
    } catch (error) {
      console.error("Error creating job:", error);
      alert("Failed to create job requisition.");
    } finally {
      setIsCreatingJob(false);
    }
  };

  const applyTemplate = (template) => {
    setNewJob(template);
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    if (files.length === 1) {
      setUploadStatus('Processing resume with AI (Extracting text & spaCy NER)...');
      try {
        await api.uploadCandidate(files[0]);
        setUploadStatus('Resume successfully parsed and indexed!');
        await fetchCandidates();
        setTimeout(() => setUploadStatus(''), 4000);
      } catch (error) {
        console.error("Upload error:", error);
        setUploadStatus('Upload failed. Please ensure the file is a valid PDF or DOCX.');
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    } else {
      setUploadStatus(`Uploading and parsing ${files.length} resumes with AI... Please wait.`);
      try {
        const res = await api.uploadBulkCandidates(files);
        const { total, successful, failed } = res.data;
        if (failed > 0) {
          setUploadStatus(`Processed ${total} resumes: ${successful} successful, ${failed} failed.`);
        } else {
          setUploadStatus(`All ${successful} resumes successfully parsed and indexed!`);
        }
        await fetchCandidates();
        setTimeout(() => setUploadStatus(''), 6000);
      } catch (error) {
        console.error("Bulk upload error:", error);
        setUploadStatus('Bulk upload failed. Please check server logs.');
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    }
  };

  const handleScore = async (candidateId) => {
    if (!selectedJobId) {
      alert('Please select an active job requisition to score against.');
      return;
    }
    setScoringCandidateId(candidateId);
    try {
      const res = await api.scoreCandidate(Number(selectedJobId), candidateId);
      const resultData = res.data;
      setScoreResult(resultData);
      
      // Cache candidate score for the active job
      setCandidateScores(prev => ({
        ...prev,
        [`${candidateId}_${selectedJobId}`]: resultData
      }));
    } catch (error) {
      console.error("Scoring error:", error);
      alert('Scoring failed or timed out. Please check backend connection.');
    } finally {
      setScoringCandidateId(null);
    }
  };

  // Selected Job details
  const currentJob = useMemo(() => {
    return jobs.find(j => String(j.id) === String(selectedJobId)) || null;
  }, [jobs, selectedJobId]);

  // Filter and sort candidates
  const processedCandidates = useMemo(() => {
    let list = [...candidates];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => {
        const nameMatch = c.name?.toLowerCase().includes(q);
        const emailMatch = c.email?.toLowerCase().includes(q);
        const skillMatch = c.skills?.some(s => s.toLowerCase().includes(q));
        const fileMatch = c.resume_file_path?.toLowerCase().includes(q);
        return nameMatch || emailMatch || skillMatch || fileMatch;
      });
    }

    // Experience filter
    if (experienceFilter !== 'all') {
      const minYears = Number(experienceFilter);
      list = list.filter(c => {
        const exp = c.experience?.[0]?.total_years || 0;
        return exp >= minYears;
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'score') {
        const scoreA = candidateScores[`${a.id}_${selectedJobId}`]?.match_score_percentage ?? -1;
        const scoreB = candidateScores[`${b.id}_${selectedJobId}`]?.match_score_percentage ?? -1;
        return scoreB - scoreA;
      }
      if (sortBy === 'experience') {
        const expA = a.experience?.[0]?.total_years || 0;
        const expB = b.experience?.[0]?.total_years || 0;
        return expB - expA;
      }
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });

    return list;
  }, [candidates, searchQuery, experienceFilter, sortBy, selectedJobId, candidateScores]);

  // Analytics Metrics
  const stats = useMemo(() => {
    const total = candidates.length;
    const scoredCount = Object.keys(candidateScores).filter(k => k.endsWith(`_${selectedJobId}`)).length;
    const scores = Object.entries(candidateScores)
      .filter(([k]) => k.endsWith(`_${selectedJobId}`))
      .map(([, v]) => v.match_score_percentage);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    
    // Top skills aggregated
    const skillCounts = {};
    candidates.forEach(c => {
      c.skills?.forEach(s => {
        skillCounts[s] = (skillCounts[s] || 0) + 1;
      });
    });
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return { total, scoredCount, avgScore, topSkills };
  }, [candidates, candidateScores, selectedJobId]);

  // Get Score visual configuration
  const getScoreBadge = (score) => {
    if (score >= 75) {
      return {
        bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        ring: 'text-emerald-400',
        label: 'Exceptional Fit',
        color: 'text-emerald-400'
      };
    }
    if (score >= 50) {
      return {
        bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        ring: 'text-amber-400',
        label: 'Moderate Match',
        color: 'text-amber-400'
      };
    }
    return {
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      ring: 'text-rose-400',
      label: 'Low Match',
      color: 'text-rose-400'
    };
  };

  // Industry badge helper
  const getIndustryBadge = (industry) => {
    const lower = (industry || '').toLowerCase();
    if (lower.includes('software') || lower.includes('it')) {
      return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
    }
    if (lower.includes('health') || lower.includes('doctor')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (lower.includes('market')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
    return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 shadow-sm">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            {authMode === 'login' ? 'Sign in to SmartHire' : 'Create your account'}
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="bg-white px-6 py-12 shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl sm:px-12">
            <form className="space-y-6" onSubmit={handleAuth}>
              {authError && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{authError}</h3>
                    </div>
                  </div>
                </div>
              )}

              {authMode === 'register' && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">Full name</label>
                  <div className="mt-2">
                    <input id="name" type="text" required
                      value={credentials.name} onChange={e => setCredentials({ ...credentials, name: e.target.value })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 px-3"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">Email address</label>
                <div className="mt-2">
                  <input id="email" type="email" required
                    value={credentials.email} onChange={e => setCredentials({ ...credentials, email: e.target.value })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 px-3"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">Password</label>
                <div className="mt-2">
                  <input id="password" type="password" required
                    value={credentials.password} onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 px-3"
                  />
                </div>
              </div>

              <div>
                <button type="submit" disabled={authLoading}
                  className="flex w-full justify-center rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 transition-all"
                >
                  {authLoading ? 'Verifying...' : authMode === 'login' ? 'Sign in' : 'Create account'}
                </button>
              </div>
            </form>

            <p className="mt-10 text-center text-sm text-gray-500">
              {authMode === 'login' ? 'Not a member? ' : 'Already have an account? '}
              <button type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }} className="font-semibold leading-6 text-teal-600 hover:text-teal-500">
                {authMode === 'login' ? 'Sign up now' : 'Sign in here'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <nav className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="font-bold text-gray-900 text-lg tracking-tight">SmartHire</span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <button onClick={() => setActiveTab('candidates')}
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${
                    activeTab === 'candidates' ? 'border-teal-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Candidates
                  <span className={`ml-2 rounded-full py-0.5 px-2 text-xs ${activeTab === 'candidates' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'}`}>
                    {candidates.length}
                  </span>
                </button>
                <button onClick={() => setActiveTab('jobs')}
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${
                    activeTab === 'jobs' ? 'border-teal-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Job Requisitions
                  <span className={`ml-2 rounded-full py-0.5 px-2 text-xs ${activeTab === 'jobs' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'}`}>
                    {jobs.length}
                  </span>
                </button>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">Talent Partner</p>
                  <p className="text-xs text-gray-500">{credentials.email || 'Admin Session'}</p>
                </div>
                <button onClick={handleLogout} className="rounded-full bg-white p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ring-1 ring-inset ring-gray-200">
                  <span className="sr-only">Log out</span>
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* TAB 1: CANDIDATES */}
          {activeTab === 'candidates' && (
            <div className="space-y-6">
              
              {/* Page Header / Action Bar */}
              <div className="sm:flex sm:items-center sm:justify-between bg-white px-4 py-5 sm:px-6 shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                <div className="sm:flex-auto flex items-center gap-4 flex-wrap">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Score against requisition</label>
                    <select
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="block w-full sm:w-64 rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-teal-600 sm:text-sm sm:leading-6"
                    >
                      {jobs.map(job => (
                        <option key={job.id} value={job.id}>{job.title} ({job.industry_category})</option>
                      ))}
                      {jobs.length === 0 && <option value="">No jobs created yet</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Search candidates</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                      </div>
                      <input
                        type="text"
                        placeholder="Name, email, skill..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="block w-full sm:w-64 rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-teal-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                  <label className="cursor-pointer relative inline-flex items-center gap-x-1.5 rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 transition-colors">
                    <UploadCloud className="-ml-0.5 h-4 w-4" aria-hidden="true" />
                    {isUploading ? 'Processing...' : 'Upload Resumes'}
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {uploadStatus && (
                <div className="rounded-md bg-blue-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 mt-2 rounded-full bg-blue-600 animate-pulse" />
                    </div>
                    <div className="ml-3 flex-1 md:flex md:justify-between">
                      <p className="text-sm text-blue-700">{uploadStatus}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Candidates List */}
              <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
                {processedCandidates.length === 0 ? (
                  <div className="text-center py-16">
                    <Users className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No candidates</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by uploading a new candidate resume.</p>
                  </div>
                ) : (
                  <ul role="list" className="divide-y divide-gray-100">
                    {processedCandidates.map((cand) => {
                      const scoreKey = `${cand.id}_${selectedJobId}`;
                      const scoreData = candidateScores[scoreKey];
                      const hasScore = !!scoreData;
                      const matchScore = hasScore ? scoreData.match_score_percentage : null;
                      const totalExp = cand.experience?.[0]?.total_years ?? 0;
                      const educationLevel = cand.education?.[0]?.level ?? 'Unspecified';
                      const isScoringThis = scoringCandidateId === cand.id;

                      return (
                        <li key={cand.id} className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6 transition-colors">
                          <div className="flex min-w-0 gap-x-4 items-center">
                            <div className="h-12 w-12 flex-none rounded-full bg-gray-50 ring-1 ring-gray-200 flex items-center justify-center text-gray-500 font-semibold text-lg shadow-sm">
                              {cand.name ? cand.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div className="min-w-0 flex-auto">
                              <p className="text-sm font-semibold leading-6 text-gray-900 truncate">
                                {cand.name || `Candidate #${cand.id}`}
                              </p>
                              <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                {cand.email && <span className="truncate">{cand.email}</span>}
                                {cand.email && <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current"><circle cx={1} cy={1} r={1} /></svg>}
                                <span className="truncate">{cand.resume_file_path?.split(/[\\/]/).pop()}</span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                  {totalExp} yr exp
                                </span>
                                <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                  {educationLevel}
                                </span>
                                {cand.skills?.slice(0, 4).map((s, i) => (
                                  <span key={i} className="inline-flex items-center rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-700/10">
                                    {s}
                                  </span>
                                ))}
                                {cand.skills && cand.skills.length > 4 && (
                                  <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-gray-400">
                                    +{cand.skills.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex shrink-0 items-center gap-x-4">
                            {hasScore ? (
                              <div className="flex flex-col items-end gap-1">
                                <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                                  matchScore >= 75 ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                                  matchScore >= 50 ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' : 
                                  'bg-red-50 text-red-700 ring-red-600/10'
                                }`}>
                                  {matchScore}% Match
                                </span>
                                <button onClick={() => setScoreResult(scoreData)} className="text-xs font-medium text-teal-600 hover:text-teal-500">
                                  View details <span aria-hidden="true">&rarr;</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleScore(cand.id)}
                                disabled={isScoringThis}
                                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                              >
                                {isScoringThis ? 'Scoring...' : 'Score Candidate'}
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: JOBS */}
          {activeTab === 'jobs' && (
            <div className="mx-auto grid max-w-2xl grid-cols-1 grid-rows-1 items-start gap-x-8 gap-y-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-base font-semibold leading-7 text-gray-900">Active Requisitions</h2>
                {jobs.map(job => (
                  <div key={job.id} className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl px-6 py-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold leading-6 text-gray-900">{job.title}</h3>
                      <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-700/10">
                        {job.industry_category}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">{job.description}</p>
                  </div>
                ))}
                {jobs.length === 0 && (
                  <div className="text-center py-12 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                    <Briefcase className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No jobs active</h3>
                    <p className="mt-1 text-sm text-gray-500">Create a requisition to start scoring candidates.</p>
                  </div>
                )}
              </div>

              <div className="lg:col-start-3">
                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl px-6 py-6 sticky top-6">
                  <h2 className="text-base font-semibold leading-7 text-gray-900 mb-4">Create New Position</h2>
                  
                  <div className="mb-5">
                    <p className="text-xs font-medium text-gray-500 mb-2">Templates:</p>
                    <div className="flex flex-col gap-1.5">
                      {jobTemplates.map((t, idx) => (
                        <button key={idx} type="button" onClick={() => setNewJob(t)} className="text-left text-xs font-medium text-teal-600 hover:text-teal-500 truncate">
                          + {t.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleCreateJob} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">Job Title</label>
                      <input type="text" required value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})}
                        className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 px-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">Department / Industry</label>
                      <select value={newJob.industry_category} onChange={e => setNewJob({...newJob, industry_category: e.target.value})}
                        className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-teal-600 sm:text-sm sm:leading-6"
                      >
                        <option value="Software">Engineering</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Finance">Finance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium leading-6 text-gray-900">Description & Requirements</label>
                      <textarea required rows={4} value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})}
                        className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 px-3"
                      />
                    </div>
                    <button type="submit" disabled={isCreatingJob}
                      className="flex w-full justify-center rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 transition-colors"
                    >
                      {isCreatingJob ? 'Saving...' : 'Publish Position'}
                    </button>
                  </form>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* AI Scoring Diagnostic Modal */}
      {scoreResult && (
        <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm"></div>
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              
              <div className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 ring-1 ring-gray-900/5">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button type="button" onClick={() => setScoreResult(null)} className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2">
                    <span className="sr-only">Close</span>
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 sm:mx-0 sm:h-10 sm:w-10 ring-1 ring-teal-500/20">
                    <Sparkles className="h-5 w-5 text-teal-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-base font-semibold leading-6 text-gray-900" id="modal-title">AI Match Analysis</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">Deep semantic and skill overlap breakdown.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-6">
                  <div className="flex items-center justify-center bg-gray-50 rounded-xl py-6 ring-1 ring-inset ring-gray-900/5">
                    <div className="text-center">
                      <span className="text-5xl font-bold tracking-tight text-gray-900">{scoreResult.match_score_percentage}%</span>
                      <p className="mt-1 text-sm font-medium text-gray-500">Overall Fit</p>
                    </div>
                  </div>

                  <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="overflow-hidden rounded-xl bg-white px-4 py-5 shadow-sm ring-1 ring-inset ring-gray-900/5 sm:p-4">
                      <dt className="truncate text-sm font-medium text-gray-500">Semantic Context</dt>
                      <dd className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">{scoreResult.score_breakdown?.semantic_score ?? 0}%</dd>
                    </div>
                    <div className="overflow-hidden rounded-xl bg-white px-4 py-5 shadow-sm ring-1 ring-inset ring-gray-900/5 sm:p-4">
                      <dt className="truncate text-sm font-medium text-gray-500">Keyword Overlap</dt>
                      <dd className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">{scoreResult.score_breakdown?.skill_score ?? 0}%</dd>
                    </div>
                  </dl>

                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900">Missing Requirements</h4>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {scoreResult.missing_skills && scoreResult.missing_skills.length > 0 ? (
                        scoreResult.missing_skills.map((s, i) => (
                          <span key={i} className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-green-600 font-medium">All required skills present.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 sm:flex sm:flex-row-reverse">
                  <button type="button" onClick={() => setScoreResult(null)}
                    className="inline-flex w-full justify-center rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 sm:ml-3 sm:w-auto transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
