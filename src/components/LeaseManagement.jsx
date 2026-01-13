import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Edit,
  Download,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Save,
  Eye,
  User,
  Home,
  Calendar,
  Banknote,
  FileSignature,
  Send,
  PenTool
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { formatCurrency, formatDate } from '../utils/formatters';
import jsPDF from 'jspdf';
import SignaturePad from './SignaturePad';

const LeaseManagement = ({ landlordId, properties, tenants }) => {
  const [leases, setLeases] = useState([]);
  const [filteredLeases, setFilteredLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedLease, setSelectedLease] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Lease form state
  const [leaseForm, setLeaseForm] = useState({
    tenantId: '',
    propertyId: '',
    unit: '',
    startDate: '',
    endDate: '',
    monthlyRent: '',
    securityDeposit: '',
    lateFeeDays: 5,
    lateFeePercentage: 10,
    utilitiesIncluded: [],
    specialTerms: '',
    landlordSignature: null,
    tenantSignature: null,
    status: 'draft' // draft, pending_signature, active, expired, terminated
  });

  // Signature modal states
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureType, setSignatureType] = useState(null); // 'landlord' or 'tenant'
  const [currentSigningLease, setCurrentSigningLease] = useState(null);

  // Lease statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    expired: 0
  });

  // Fetch leases from Firestore
  useEffect(() => {
    const fetchLeases = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'leases'),
          where('landlordId', '==', landlordId)
        );

        const querySnapshot = await getDocs(q);
        const leasesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setLeases(leasesData);
        setFilteredLeases(leasesData);

        // Calculate stats
        const active = leasesData.filter(l => l.status === 'active').length;
        const pending = leasesData.filter(l => l.status === 'pending_signature').length;
        const expired = leasesData.filter(l => l.status === 'expired').length;

        setStats({
          total: leasesData.length,
          active,
          pending,
          expired
        });

      } catch (error) {
        console.error('Error fetching leases:', error);
      }
      setLoading(false);
    };

    fetchLeases();
  }, [landlordId]);

  // Filter leases based on search and status
  useEffect(() => {
    let filtered = leases;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lease => lease.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(lease =>
        lease.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lease.propertyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lease.unit?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLeases(filtered);
  }, [searchTerm, statusFilter, leases]);

  // Generate lease PDF
  const generateLeasePDF = (lease) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RESIDENTIAL LEASE AGREEMENT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Border
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Agreement Details Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('AGREEMENT DETAILS', 15, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Lease Agreement No: ${lease.leaseNumber || lease.id}`, 15, yPos);
    yPos += 6;
    doc.text(`Date of Agreement: ${formatDate(lease.createdAt?.toDate ? lease.createdAt.toDate() : new Date())}`, 15, yPos);
    yPos += 10;

    // Parties Section
    doc.setFont('helvetica', 'bold');
    doc.text('PARTIES TO THIS AGREEMENT', 15, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.text('LANDLORD:', 15, yPos);
    yPos += 6;
    doc.text(`Name: ${lease.landlordName || 'Landlord Name'}`, 20, yPos);
    yPos += 6;
    doc.text(`Contact: ${lease.landlordContact || 'Contact Info'}`, 20, yPos);
    yPos += 10;

    doc.text('TENANT:', 15, yPos);
    yPos += 6;
    doc.text(`Name: ${lease.tenantName}`, 20, yPos);
    yPos += 6;
    doc.text(`ID Number: ${lease.tenantIdNumber || 'N/A'}`, 20, yPos);
    yPos += 6;
    doc.text(`Phone: ${lease.tenantPhone || 'N/A'}`, 20, yPos);
    yPos += 6;
    doc.text(`Email: ${lease.tenantEmail || 'N/A'}`, 20, yPos);
    yPos += 10;

    // Property Details
    doc.setFont('helvetica', 'bold');
    doc.text('PROPERTY DETAILS', 15, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.text(`Property: ${lease.propertyName}`, 15, yPos);
    yPos += 6;
    doc.text(`Unit: ${lease.unit}`, 15, yPos);
    yPos += 6;
    doc.text(`Address: ${lease.propertyAddress || 'Property Address'}`, 15, yPos);
    yPos += 10;

    // Lease Terms
    doc.setFont('helvetica', 'bold');
    doc.text('LEASE TERMS', 15, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.text(`Start Date: ${formatDate(lease.startDate?.toDate ? lease.startDate.toDate() : new Date(lease.startDate))}`, 15, yPos);
    yPos += 6;
    doc.text(`End Date: ${formatDate(lease.endDate?.toDate ? lease.endDate.toDate() : new Date(lease.endDate))}`, 15, yPos);
    yPos += 6;
    doc.text(`Monthly Rent: ${formatCurrency(lease.monthlyRent)}`, 15, yPos);
    yPos += 6;
    doc.text(`Security Deposit: ${formatCurrency(lease.securityDeposit)}`, 15, yPos);
    yPos += 6;
    doc.text(`Late Fee: ${lease.lateFeePercentage}% after ${lease.lateFeeDays} days`, 15, yPos);
    yPos += 10;

    // Utilities
    if (lease.utilitiesIncluded && lease.utilitiesIncluded.length > 0) {
      doc.text(`Utilities Included: ${lease.utilitiesIncluded.join(', ')}`, 15, yPos);
      yPos += 10;
    }

    // Special Terms
    if (lease.specialTerms) {
      doc.setFont('helvetica', 'bold');
      doc.text('SPECIAL TERMS AND CONDITIONS', 15, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      const specialTermsLines = doc.splitTextToSize(lease.specialTerms, pageWidth - 30);
      doc.text(specialTermsLines, 15, yPos);
      yPos += (specialTermsLines.length * 6) + 10;
    }

    // Check if we need a new page
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 20;
    }

    // Standard Terms
    doc.setFont('helvetica', 'bold');
    doc.text('STANDARD TERMS', 15, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    const standardTerms = [
      '1. The tenant shall pay rent on or before the 5th day of each month.',
      '2. The tenant shall maintain the property in good condition.',
      '3. The tenant shall not sub-let the property without written consent.',
      '4. The landlord shall be responsible for major repairs and maintenance.',
      '5. Either party may terminate this agreement with 30 days written notice.',
      '6. The security deposit will be refunded within 30 days after move-out, less any deductions.',
      '7. This agreement is governed by the laws of Kenya.'
    ];

    standardTerms.forEach(term => {
      const lines = doc.splitTextToSize(term, pageWidth - 30);
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(lines, 15, yPos);
      yPos += (lines.length * 6) + 3;
    });

    // Signatures Section
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('SIGNATURES', 15, yPos);
    yPos += 15;

    // Landlord Signature
    doc.setFont('helvetica', 'normal');
    doc.text('Landlord Signature:', 15, yPos);
    if (lease.landlordSignature) {
      doc.addImage(lease.landlordSignature, 'PNG', 15, yPos + 2, 50, 15);
    }
    doc.line(15, yPos + 20, 85, yPos + 20);
    yPos += 25;
    doc.text(`Date: ${formatDate(lease.landlordSignedAt?.toDate ? lease.landlordSignedAt.toDate() : new Date())}`, 15, yPos);

    // Tenant Signature
    yPos += 15;
    doc.text('Tenant Signature:', 15, yPos);
    if (lease.tenantSignature) {
      doc.addImage(lease.tenantSignature, 'PNG', 15, yPos + 2, 50, 15);
    }
    doc.line(15, yPos + 20, 85, yPos + 20);
    yPos += 25;
    if (lease.tenantSignedAt) {
      doc.text(`Date: ${formatDate(lease.tenantSignedAt.toDate())}`, 15, yPos);
    }

    return doc;
  };

  // Handle lease creation
  const handleCreateLease = async () => {
    if (!leaseForm.tenantId || !leaseForm.propertyId || !leaseForm.startDate || !leaseForm.endDate || !leaseForm.monthlyRent) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const selectedTenant = tenants.find(t => t.id === leaseForm.tenantId);
      const selectedProperty = properties.find(p => p.id === leaseForm.propertyId);

      const leaseData = {
        landlordId,
        landlordName: selectedProperty?.ownerName || 'Landlord',
        tenantId: leaseForm.tenantId,
        tenantName: selectedTenant?.name,
        tenantEmail: selectedTenant?.email,
        tenantPhone: selectedTenant?.phone,
        tenantIdNumber: selectedTenant?.idNumber,
        propertyId: leaseForm.propertyId,
        propertyName: selectedProperty?.name,
        propertyAddress: selectedProperty?.location,
        unit: leaseForm.unit,
        startDate: new Date(leaseForm.startDate),
        endDate: new Date(leaseForm.endDate),
        monthlyRent: parseFloat(leaseForm.monthlyRent),
        securityDeposit: parseFloat(leaseForm.securityDeposit),
        lateFeeDays: parseInt(leaseForm.lateFeeDays),
        lateFeePercentage: parseFloat(leaseForm.lateFeePercentage),
        utilitiesIncluded: leaseForm.utilitiesIncluded,
        specialTerms: leaseForm.specialTerms,
        status: 'draft',
        leaseNumber: `LSE-${Date.now()}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'leases'), leaseData);

      alert('Lease created successfully!');
      setShowCreateModal(false);
      resetForm();

      // Refresh leases
      const q = query(collection(db, 'leases'), where('landlordId', '==', landlordId));
      const querySnapshot = await getDocs(q);
      const leasesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeases(leasesData);

    } catch (error) {
      console.error('Error creating lease:', error);
      alert('Error creating lease. Please try again.');
    }
  };

  // Reset form
  const resetForm = () => {
    setLeaseForm({
      tenantId: '',
      propertyId: '',
      unit: '',
      startDate: '',
      endDate: '',
      monthlyRent: '',
      securityDeposit: '',
      lateFeeDays: 5,
      lateFeePercentage: 10,
      utilitiesIncluded: [],
      specialTerms: '',
      landlordSignature: null,
      tenantSignature: null,
      status: 'draft'
    });
  };

  // Handle signature for existing lease
  const handleSignLease = (lease, type) => {
    setCurrentSigningLease(lease);
    setSignatureType(type);
    setShowSignaturePad(true);
  };

  // Save signature to lease
  const handleSaveSignature = async (signatureData) => {
    try {
      const leaseRef = doc(db, 'leases', currentSigningLease.id);

      const updateData = {};
      if (signatureType === 'landlord') {
        updateData.landlordSignature = signatureData;
        updateData.landlordSignedAt = serverTimestamp();
      } else if (signatureType === 'tenant') {
        updateData.tenantSignature = signatureData;
        updateData.tenantSignedAt = serverTimestamp();
      }

      // Update status if both signatures are present
      const updatedLease = { ...currentSigningLease, ...updateData };
      if (updatedLease.landlordSignature && updatedLease.tenantSignature) {
        updateData.status = 'active';
      } else if (updatedLease.landlordSignature || updatedLease.tenantSignature) {
        updateData.status = 'pending_signature';
      }

      updateData.updatedAt = serverTimestamp();

      await updateDoc(leaseRef, updateData);

      // Refresh leases
      const q = query(collection(db, 'leases'), where('landlordId', '==', landlordId));
      const querySnapshot = await getDocs(q);
      const leasesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeases(leasesData);

      setShowSignaturePad(false);
      setCurrentSigningLease(null);
      setSignatureType(null);

      alert('Signature added successfully!');
    } catch (error) {
      console.error('Error saving signature:', error);
      alert('Error saving signature. Please try again.');
    }
  };

  // Download lease PDF
  const handleDownloadPDF = (lease) => {
    const doc = generateLeasePDF(lease);
    doc.save(`Lease_${lease.leaseNumber}_${lease.tenantName}.pdf`);
  };

  // Preview lease
  const handlePreview = (lease) => {
    setSelectedLease(lease);
    setShowPreviewModal(true);
  };

  // Delete lease
  const handleDeleteLease = async (leaseId) => {
    if (!window.confirm('Are you sure you want to delete this lease?')) return;

    try {
      await deleteDoc(doc(db, 'leases', leaseId));
      setLeases(prev => prev.filter(l => l.id !== leaseId));
      alert('Lease deleted successfully');
    } catch (error) {
      console.error('Error deleting lease:', error);
      alert('Error deleting lease');
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      draft: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200', icon: Edit },
      pending_signature: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200', icon: Clock },
      active: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200', icon: CheckCircle },
      expired: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200', icon: AlertCircle },
      terminated: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-800 dark:text-orange-200', icon: X }
    };

    const badge = badges[status] || badges.draft;
    const Icon = badge.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Lease Management</h2>
            <p className="text-gray-600 dark:text-gray-400">Create, manage, and track tenant lease agreements</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#003366] hover:bg-[#002244] text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Lease
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Leases</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Leases</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Signature</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Expired</p>
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by tenant, property, or unit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {['all', 'draft', 'pending_signature', 'active', 'expired'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg transition capitalize ${
                  statusFilter === status
                    ? 'bg-[#003366] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leases List */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-xl shadow-sm text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading leases...</p>
        </div>
      ) : filteredLeases.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Lease #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Rent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLeases.map((lease) => (
                  <tr key={lease.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {lease.leaseNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{lease.tenantName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{lease.tenantEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">{lease.propertyName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Unit {lease.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(lease.startDate?.toDate ? lease.startDate.toDate() : new Date(lease.startDate))} -
                      {formatDate(lease.endDate?.toDate ? lease.endDate.toDate() : new Date(lease.endDate))}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(lease.monthlyRent)}/mo
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(lease.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePreview(lease)}
                          className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!lease.landlordSignature && (
                          <button
                            onClick={() => handleSignLease(lease, 'landlord')}
                            className="text-purple-600 hover:text-purple-700 p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30"
                            title="Sign as Landlord"
                          >
                            <PenTool className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadPDF(lease)}
                          className="text-green-600 hover:text-green-700 p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLease(lease.id)}
                          className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-xl shadow-sm text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Leases Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first lease agreement to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#003366] hover:bg-[#002244] text-white px-6 py-2 rounded-lg inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Lease
          </button>
        </div>
      )}

      {/* Create Lease Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create New Lease</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Tenant Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Tenant *
                </label>
                <select
                  value={leaseForm.tenantId}
                  onChange={(e) => setLeaseForm({ ...leaseForm, tenantId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Choose a tenant...</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} - {tenant.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Property Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Property *
                  </label>
                  <select
                    value={leaseForm.propertyId}
                    onChange={(e) => setLeaseForm({ ...leaseForm, propertyId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Choose a property...</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>
                        {property.name} - {property.location}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unit Number *
                  </label>
                  <input
                    type="text"
                    value={leaseForm.unit}
                    onChange={(e) => setLeaseForm({ ...leaseForm, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., A101"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={leaseForm.startDate}
                    onChange={(e) => setLeaseForm({ ...leaseForm, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={leaseForm.endDate}
                    onChange={(e) => setLeaseForm({ ...leaseForm, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Financial Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monthly Rent (KES) *
                  </label>
                  <input
                    type="number"
                    value={leaseForm.monthlyRent}
                    onChange={(e) => setLeaseForm({ ...leaseForm, monthlyRent: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., 25000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Security Deposit (KES)
                  </label>
                  <input
                    type="number"
                    value={leaseForm.securityDeposit}
                    onChange={(e) => setLeaseForm({ ...leaseForm, securityDeposit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., 25000"
                  />
                </div>
              </div>

              {/* Late Fee Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Late Fee Grace Period (Days)
                  </label>
                  <input
                    type="number"
                    value={leaseForm.lateFeeDays}
                    onChange={(e) => setLeaseForm({ ...leaseForm, lateFeeDays: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Late Fee Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={leaseForm.lateFeePercentage}
                    onChange={(e) => setLeaseForm({ ...leaseForm, lateFeePercentage: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Utilities Included */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Utilities Included
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Water', 'Electricity', 'Internet', 'Garbage Collection', 'Security', 'Parking'].map(utility => (
                    <label key={utility} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={leaseForm.utilitiesIncluded.includes(utility)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setLeaseForm({
                              ...leaseForm,
                              utilitiesIncluded: [...leaseForm.utilitiesIncluded, utility]
                            });
                          } else {
                            setLeaseForm({
                              ...leaseForm,
                              utilitiesIncluded: leaseForm.utilitiesIncluded.filter(u => u !== utility)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{utility}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Special Terms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Special Terms & Conditions
                </label>
                <textarea
                  value={leaseForm.specialTerms}
                  onChange={(e) => setLeaseForm({ ...leaseForm, specialTerms: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter any additional terms or conditions..."
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 p-6 border-t border-gray-200 dark:border-gray-600 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLease}
                className="bg-[#003366] hover:bg-[#002244] text-white px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Create Lease
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedLease && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Lease Preview</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
              {/* Lease content preview */}
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-8 bg-white dark:bg-gray-900">
                <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">RESIDENTIAL LEASE AGREEMENT</h2>

                <div className="space-y-6 text-gray-700 dark:text-gray-300">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Lease Number</h3>
                    <p>{selectedLease.leaseNumber}</p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Parties</h3>
                    <p><strong>Landlord:</strong> {selectedLease.landlordName}</p>
                    <p><strong>Tenant:</strong> {selectedLease.tenantName}</p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Property</h3>
                    <p>{selectedLease.propertyName} - Unit {selectedLease.unit}</p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Term</h3>
                    <p>From {formatDate(selectedLease.startDate?.toDate ? selectedLease.startDate.toDate() : new Date(selectedLease.startDate))} to {formatDate(selectedLease.endDate?.toDate ? selectedLease.endDate.toDate() : new Date(selectedLease.endDate))}</p>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Financial Terms</h3>
                    <p><strong>Monthly Rent:</strong> {formatCurrency(selectedLease.monthlyRent)}</p>
                    <p><strong>Security Deposit:</strong> {formatCurrency(selectedLease.securityDeposit)}</p>
                    <p><strong>Late Fee:</strong> {selectedLease.lateFeePercentage}% after {selectedLease.lateFeeDays} days</p>
                  </div>

                  {selectedLease.utilitiesIncluded && selectedLease.utilitiesIncluded.length > 0 && (
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Utilities Included</h3>
                      <p>{selectedLease.utilitiesIncluded.join(', ')}</p>
                    </div>
                  )}

                  {selectedLease.specialTerms && (
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Special Terms</h3>
                      <p className="whitespace-pre-wrap">{selectedLease.specialTerms}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 p-6 border-t border-gray-200 dark:border-gray-600 flex justify-end gap-3">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDownloadPDF(selectedLease);
                  setShowPreviewModal(false);
                }}
                className="bg-[#003366] hover:bg-[#002244] text-white px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Pad Modal */}
      {showSignaturePad && currentSigningLease && (
        <SignaturePad
          onSave={handleSaveSignature}
          onCancel={() => {
            setShowSignaturePad(false);
            setCurrentSigningLease(null);
            setSignatureType(null);
          }}
          signerName={signatureType === 'landlord' ? currentSigningLease.landlordName : currentSigningLease.tenantName}
          title={`${signatureType === 'landlord' ? 'Landlord' : 'Tenant'} Signature`}
        />
      )}
    </div>
  );
};

export default LeaseManagement;
