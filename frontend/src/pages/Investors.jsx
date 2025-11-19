import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp, TrendingDown, Eye, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import InvestorFormModal from '../components/InvestorFormModal';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

const Investors = ({ user, onLogout }) => {
  const [investors, setInvestors] = useState([]);
  const [filteredInvestors, setFilteredInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadInvestors();
  }, []);

  useEffect(() => {
    filterInvestors();
  }, [searchTerm, riskFilter, investors]);

  const loadInvestors = async () => {
    try {
      const response = await axios.get('/investors');
      setInvestors(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load investors');
    } finally {
      setLoading(false);
    }
  };

  const filterInvestors = () => {
    let filtered = investors;

    if (searchTerm) {
      filtered = filtered.filter(inv =>
        inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.pan.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (riskFilter !== 'all') {
      filtered = filtered.filter(inv => inv.risk_profile === riskFilter);
    }

    setFilteredInvestors(filtered);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const handleAddInvestor = () => {
    setSelectedInvestor(null);
    setShowFormModal(true);
  };

  const handleEditInvestor = (investor, e) => {
    e.stopPropagation();
    setSelectedInvestor(investor);
    setShowFormModal(true);
  };

  const handleDeleteInvestor = (investor, e) => {
    e.stopPropagation();
    setSelectedInvestor(investor);
    setShowDeleteDialog(true);
  };

  const handleFormSuccess = () => {
    loadInvestors();
  };

  const handleDeleteSuccess = () => {
    loadInvestors();
  };

  const maskPAN = (pan) => {
    if (!pan || pan.length < 6) return pan;
    return pan.slice(0, 3) + '***' + pan.slice(-2);
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="investors-page">
      <Sidebar onLogout={onLogout} />
      <div className="ml-64">
        <Header user={user} title="Investors" />
        
        <main className="pt-16 p-6">
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search by name, email, or PAN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="search-investors-input"
                    className="pl-10 h-11"
                  />
                </div>
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="w-full md:w-48 h-11" data-testid="risk-filter-select">
                    <SelectValue placeholder="Risk Profile" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Profiles</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Investors Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>All Investors</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-normal text-slate-600" data-testid="investor-count">
                    {filteredInvestors.length} investors
                  </span>
                  <Button 
                    onClick={handleAddInvestor}
                    className="bg-blue-900 hover:bg-blue-800 text-white"
                    data-testid="add-investor-button"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Investor
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-slate-600">Loading investors...</p>
                </div>
              ) : filteredInvestors.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-600">No investors found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full custom-table" data-testid="investors-table">
                    <thead>
                      <tr>
                        <th className="text-left">Investor</th>
                        <th className="text-left">PAN</th>
                        <th className="text-right">Total AUM</th>
                        <th className="text-right">Invested</th>
                        <th className="text-right">Returns</th>
                        <th className="text-center">Risk Profile</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvestors.map((investor) => (
                        <tr key={investor.investor_id} data-testid={`investor-row-${investor.investor_id}`}>
                          <td>
                            <div>
                              <p className="font-semibold text-slate-900">{investor.name}</p>
                              <p className="text-sm text-slate-500">{investor.email}</p>
                            </div>
                          </td>
                          <td className="font-mono text-sm">{maskPAN(investor.pan)}</td>
                          <td className="text-right font-semibold">{formatCurrency(investor.total_aum)}</td>
                          <td className="text-right">{formatCurrency(investor.total_invested)}</td>
                          <td className="text-right">
                            <span className={`inline-flex items-center gap-1 font-semibold ${
                              investor.gain_loss_pct >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {investor.gain_loss_pct >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              {investor.gain_loss_pct.toFixed(2)}%
                            </span>
                          </td>
                          <td className="text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              investor.risk_profile === 'Low' ? 'bg-green-100 text-green-700' :
                              investor.risk_profile === 'High' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {investor.risk_profile}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/investors/${investor.investor_id}`)}
                                data-testid={`view-investor-${investor.investor_id}`}
                                className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => handleEditInvestor(investor, e)}
                                data-testid={`edit-investor-${investor.investor_id}`}
                                className="hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => handleDeleteInvestor(investor, e)}
                                data-testid={`delete-investor-${investor.investor_id}`}
                                className="hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Modals */}
      <InvestorFormModal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        investor={selectedInvestor}
        onSuccess={handleFormSuccess}
      />

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        investor={selectedInvestor}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export default Investors;
