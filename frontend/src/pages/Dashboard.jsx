import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { TrendingUp, TrendingDown, Users, Wallet, Brain, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Check seed status
      const seedStatus = await axios.get('/seed/status');
      
      if (!seedStatus.data.data.seeded) {
        setStats({ needsSeeding: true });
        setLoading(false);
        return;
      }

      // Load investors for stats
      const response = await axios.get('/investors');
      const investors = response.data.data;

      // Calculate stats
      const totalInvestors = investors.length;
      const totalAUM = investors.reduce((sum, inv) => sum + inv.total_aum, 0);
      const totalInvested = investors.reduce((sum, inv) => sum + inv.total_invested, 0);
      const avgGain = totalInvestors > 0 ? investors.reduce((sum, inv) => sum + inv.gain_loss_pct, 0) / totalInvestors : 0;

      setStats({
        totalInvestors,
        totalAUM,
        totalInvested,
        avgGain,
        needsSeeding: false
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      toast.info('Seeding database with 300 investors... This may take a minute.');
      const response = await axios.post('/seed/run');
      if (response.data.success) {
        toast.success(`Successfully seeded ${response.data.count} investors!`);
        loadDashboardData();
      }
    } catch (error) {
      toast.error('Failed to seed database');
    } finally {
      setSeeding(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="dashboard-page">
      <Sidebar onLogout={onLogout} />
      <div className="ml-64">
        <Header user={user} title="Dashboard" />
        
        <main className="pt-16 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-slate-600">Loading dashboard...</p>
              </div>
            </div>
          ) : stats?.needsSeeding ? (
            <div className="max-w-2xl mx-auto mt-20">
              <Card className="border-2 border-dashed border-slate-300">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Welcome to MF360!</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <p className="text-slate-600 text-lg">
                    Your database is empty. Click below to seed 300 sample investors with portfolios and transactions.
                  </p>
                  <Button
                    onClick={handleSeedData}
                    disabled={seeding}
                    data-testid="seed-database-button"
                    className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-6 text-lg"
                  >
                    {seeding ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Seeding Database...
                      </span>
                    ) : (
                      'Seed Database'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="stat-card" data-testid="total-investors-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Total Investors</CardTitle>
                    <Users className="w-5 h-5 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900">{stats?.totalInvestors || 0}</div>
                    <p className="text-xs text-slate-500 mt-1">Active clients</p>
                  </CardContent>
                </Card>

                <Card className="stat-card" data-testid="total-aum-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Total AUM</CardTitle>
                    <Wallet className="w-5 h-5 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900">
                      {formatCurrency(stats?.totalAUM || 0)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Assets under management</p>
                  </CardContent>
                </Card>

                <Card className="stat-card" data-testid="total-invested-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Total Invested</CardTitle>
                    <TrendingUp className="w-5 h-5 text-teal-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900">
                      {formatCurrency(stats?.totalInvested || 0)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Principal amount</p>
                  </CardContent>
                </Card>

                <Card className="stat-card" data-testid="avg-returns-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Avg. Returns</CardTitle>
                    {stats?.avgGain >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${
                      stats?.avgGain >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(stats?.avgGain || 0).toFixed(2)}%
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Portfolio performance</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="card-hover cursor-pointer" onClick={() => navigate('/investors')} data-testid="manage-investors-card">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Manage Investors</span>
                      <ArrowRight className="w-5 h-5 text-blue-600" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">
                      View and manage all your investors, their portfolios, and transactions.
                    </p>
                  </CardContent>
                </Card>

                <Card className="card-hover cursor-pointer" onClick={() => navigate('/ai-insights')} data-testid="ai-analysis-card">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-600" />
                        AI Analysis
                      </span>
                      <ArrowRight className="w-5 h-5 text-blue-600" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">
                      Run AI-powered analysis with 20 algorithms and ChatGPT summarization.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
