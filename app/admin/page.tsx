'use client';

import { useState, useEffect, useMemo } from 'react';
import { signIn } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users,
  Sparkles,
  DollarSign,
  Activity,
  LogOut,
  Lock,
  RefreshCw,
  TrendingUp,
  Clock,
  Search,
  Chrome,
  ChevronDown,
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

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  provider: string | null;
  createdAt: string;
  subscriptionStatus: string;
  subscriptionCurrentPeriodEnd: string | null;
  testsCompleted: number;
  avgScore: number;
  testsCreated: number;
  aiGenerations: number;
  apiCalls: number;
  lastActive: string | null;
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

type Tab = 'overview' | 'users' | 'activity' | 'tests';

interface AdminTestSummary {
  id: string;
  topic: string;
  difficulty: string;
  title: string;
  questionCount: number;
  indexable?: boolean;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z');
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (Number.isNaN(seconds)) return 'Never';
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z');
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StatusBadge({ status, periodEnd }: { status: string; periodEnd: string | null }) {
  if (status === 'active') {
    const expired = periodEnd ? new Date(periodEnd) < new Date() : false;
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${expired ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
        {expired ? 'Expired' : 'Pro'}
      </span>
    );
  }
  if (status === 'past_due') {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">Past Due</span>;
  }
  if (status === 'canceled') {
    return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Canceled</span>;
  }
  return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">Free</span>;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usageByDay, setUsageByDay] = useState<UsageByDay[]>([]);
  const [topicStats, setTopicStats] = useState<TopicStat[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [recentApiCalls, setRecentApiCalls] = useState<RecentApiCall[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [indexableTests, setIndexableTests] = useState<AdminTestSummary[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [togglingTestId, setTogglingTestId] = useState<string | null>(null);

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
    setUsers([]);
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
        setUsers(data.users || []);
        setRecentApiCalls(data.recentApiCalls || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setIsRefreshing(false);
  };

  // SEO indexing toggles: page-eligible public tests with their indexable
  // state. Loaded lazily when the tab opens.
  const loadIndexableTests = async () => {
    setTestsLoading(true);
    try {
      const response = await fetch('/api/admin/tests');
      if (response.ok) {
        const data = await response.json();
        setIndexableTests(data.tests || []);
      }
    } catch (error) {
      console.error('Failed to load tests:', error);
    }
    setTestsLoading(false);
  };

  const toggleIndexable = async (test: AdminTestSummary) => {
    if (togglingTestId) return;
    setTogglingTestId(test.id);
    try {
      const next = !test.indexable;
      const response = await fetch('/api/admin/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: test.id, indexable: next }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Failed to update');
      } else {
        setIndexableTests((prev) =>
          prev.map((t) => (t.id === test.id ? { ...t, indexable: next } : t))
        );
      }
    } catch (error) {
      console.error('Failed to toggle indexing:', error);
      alert('Failed to update');
    }
    setTogglingTestId(null);
  };

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(query) ||
        (u.name || '').toLowerCase().includes(query)
    );
  }, [users, userSearch]);

  const activeUsersThisWeek = useMemo(
    () =>
      users.filter((u) => {
        if (!u.lastActive) return false;
        const date = new Date(u.lastActive.includes('T') ? u.lastActive : u.lastActive.replace(' ', 'T') + 'Z');
        return Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000;
      }).length,
    [users]
  );

  const proUsers = useMemo(
    () => users.filter((u) => u.subscriptionStatus === 'active').length,
    [users]
  );

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
            <CardDescription>Restricted access — admin account only</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full mb-4"
              variant="outline"
              onClick={() => signIn('google', { callbackUrl: '/admin' })}
            >
              <Chrome className="h-4 w-4 mr-2" />
              Continue with Google
            </Button>

