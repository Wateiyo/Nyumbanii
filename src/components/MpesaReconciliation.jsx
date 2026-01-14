import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  Download,
  RefreshCw,
  Search,
  Filter,
  Check,
  Users
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { formatCurrency, formatDate } from '../utils/formatters';

const MpesaReconciliation = ({ landlordId, properties, tenants }) => {
  const [csvFile, setCSVFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [matchedTransactions, setMatchedTransactions] = useState([]);
  const [unmatchedTransactions, setUnmatchedTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, matched, unmatched
  const [searchTerm, setSearchTerm] = useState('');
  const [reconciliationStats, setReconciliationStats] = useState({
    totalTransactions: 0,
    matched: 0,
    unmatched: 0,
    totalAmount: 0,
    matchedAmount: 0
  });

  // Parse M-Pesa CSV file
  const parseCSVFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n');

          // Skip header row
          const dataLines = lines.slice(1).filter(line => line.trim());

          const parsedTransactions = dataLines.map((line, index) => {
            // M-Pesa CSV format: Receipt No., Completion Time, Details, Transaction Status, Paid In, Withdrawn, Balance
            const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));

            // Extract transaction details
            const receiptNo = columns[0] || '';
            const completionTime = columns[1] || '';
            const details = columns[2] || '';
            const status = columns[3] || '';
            const paidIn = parseFloat(columns[4]?.replace(/[^0-9.-]/g, '') || '0');
            const withdrawn = parseFloat(columns[5]?.replace(/[^0-9.-]/g, '') || '0');

            // Extract phone number and name from details
            // Format: "Received from John Doe 0712345678..."
            const phoneMatch = details.match(/\b(254\d{9}|0\d{9})\b/);
            const nameMatch = details.match(/from\s+([A-Za-z\s]+?)(?:\s+\d|$)/i);

            return {
              id: `mpesa-${index}-${Date.now()}`,
              receiptNo,
              completionTime,
              details,
              status,
              amount: paidIn > 0 ? paidIn : withdrawn,
              type: paidIn > 0 ? 'received' : 'paid',
              phoneNumber: phoneMatch ? phoneMatch[0] : '',
              senderName: nameMatch ? nameMatch[1].trim() : '',
              matched: false,
              matchedTenant: null,
              confidence: 0
            };
          });

          resolve(parsedTransactions.filter(t => t.type === 'received' && t.amount > 0));
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // Matching algorithm - matches M-Pesa transactions to tenants
  const matchTransactionsToTenants = (mpesaTransactions) => {
    const matched = [];
    const unmatched = [];

    mpesaTransactions.forEach(transaction => {
      let bestMatch = null;
      let highestConfidence = 0;

      tenants.forEach(tenant => {
        let confidence = 0;

        // Phone number match (highest confidence - 80 points)
        if (transaction.phoneNumber && tenant.phone) {
          const normalizedTransactionPhone = transaction.phoneNumber.replace(/^0/, '254');
          const normalizedTenantPhone = tenant.phone.replace(/^0/, '254');

          if (normalizedTransactionPhone === normalizedTenantPhone) {
            confidence += 80;
          }
        }

        // Name matching (medium confidence - up to 60 points)
        if (transaction.senderName && tenant.name) {
          const transactionNameLower = transaction.senderName.toLowerCase();
          const tenantNameLower = tenant.name.toLowerCase();

          // Exact match
          if (transactionNameLower === tenantNameLower) {
            confidence += 60;
          }
          // First name match
          else if (tenantNameLower.split(' ')[0] === transactionNameLower.split(' ')[0]) {
            confidence += 40;
          }
          // Last name match
          else if (tenantNameLower.split(' ').pop() === transactionNameLower.split(' ').pop()) {
            confidence += 35;
          }
          // Partial match
          else if (transactionNameLower.includes(tenantNameLower.split(' ')[0]) ||
                   tenantNameLower.includes(transactionNameLower.split(' ')[0])) {
            confidence += 25;
          }
        }

        // Amount matching with expected rent (low confidence - 20 points)
        if (tenant.rentAmount && Math.abs(transaction.amount - tenant.rentAmount) < 100) {
          confidence += 20;
        }

        if (confidence > highestConfidence && confidence >= 60) {
          highestConfidence = confidence;
          bestMatch = {
            ...tenant,
            confidence
          };
        }
      });

      if (bestMatch) {
        matched.push({
          ...transaction,
          matched: true,
          matchedTenant: bestMatch,
          confidence: highestConfidence
        });
      } else {
        unmatched.push({
          ...transaction,
          matched: false
        });
      }
    });

    return { matched, unmatched };
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setCSVFile(file);
    setLoading(true);

    try {
      const parsedTransactions = await parseCSVFile(file);
      setTransactions(parsedTransactions);

      // Auto-match transactions
      const { matched, unmatched } = matchTransactionsToTenants(parsedTransactions);
      setMatchedTransactions(matched);
      setUnmatchedTransactions(unmatched);

      // Calculate stats
      const totalAmount = parsedTransactions.reduce((sum, t) => sum + t.amount, 0);
      const matchedAmount = matched.reduce((sum, t) => sum + t.amount, 0);

      setReconciliationStats({
        totalTransactions: parsedTransactions.length,
        matched: matched.length,
        unmatched: unmatched.length,
        totalAmount,
        matchedAmount
      });

      setLoading(false);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Error parsing CSV file. Please check the format.');
      setLoading(false);
    }
  };

  // Confirm and save matched transactions
  const handleConfirmMatch = async (transaction) => {
    setProcessing(true);

    try {
      // Create payment record in Firestore
      await addDoc(collection(db, 'payments'), {
        tenantId: transaction.matchedTenant.docId || transaction.matchedTenant.id, // Use docId (document ID) for tenant reference
        tenantName: transaction.matchedTenant.name,
        landlordId: landlordId,
        propertyId: transaction.matchedTenant.propertyId,
        propertyName: transaction.matchedTenant.propertyName,
        unit: transaction.matchedTenant.unit,
        amount: transaction.amount,
        method: 'M-Pesa',
        referenceNumber: transaction.receiptNo,
        datePaid: new Date(transaction.completionTime),
        month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        status: 'verified',
        notes: `Auto-matched from M-Pesa reconciliation. Confidence: ${transaction.confidence}%`,
        mpesaReconciled: true,
        mpesaDetails: {
          senderName: transaction.senderName,
          phoneNumber: transaction.phoneNumber,
          receiptNo: transaction.receiptNo,
          details: transaction.details
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Remove from matched list
      setMatchedTransactions(prev => prev.filter(t => t.id !== transaction.id));

      // Update stats
      setReconciliationStats(prev => ({
        ...prev,
        matched: prev.matched - 1
      }));

      alert('Payment recorded successfully!');
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Error saving payment. Please try again.');
    }

    setProcessing(false);
  };

  // Manual tenant assignment
  const handleManualMatch = async (transaction, selectedTenant) => {
    const updatedTransaction = {
      ...transaction,
      matched: true,
      matchedTenant: selectedTenant,
      confidence: 100 // Manual match = 100% confidence
    };

    // Move from unmatched to matched
    setUnmatchedTransactions(prev => prev.filter(t => t.id !== transaction.id));
    setMatchedTransactions(prev => [...prev, updatedTransaction]);

    // Update stats
    setReconciliationStats(prev => ({
      ...prev,
      matched: prev.matched + 1,
      unmatched: prev.unmatched - 1,
      matchedAmount: prev.matchedAmount + transaction.amount
    }));
  };

  // Filter transactions
  const getFilteredTransactions = () => {
    let filtered = [];

    if (filter === 'matched') {
      filtered = matchedTransactions;
    } else if (filter === 'unmatched') {
      filtered = unmatchedTransactions;
    } else {
      filtered = [...matchedTransactions, ...unmatchedTransactions];
    }

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.receiptNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.phoneNumber.includes(searchTerm) ||
        (t.matchedTenant && t.matchedTenant.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">M-Pesa Reconciliation</h2>
        <p className="text-gray-600 dark:text-gray-400">Upload your M-Pesa statement to automatically match transactions with tenant payments</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload M-Pesa Statement</h3>
          {csvFile && (
            <button
              onClick={() => {
                setCSVFile(null);
                setTransactions([]);
                setMatchedTransactions([]);
                setUnmatchedTransactions([]);
                setReconciliationStats({
                  totalTransactions: 0,
                  matched: 0,
                  unmatched: 0,
                  totalAmount: 0,
                  matchedAmount: 0
                });
              }}
              className="text-red-600 hover:text-red-700 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
          <div className="text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <label className="cursor-pointer">
              <span className="bg-[#003366] hover:bg-[#002244] text-white px-6 py-2 rounded-lg inline-block transition">
                Choose CSV File
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {csvFile ? `Selected: ${csvFile.name}` : 'Upload M-Pesa statement in CSV format'}
            </p>
          </div>
        </div>

        {loading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-[#003366]">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Processing transactions...</span>
          </div>
        )}
      </div>

      {/* Statistics */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{reconciliationStats.totalTransactions}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Auto-Matched</p>
                <p className="text-2xl font-bold text-green-600">{reconciliationStats.matched}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unmatched</p>
                <p className="text-2xl font-bold text-orange-600">{reconciliationStats.unmatched}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(reconciliationStats.totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Matched Amount</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(reconciliationStats.matchedAmount)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      {transactions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'all'
                    ? 'bg-[#003366] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All ({reconciliationStats.totalTransactions})
              </button>
              <button
                onClick={() => setFilter('matched')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'matched'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Matched ({reconciliationStats.matched})
              </button>
              <button
                onClick={() => setFilter('unmatched')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'unmatched'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Unmatched ({reconciliationStats.unmatched})
              </button>
            </div>

            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by receipt, name, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions List */}
      {filteredTransactions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Receipt No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sender</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Matched Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Confidence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{transaction.receiptNo}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(transaction.completionTime).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{transaction.senderName || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{transaction.phoneNumber || '-'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4">
                      {transaction.matched ? (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{transaction.matchedTenant.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{transaction.matchedTenant.propertyName}</p>
                          </div>
                        </div>
                      ) : (
                        <select
                          onChange={(e) => {
                            const selectedTenant = tenants.find(t => t.id === e.target.value);
                            if (selectedTenant) {
                              handleManualMatch(transaction, selectedTenant);
                            }
                          }}
                          className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Select tenant...</option>
                          {tenants.map(tenant => (
                            <option key={tenant.id} value={tenant.id}>
                              {tenant.name} - {tenant.propertyName}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {transaction.matched && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          transaction.confidence >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          transaction.confidence >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        }`}>
                          {transaction.confidence}%
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {transaction.matched && (
                        <button
                          onClick={() => handleConfirmMatch(transaction)}
                          disabled={processing}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          Confirm & Save
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {transactions.length === 0 && !loading && (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-xl shadow-sm text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Transactions Yet</h3>
          <p className="text-gray-600 dark:text-gray-400">Upload an M-Pesa CSV statement to get started</p>
        </div>
      )}
    </div>
  );
};

export default MpesaReconciliation;
