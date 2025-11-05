import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AIAnalysisCards from '../components/AIAnalysisCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Loader, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Users, BarChart3, PieChart, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { toast } from 'sonner';

const AIInsights = ({ user, onLogout }) => {
  const [investors, setInvestors] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingInvestors, setLoadingInvestors] = useState(true);
  const [aggregateData, setAggregateData] = useState(null);
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

  const renderAlgorithmResult = (title, data, icon) => {
    return (
      <Card className="stat-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
            {JSON.stringify(data, null, 2)}
          </pre>
        </CardContent>
      </Card>
    );
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

              {/* Performance Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="stat-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Invested Amount</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900" data-testid="analysis-invested">
                      {formatCurrency(analysis.analysis?.performance?.invested)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="stat-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Current Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900" data-testid="analysis-value">
                      {formatCurrency(analysis.analysis?.performance?.value)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="stat-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Gain/Loss</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold flex items-center gap-2 ${
                      (analysis.analysis?.performance?.gainLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`} data-testid="analysis-gain-loss">
                      {(analysis.analysis?.performance?.gainLoss || 0) >= 0 ? <TrendingUp /> : <TrendingDown />}
                      {(analysis.analysis?.performance?.gainLoss || 0).toFixed(2)}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Key Alerts */}
              {analysis.analysis?.concentration?.alerts?.length > 0 && (
                <Card className="border-2 border-yellow-300 bg-yellow-50/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      Concentration Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2" data-testid="concentration-alerts">
                      {analysis.analysis.concentration.alerts.map((alert, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-4 border border-yellow-200">
                          <p className="font-semibold text-yellow-800">{alert.type}</p>
                          <p className="text-sm text-slate-600">AMC: {alert.amc} - {alert.pct}%</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Diversification Score */}
              <Card className="border-2 border-green-300 bg-green-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Diversification Quality
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="diversification-metrics">
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-slate-600">Diversification Score</p>
                      <p className="text-3xl font-bold text-green-600">
                        {analysis.analysis?.diversification?.diversificationScore || 0}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-slate-600">AMC Count</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {analysis.analysis?.diversification?.amcCount || 0}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-slate-600">Category Count</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {analysis.analysis?.diversification?.catCount || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {analysis.analysis?.rebalancing_recommendations?.suggestions?.length > 0 && (
                <Card className="border-2 border-blue-300 bg-blue-50/30">
                  <CardHeader>
                    <CardTitle className="text-lg">Rebalancing Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2" data-testid="rebalancing-recommendations">
                      {analysis.analysis.rebalancing_recommendations.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="bg-white rounded-lg p-4 border border-blue-200 flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* All Algorithm Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Algorithm Results (20 Analyses)</CardTitle>
                  <p className="text-sm text-slate-600 mt-2">
                    Complete output from all AI algorithms
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {renderAlgorithmResult('Portfolio Performance', analysis.analysis?.performance, <TrendingUp className="w-4 h-4 text-blue-600" />)}
                    {renderAlgorithmResult('Asset Allocation', analysis.analysis?.allocation, <TrendingUp className="w-4 h-4 text-teal-600" />)}
                    {renderAlgorithmResult('SIP Health', analysis.analysis?.sip_health, <CheckCircle className="w-4 h-4 text-green-600" />)}
                    {renderAlgorithmResult('Risk Mismatch', analysis.analysis?.risk_mismatch, <AlertTriangle className="w-4 h-4 text-yellow-600" />)}
                    {renderAlgorithmResult('Churn Risk', analysis.analysis?.churn_risk, <AlertTriangle className="w-4 h-4 text-red-600" />)}
                    {renderAlgorithmResult('Goal Forecast', analysis.analysis?.goal_forecast, <TrendingUp className="w-4 h-4 text-purple-600" />)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!loading && !analysis && (
            <div className="text-center py-20">
              <Brain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">Select an investor and run analysis to see results</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AIInsights;