            {!showPasswordLogin ? (
              <button
                type="button"
                onClick={() => setShowPasswordLogin(true)}
                className="w-full text-xs text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
              >
                Use password instead <ChevronDown className="h-3 w-3" />
              </button>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4 pt-4 border-t">
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
            )}
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
            <p className="text-sm text-gray-500">Users, usage, and analytics</p>
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
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {([
            ['overview', 'Overview'],
            ['users', 'Users'],
            ['activity', 'Activity'],
            ['tests', 'SEO Tests'],
          ] as [Tab, string][]).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'tests') loadIndexableTests();
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ===================== Overview Tab ===================== */}
        {activeTab === 'overview' && (
          <>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Active This Week</span>
                      <span className="font-semibold">{activeUsersThisWeek}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Pro Subscribers</span>
                      <span className="font-semibold">{proUsers}</span>
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
                    <Sparkles className="h-5 w-5" />
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
          </>
        )}

        {/* ===================== Users Tab ===================== */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Registered Users
                </CardTitle>
                <CardDescription>
                  {filteredUsers.length} of {users.length} users
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search email or name..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No users yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="py-2 pr-4 font-medium">User</th>
                        <th className="py-2 pr-4 font-medium">Registered</th>
                        <th className="py-2 pr-4 font-medium">Status</th>
                        <th className="py-2 pr-4 font-medium text-right">Tests Done</th>
                        <th className="py-2 pr-4 font-medium text-right">Avg Score</th>
                        <th className="py-2 pr-4 font-medium text-right">AI Gens</th>
                        <th className="py-2 pr-4 font-medium text-right">API Calls</th>
                        <th className="py-2 font-medium">Last Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              {user.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={user.image}
                                  alt=""
                                  className="h-8 w-8 rounded-full"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                  {(user.name || user.email)[0].toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium truncate">{user.name || 'Unknown'}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4 whitespace-nowrap text-gray-600">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="py-3 pr-4">
                            <StatusBadge status={user.subscriptionStatus} periodEnd={user.subscriptionCurrentPeriodEnd} />
                          </td>
                          <td className="py-3 pr-4 text-right">{user.testsCompleted}</td>
                          <td className="py-3 pr-4 text-right">
                            {user.testsCompleted > 0 ? `${user.avgScore}%` : '—'}
                          </td>
                          <td className="py-3 pr-4 text-right">{user.aiGenerations}</td>
                          <td className="py-3 pr-4 text-right text-gray-500">{user.apiCalls}</td>
                          <td className="py-3 whitespace-nowrap text-gray-600">
                            {timeAgo(user.lastActive)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ===================== Activity Tab ===================== */}
        {activeTab === 'activity' && (
          <>
            <Card className="mb-8">
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
                  <div className="space-y-3 max-h-96 overflow-y-auto">
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

            {usageByDay.length > 0 && (
              <Card>
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
          </>
        )}

        {/* ===================== SEO Tests Tab ===================== */}
        {activeTab === 'tests' && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Per-test page indexing</h2>
              <p className="text-sm text-gray-600 mt-1">
                Toggle which public test pages search engines may index. The bar:
                public original content, &ge;10 questions (enforced), and a human
                spot-check of the questions (your judgment). Indexed pages get
                <code className="mx-1 px-1 rounded bg-gray-100">index,follow</code>
                + sitemap entries; all others stay
                <code className="mx-1 px-1 rounded bg-gray-100">noindex,follow</code>.
                Changes appear in the sitemap and event pages within an hour.
              </p>
            </div>

            {testsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Event</th>
                          <th className="text-left py-2">Difficulty</th>
                          <th className="text-left py-2">Test</th>
                          <th className="text-right py-2">Questions</th>
                          <th className="text-right py-2 px-4">Indexed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {indexableTests.map((t) => (
                          <tr key={t.id} className="border-b">
                            <td className="py-2 px-4">{t.topic}</td>
                            <td className="py-2">{t.difficulty}</td>
                            <td className="py-2 max-w-md truncate" title={t.title}>
                              {t.title}
                            </td>
                            <td className="py-2 text-right">
                              {t.questionCount}
                              {t.questionCount < 10 && (
                                <span className="ml-1 text-xs text-gray-400" title="Below the enforced 10-question bar">
                                  (bar)
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-4 text-right">
                              <button
                                onClick={() => toggleIndexable(t)}
                                disabled={togglingTestId === t.id || (!t.indexable && t.questionCount < 10)}
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  t.indexable
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                              >
                                {togglingTestId === t.id
                                  ? '…'
                                  : t.indexable
                                    ? 'Indexed'
                                    : 'Off'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
