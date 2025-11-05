import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowRight, TrendingUp } from 'lucide-react';

const Signup = ({ onSignup }) => {
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/auth/signup', formData);
      if (response.data.success) {
        toast.success('Account created successfully!');
        // Auto login after signup
        const loginResponse = await axios.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        if (loginResponse.data.success) {
          onSignup(loginResponse.data.data);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="signup-page">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6bS0yIDJ2Mmgydi0yaC0yem0wLTR2Mmgydi0yaC0yem0yLTJ2Mmgydi0yaC0yem0wLTJ2Mmgydi0yaC0yem0tMiAwdjJoMnYtMmgtMnptMC0ydjJoMnYtMmgtMnptMi0ydjJoMnYtMmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-12 h-12" />
            <h1 className="text-5xl font-bold">MF360</h1>
          </div>
          <h2 className="text-3xl font-semibold mb-4">Join the Future of MF Distribution</h2>
          <p className="text-xl text-blue-100 leading-relaxed">
            Transform your mutual fund business with cutting-edge AI analytics,
            automated insights, and comprehensive client management.
          </p>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2" data-testid="signup-title">Create Account</h2>
              <p className="text-slate-600">Start your MF360 journey today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" data-testid="signup-form">
              <div>
                <Label htmlFor="name" className="text-slate-700 font-medium">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="signup-name-input"
                  className="mt-1.5 h-11 bg-slate-50 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  data-testid="signup-email-input"
                  className="mt-1.5 h-11 bg-slate-50 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  data-testid="signup-password-input"
                  className="mt-1.5 h-11 bg-slate-50 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                data-testid="signup-submit-button"
                className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating account...
                  </span>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-600">
                Already have an account?{' '}
                <Link to="/login" data-testid="login-link" className="text-blue-900 font-semibold hover:text-blue-700 hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
