'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Filter, Download, Eye, AlertTriangle, Shield } from 'lucide-react';
import { AuditLog, AuditLogStats } from '@/types/sprint5';
import { sprint5API } from '@/services/sprint5';

interface AuditLogViewerProps {
  companyId: string;
  isManager: boolean;
  userId?: string;
}

export function AuditLogViewer({ companyId, isManager, userId }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    success: '',
    startDate: '',
    endDate: '',
    limit: 50,
    offset: 0
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false
  });

  useEffect(() => {
    loadLogs();
    if (isManager) {
      loadStats();
    }
  }, [companyId, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        action: filters.action || undefined,
        userId: userId || filters.userId || undefined,
        success: filters.success === 'all' ? undefined : filters.success === 'true' || filters.success === 'false' ? filters.success === 'true' : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      };

      const data = await sprint5API.getAuditLogs(companyId, params);
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await sprint5API.getAuditLogStats(companyId, 30);
      setStats(data);
    } catch (err) {
      console.error('Failed to load audit stats:', err);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0 // Reset pagination when filters change
    }));
  };

  const exportLogs = async () => {
    try {
      // Export current filtered logs as CSV
      const csvData = [
        ['Timestamp', 'User', 'Action', 'IP Address', 'Success', 'Details'],
        ...logs.map(log => [
          new Date(log.timestamp).toISOString(),
          log.user?.name || 'Unknown',
          log.action,
          log.ipAddress || 'Unknown',
          log.success ? 'Success' : 'Failed',
          log.details || ''
        ])
      ];

      const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export logs:', err);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN')) return <Shield className="h-4 w-4 text-green-600" />;
    if (action.includes('FAILED')) return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (action.includes('2FA')) return <Shield className="h-4 w-4 text-blue-600" />;
    if (action.includes('SSO')) return <Shield className="h-4 w-4 text-purple-600" />;
    if (action.includes('BILLING')) return <Eye className="h-4 w-4 text-yellow-600" />;
    return <Eye className="h-4 w-4 text-gray-600" />;
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('FAILED')) return 'destructive';
    if (action.includes('LOGIN') && !action.includes('FAILED')) return 'default';
    if (action.includes('2FA') || action.includes('SSO')) return 'secondary';
    return 'outline';
  };

  if (!isManager) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription>
              Only managers can access audit logs.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">
          Monitor security events and user activity
        </p>
      </div>

      {isManager && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Events (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalEvents > 0 
                  ? Math.round((stats.successRate.find(s => s.success)?. _count.id || 0) / stats.totalEvents * 100)
                  : 0}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {stats.actionBreakdown.slice(0, 3).map((action, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{action.action}</span>
                    <span className="font-medium">{action._count.id}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Most Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {stats.topUsers.slice(0, 3).map((user, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{user.user?.name || 'Unknown'}</span>
                    <span className="font-medium">{user._count.id}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Event Logs</TabsTrigger>
          {isManager && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
        </TabsList>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Audit Events</CardTitle>
                  <CardDescription>
                    Recent security and activity events
                  </CardDescription>
                </div>
                <Button onClick={exportLogs} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                <div>
                  <label className="text-sm font-medium">Action</label>
                  <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All actions</SelectItem>
                      <SelectItem value="LOGIN">Login</SelectItem>
                      <SelectItem value="LOGOUT">Logout</SelectItem>
                      <SelectItem value="LOGIN_FAILED">Failed Login</SelectItem>
                      <SelectItem value="2FA_ENABLED">2FA Enabled</SelectItem>
                      <SelectItem value="2FA_DISABLED">2FA Disabled</SelectItem>
                      <SelectItem value="SSO_ATTEMPT">SSO Attempt</SelectItem>
                      <SelectItem value="BILLING">Billing</SelectItem>
                      <SelectItem value="WHITELABEL_UPDATED">White-label Updated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={filters.success} onValueChange={(value) => handleFilterChange('success', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Success</SelectItem>
                      <SelectItem value="false">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Limit</label>
                  <Select value={filters.limit.toString()} onValueChange={(value) => handleFilterChange('limit', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button onClick={loadLogs} variant="outline" className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    Apply Filters
                  </Button>
                </div>
              </div>

              {/* Logs Table */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No audit logs found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {getActionIcon(log.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">{log.user?.name || 'System'}</p>
                            <Badge variant={getActionBadgeVariant(log.action)}>
                              {log.action}
                            </Badge>
                            {log.success ? (
                              <Badge variant="outline" className="text-green-700 border-green-200">
                                Success
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-700 border-red-200">
                                Failed
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                            {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                            {log.userAgent && (
                              <span className="truncate max-w-xs">
                                {log.userAgent.length > 50 ? log.userAgent.substring(0, 50) + '...' : log.userAgent}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {log.details && (
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.total > pagination.limit && (
                <div className="flex justify-between items-center mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} results
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                      disabled={pagination.offset === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                      disabled={!pagination.hasMore}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isManager && (
          <TabsContent value="analytics">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Analytics</CardTitle>
                  <CardDescription>
                    Security and usage trends over the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stats ? (
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium mb-3">Daily Login Activity</h4>
                        <div className="h-32 bg-muted rounded-lg flex items-end justify-around p-4">
                          {stats.dailyLogins.slice(-7).map((day, index) => (
                            <div key={index} className="flex flex-col items-center">
                              <div 
                                className="bg-blue-500 w-8 rounded-t"
                                style={{ height: `${Math.max(4, (day._count.id / Math.max(...stats.dailyLogins.map(d => d._count.id))) * 80)}px` }}
                              />
                              <span className="text-xs mt-1 text-muted-foreground">
                                {new Date(day.timestamp).toLocaleDateString('en-US', { weekday: 'short' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-3">Action Breakdown</h4>
                          <div className="space-y-2">
                            {stats.actionBreakdown.map((action, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{action.action}</span>
                                <span className="font-medium">{action._count.id}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-3">Success vs Failed</h4>
                          <div className="space-y-2">
                            {stats.successRate.map((result, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{result.success ? 'Success' : 'Failed'}</span>
                                <span className="font-medium">{result._count.id}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}