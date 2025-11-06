import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  Target, Shield, Activity, Users, DollarSign, PieChart,
  BarChart3, LineChart, Zap, Award
} from 'lucide-react';

const AIAnalysisCards = ({ analysis }) => {
  if (!analysis) return null;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  return (
    <div className="space-y-6" data-testid="ai-analysis-cards">
      {/* Performance Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-blue-600" />
            Portfolio Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="text-sm text-slate-600 mb-1">Invested Amount</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(analysis.performance?.invested)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="text-sm text-slate-600 mb-1">Current Value</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(analysis.performance?.value)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="text-sm text-slate-600 mb-1">Gain/Loss</p>
              <p className={`text-2xl font-bold flex items-center gap-2 ${
                (analysis.performance?.gainLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(analysis.performance?.gainLoss || 0) >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                {formatPercent(analysis.performance?.gainLoss)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diversification Score */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChart className="w-5 h-5 text-green-600" />
            Diversification Quality
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {analysis.diversification?.diversificationScore || 0}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-700">Diversification Score</p>
              <p className="text-xs text-slate-500 mt-1">Out of 100</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-600">AMC Count</p>
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {analysis.diversification?.amcCount || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">Fund houses</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-600">Category Count</p>
                <BarChart3 className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {analysis.diversification?.catCount || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">Asset classes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Analysis */}
      {analysis.risk_mismatch?.alert && (
        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Risk Mismatch Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg p-4 border border-yellow-200">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800 mb-1">Risk Profile Mismatch Detected</p>
                  <p className="text-sm text-slate-700">{analysis.risk_mismatch.alert}</p>
                  <div className="mt-3 flex items-center gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Equity Allocation</p>
                      <p className="text-lg font-bold text-yellow-700">
                        {formatPercent(analysis.risk_mismatch.equityShare)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Concentration Alerts */}
      {analysis.concentration?.alerts?.length > 0 && (
        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-orange-600" />
              Concentration Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.concentration.alerts.map((alert, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-orange-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-orange-800">{alert.type}</p>
                        <p className="text-sm text-slate-700 mt-1">AMC: {alert.amc}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">{alert.pct}%</p>
                      <p className="text-xs text-slate-500">of portfolio</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SIP Health */}
      <Card className={`border-2 ${
        analysis.sip_discontinuation?.risk === 'Very High' || analysis.sip_discontinuation?.risk === 'High'
          ? 'border-red-200 bg-gradient-to-br from-red-50 to-white'
          : analysis.sip_discontinuation?.risk === 'Medium'
          ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-white'
          : 'border-teal-200 bg-gradient-to-br from-teal-50 to-white'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className={`w-5 h-5 ${
              analysis.sip_discontinuation?.risk === 'Very High' || analysis.sip_discontinuation?.risk === 'High'
                ? 'text-red-600'
                : analysis.sip_discontinuation?.risk === 'Medium'
                ? 'text-yellow-600'
                : 'text-teal-600'
            }`} />
            SIP Health Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-teal-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-600">Active SIPs</p>
                <CheckCircle className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-3xl font-bold text-teal-600">
                {analysis.sip_health?.active || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">Currently running</p>
            </div>
            <div className={`bg-white rounded-lg p-4 border ${
              analysis.sip_discontinuation?.risk === 'Very High' || analysis.sip_discontinuation?.risk === 'High'
                ? 'border-red-200'
                : analysis.sip_discontinuation?.risk === 'Medium'
                ? 'border-yellow-200'
                : 'border-teal-100'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-600">Discontinuation Risk</p>
                <Activity className={`w-4 h-4 ${
                  analysis.sip_discontinuation?.risk === 'Very High' || analysis.sip_discontinuation?.risk === 'High'
                    ? 'text-red-600'
                    : analysis.sip_discontinuation?.risk === 'Medium'
                    ? 'text-yellow-600'
                    : 'text-teal-600'
                }`} />
              </div>
              <p className={`text-3xl font-bold ${
                analysis.sip_discontinuation?.risk === 'Very High' || analysis.sip_discontinuation?.risk === 'High'
                  ? 'text-red-600'
                  : analysis.sip_discontinuation?.risk === 'Medium'
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}>
                {analysis.sip_discontinuation?.risk || 'Low'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {analysis.sip_discontinuation?.missedCount || 0} missed payments
              </p>
            </div>
          </div>
          
          {/* Detailed Breakdown */}
          {analysis.sip_discontinuation?.sipCount > 0 && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-xs font-semibold text-slate-700 mb-2">Breakdown:</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-red-600">
                    {analysis.sip_discontinuation?.highRiskCount || 0}
                  </p>
                  <p className="text-xs text-slate-500">High Risk</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-yellow-600">
                    {analysis.sip_discontinuation?.mediumRiskCount || 0}
                  </p>
                  <p className="text-xs text-slate-500">Medium Risk</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">
                    {analysis.sip_discontinuation?.lowRiskCount || 0}
                  </p>
                  <p className="text-xs text-slate-500">Low Risk</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Churn Risk */}
      <Card className={`border-2 ${
        analysis.churn_risk?.churnRisk === 'High' 
          ? 'border-red-200 bg-gradient-to-br from-red-50 to-white'
          : 'border-green-200 bg-gradient-to-br from-green-50 to-white'
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className={`w-5 h-5 ${
              analysis.churn_risk?.churnRisk === 'High' ? 'text-red-600' : 'text-green-600'
            }`} />
            Client Retention Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg p-4 border ${
            analysis.churn_risk?.churnRisk === 'High' ? 'border-red-200' : 'border-green-200'
          }">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Churn Risk Level</p>
                <p className={`text-3xl font-bold ${
                  analysis.churn_risk?.churnRisk === 'High' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {analysis.churn_risk?.churnRisk || 'Low'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Risk Score: {((analysis.churn_risk?.score || 0) * 100).toFixed(0)}/100
                </p>
              </div>
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  analysis.churn_risk?.churnRisk === 'High' 
                    ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  <span className={`text-2xl font-bold ${
                    analysis.churn_risk?.churnRisk === 'High' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {((1 - (analysis.churn_risk?.score || 0)) * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Retention</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {analysis.rebalancing_recommendations?.suggestions?.length > 0 && (
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LineChart className="w-5 h-5 text-purple-600" />
              Rebalancing Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.rebalancing_recommendations.suggestions.map((suggestion, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-purple-200 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-700">{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIAnalysisCards;
