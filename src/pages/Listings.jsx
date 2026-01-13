import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import TenantApplicationForm from '../components/TenantApplicationForm';
import {
  Home,
  MapPin,
  BedDouble,
  DollarSign,
  Search,
  Phone,
  Mail,
  Calendar,
  Building,
  Users,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  FileText
} from 'lucide-react';

const ImageCarousel = ({ images, alt }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="relative h-48 overflow-hidden group">
      <img 
        src={images[currentIndex]} 
        alt={`${alt} - Image ${currentIndex + 1}`}
        className="w-full h-full object-cover"
      />
      
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-white w-6' 
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const Listings = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [filterLocation, setFilterLocation] = useState('all');
  const [locationInput, setLocationInput] = useState('');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    message: '',
    employmentStatus: '',
    employerName: '',
    employerPhone: '',
    monthlyIncome: '',
    occupation: '',
    motivation: '',
    moveInDate: '',
    currentResidence: '',
    references: ''
  });
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // STATE FOR REAL-TIME LISTINGS FROM FIREBASE
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertyDetails, setPropertyDetails] = useState({});
  const [userData, setUserData] = useState(null);

  // FETCH USER DATA IF LOGGED IN
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            // Pre-populate booking form with user data
            setBookingData(prev => ({
              ...prev,
              name: data.fullName || data.name || '',
              email: data.email || currentUser.email || '',
              phone: data.phone || ''
            }));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [currentUser]);

  // FETCH ALL PROPERTIES TO GET LOCATION DATA
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const propertiesSnapshot = await getDocs(collection(db, 'properties'));
        const propertiesMap = {};
        propertiesSnapshot.forEach((doc) => {
          const data = doc.data();
          propertiesMap[data.name] = {
            location: data.location || 'Location Not Specified',
            landlordId: data.landlordId
          };
        });
        setPropertyDetails(propertiesMap);
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    };

    fetchProperties();
  }, []);

  // FETCH LISTINGS FROM FIREBASE IN REAL-TIME
  useEffect(() => {
    const q = query(
      collection(db, 'listings'),
      where('status', '==', 'available')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const listingsData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const propertyName = data.property || 'Property';
        const location = propertyDetails[propertyName]?.location || 'Location Not Specified';
        
        listingsData.push({
          id: doc.id,
          propertyName: propertyName,
          location: location,
          availableUnits: 1, // Single listing per unit
          bedrooms: data.bedrooms?.toString() || '0',
          bathrooms: data.bathrooms?.toString() || '0',
          area: data.area?.toString() || 'N/A',
          rent: data.rent?.toString() || '0',
          deposit: data.deposit?.toString() || data.rent?.toString() || '0',
          amenities: data.amenities || [],
          description: data.description || 'No description available',
          landlord: 'Property Owner', // You can fetch landlord details separately
          phone: '+254 712 345 678', // Default or fetch from landlord profile
          email: 'info@nyumbanii.co.ke', // Default or fetch from landlord profile
          images: data.images && data.images.length > 0 ? data.images : [
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop'
          ],
          listed: data.postedDate || new Date().toISOString().split('T')[0],
          unit: data.unit || 'N/A',
          landlordId: data.landlordId
        });
      });
      setListings(listingsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching listings:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [propertyDetails]);

  // Comprehensive list of Kenyan locations
  const allLocations = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale', 'Garissa', 'Kakamega',
    'Karen', 'Westlands', 'Kilimani', 'Parklands', 'CBD', 'Kileleshwa', 'Lavington', 'Runda', 'Muthaiga',
    'Upperhill', 'South B', 'South C', 'Hurlingham', 'Ngong', 'Rongai', 'Kitengela', 'Ruaka', 'Ruiru',
    'Juja', 'Kahawa', 'Kasarani', 'Roysambu', 'Zimmerman', 'Pipeline', 'Embakasi', 'Donholm', 'Buruburu',
    'Umoja', 'Komarock', 'Kayole', 'Njiru', 'Utawala', 'Syokimau', 'Mlolongo', 'Athi River', 'Machakos',
    'Nyali', 'Bamburi', 'Shanzu', 'Diani', 'Kilifi', 'Kwale', 'Likoni', 'Changamwe', 'Kisauni',
    'Kiambu', 'Limuru', 'Kikuyu', 'Ngong Road', 'Langata', 'Nairobi West', 'Adams Arcade', 'Yaya Center',
    'Junction', 'Gigiri', 'Spring Valley', 'Loresho', 'Ridgeways', 'Rosslyn', 'Red Hill', 'Two Rivers',
    'Garden Estate', 'Pangani', 'Eastleigh', 'South B', 'Imara Daima', 'Madaraka', 'Nyayo Estate',
    'Milimani', 'Kilimani', 'Kileleshwa', 'Dennis Pritt', 'Argwings Kodhek', 'Waiyaki Way', 'Muthangari'
  ].sort();

  // Get filtered location suggestions based on input
  const getLocationSuggestions = (input) => {
    if (!input || input.trim() === '') return [];
    const searchTerm = input.toLowerCase().trim();
    return allLocations.filter(location =>
      location.toLowerCase().startsWith(searchTerm)
    ).slice(0, 8); // Limit to 8 suggestions
  };

  const locationSuggestions = getLocationSuggestions(locationInput);

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchTerm.toLowerCase());

    // If locationInput is being used, filter by it; otherwise use filterLocation
    const locationToMatch = locationInput.trim() !== '' ? locationInput : filterLocation;
    const matchesLocation = locationToMatch === 'all' || locationToMatch === '' ||
                           listing.location.toLowerCase().includes(locationToMatch.toLowerCase());

    return matchesSearch && matchesLocation;
  });

  // Handle location selection from autocomplete
  const handleLocationSelect = (location) => {
    setLocationInput(location);
    setFilterLocation(location);
    setShowLocationSuggestions(false);
  };

  // Handle location input change
  const handleLocationInputChange = (value) => {
    setLocationInput(value);
    setShowLocationSuggestions(value.trim() !== '');
    if (value.trim() === '') {
      setFilterLocation('all');
    }
  };

  // Handle clearing location
  const handleClearLocation = () => {
    setLocationInput('');
    setFilterLocation('all');
    setShowLocationSuggestions(false);
  };

  const handleBookViewing = async () => {
  if (bookingData.name && bookingData.email && bookingData.phone && bookingData.date && bookingData.time) {
    try {
      const viewingData = {
        landlordId: selectedProperty.landlordId,  // The landlord who owns this property
        tenantId: currentUser?.uid || 'guest',     // Current user ID or 'guest' if not logged in
        property: selectedProperty.propertyName,
        unit: selectedProperty.unit || 'N/A',
        prospectName: bookingData.name,
        email: bookingData.email,
        phone: bookingData.phone,
        date: bookingData.date,
        time: bookingData.time,
        status: 'pending',
        credibilityScore: 85, // Default score, you can calculate this later
        createdAt: serverTimestamp()
      };

      // Save to Firebase
      await addDoc(collection(db, 'viewings'), viewingData);

      // Create notification for landlord
      await addDoc(collection(db, 'notifications'), {
        userId: selectedProperty.landlordId,
        title: 'New Viewing Request',
        message: `${bookingData.name} has requested a viewing for ${selectedProperty.propertyName} (Unit: ${selectedProperty.unit}) on ${bookingData.date} at ${bookingData.time}`,
        type: 'viewing',
        read: false,
        createdAt: serverTimestamp()
      });

      // Find property managers assigned to this property and notify them
      const propertyDoc = await getDocs(
        query(collection(db, 'properties'), where('name', '==', selectedProperty.propertyName))
      );

      if (!propertyDoc.empty) {
        const propertyId = propertyDoc.docs[0].id;

        // Find team members (property managers) who have this property assigned
        const teamMembersQuery = query(
          collection(db, 'teamMembers'),
          where('landlordId', '==', selectedProperty.landlordId),
          where('role', '==', 'property_manager')
        );

        const teamMembersSnapshot = await getDocs(teamMembersQuery);

        // Create notifications for property managers assigned to this property
        const notificationPromises = [];
        teamMembersSnapshot.forEach((doc) => {
          const teamMemberData = doc.data();
          if (teamMemberData.assignedProperties && teamMemberData.assignedProperties.includes(propertyId)) {
            // This property manager is assigned to this property
            if (teamMemberData.userId) {
              notificationPromises.push(
                addDoc(collection(db, 'notifications'), {
                  userId: teamMemberData.userId,
                  title: 'New Viewing Request',
                  message: `${bookingData.name} has requested a viewing for ${selectedProperty.propertyName} (Unit: ${selectedProperty.unit}) on ${bookingData.date} at ${bookingData.time}`,
                  type: 'viewing',
                  read: false,
                  createdAt: serverTimestamp()
                })
              );
            }
          }
        });

        await Promise.all(notificationPromises);
      }

      alert(`Viewing booked successfully for ${selectedProperty.propertyName} on ${bookingData.date} at ${bookingData.time}. You will receive a confirmation email shortly.`);
      setShowBookingModal(false);
      setBookingData({ name: '', email: '', phone: '', date: '', time: '' });
    } catch (error) {
      console.error('Error booking viewing:', error);
      alert('Failed to book viewing. Please try again.');
    }
  } else {
    alert('Please fill in all required fields');
  }
};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition">
              <img src="/images/Logo.svg" alt="Nyumbanii Logo" className="h-10 w-10" />
            </a>

            <div className="flex items-center gap-4">
              {currentUser ? (
                <>
                  <button
                    onClick={() => {
                      // Navigate to appropriate dashboard based on user role
                      const role = userData?.role || 'tenant';
                      if (role === 'landlord') {
                        navigate('/landlord/dashboard');
                      } else if (role === 'property_manager') {
                        navigate('/property-manager/dashboard');
                      } else if (role === 'maintenance') {
                        navigate('/maintenance/dashboard');
                      } else {
                        navigate('/tenant/dashboard');
                      }
                    }}
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-[#003366] dark:hover:text-blue-400 transition-colors"
                  >
                    <User className="w-5 h-5 text-[#003366] dark:text-blue-400" />
                    <span className="font-medium">
                      {userData?.fullName || userData?.name || currentUser.email}
                    </span>
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await logout();
                        navigate('/');
                      } catch (error) {
                        console.error('Error logging out:', error);
                      }
                    }}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="bg-[#003366] hover:bg-[#002244] text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-[#003366] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your Perfect Home</h1>
          <p className="text-xl text-blue-100 mb-8">Browse available properties across Kenya</p>
          
          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by property name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none text-gray-900"
              />
            </div>

            {/* Autocomplete Location Input */}
            <div className="relative md:w-64">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <input
                type="text"
                placeholder="Enter location..."
                value={locationInput}
                onChange={(e) => handleLocationInputChange(e.target.value)}
                onFocus={() => locationInput.trim() !== '' && setShowLocationSuggestions(true)}
                onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none text-gray-900"
              />
              {locationInput && (
                <button
                  onClick={handleClearLocation}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Autocomplete Suggestions Dropdown */}
              {showLocationSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {locationSuggestions.map((location, index) => (
                    <button
                      key={index}
                      onClick={() => handleLocationSelect(location)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                    >
                      <MapPin className="w-4 h-4 text-[#003366]" />
                      <span className="text-gray-900">{location}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Available Properties</h2>
            <p className="text-gray-600">
              {loading ? 'Loading...' : `${filteredListings.length} properties found`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-[#003366] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500 text-lg">Loading properties...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No properties found matching your search</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map(listing => (
              <div key={listing.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden">
                <ImageCarousel images={listing.images} alt={listing.propertyName} />
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{listing.propertyName}</h3>
                      <div className="flex items-center text-gray-600 text-sm">
                        <MapPin className="w-4 h-4 mr-1" />
                        {listing.location}
                      </div>
                      {listing.unit && (
                        <div className="text-xs text-gray-500 mt-1">Unit: {listing.unit}</div>
                      )}
                    </div>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                      Available
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{listing.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-700">
                      <BedDouble className="w-4 h-4 mr-2 text-[#003366]" />
                      <span>{listing.bedrooms} Bedrooms • {listing.bathrooms} Bathrooms</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <DollarSign className="w-4 h-4 mr-2 text-[#003366]" />
                      <span className="font-semibold">KES {parseInt(listing.rent).toLocaleString()}/month</span>
                    </div>
                    {listing.area && listing.area !== 'N/A' && listing.area !== '0' && (
                      <div className="flex items-center text-sm text-gray-700">
                        <Home className="w-4 h-4 mr-2 text-[#003366]" />
                        <span>{listing.area} sq ft</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {listing.amenities.slice(0, 3).map((amenity, idx) => (
                      <span key={idx} className="bg-blue-50 text-[#003366] px-2 py-1 rounded text-xs">
                        {amenity}
                      </span>
                    ))}
                    {listing.amenities.length > 3 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        +{listing.amenities.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedProperty(listing);
                          setShowBookingModal(true);
                        }}
                        className="flex-1 bg-[#003366] hover:bg-[#002244] text-white px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        Book Viewing
                      </button>
                      <button
                        onClick={() => setSelectedProperty(listing)}
                        className="px-4 py-2 border-2 border-[#003366] text-[#003366] hover:bg-blue-50 rounded-lg font-semibold transition"
                      >
                        Details
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedProperty(listing);
                        setShowApplicationModal(true);
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Apply for Tenancy
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Property Details Modal */}
      {selectedProperty && !showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">{selectedProperty.propertyName}</h3>
              <button onClick={() => setSelectedProperty(null)}>
                <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <div className="p-6">
              <div className="h-64 rounded-lg overflow-hidden mb-6">
                <ImageCarousel images={selectedProperty.images} alt={selectedProperty.propertyName} />
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Property Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-700">
                      <MapPin className="w-5 h-5 mr-2 text-[#003366]" />
                      {selectedProperty.location}
                    </div>
                    {selectedProperty.unit && (
                      <div className="flex items-center text-gray-700">
                        <Building className="w-5 h-5 mr-2 text-[#003366]" />
                        Unit: {selectedProperty.unit}
                      </div>
                    )}
                    <div className="flex items-center text-gray-700">
                      <BedDouble className="w-5 h-5 mr-2 text-[#003366]" />
                      {selectedProperty.bedrooms} Bedrooms • {selectedProperty.bathrooms} Bathrooms
                    </div>
                    {selectedProperty.area && selectedProperty.area !== 'N/A' && selectedProperty.area !== '0' && (
                      <div className="flex items-center text-gray-700">
                        <Home className="w-5 h-5 mr-2 text-[#003366]" />
                        {selectedProperty.area} sq ft
                      </div>
                    )}
                    <div className="flex items-center text-gray-700 font-semibold">
                      <DollarSign className="w-5 h-5 mr-2 text-[#003366]" />
                      KES {parseInt(selectedProperty.rent).toLocaleString()}/month
                    </div>
                    <div className="flex items-center text-gray-700 text-sm">
                      <CheckCircle className="w-5 h-5 mr-2 text-[#003366]" />
                      Deposit: KES {parseInt(selectedProperty.deposit).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-700">
                      <Users className="w-5 h-5 mr-2 text-[#003366]" />
                      {selectedProperty.landlord}
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Phone className="w-5 h-5 mr-2 text-[#003366]" />
                      {selectedProperty.phone}
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Mail className="w-5 h-5 mr-2 text-[#003366]" />
                      {selectedProperty.email}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Description</h4>
                <p className="text-gray-700">{selectedProperty.description}</p>
              </div>

              {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProperty.amenities.map((amenity, idx) => (
                      <span key={idx} className="bg-blue-50 text-[#003366] px-3 py-1 rounded-lg text-sm flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="bg-[#003366] hover:bg-[#002244] text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Book to View
                </button>
                <button
                  onClick={() => {
                    setSelectedProperty(null);
                    setShowApplicationModal(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  Apply for Tenancy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Booking Modal for Public Users */}
      {showBookingModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full my-8">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">Book a Site Viewing</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedProperty.propertyName} - {selectedProperty.location}</p>
                </div>
                <button onClick={() => setShowBookingModal(false)}>
                  <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                </button>
              </div>
            </div>

            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto space-y-6">
              {/* Section 1: Contact Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-[#003366] text-white rounded-full flex items-center justify-center text-sm">1</span>
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={bookingData.name}
                      onChange={(e) => setBookingData({...bookingData, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={bookingData.email}
                      onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      value={bookingData.phone}
                      onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      placeholder="+254 7XX XXX XXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Residence *</label>
                    <input
                      type="text"
                      value={bookingData.currentResidence}
                      onChange={(e) => setBookingData({...bookingData, currentResidence: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      placeholder="Nairobi, Kenya"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Viewing Date *</label>
                    <input
                      type="date"
                      value={bookingData.date}
                      onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Viewing Time *</label>
                    <select
                      value={bookingData.time}
                      onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    >
                      <option value="">Select Time</option>
                      <option value="09:00">09:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="14:00">02:00 PM</option>
                      <option value="15:00">03:00 PM</option>
                      <option value="16:00">04:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Employment Information */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-[#003366] text-white rounded-full flex items-center justify-center text-sm">2</span>
                  Employment Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status *</label>
                    <select
                      value={bookingData.employmentStatus}
                      onChange={(e) => setBookingData({...bookingData, employmentStatus: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    >
                      <option value="">Select Status</option>
                      <option value="employed">Employed</option>
                      <option value="self-employed">Self-Employed</option>
                      <option value="student">Student</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Occupation *</label>
                    <input
                      type="text"
                      value={bookingData.occupation}
                      onChange={(e) => setBookingData({...bookingData, occupation: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      placeholder="Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employer Name</label>
                    <input
                      type="text"
                      value={bookingData.employerName}
                      onChange={(e) => setBookingData({...bookingData, employerName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      placeholder="Company Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employer Contact</label>
                    <input
                      type="tel"
                      value={bookingData.employerPhone}
                      onChange={(e) => setBookingData({...bookingData, employerPhone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      placeholder="+254 7XX XXX XXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income *</label>
                    <input
                      type="number"
                      value={bookingData.monthlyIncome}
                      onChange={(e) => setBookingData({...bookingData, monthlyIncome: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      placeholder="50000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Move-in Date</label>
                    <input
                      type="date"
                      value={bookingData.moveInDate}
                      onChange={(e) => setBookingData({...bookingData, moveInDate: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Additional Information */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-[#003366] text-white rounded-full flex items-center justify-center text-sm">3</span>
                  Additional Information
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Why are you interested in this property? *</label>
                    <textarea
                      value={bookingData.motivation}
                      onChange={(e) => setBookingData({...bookingData, motivation: e.target.value})}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      placeholder="Tell us why you're interested in this property..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">References (Optional)</label>
                    <textarea
                      value={bookingData.references}
                      onChange={(e) => setBookingData({...bookingData, references: e.target.value})}
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      placeholder="Previous landlord contact, employer reference, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Message (Optional)</label>
                    <textarea
                      value={bookingData.message}
                      onChange={(e) => setBookingData({...bookingData, message: e.target.value})}
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
                      placeholder="Any additional information you'd like to share..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookViewing}
                  className="flex-1 px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-semibold transition"
                >
                  Submit Booking Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Application Modal */}
      {showApplicationModal && selectedProperty && (
        <TenantApplicationForm
          propertyId={selectedProperty.id}
          propertyName={selectedProperty.propertyName}
          landlordId={selectedProperty.landlordId}
          onClose={() => {
            setShowApplicationModal(false);
            setSelectedProperty(null);
          }}
          onSuccess={(applicationId) => {
            alert(`Application submitted successfully! Reference: ${applicationId}`);
          }}
        />
      )}
    </div>
  );
};

export default Listings;