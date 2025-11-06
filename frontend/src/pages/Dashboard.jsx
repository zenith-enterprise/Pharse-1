import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { TrendingUp, TrendingDown, Users, Wallet, Brain, ArrowRight, UserCheck, UserX, UserPlus, Activity, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';

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

      // Load investors with portfolios for comprehensive stats
      const response = await axios.get('/investors?include_portfolios=true');
      const investors = response.data.data;

      // Calculate comprehensive analytics
      const analytics = calculateComprehensiveAnalytics(investors);
      setStats(analytics);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateComprehensiveAnalytics = (investors) => {
    const totalInvestors = investors.length;
    const totalAUM = investors.reduce((sum, inv) => sum + inv.total_aum, 0);
    const totalInvested = investors.reduce((sum, inv) => sum + inv.total_invested, 0);
    const avgGain = totalInvestors > 0 ? investors.reduce((sum, inv) => sum + inv.gain_loss_pct, 0) / totalInvestors : 0;

    // Investor Segmentation
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newInvestors = investors.filter(inv => {
      try {
        const onboardingDate = new Date(inv.onboarding_date);
        return onboardingDate >= thirtyDaysAgo;
      } catch {
        return false;
      }
    });

    const activeInvestors = investors.filter(inv => inv.gain_loss_pct >= 0);
    const inactiveInvestors = investors.filter(inv => inv.gain_loss_pct < -5);

    // AUM by Asset Class (from portfolios)
    const assetClassData = {};
    let totalPortfolios = 0;
    investors.forEach(inv => {
      if (inv.portfolios && Array.isArray(inv.portfolios)) {
        inv.portfolios.forEach(portfolio => {
          totalPortfolios++;
          const category = portfolio.category || 'Other';
          const value = parseFloat(portfolio.current_value) || 0;
          assetClassData[category] = (assetClassData[category] || 0) + value;
        });
      }
    });

    const aumByAssetClass = Object.entries(assetClassData)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .filter(item => item.value > 0);
    
    console.log('Asset Class Data:', assetClassData);
    console.log('AUM By Asset Class Array:', aumByAssetClass);

    // AMC Weightage
    const amcData = {};
    investors.forEach(inv => {
      if (inv.portfolios && Array.isArray(inv.portfolios)) {
        inv.portfolios.forEach(portfolio => {
          const amc = portfolio.amc_name || 'Other';
          const value = parseFloat(portfolio.current_value) || 0;
          amcData[amc] = (amcData[amc] || 0) + value;
        });
      }
    });

    const amcWeightage = Object.entries(amcData)
      .map(([name, value]) => ({ 
        name, 
        value: parseFloat(value.toFixed(2)), 
        percentage: parseFloat(((value / totalAUM) * 100).toFixed(2))
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .filter(item => item.value > 0);
    
    console.log('AMC Data:', amcData);
    console.log('AMC Weightage Array:', amcWeightage);
    console.log('Total SIPs:', totalSIPs, 'SIP Value:', sipValue);
    console.log('New Investors:', newInvestors.length);

    // SIP Statistics
    let totalSIPs = 0;
    let sipValue = 0;
    investors.forEach(inv => {
      if (inv.portfolios && Array.isArray(inv.portfolios)) {
        inv.portfolios.forEach(portfolio => {
          if (portfolio.sip_flag) {
            totalSIPs++;
            sipValue += parseFloat(portfolio.current_value) || 0;
          }
        });
      }
    });

    // Performance Distribution
    const performanceBuckets = {
      'Negative': 0,
      '0-5%': 0,
      '5-10%': 0,
      '10-15%': 0,
      '15%+': 0
    };

    investors.forEach(inv => {
      if (inv.gain_loss_pct < 0) performanceBuckets['Negative']++;
      else if (inv.gain_loss_pct < 5) performanceBuckets['0-5%']++;
      else if (inv.gain_loss_pct < 10) performanceBuckets['5-10%']++;
      else if (inv.gain_loss_pct < 15) performanceBuckets['10-15%']++;
      else performanceBuckets['15%+']++;
    });

    const performanceDistribution = Object.entries(performanceBuckets).map(([name, value]) => ({ name, value }));

    // AUM Distribution by Size
    const aumBuckets = {
      '<5L': 0,
      '5-10L': 0,
      '10-15L': 0,
      '15-20L': 0,
      '20L+': 0
    };

    investors.forEach(inv => {
      const aum = inv.total_aum / 100000;
      if (aum < 5) aumBuckets['<5L']++;
      else if (aum < 10) aumBuckets['5-10L']++;
      else if (aum < 15) aumBuckets['10-15L']++;
      else if (aum < 20) aumBuckets['15-20L']++;
      else aumBuckets['20L+']++;
    });

    const aumDistribution = Object.entries(aumBuckets).map(([name, value]) => ({ name, value }));

    // Top Investors by AUM
    const topInvestors = [...investors]
      .sort((a, b) => b.total_aum - a.total_aum)
      .slice(0, 5)
      .map(inv => ({
        name: inv.name,
        aum: inv.total_aum,
        gain: inv.gain_loss_pct
      }));

    // Risk Profile Distribution
    const riskDist = investors.reduce((acc, inv) => {
      acc[inv.risk_profile] = (acc[inv.risk_profile] || 0) + 1;
      return acc;
    }, {});

    const riskDistribution = Object.entries(riskDist).map(([name, value]) => ({ name, value }));

    return {
      totalInvestors,
      totalAUM,
      totalInvested,
      avgGain,
      newInvestors: newInvestors.length,
      activeInvestors: activeInvestors.length,
      inactiveInvestors: inactiveInvestors.length,
      aumByAssetClass,
      amcWeightage,
      totalSIPs,
      sipValue,
      performanceDistribution,
      aumDistribution,
      topInvestors,
      riskDistribution,
      needsSeeding: false
    };
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

  const COLORS = ['#1E3A8A', '#7C3AED', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#10B981', '#F97316'];

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
              {/* Primary Stats Grid */}
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

              {/* Investor Segmentation */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Investor Segmentation</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">Active Investors</CardTitle>
                      <UserCheck className="w-5 h-5 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">{stats?.activeInvestors || 0}</div>
                      <p className="text-xs text-slate-500 mt-1">
                        {((stats?.activeInvestors / stats?.totalInvestors) * 100).toFixed(1)}% of total
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">Needs Attention</CardTitle>
                      <UserX className="w-5 h-5 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">{stats?.inactiveInvestors || 0}</div>
                      <p className="text-xs text-slate-500 mt-1">Loss > 5%</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">New Investors</CardTitle>
                      <UserPlus className="w-5 h-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">{stats?.newInvestors || 0}</div>
                      <p className="text-xs text-slate-500 mt-1">Last 30 days</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">Active SIPs</CardTitle>
                      <Activity className="w-5 h-5 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-600">{stats?.totalSIPs || 0}</div>
                      <p className="text-xs text-slate-500 mt-1">{formatCurrency(stats?.sipValue || 0)}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* AUM Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* AUM by Asset Class */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-blue-600" />
                      AUM Split by Asset Class
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats?.aumByAssetClass || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${((value / stats?.totalAUM) * 100).toFixed(1)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {(stats?.aumByAssetClass || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Performance Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-green-600" />
                      Performance Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats?.performanceDistribution || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#14B8A6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* AMC Weightage */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    Top 10 AMC Weightage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(stats?.amcWeightage || []).map((amc, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-4 text-sm font-semibold text-slate-500">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-slate-900">{amc.name}</span>
                            <span className="text-sm text-slate-600">
                              {formatCurrency(amc.value)} ({amc.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-600 to-purple-400 h-2 rounded-full"
                              style={{ width: `${amc.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Additional Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* AUM Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-teal-600" />
                      Investor AUM Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stats?.aumDistribution || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#14B8A6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Risk Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-orange-600" />
                      Risk Profile Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={stats?.riskDistribution || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {(stats?.riskDistribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Top Investors */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Top 5 Investors by AUM
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(stats?.topInvestors || []).map((inv, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-lg font-bold text-blue-600">{idx + 1}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{inv.name}</p>
                            <p className="text-sm text-slate-500">{formatCurrency(inv.aum)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            inv.gain >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {inv.gain >= 0 ? '+' : ''}{inv.gain.toFixed(2)}%
                          </p>
                          <p className="text-xs text-slate-500">Returns</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

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
