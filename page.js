"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiGithub, FiPlus, FiSearch, FiAlertCircle, FiCheckCircle, FiRefreshCw } from "react-icons/fi";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { RepositoryCard } from "@/components/RepositoryCard";

export default function DashboardPage() {
  const router = useRouter();
  const [repos, setRepos] = useState([]);
  const [savedRepos, setSavedRepos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeRepo, setActiveRepo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Mock recent activity data
  const recentActivity = [
    { id: 1, type: 'update', repo: 'autodocs', time: '2 hours ago', description: 'Documentation updated' },
    { id: 2, type: 'add', repo: 'autodocs-api', time: '5 hours ago', description: 'New API endpoints added' },
    { id: 3, type: 'fix', repo: 'autodocs-web', time: '1 day ago', description: 'Fixed login issue' },
  ];

  // Fetch available GitHub repositories
  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const res = await fetch("/api/github");
        const data = await res.json();
        if (data.repos) {
          setRepos(data.repos);
        }
      } catch (error) {
        console.error("Error fetching GitHub repos:", error);
        setError("Failed to load GitHub repositories");
      }
    };

    fetchRepos();
  }, []);

  // Fetch saved repositories
  const fetchSavedRepos = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/repos");
      const data = await res.json();
      if (data.repos) {
        setSavedRepos(data.repos);
      }
    } catch (error) {
      console.error("Error fetching saved repos:", error);
      setError("Failed to load saved repositories");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch of saved repos
  useEffect(() => {
    fetchSavedRepos();
  }, []);

  // Function to save the selected repo
  const saveRepo = async (repo) => {
    try {
      setError(null);
      const res = await fetch("/api/repos/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || `Failed to save repository (${res.status})`);
      }
      
      // Update the UI optimistically
      setSavedRepos(prevRepos => {
        // Check if repo already exists to avoid duplicates
        if (!prevRepos.some(r => r.id === data.repo.id)) {
          return [data.repo, ...prevRepos];
        }
        return prevRepos;
      });
      
      setSuccess('Repository saved successfully');
      
      // Still fetch the latest data to ensure consistency
      await fetchSavedRepos();
      
      return data;
    } catch (error) {
      console.error("Error in saveRepo:", error);
      setError(error.message || 'Failed to save repository');
      throw error;
    } finally {
      // Clear messages after 5 seconds
      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
    }
  };

  // Function to delete a saved repo
  const deleteRepo = async (repoId) => {
    if (window.confirm("Are you sure you want to remove this repository?")) {
      try {
        const res = await fetch(`/api/repos/${repoId}`, {
          method: "DELETE",
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || errorData.message || 'Failed to delete repository');
        }
        
        // Refresh the saved repos list
        await fetchSavedRepos();
        setSuccess('Repository removed successfully');
      } catch (error) {
        console.error("Error deleting repository:", error);
        setError(error.message || 'Failed to delete repository');
      } finally {
        // Clear messages after 5 seconds
        setTimeout(() => {
          setSuccess(null);
          setError(null);
        }, 5000);
      }
    }
  };

  // Filter repositories based on search query
  const filteredRepos = savedRepos.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle repository selection
  const handleRepoSelect = (repoId) => {
    setActiveRepo(activeRepo === repoId ? null : repoId);
  };

  // Handle documentation generation
  const handleGenerateDocs = async (repoId) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      // In a real app, you would call your API endpoint here
      // await fetch(`/api/repos/${repoId}/generate-docs`, { method: 'POST' });
      
      // Update the repo to show it has docs now
      setSavedRepos(prevRepos => 
        prevRepos.map(repo => 
          repo.id === repoId ? { ...repo, hasDocs: true } : repo
        )
      );
      
      setSuccess('Documentation generated successfully!');
    } catch (error) {
      console.error('Error generating docs:', error);
      throw new Error('Failed to generate documentation');
    }
  };

  // Handle view documentation
  const handleViewDocs = (repoId) => {
    const repo = savedRepos.find(r => r.id === repoId);
    if (repo) {
      router.push(`/docs/${repo.name}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-text-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-text-primary">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 text-red-300 rounded-lg border border-red-800/50 flex items-center">
              <FiAlertCircle className="mr-2" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-900/30 text-green-300 rounded-lg border border-green-800/50 flex items-center">
              <FiCheckCircle className="mr-2" />
              {success}
            </div>
          )}
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">Your Repositories</h1>
              <p className="text-text-secondary mt-1">Manage your connected repositories and documentation</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button className="btn-primary">
                <FiPlus className="mr-2" />
                Add Repository
              </button>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-text-disabled" />
                </div>
                <input
                  type="text"
                  className="input-field pl-10 pr-4 py-2 w-full md:w-64"
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Repositories List - 3 columns on large screens */}
            <div className="lg:col-span-3">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="card">
                  <div className="text-text-secondary text-sm mb-1">Total Repositories</div>
                  <div className="text-2xl font-bold">{savedRepos.length}</div>
                </div>
                <div className="card">
                  <div className="text-text-secondary text-sm mb-1">Documented</div>
                  <div className="text-2xl font-bold">
                    {savedRepos.filter(repo => repo.hasDocs).length}
                  </div>
                </div>
                <div className="card">
                  <div className="text-text-secondary text-sm mb-1">Needs Attention</div>
                  <div className="text-2xl font-bold">
                    {savedRepos.filter(repo => !repo.hasDocs).length}
                  </div>
                </div>
              </div>
              
              {/* Repositories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredRepos.length > 0 ? (
                  filteredRepos.map((repo) => (
                    <RepositoryCard
                      key={repo.id}
                      id={repo.id}
                      name={repo.full_name || repo.name}
                      description={repo.description}
                      language={repo.language}
                      stars={repo.stargazers_count}
                      forks={repo.forks_count}
                      updatedAt={repo.updated_at || repo.updatedAt}
                      isActive={activeRepo === repo.id}
                      hasDocs={repo.hasDocs || false}
                      onSelect={handleRepoSelect}
                      onGenerateDocs={handleGenerateDocs}
                      onViewDocs={handleViewDocs}
                      onRemove={deleteRepo}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center">
                    <div className="mx-auto w-24 h-24 bg-background-elevated rounded-full flex items-center justify-center mb-4">
                      <FiGithub size={40} className="text-text-secondary" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No repositories found</h3>
                    <p className="text-text-secondary mb-6">
                      {searchQuery 
                        ? 'No repositories match your search.' 
                        : 'Add your first repository to get started.'}
                    </p>
                    <button 
                      className="btn-primary"
                      onClick={() => {
                        // Open repository add modal or navigate to add page
                        document.querySelector('select')?.focus();
                      }}
                    >
                      <FiPlus className="mr-2" />
                      Add Repository
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Recent Activity - 1 column */}
            <div className="lg:col-span-1">
              <div className="card h-full">
                <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
                
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {activity.type === 'update' && <FiRefreshCw className="text-primary" />}
                            {activity.type === 'add' && <FiPlus className="text-green-500" />}
                            {activity.type === 'fix' && <FiAlertCircle className="text-yellow-500" />}
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium">{activity.repo}</p>
                          <p className="text-sm text-text-secondary">{activity.description}</p>
                          <p className="text-xs text-text-disabled mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-text-secondary">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
