import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  PieChart,
  BarChart3,
  Building,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

const MaintenanceAnalytics = ({ landlordId, properties }) => {
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // all, month, quarter, year
  const [selectedProperty, setSelectedProperty] = useState('all');

  // Fetch maintenance requests with cost data
  useEffect(() => {
    const fetchMaintenanceData = async () => {
      if (!landlordId) return;

      try {
        setLoading(true);
        const q = query(
          collection(db, 'maintenanceRequests'),
          where('landlordId', '==', landlordId)
        );
        const snapshot = await getDocs(q);
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          completedAt: doc.data().completedAt?.toDate()
        }));
        setMaintenanceRequests(requests);
      } catch (error) {
        console.error('Error fetching maintenance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceData();
  }, [landlordId]);

  // Filter requests by period
  const filteredRequests = useMemo(() => {
    let filtered = maintenanceRequests;

    // Filter by property
    if (selectedProperty !== 'all') {
      filtered = filtered.filter(r => r.property === selectedProperty);
    }

    // Filter by period
    if (selectedPeriod !== 'all') {
      const now = new Date();
      let startDate;

      if (selectedPeriod === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (selectedPeriod === 'quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
      } else if (selectedPeriod === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
      }

      filtered = filtered.filter(r => {
        const date = r.completedAt || r.createdAt;
        return date && date >= startDate;
      });
    }

    return filtered;
  }, [maintenanceRequests, selectedPeriod, selectedProperty]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const completedRequests = filteredRequests.filter(r => r.status === 'completed' && r.actualCost);
    const approvedRequests = filteredRequests.filter(r => r.approvedCost);

    const totalEstimated = filteredRequests.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
    const totalApproved = approvedRequests.reduce((sum, r) => sum + (r.approvedCost || 0), 0);
    const totalActual = completedRequests.reduce((sum, r) => sum + (r.actualCost || 0), 0);

    const variance = totalActual - totalApproved;
    const variancePercent = totalApproved > 0 ? ((variance / totalApproved) * 100) : 0;

    // Budget utilization (if budget settings exist)
    const monthlyBudget = 50000; // This should come from landlordSettings
    const budgetUtilization = (totalActual / monthlyBudget) * 100;

    // Average costs
    const avgEstimate = filteredRequests.length > 0 ? totalEstimated / filteredRequests.length : 0;
    const avgActual = completedRequests.length > 0 ? totalActual / completedRequests.length : 0;

    // Accuracy: how close estimates are to actual costs
    const estimateAccuracy = completedRequests.reduce((acc, r) => {
      if (r.estimatedCost && r.actualCost) {
        const diff = Math.abs(r.actualCost - r.estimatedCost);
        const accuracy = 100 - ((diff / r.estimatedCost) * 100);
        return acc + Math.max(0, accuracy);
      }
      return acc;
    }, 0) / (completedRequests.length || 1);

    // Category breakdown
    const byCategory = {};
    filteredRequests.forEach(r => {
      const category = r.category || 'Other';
      if (!byCategory[category]) {
        byCategory[category] = { count: 0, cost: 0 };
      }
      byCategory[category].count++;
      byCategory[category].cost += r.actualCost || r.estimatedCost || 0;
    });

    // Property breakdown
    const byProperty = {};
    filteredRequests.forEach(r => {
      const prop = r.property || 'Unknown';
      if (!byProperty[prop]) {
        byProperty[prop] = { count: 0, cost: 0 };
      }
      byProperty[prop].count++;
      byProperty[prop].cost += r.actualCost || r.estimatedCost || 0;
    });

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthRequests = maintenanceRequests.filter(r => {
        const reqDate = r.completedAt || r.createdAt;
        return reqDate && reqDate >= monthStart && reqDate <= monthEnd;
      });

      const monthCost = monthRequests.reduce((sum, r) => sum + (r.actualCost || 0), 0);

      monthlyTrend.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        cost: monthCost,
        count: monthRequests.length
      });
    }

    return {
      totalEstimated,
      totalApproved,
      totalActual,
      variance,
      variancePercent,
      budgetUtilization,
      avgEstimate,
      avgActual,
      estimateAccuracy,
      byCategory,
      byProperty,
      monthlyTrend,
      totalRequests: filteredRequests.length,
      completedCount: completedRequests.length,
      pendingCount: filteredRequests.filter(r => r.status === 'pending').length,
      inProgressCount: filteredRequests.filter(r => r.status === 'in-progress').length
    };
  }, [filteredRequests, maintenanceRequests]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Time Period
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Property
          </label>
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Properties</option>
            {properties.map(prop => (
              <option key={prop.id} value={prop.name}>{prop.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Actual Cost */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Spent</span>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            KSH {analytics.totalActual.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {analytics.completedCount} completed requests
          </div>
        </div>

        {/* Budget Utilization */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Budget Used</span>
            <PieChart className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.budgetUtilization.toFixed(1)}%
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full ${
                analytics.budgetUtilization > 90 ? 'bg-red-500' :
                analytics.budgetUtilization > 75 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(analytics.budgetUtilization, 100)}%` }}
            />
          </div>
        </div>

        {/* Variance */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Variance</span>
            {analytics.variance > 0 ? (
              <TrendingUp className="w-5 h-5 text-red-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-green-600" />
            )}
          </div>
          <div className={`text-2xl font-bold ${
            analytics.variance > 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {analytics.variance > 0 ? '+' : ''}KSH {Math.abs(analytics.variance).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {analytics.variancePercent > 0 ? '+' : ''}{analytics.variancePercent.toFixed(1)}% vs approved
          </div>
        </div>

        {/* Estimate Accuracy */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Estimate Accuracy</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.estimateAccuracy.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Average deviation from estimates
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Cost Trend</h3>
        </div>
        <div className="space-y-3">
          {analytics.monthlyTrend.map((month, index) => {
            const maxCost = Math.max(...analytics.monthlyTrend.map(m => m.cost), 1);
            const widthPercent = (month.cost / maxCost) * 100;

            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{month.month}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    KSH {month.cost.toLocaleString()} ({month.count} requests)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category & Property Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Category */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cost by Category</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(analytics.byCategory)
              .sort((a, b) => b[1].cost - a[1].cost)
              .slice(0, 5)
              .map(([category, data], index) => {
                const totalCategoryCost = Object.values(analytics.byCategory).reduce((sum, cat) => sum + cat.cost, 0);
                const percent = (data.cost / totalCategoryCost) * 100;

                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{category}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        KSH {data.cost.toLocaleString()} ({data.count})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* By Property */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Building className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cost by Property</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(analytics.byProperty)
              .sort((a, b) => b[1].cost - a[1].cost)
              .slice(0, 5)
              .map(([property, data], index) => {
                const totalPropertyCost = Object.values(analytics.byProperty).reduce((sum, prop) => sum + prop.cost, 0);
                const percent = (data.cost / totalPropertyCost) * 100;

                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{property}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        KSH {data.cost.toLocaleString()} ({data.count})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Request Status Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalRequests}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Requests</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-300">{analytics.pendingCount}</div>
            <div className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">Pending</div>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-300">{analytics.inProgressCount}</div>
            <div className="text-sm text-blue-700 dark:text-blue-400 mt-1">In Progress</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-3xl font-bold text-green-900 dark:text-green-300">{analytics.completedCount}</div>
            <div className="text-sm text-green-700 dark:text-green-400 mt-1">Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceAnalytics;
