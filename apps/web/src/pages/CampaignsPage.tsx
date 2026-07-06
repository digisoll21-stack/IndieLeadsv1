import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Edit2, Plus, Loader2, Trash2, BarChart2, MoreVertical, Megaphone } from 'lucide-react';
import apiClient from '../utils/api-client';
import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';

const CampaignsPage: React.FC<{ theme: 'ethereal' | 'glass' }> = ({ theme }) => {
  const navigate = useNavigate();
  const isEthereal = theme === 'ethereal';
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'draft'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  const fetchCampaigns = async (p = page, status = filterStatus) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/campaigns', {
        params: { page: p, limit, status }
      });
      // Handle both old array format (fallback) and new paginated format
      if (Array.isArray(response.data)) {
        setCampaigns(response.data);
        setTotalPages(1);
      } else {
        setCampaigns(response.data.data || []);
        setTotalPages(response.data.meta.totalPages || 1);
      }
    } catch (err) {
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1); // Reset to page 1 on filter change
    fetchCampaigns(1, filterStatus);
  }, [filterStatus]);

  useEffect(() => {
    fetchCampaigns(page, filterStatus);
  }, [page]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await apiClient.put(`/campaigns/${id}`, { status: newStatus });
      fetchCampaigns(); // Refresh to ensure data consistency
    } catch (err) {
      console.error('Status toggle failed');
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await apiClient.delete(`/campaigns/${id}`);
      fetchCampaigns();
    } catch (err) {
      console.error('Deletion failed');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Campaigns</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and monitor your automated outreach efforts.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex p-1 rounded-xl border bg-slate-50 border-slate-200">
            {(['all', 'active', 'paused', 'draft'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${filterStatus === status
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('/campaigns/new')}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-slate-200 active:scale-[0.98] flex items-center transition-all hover:bg-slate-800"
          >
            <Plus className="w-4 h-4 mr-2" /> New Campaign
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="w-48 h-5" />
                  <Skeleton className="w-32 h-3" />
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <Skeleton className="w-10 h-10 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {campaigns.map(campaign => (
              <div key={campaign.id} className="bg-white p-6 rounded-2xl border border-slate-100 space-y-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div onClick={() => navigate(`/campaigns/${campaign.id}`)} className="cursor-pointer">
                    <h3 className="font-bold text-base text-slate-900">{campaign.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${campaign.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                      <span className="text-xs font-medium text-slate-500 capitalize">{campaign.status}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => toggleStatus(campaign.id, campaign.status)} className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors">
                      {campaign.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button onClick={() => deleteCampaign(campaign.id)} className="p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-50">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 capitalize">Sent</p>
                    <p className="text-sm font-bold text-slate-900">0</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 capitalize">Open</p>
                    <p className="text-sm font-bold text-slate-900">0%</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 capitalize">Replied</p>
                    <p className="text-sm font-bold text-emerald-600">0%</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 capitalize">Leads</p>
                    <p className="text-sm font-bold text-slate-900">{campaign._count?.leads || 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm shadow-slate-200/50">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-xs font-semibold text-slate-500 border-b border-slate-100">
                  <th className="px-8 py-5 text-left">Campaign Name</th>
                  <th className="px-4 py-5 text-center">Status</th>
                  <th className="px-4 py-5 text-center">Sent</th>
                  <th className="px-4 py-5 text-center">Opens</th>
                  <th className="px-4 py-5 text-center">Replies</th>
                  <th className="px-4 py-5 text-center">Leads</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {campaigns.map(campaign => (
                  <tr
                    key={campaign.id}
                    className="group transition-all hover:bg-slate-50/50"
                  >
                    <td className="px-8 py-5" onClick={() => navigate(`/campaigns/${campaign.id}`)}>
                      <div className="flex flex-col cursor-pointer">
                        <span className="text-sm font-semibold transition-colors text-slate-900 hover:text-emerald-600">
                          {campaign.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${campaign.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        <span className="text-xs font-medium capitalize text-slate-600">
                          {campaign.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-center text-sm font-medium text-slate-900">0</td>
                    <td className="px-4 py-5 text-center text-sm font-bold text-slate-900">0%</td>
                    <td className="px-4 py-5 text-center text-sm font-bold text-emerald-600">0%</td>
                    <td className="px-4 py-5 text-center text-sm font-medium text-slate-900">
                      {campaign._count?.leads || 0}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/campaigns/${campaign.id}`); }}
                          className="p-2.5 rounded-xl transition-all bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"
                          title="Edit Campaign"
                        >
                          <Edit2 size={16} />
                        </button>

                        <div className="relative group/more">
                          <button className="p-2.5 rounded-xl transition-all bg-slate-50 text-slate-500 hover:bg-slate-100">
                            <MoreVertical size={16} />
                          </button>
                          <div className="absolute right-0 top-full mt-2 w-48 z-20 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden hidden group-hover/more:block">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleStatus(campaign.id, campaign.status); }}
                              className="w-full text-left px-5 py-3 text-sm font-medium hover:bg-slate-50 flex items-center space-x-3 text-slate-700"
                            >
                              {campaign.status === 'active' ? <><Pause size={16} className="text-slate-400" /> <span>Pause</span></> : <><Play size={16} className="text-slate-400" /> <span>Resume</span></>}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteCampaign(campaign.id); }}
                              className="w-full text-left px-5 py-3 text-sm font-medium hover:bg-red-50 flex items-center space-x-3 text-red-600 border-t border-slate-50"
                            >
                              <Trash2 size={16} /> <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="bg-slate-50/50 p-4 border-t border-slate-100">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                isLoading={isLoading}
              />
            </div>
          </div>

          {campaigns.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-24 px-10 bg-white rounded-2xl border border-slate-100 shadow-sm mt-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Megaphone size={32} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No campaigns yet</h3>
              <p className="text-slate-500 text-sm mt-2 max-w-sm">Create your first campaign to start reaching out to your leads with automated sequences.</p>
              <button
                onClick={() => navigate('/campaigns/new')}
                className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                Create Campaign
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CampaignsPage;