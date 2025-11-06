import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AIAnalysisCards from '../components/AIAnalysisCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Loader, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Users, BarChart3, PieChart, Activity, Play, Pause, StopCircle, Star, AlertCircle, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { toast } from 'sonner';

const AIInsights = ({ user, onLogout }) => {
  const [investors, setInvestors] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingInvestors, setLoadingInvestors] = useState(true);
  const [aggregateData, setAggregateData] = useState(null);
  const [enhancedAnalytics, setEnhancedAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('individual');

  useEffect(() => {
    loadInvestors();
  }, []);

  const loadInvestors = async () => {
    try {
      const response = await axios.get('/investors');
      const investorData = response.data.data || [];
      setInvestors(investorData);
      
      // Calculate aggregate data
      calculateAggregateData(investorData);
      
      // Fetch enhanced dashboard analytics
      const enhancedResponse = await axios.get('/dashboard/analytics');
      setEnhancedAnalytics(enhancedResponse.data.data);
    } catch (error) {
      toast.error('Failed to load investors');
    } finally {
      setLoadingInvestors(false);
    }
  };

  const calculateAggregateData = (investorData) => {
    if (!investorData.length) return;

    // Calculate aggregate metrics
    const totalInvestors = investorData.length;
    const totalAUM = investorData.reduce((sum, inv) => sum + inv.total_aum, 0);
    const totalInvested = investorData.reduce((sum, inv) => sum + inv.total_invested, 0);
    const avgReturns = investorData.reduce((sum, inv) => sum + inv.gain_loss_pct, 0) / totalInvestors;
    
    // Risk profile distribution
    const riskDist = investorData.reduce((acc, inv) => {
      acc[inv.risk_profile] = (acc[inv.risk_profile] || 0) + 1;
      return acc;
    }, {});
    
    const riskDistribution = Object.entries(riskDist).map(([name, value]) => ({ name, value }));
    
    // Performance distribution
    const perfBuckets = {
      'Negative': 0,
      '0-5%': 0,
      '5-10%': 0,
      '10-15%': 0,
      '15%+': 0
    };
    
    investorData.forEach(inv => {
      if (inv.gain_loss_pct < 0) perfBuckets['Negative']++;
      else if (inv.gain_loss_pct < 5) perfBuckets['0-5%']++;
      else if (inv.gain_loss_pct < 10) perfBuckets['5-10%']++;
      else if (inv.gain_loss_pct < 15) perfBuckets['10-15%']++;
      else perfBuckets['15%+']++;
    });
    
    const performanceDistribution = Object.entries(perfBuckets).map(([name, value]) => ({ name, value }));
    
    // Top and bottom performers
    const sortedByPerformance = [...investorData].sort((a, b) => b.gain_loss_pct - a.gain_loss_pct);
    const topPerformers = sortedByPerformance.slice(0, 5);
    const bottomPerformers = sortedByPerformance.slice(-5).reverse();
    
    // AUM distribution
    const aumBuckets = {
      '<5L': 0,
      '5-10L': 0,
      '10-15L': 0,
      '15L+': 0
    };
    
    investorData.forEach(inv => {
      const aum = inv.total_aum / 100000; // Convert to lakhs
      if (aum < 5) aumBuckets['<5L']++;
      else if (aum < 10) aumBuckets['5-10L']++;
      else if (aum < 15) aumBuckets['10-15L']++;
      else aumBuckets['15L+']++;
    });
    
    const aumDistribution = Object.entries(aumBuckets).map(([name, value]) => ({ name, value }));

    setAggregateData({
      totalInvestors,
      totalAUM,
      totalInvested,
      avgReturns,
      riskDistribution,
      performanceDistribution,
      topPerformers,
      bottomPerformers,
      aumDistribution
    });
  };

  const runAnalysis = async () => {
    if (!selectedInvestor) {
      toast.error('Please select an investor first');
      return;
    }

    setLoading(true);
    try {
      toast.info('Running comprehensive AI analysis...');
      const response = await axios.post(`/ai/run/${selectedInvestor}`);
      if (response.data.success) {
        setAnalysis(response.data.data);
        toast.success('AI analysis completed!');
      }
    } catch (error) {
      toast.error('Failed to run AI analysis');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const COLORS = ['#1E3A8A', '#7C3AED', '#14B8A6', '#F59E0B', '#EF4444'];

  return (
    <div className="min-h-screen bg-slate-50" data-testid="ai-insights-page">
      <Sidebar onLogout={onLogout} />
      <div className="ml-64">
        <Header user={user} title="AI Insights" />
        
        <main className="pt-16 p-6">
          {/* Tabs for Individual vs Aggregate */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="individual" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Individual Analysis
              </TabsTrigger>
              <TabsTrigger value="aggregate" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Aggregate Dashboard
              </TabsTrigger>
            </TabsList>

            {/* Individual Analysis Tab */}
            <TabsContent value="individual" className="space-y-6">
              {/* Control Panel */}
              <Card className="border-2 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-600" />
                    AI Portfolio Analysis
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-2">
                    Select an investor and run comprehensive AI analysis using 20 algorithms + ChatGPT summarization
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <Select value={selectedInvestor || ''} onValueChange={setSelectedInvestor} disabled={loadingInvestors}>
                        <SelectTrigger className="w-full h-11" data-testid="select-investor">
                          <SelectValue placeholder="Select an investor" />
                        </SelectTrigger>
                        <SelectContent>
                          {investors.map((inv) => (
                            <SelectItem key={inv.investor_id} value={inv.investor_id}>
                              {inv.name} - {inv.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={runAnalysis}
                      disabled={loading || !selectedInvestor}
                      data-testid="run-analysis-button"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Run Analysis
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Individual Analysis Results */}
              {loading && (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mb-4"></div>
                  <p className="text-slate-600 text-lg">Running 20 AI algorithms...</p>
                </div>
              )}

              {!loading && analysis && (
                <div className="space-y-6 animate-fadeIn">
                  {/* ChatGPT AI Summary - Prominent */}
                  <Card className="border-2 border-purple-300 shadow-lg bg-gradient-to-br from-purple-50 via-white to-purple-50" data-testid="ai-summary-section">
                    <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-t-lg">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Brain className="w-7 h-7" />
                        ChatGPT AI Analysis Summary
                      </CardTitle>
                      <p className="text-sm text-purple-100 mt-2">
                        Powered by GPT-4o-mini • Generated using 20 AI algorithms
                      </p>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="bg-white rounded-lg p-6 border-2 border-purple-200 shadow-sm" data-testid="chatgpt-summary">
                        <div className="prose prose-slate max-w-none">
                          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-base">
                            {analysis.summary?.summary || 'No summary available'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Analysis Cards */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-600" />
                      Detailed Insights
                    </h3>
                    <AIAnalysisCards analysis={analysis.analysis} />
                  </div>
                </div>
              )}

              {!loading && !analysis && (
                <div className="text-center py-20">
                  <Brain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 text-lg">Select an investor and run analysis to see results</p>
                </div>
              )}
            </TabsContent>

            {/* Aggregate Dashboard Tab */}
            <TabsContent value="aggregate" className="space-y-6">
              {aggregateData ? (
                <>
                  {/* Aggregate Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="stat-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Investors</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-slate-900">
                          {aggregateData.totalInvestors}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Active clients</p>
                      </CardContent>
                    </Card>

                    <Card className="stat-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total AUM</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-slate-900">
                          {formatCurrency(aggregateData.totalAUM)}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Assets under management</p>
                      </CardContent>
                    </Card>

                    <Card className="stat-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Invested</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-slate-900">
                          {formatCurrency(aggregateData.totalInvested)}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Principal amount</p>
                      </CardContent>
                    </Card>

                    <Card className="stat-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Avg Returns</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-3xl font-bold flex items-center gap-2 ${
                          aggregateData.avgReturns >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {aggregateData.avgReturns >= 0 ? <TrendingUp /> : <TrendingDown />}
                          {aggregateData.avgReturns.toFixed(2)}%
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Portfolio performance</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Risk Profile Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PieChart className="w-5 h-5 text-blue-600" />
                          Risk Profile Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RePieChart>
                            <Pie
                              data={aggregateData.riskDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value }) => `${name}: ${value}`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {aggregateData.riskDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </RePieChart>
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
                          <BarChart data={aggregateData.performanceDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#14B8A6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* AUM Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-purple-600" />
                          AUM Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={aggregateData.aumDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#7C3AED" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Top Performers */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          Top 5 Performers
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {aggregateData.topPerformers.map((inv, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                              <div>
                                <p className="font-semibold text-slate-900">{inv.name}</p>
                                <p className="text-xs text-slate-500">{formatCurrency(inv.total_aum)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-green-600">
                                  +{inv.gain_loss_pct.toFixed(2)}%
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Enhanced Analytics - SIP Insights */}
                  {enhancedAnalytics && !enhancedAnalytics.needsSeeding && (
                    <>
                      {/* SIP Status Overview */}
                      <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">SIP Insights</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium text-slate-600">Active SIPs</CardTitle>
                              <Play className="w-5 h-5 text-green-600" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-3xl font-bold text-green-600">
                                {enhancedAnalytics.sip_status?.active || 0}
                              </div>
                              <p className="text-xs text-slate-500 mt-1">Currently running</p>
                            </CardContent>
                          </Card>

                          <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium text-slate-600">Paused SIPs</CardTitle>
                              <Pause className="w-5 h-5 text-yellow-600" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-3xl font-bold text-yellow-600">
                                {enhancedAnalytics.sip_status?.paused || 0}
                              </div>
                              <p className="text-xs text-slate-500 mt-1">Needs attention</p>
                            </CardContent>
                          </Card>

                          <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-white">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <CardTitle className="text-sm font-medium text-slate-600">Stopped SIPs</CardTitle>
                              <StopCircle className="w-5 h-5 text-red-600" />
                            </CardHeader>
                            <CardContent>
                              <div className="text-3xl font-bold text-red-600">
                                {enhancedAnalytics.sip_status?.stopped || 0}
                              </div>
                              <p className="text-xs text-slate-500 mt-1">Discontinued</p>
                            </CardContent>
                          </Card>
                        </div>

                        {/* SIP Metrics Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Monthly SIP Inflow */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                Monthly SIP Inflow Trend
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={enhancedAnalytics.monthly_sip_inflow || []}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="month" />
                                  <YAxis />
                                  <Tooltip formatter={(value) => formatCurrency(value)} />
                                  <Line 
                                    type="monotone" 
                                    dataKey="inflow" 
                                    stroke="#1E3A8A" 
                                    strokeWidth={2}
                                    dot={{ fill: '#1E3A8A', r: 4 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-slate-600">
                                  <span className="font-semibold">Avg. SIP Ticket Size:</span>{' '}
                                  {formatCurrency(enhancedAnalytics.average_sip_ticket_size || 0)}
                                </p>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Top 10 SIP Investors */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-purple-600" />
                                Top 10 SIP Investors
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {(enhancedAnalytics.top_sip_investors || []).map((inv, idx) => (
                                  <div 
                                    key={idx} 
                                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                      <span className="text-sm font-bold text-purple-600">{idx + 1}</span>
                                    </div>
                                    <p className="font-semibold text-sm text-slate-900 flex-1">{inv.name}</p>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* Upcoming SIP Expiry & High-Potential Investors */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Upcoming SIP Expiry Alerts */}
                        <Card className="border-2 border-orange-200">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <AlertCircle className="w-5 h-5 text-orange-600" />
                              Upcoming SIP Expiry (Next 3 Months)
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {(enhancedAnalytics.upcoming_sip_expiry || []).length === 0 ? (
                              <p className="text-slate-500 text-center py-8">No upcoming expiries</p>
                            ) : (
                              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {(enhancedAnalytics.upcoming_sip_expiry || []).map((sip, idx) => (
                                  <div 
                                    key={idx} 
                                    className="p-3 bg-orange-50 rounded-lg border border-orange-200"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="font-semibold text-sm text-slate-900">{sip.investor_name}</p>
                                      <span className="text-xs font-bold text-orange-600">
                                        {sip.days_until_due} days
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-600 truncate">{sip.scheme_name}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                      Amount: {formatCurrency(sip.sip_amount)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* High-Potential Investors */}
                        <Card className="border-2 border-green-200">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Star className="w-5 h-5 text-green-600" />
                              High-Potential Investors
                            </CardTitle>
                            <p className="text-xs text-slate-500 mt-1">
                              Long-term holders with minimal redemptions
                            </p>
                          </CardHeader>
                          <CardContent>
                            {(enhancedAnalytics.high_potential_investors || []).length === 0 ? (
                              <p className="text-slate-500 text-center py-8">No data available</p>
                            ) : (
                              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {(enhancedAnalytics.high_potential_investors || []).map((inv, idx) => (
                                  <div 
                                    key={idx} 
                                    className="p-3 bg-green-50 rounded-lg border border-green-200"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="font-semibold text-sm text-slate-900">{inv.name}</p>
                                      <span className="text-sm font-bold text-green-600">
                                        +{inv.gain_loss_pct.toFixed(2)}%
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-600">
                                      <span>SIP Value: {formatCurrency(inv.total_sip_value)}</span>
                                      <span>Redemptions: {inv.redemptions}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* Profit/Loss Split */}
                      <Card className="mb-8">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-blue-600" />
                            Investors in Profit vs Loss
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ResponsiveContainer width="100%" height={250}>
                              <RePieChart>
                                <Pie
                                  data={[
                                    { name: 'In Profit', value: enhancedAnalytics.profit_loss_split?.profit || 0 },
                                    { name: 'In Loss', value: enhancedAnalytics.profit_loss_split?.loss || 0 }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, value }) => `${name}: ${value}`}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  <Cell fill="#10B981" />
                                  <Cell fill="#EF4444" />
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </RePieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-col justify-center space-y-4">
                              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                                <div>
                                  <p className="text-sm text-slate-600">Investors in Profit</p>
                                  <p className="text-2xl font-bold text-green-600">
                                    {enhancedAnalytics.profit_loss_split?.profit || 0}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-slate-600">Percentage</p>
                                  <p className="text-xl font-bold text-green-600">
                                    {((enhancedAnalytics.profit_loss_split?.profit / 
                                      (enhancedAnalytics.profit_loss_split?.profit + enhancedAnalytics.profit_loss_split?.loss)) * 100).toFixed(1)}%
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                                <div>
                                  <p className="text-sm text-slate-600">Investors in Loss</p>
                                  <p className="text-2xl font-bold text-red-600">
                                    {enhancedAnalytics.profit_loss_split?.loss || 0}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-slate-600">Percentage</p>
                                  <p className="text-xl font-bold text-red-600">
                                    {((enhancedAnalytics.profit_loss_split?.loss / 
                                      (enhancedAnalytics.profit_loss_split?.profit + enhancedAnalytics.profit_loss_split?.loss)) * 100).toFixed(1)}%
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* Bottom Performers */}
                  <Card className="border-2 border-red-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-red-600" />
                        Bottom 5 Performers (Need Attention)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {aggregateData.bottomPerformers.map((inv, idx) => (
                          <div key={idx} className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <p className="font-semibold text-slate-900 text-sm mb-1">{inv.name}</p>
                            <p className="text-xs text-slate-500 mb-2">{formatCurrency(inv.total_aum)}</p>
                            <p className="text-xl font-bold text-red-600">
                              {inv.gain_loss_pct.toFixed(2)}%
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-slate-600">Loading aggregate data...</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AIInsights;
