'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users,
  FileText,
  Sparkles,
  DollarSign,
  Activity,
  LogOut,
  Lock,
  RefreshCw,
  TrendingUp,
  Clock,
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  usersToday: number;
  usersThisWeek: number;
  usersThisMonth: number;
  totalTests: number;
  testsGenerated: number;
  testsCompleted: number;
  totalTokensUsed: number;
  totalCost: number;
  apiCallsToday: number;
}

interface UsageByDay {
  date: string;
  calls: number;
  tokens: number;
  cost: number;
}

interface TopicStat {
  topic: string;
  count: number;
  tokens: number;
}

interface RecentUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

interface RecentApiCall {
  id: number;
  endpoint: string;
  model: string | null;
  totalTokens: number;
  costUsd: number;
  topic: string | null;
  difficulty: string | null;
  success: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usageByDay, setUsageByDay] = useState<UsageByDay[]>([]);
  const [topicStats, setTopicStats] = useState<TopicStat[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentApiCalls, setRecentApiCalls] = useState<RecentApiCall[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if already authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/stats?action=overview');
      if (response.ok) {
        setIsAuthenticated(true);
        loadAllData();
      }
    } catch {
      // Not authenticated
    }
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        loadAllData();
      } else {
        const data = await response.json();
        setLoginError(data.error || 'Login failed');
      }
    } catch {
      setLoginError('Login failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setStats(null);
    setUsageByDay([]);
    setTopicStats([]);
    setRecentUsers([]);
    setRecentApiCalls([]);
  };

  const loadAllData = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/admin/stats?action=all');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setUsageByDay(data.usageByDay || []);
        setTopicStats(data.topicStats || []);
        setRecentUsers(data.recentUsers || []);
        setRecentApiCalls(data.recentApiCalls || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Enter your credentials to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
              {loginError && (
                <p className="text-sm text-red-600">{loginError}</p>
              )}
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Monitor usage and analytics</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAllData}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
                  <p className="text-xs text-green-600 mt-1">
                    +{stats?.usersToday || 0} today
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tests Generated (AI)</p>
                  <p className="text-3xl font-bold">{stats?.testsGenerated || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats?.testsCompleted || 0} completed
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Tokens Used</p>
                  <p className="text-3xl font-bold">
                    {((stats?.totalTokensUsed || 0) / 1000).toFixed(1)}K
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats?.apiCallsToday || 0} API calls today
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total API Cost</p>
                  <p className="text-3xl font-bold">
                    ${(stats?.totalCost || 0).toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    OpenAI GPT-4o-mini
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Growth */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                User Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Today</span>
                  <span className="font-semibold">{stats?.usersToday || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">This Week</span>
                  <span className="font-semibold">{stats?.usersThisWeek || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">This Month</span>
                  <span className="font-semibold">{stats?.usersThisMonth || 0}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-4">
                  <span className="text-gray-500">Total</span>
                  <span className="font-bold text-lg">{stats?.totalUsers || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Topic Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topicStats.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No data yet</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {topicStats.map((topic) => (
                    <div key={topic.topic} className="flex items-center justify-between">
                      <span className="text-sm truncate flex-1">{topic.topic}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{topic.count} tests</span>
                        <span className="text-xs text-gray-400">{(topic.tokens / 1000).toFixed(1)}K tokens</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No users yet</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium text-sm">{user.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent API Calls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent API Calls
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentApiCalls.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No API calls yet</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentApiCalls.map((call) => (
                    <div key={call.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium text-sm flex items-center gap-2">
                          {call.topic || call.endpoint}
                          {call.success ? (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">OK</span>
                          ) : (
                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">FAIL</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {call.difficulty} • {call.totalTokens} tokens • ${call.costUsd.toFixed(4)}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(call.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily Usage Table */}
        {usageByDay.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Daily API Usage (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-right py-2">API Calls</th>
                      <th className="text-right py-2">Tokens</th>
                      <th className="text-right py-2">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageByDay.map((day) => (
                      <tr key={day.date} className="border-b">
                        <td className="py-2">{day.date}</td>
                        <td className="text-right py-2">{day.calls}</td>
                        <td className="text-right py-2">{(day.tokens / 1000).toFixed(1)}K</td>
                        <td className="text-right py-2">${day.cost.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
