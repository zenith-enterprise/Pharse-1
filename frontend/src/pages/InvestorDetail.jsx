import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AIAnalysisCards from '../components/AIAnalysisCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, TrendingDown, Brain, Loader } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { toast } from 'sonner';

const COLORS = ['#1E3A8A', '#7C3AED', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6'];

const InvestorDetail = ({ user, onLogout }) => {
  const { investorId } = useParams();
  const navigate = useNavigate();
  const [investor, setInvestor] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzingAI, setAnalyzingAI] = useState(false);

  useEffect(() => {
    loadInvestorDetail();
  }, [investorId]);

  const loadInvestorDetail = async () => {
    try {
      const response = await axios.get(`/investors/${investorId}`);
      setInvestor(response.data.data);

      // Try to load cached AI analysis
      try {
        const aiResponse = await axios.get(`/ai/summary/${investorId}`);
        setAnalysis(aiResponse.data.data);
      } catch (err) {
        // No cached analysis
      }
    } catch (error) {
      toast.error('Failed to load investor details');
      navigate('/investors');
    } finally {
      setLoading(false);
    }
  };

  const runAIAnalysis = async () => {
    setAnalyzingAI(true);
    try {
      toast.info('Running AI analysis... This may take a few seconds.');
      const response = await axios.post(`/ai/run/${investorId}`);
      if (response.data.success) {
        setAnalysis(response.data.data);
        toast.success('AI analysis completed!');
      }
    } catch (error) {
      toast.error('Failed to run AI analysis');
    } finally {
      setAnalyzingAI(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Loading investor details...</p>
        </div>
      </div>
    );
  }

  if (!investor) return null;

  // Prepare chart data
  const allocationData = investor.portfolios.reduce((acc, p) => {
    const existing = acc.find(a => a.name === p.category);
    if (existing) {
      existing.value += p.current_value;
    } else {
      acc.push({ name: p.category, value: p.current_value });
    }
    return acc;
  }, []);

  const amcData = investor.portfolios.reduce((acc, p) => {
    const existing = acc.find(a => a.name === p.amc_name);
    if (existing) {
      existing.value += p.current_value;
    } else {
      acc.push({ name: p.amc_name, value: p.current_value });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value).slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="investor-detail-page">
      <Sidebar onLogout={onLogout} />
      <div className="ml-64">
        <Header user={user} title="Investor Details" />
        
        <main className="pt-16 p-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/investors')}
            data-testid="back-button"
            className="mb-4 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Investors
          </Button>

          {/* Investor Header */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2" data-testid="investor-name">{investor.name}</h1>
                  <div className="space-y-1 text-slate-600">
                    <p data-testid="investor-email">Email: {investor.email}</p>
                    <p data-testid="investor-mobile">Mobile: {investor.mobile}</p>
                    <p data-testid="investor-pan">PAN: {investor.pan}</p>
                    <p>Risk Profile: <span className={`font-semibold ${
                      investor.risk_profile === 'Low' ? 'text-green-600' :
                      investor.risk_profile === 'High' ? 'text-red-600' : 'text-yellow-600'
                    }`}>{investor.risk_profile}</span></p>
                  </div>
                </div>
                <Button
                  onClick={runAIAnalysis}
                  disabled={analyzingAI}
                  data-testid="run-ai-analysis-button"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {analyzingAI ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Run AI Analysis
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="stat-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total AUM</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900" data-testid="investor-aum">
                  {formatCurrency(investor.total_aum)}
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Invested</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900" data-testid="investor-invested">
                  {formatCurrency(investor.total_invested)}
                </div>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Gain/Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold flex items-center gap-2 ${
                  investor.gain_loss_pct >= 0 ? 'text-green-600' : 'text-red-600'
                }`} data-testid="investor-gain-loss">
                  {investor.gain_loss_pct >= 0 ? <TrendingUp /> : <TrendingDown />}
                  {investor.gain_loss_pct.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 5 AMCs by Value</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={amcData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#1E3A8A" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* AI Analysis */}
          {analysis && (
            <Card className="mb-6 border-2 border-purple-200 bg-purple-50/30" data-testid="ai-summary-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-6 h-6 text-purple-600" />
                  AI-Generated Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg p-6 whitespace-pre-wrap" data-testid="ai-summary-text">
                  {analysis.ai_summary?.summary || 'No summary available'}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Portfolios Table */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolios ({investor.portfolios?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full custom-table" data-testid="portfolios-table">
                  <thead>
                    <tr>
                      <th className="text-left">Scheme Name</th>
                      <th className="text-left">AMC</th>
                      <th className="text-left">Category</th>
                      <th className="text-right">Invested</th>
                      <th className="text-right">Current Value</th>
                      <th className="text-right">Gain/Loss</th>
                      <th className="text-center">SIP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investor.portfolios?.map((portfolio, idx) => (
                      <tr key={idx} data-testid={`portfolio-row-${idx}`}>
                        <td className="font-semibold text-slate-900">{portfolio.scheme_name}</td>
                        <td className="text-slate-600">{portfolio.amc_name}</td>
                        <td>
                          <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                            {portfolio.category}
                          </span>
                        </td>
                        <td className="text-right">{formatCurrency(portfolio.invested_amount)}</td>
                        <td className="text-right font-semibold">{formatCurrency(portfolio.current_value)}</td>
                        <td className="text-right">
                          <span className={`font-semibold ${
                            portfolio.gain_loss_pct >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {portfolio.gain_loss_pct >= 0 ? '+' : ''}{portfolio.gain_loss_pct.toFixed(2)}%
                          </span>
                        </td>
                        <td className="text-center">
                          {portfolio.sip_flag ? (
                            <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">
                              Active
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default InvestorDetail;
