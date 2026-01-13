import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy } from 'firebase/firestore';
import {
  FileText,
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Home,
  Building,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  ExternalLink,
  Users,
  MapPin,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/formatters';

const ApplicationsManager = ({ landlordId }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, under_review, approved, rejected
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Fetch applications in real-time
  useEffect(() => {
    if (!landlordId) return;

    const applicationsQuery = query(
      collection(db, 'tenantApplications'),
      where('landlordId', '==', landlordId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(applicationsQuery, (snapshot) => {
      const applicationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setApplications(applicationsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching applications:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [landlordId]);

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesSearch = !searchQuery ||
      app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.phone.includes(searchQuery) ||
      app.propertyName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Handle status change
  const handleStatusChange = async (applicationId, newStatus) => {
    setUpdating(true);
    try {
      const applicationRef = doc(db, 'tenantApplications', applicationId);
      await updateDoc(applicationRef, {
        status: newStatus,
        reviewedBy: landlordId,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null
      });

      // Close modal if updating from details view
      if (selectedApplication?.id === applicationId) {
        setShowDetailsModal(false);
        setSelectedApplication(null);
        setReviewNotes('');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Failed to update application status');
    } finally {
      setUpdating(false);
    }
  };

  // View application details
  const viewDetails = (application) => {
    setSelectedApplication(application);
    setReviewNotes(application.reviewNotes || '');
    setShowDetailsModal(true);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock, label: 'Pending' },
      under_review: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Eye, label: 'Under Review' },
      approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle, label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle, label: 'Rejected' }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.label}
      </span>
    );
  };

  // Statistics
  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    under_review: applications.filter(a => a.status === 'under_review').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tenant Applications</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Review and manage tenant applications for your properties
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-yellow-200 dark:border-yellow-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Under Review</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{stats.under_review}</p>
            </div>
            <Eye className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-green-200 dark:border-green-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">Approved</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 dark:text-red-400">Rejected</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">{stats.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, phone, or property..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No applications found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Tenant applications will appear here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Employment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Monthly Income
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Move-In Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Applied
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {application.fullName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {application.email}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {application.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900 dark:text-white">
                          {application.propertyName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white capitalize">
                        {application.employmentStatus.replace('-', ' ')}
                      </div>
                      {application.employer && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {application.employer}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        KES {application.monthlyIncome?.toLocaleString() || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(application.moveInDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(application.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {application.createdAt && formatDate(application.createdAt.toDate())}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => viewDetails(application)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Application Details
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Application ID: {selectedApplication.applicationId}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedApplication(null);
                    setReviewNotes('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Status */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Application Status
                  </h3>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(selectedApplication.status)}
                    {selectedApplication.reviewedAt && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Reviewed on {formatDate(selectedApplication.reviewedAt.toDate())}
                      </span>
                    )}
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedApplication.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedApplication.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedApplication.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">ID Number</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedApplication.idNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Date of Birth</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedApplication.dateOfBirth)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Nationality</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedApplication.nationality}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Marital Status</p>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">{selectedApplication.maritalStatus}</p>
                    </div>
                  </div>
                </div>

                {/* Employment Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Employment Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Employment Status</p>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">
                        {selectedApplication.employmentStatus.replace('-', ' ')}
                      </p>
                    </div>
                    {selectedApplication.employer && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Employer</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedApplication.employer}</p>
                      </div>
                    )}
                    {selectedApplication.occupation && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Occupation</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedApplication.occupation}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Income</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        KES {selectedApplication.monthlyIncome?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-3">
                    Emergency Contact
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedApplication.emergencyContactName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedApplication.emergencyContactPhone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Relationship</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedApplication.emergencyContactRelation}</p>
                    </div>
                  </div>
                </div>

                {/* Rental History */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Rental History
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Current Address</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedApplication.currentAddress}</p>
                    </div>
                    {selectedApplication.previousLandlordName && (
                      <>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Previous Landlord</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedApplication.previousLandlordName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Landlord Phone</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedApplication.previousLandlordPhone}</p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Desired Move-In Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedApplication.moveInDate)}</p>
                    </div>
                    {selectedApplication.reasonForLeaving && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Reason for Leaving</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedApplication.reasonForLeaving}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Uploaded Documents
                  </h3>
                  <div className="space-y-2">
                    <a
                      href={selectedApplication.idDocumentURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-900 dark:text-white">ID Document</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>

                    <a
                      href={selectedApplication.proofOfIncomeURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-gray-900 dark:text-white">Proof of Income</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>

                    {selectedApplication.referenceLetterURL && (
                      <a
                        href={selectedApplication.referenceLetterURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-purple-600" />
                          <span className="font-medium text-gray-900 dark:text-white">Reference Letter</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Review Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Review Notes (Optional)
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Add notes about this application..."
                  />
                </div>
              </div>
            </div>

            {/* Footer with Actions */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedApplication(null);
                    setReviewNotes('');
                  }}
                  disabled={updating}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition"
                >
                  Close
                </button>

                {selectedApplication.status !== 'rejected' && (
                  <button
                    onClick={() => handleStatusChange(selectedApplication.id, 'rejected')}
                    disabled={updating}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    {updating ? 'Rejecting...' : 'Reject'}
                  </button>
                )}

                {selectedApplication.status === 'pending' && (
                  <button
                    onClick={() => handleStatusChange(selectedApplication.id, 'under_review')}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {updating ? 'Processing...' : 'Mark Under Review'}
                  </button>
                )}

                {selectedApplication.status !== 'approved' && (
                  <button
                    onClick={() => handleStatusChange(selectedApplication.id, 'approved')}
                    disabled={updating}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {updating ? 'Approving...' : 'Approve Application'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsManager;
