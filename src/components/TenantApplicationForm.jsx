import React, { useState } from 'react';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  User,
  Briefcase,
  FileText,
  Upload,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Home,
  Phone,
  Mail,
  Calendar,
  Users,
  MapPin,
  Building,
  AlertCircle
} from 'lucide-react';

const TenantApplicationForm = ({ propertyId, propertyName, landlordId, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    fullName: '',
    email: '',
    phone: '',
    idNumber: '',
    dateOfBirth: '',
    nationality: 'Kenyan',
    maritalStatus: 'single',

    // Step 2: Employment Information
    employmentStatus: 'employed',
    employer: '',
    occupation: '',
    monthlyIncome: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',

    // Step 3: Rental History
    currentAddress: '',
    previousLandlordName: '',
    previousLandlordPhone: '',
    reasonForLeaving: '',
    moveInDate: '',

    // Step 4: Documents
    idDocument: null,
    proofOfIncome: null,
    referenceLetter: null
  });

  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle file uploads
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      // Validate file size (max 5MB)
      if (files[0].size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          [name]: 'File size must be less than 5MB'
        }));
        return;
      }

      // Validate file type (PDF, JPG, PNG)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(files[0].type)) {
        setErrors(prev => ({
          ...prev,
          [name]: 'Only PDF, JPG, and PNG files are allowed'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));

      // Clear error
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    }
  };

  // Validation for each step
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      else if (!/^(\+254|0)[17]\d{8}$/.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Invalid Kenyan phone number';
      }
      if (!formData.idNumber.trim()) newErrors.idNumber = 'ID number is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      else {
        const age = Math.floor((new Date() - new Date(formData.dateOfBirth)) / 31557600000);
        if (age < 18) newErrors.dateOfBirth = 'You must be at least 18 years old';
      }
    }

    if (step === 2) {
      if (formData.employmentStatus === 'employed') {
        if (!formData.employer.trim()) newErrors.employer = 'Employer name is required';
        if (!formData.occupation.trim()) newErrors.occupation = 'Occupation is required';
      }
      if (!formData.monthlyIncome) newErrors.monthlyIncome = 'Monthly income is required';
      else if (formData.monthlyIncome < 0) newErrors.monthlyIncome = 'Monthly income must be positive';
      if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = 'Emergency contact name is required';
      if (!formData.emergencyContactPhone.trim()) newErrors.emergencyContactPhone = 'Emergency contact phone is required';
      if (!formData.emergencyContactRelation.trim()) newErrors.emergencyContactRelation = 'Emergency contact relation is required';
    }

    if (step === 3) {
      if (!formData.currentAddress.trim()) newErrors.currentAddress = 'Current address is required';
      if (!formData.moveInDate) newErrors.moveInDate = 'Desired move-in date is required';
    }

    if (step === 4) {
      if (!formData.idDocument) newErrors.idDocument = 'ID document is required';
      if (!formData.proofOfIncome) newErrors.proofOfIncome = 'Proof of income is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigate to next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  // Navigate to previous step
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Upload file to Firebase Storage
  const uploadFile = async (file, path) => {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  // Submit application
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(4)) {
      return;
    }

    setLoading(true);

    try {
      // Upload documents to Firebase Storage
      const timestamp = Date.now();
      const applicationId = `APP-${timestamp}`;

      setUploadProgress({ message: 'Uploading ID document...', percent: 20 });
      const idDocumentURL = await uploadFile(
        formData.idDocument,
        `applications/${applicationId}/id-document`
      );

      setUploadProgress({ message: 'Uploading proof of income...', percent: 50 });
      const proofOfIncomeURL = await uploadFile(
        formData.proofOfIncome,
        `applications/${applicationId}/proof-of-income`
      );

      let referenceLetterURL = null;
      if (formData.referenceLetter) {
        setUploadProgress({ message: 'Uploading reference letter...', percent: 70 });
        referenceLetterURL = await uploadFile(
          formData.referenceLetter,
          `applications/${applicationId}/reference-letter`
        );
      }

      setUploadProgress({ message: 'Submitting application...', percent: 90 });

      // Create application document in Firestore
      const applicationData = {
        applicationId,
        propertyId,
        propertyName,
        landlordId,

        // Personal Information
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        idNumber: formData.idNumber,
        dateOfBirth: formData.dateOfBirth,
        nationality: formData.nationality,
        maritalStatus: formData.maritalStatus,

        // Employment Information
        employmentStatus: formData.employmentStatus,
        employer: formData.employer || null,
        occupation: formData.occupation || null,
        monthlyIncome: parseFloat(formData.monthlyIncome),
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        emergencyContactRelation: formData.emergencyContactRelation,

        // Rental History
        currentAddress: formData.currentAddress,
        previousLandlordName: formData.previousLandlordName || null,
        previousLandlordPhone: formData.previousLandlordPhone || null,
        reasonForLeaving: formData.reasonForLeaving || null,
        moveInDate: formData.moveInDate,

        // Documents
        idDocumentURL,
        proofOfIncomeURL,
        referenceLetterURL,

        // Application Status
        status: 'pending', // pending, under_review, approved, rejected
        crbCheckStatus: 'not_started', // not_started, in_progress, completed
        crbScore: null,
        reviewNotes: '',
        reviewedBy: null,
        reviewedAt: null,

        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'tenantApplications'), applicationData);

      setUploadProgress({ message: 'Application submitted successfully!', percent: 100 });

      // Show success message
      if (onSuccess) {
        onSuccess(applicationId);
      }

      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress({});
    }
  };

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Employment', icon: Briefcase },
    { number: 3, title: 'Rental History', icon: Home },
    { number: 4, title: 'Documents', icon: FileText }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Tenant Application
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Property: {propertyName}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.number;
              const isCurrent = currentStep === step.number;

              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium ${
                        isCurrent
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        isCompleted
                          ? 'bg-green-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="px-6 py-6">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., John Doe"
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0712345678 or +254712345678"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    ID Number *
                  </label>
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.idNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="12345678"
                  />
                  {errors.idNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.idNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nationality
                  </label>
                  <select
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="Kenyan">Kenyan</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    Marital Status
                  </label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Employment Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Employment Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Briefcase className="w-4 h-4 inline mr-2" />
                    Employment Status *
                  </label>
                  <select
                    name="employmentStatus"
                    value={formData.employmentStatus}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="employed">Employed</option>
                    <option value="self-employed">Self-Employed</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="student">Student</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>

                {(formData.employmentStatus === 'employed' || formData.employmentStatus === 'self-employed') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Building className="w-4 h-4 inline mr-2" />
                        Employer/Business Name *
                      </label>
                      <input
                        type="text"
                        name="employer"
                        value={formData.employer}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          errors.employer ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Company name"
                      />
                      {errors.employer && (
                        <p className="text-red-500 text-xs mt-1">{errors.employer}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Occupation/Job Title *
                      </label>
                      <input
                        type="text"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          errors.occupation ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Software Engineer"
                      />
                      {errors.occupation && (
                        <p className="text-red-500 text-xs mt-1">{errors.occupation}</p>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monthly Income (KES) *
                  </label>
                  <input
                    type="number"
                    name="monthlyIncome"
                    value={formData.monthlyIncome}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.monthlyIncome ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="50000"
                    min="0"
                  />
                  {errors.monthlyIncome && (
                    <p className="text-red-500 text-xs mt-1">{errors.monthlyIncome}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-3">
                    Emergency Contact
                  </h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Name *
                  </label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.emergencyContactName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Jane Doe"
                  />
                  {errors.emergencyContactName && (
                    <p className="text-red-500 text-xs mt-1">{errors.emergencyContactName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.emergencyContactPhone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0712345678"
                  />
                  {errors.emergencyContactPhone && (
                    <p className="text-red-500 text-xs mt-1">{errors.emergencyContactPhone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Relationship *
                  </label>
                  <input
                    type="text"
                    name="emergencyContactRelation"
                    value={formData.emergencyContactRelation}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.emergencyContactRelation ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Mother, Sibling"
                  />
                  {errors.emergencyContactRelation && (
                    <p className="text-red-500 text-xs mt-1">{errors.emergencyContactRelation}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Rental History */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Rental History
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Current Address *
                  </label>
                  <textarea
                    name="currentAddress"
                    value={formData.currentAddress}
                    onChange={handleChange}
                    rows="3"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.currentAddress ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Your current residential address"
                  />
                  {errors.currentAddress && (
                    <p className="text-red-500 text-xs mt-1">{errors.currentAddress}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Previous Landlord Name
                  </label>
                  <input
                    type="text"
                    name="previousLandlordName"
                    value={formData.previousLandlordName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Previous Landlord Phone
                  </label>
                  <input
                    type="tel"
                    name="previousLandlordPhone"
                    value={formData.previousLandlordPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Optional"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason for Leaving Current Residence
                  </label>
                  <textarea
                    name="reasonForLeaving"
                    value={formData.reasonForLeaving}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Optional - e.g., Closer to workplace, need more space"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Desired Move-In Date *
                  </label>
                  <input
                    type="date"
                    name="moveInDate"
                    value={formData.moveInDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.moveInDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.moveInDate && (
                    <p className="text-red-500 text-xs mt-1">{errors.moveInDate}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Required Documents
              </h3>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Upload Requirements:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Accepted formats: PDF, JPG, PNG</li>
                      <li>Maximum file size: 5MB per document</li>
                      <li>Ensure documents are clear and readable</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* ID Document */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    ID Document (National ID or Passport) *
                  </label>
                  <div className="flex items-center gap-4">
                    <label className={`flex-1 flex items-center justify-center px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition ${
                      errors.idDocument
                        ? 'border-red-500 hover:border-red-600'
                        : formData.idDocument
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
                    }`}>
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formData.idDocument ? formData.idDocument.name : 'Click to upload ID document'}
                        </span>
                      </div>
                      <input
                        type="file"
                        name="idDocument"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                      />
                    </label>
                  </div>
                  {errors.idDocument && (
                    <p className="text-red-500 text-xs mt-1">{errors.idDocument}</p>
                  )}
                </div>

                {/* Proof of Income */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Proof of Income (Payslip, Bank Statement, or Tax Returns) *
                  </label>
                  <div className="flex items-center gap-4">
                    <label className={`flex-1 flex items-center justify-center px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition ${
                      errors.proofOfIncome
                        ? 'border-red-500 hover:border-red-600'
                        : formData.proofOfIncome
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
                    }`}>
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formData.proofOfIncome ? formData.proofOfIncome.name : 'Click to upload proof of income'}
                        </span>
                      </div>
                      <input
                        type="file"
                        name="proofOfIncome"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                      />
                    </label>
                  </div>
                  {errors.proofOfIncome && (
                    <p className="text-red-500 text-xs mt-1">{errors.proofOfIncome}</p>
                  )}
                </div>

                {/* Reference Letter (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Reference Letter (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className={`flex-1 flex items-center justify-center px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition ${
                      formData.referenceLetter
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
                    }`}>
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formData.referenceLetter ? formData.referenceLetter.name : 'Click to upload reference letter'}
                        </span>
                      </div>
                      <input
                        type="file"
                        name="referenceLetter"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {loading && uploadProgress.message && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {uploadProgress.message}
                </span>
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {uploadProgress.percent}%
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1 || loading}
              className="flex items-center gap-2 px-6 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantApplicationForm;
