import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
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
  ChevronRight
  
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
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: ''
  });
  const navigate = useNavigate();

  const sampleListings = [
    {
      id: 1,
      propertyName: 'Sunset Apartments',
      location: 'Westlands, Nairobi',
      availableUnits: 2,
      bedrooms: '2-3',
      rent: '45000-65000',
      amenities: ['Parking', 'Security', 'Gym', 'Pool'],
      description: 'Modern apartments in the heart of Westlands with excellent amenities and 24/7 security.',
      landlord: 'Tom Doe',
      phone: '+254 712 345 678',
      email: 'tom@nyumbanii.co.ke',
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop'
      ],
      listed: '2025-10-01'
    },
    {
      id: 2,
      propertyName: 'Riverside Towers',
      location: 'Parklands, Nairobi',
      availableUnits: 3,
      bedrooms: '1-2',
      rent: '35000-50000',
      amenities: ['Parking', 'Security', 'Backup Generator'],
      description: 'Affordable apartments with great access to public transport and shopping centers.',
      landlord: 'Tom Doe',
      phone: '+254 712 345 678',
      email: 'tom@nyumbanii.co.ke',
      images: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop'
      ],
      listed: '2025-09-28'
    },
    {
      id: 3,
      propertyName: 'Garden Residence',
      location: 'Kilimani, Nairobi',
      availableUnits: 1,
      bedrooms: '3',
      rent: '75000',
      amenities: ['Parking', 'Security', 'Gym', 'Garden', 'Playground'],
      description: 'Spacious family apartments with beautiful gardens and a children\'s playground.',
      landlord: 'Sarah Johnson',
      phone: '+254 723 456 789',
      email: 'sarah@nyumbanii.co.ke',
      images: [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop'
      ],
      listed: '2025-10-02'
    },
    {
      id: 4,
      propertyName: 'Skyline Heights',
      location: 'Westlands, Nairobi',
      availableUnits: 4,
      bedrooms: '2',
      rent: '55000',
      amenities: ['Parking', 'Security', 'Gym', 'Rooftop Lounge'],
      description: 'Premium living with stunning city views and modern facilities.',
      landlord: 'David Kimani',
      phone: '+254 734 567 890',
      email: 'david@nyumbanii.co.ke',
      images: [
        'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800&h=600&fit=crop'
      ],
      listed: '2025-09-30'
    },
    {
      id: 5,
      propertyName: 'Palm Court',
      location: 'Karen, Nairobi',
      availableUnits: 2,
      bedrooms: '4',
      rent: '120000',
      amenities: ['Parking', 'Security', 'Garden', 'Gym', 'Pool', 'Clubhouse'],
      description: 'Luxury family homes in serene Karen with world-class amenities.',
      landlord: 'Mary Wanjiru',
      phone: '+254 745 678 901',
      email: 'mary@nyumbanii.co.ke',
      images: [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop'
      ],
      listed: '2025-10-03'
    },
    {
      id: 6,
      propertyName: 'City Center Studios',
      location: 'CBD, Nairobi',
      availableUnits: 5,
      bedrooms: 'Studio',
      rent: '28000',
      amenities: ['Security', 'Backup Generator', 'WiFi'],
      description: 'Affordable studio apartments perfect for young professionals in the city center.',
      landlord: 'John Omondi',
      phone: '+254 756 789 012',
      email: 'john@nyumbanii.co.ke',
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&h=600&fit=crop'
      ],
      listed: '2025-09-27'
    },
    {
      id: 7,
      propertyName: 'Nyali Beach Villas',
      location: 'Nyali, Mombasa',
      availableUnits: 3,
      bedrooms: '3-4',
      rent: '85000-110000',
      amenities: ['Beach Access', 'Pool', 'Security', 'Parking', 'Ocean View'],
      description: 'Stunning beachfront villas with direct beach access and breathtaking ocean views.',
      landlord: 'Ahmed Hassan',
      phone: '+254 720 123 456',
      email: 'ahmed@nyumbanii.co.ke',
      images: [
        'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800&h=600&fit=crop'
      ],
      listed: '2025-10-04'
    },
    {
      id: 8,
      propertyName: 'Eldoret Heights',
      location: 'Pioneer, Eldoret',
      availableUnits: 6,
      bedrooms: '2',
      rent: '25000',
      amenities: ['Parking', 'Security', 'Water Supply'],
      description: 'Comfortable and affordable apartments in the growing town of Eldoret.',
      landlord: 'Grace Chebet',
      phone: '+254 732 456 789',
      email: 'grace@nyumbanii.co.ke',
      images: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop'
      ],
      listed: '2025-10-05'
    },
    {
      id: 9,
      propertyName: 'Kisumu Lakeside Apartments',
      location: 'Milimani, Kisumu',
      availableUnits: 4,
      bedrooms: '1-2',
      rent: '30000-45000',
      amenities: ['Lake View', 'Parking', 'Security', 'Gym'],
      description: 'Modern apartments with stunning views of Lake Victoria and excellent facilities.',
      landlord: 'Peter Ochieng',
      phone: '+254 743 567 890',
      email: 'peter@nyumbanii.co.ke',
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'
      ],
      listed: '2025-09-29'
    },
    {
      id: 10,
      propertyName: 'Nakuru Garden Estate',
      location: 'Milimani, Nakuru',
      availableUnits: 2,
      bedrooms: '3',
      rent: '40000',
      amenities: ['Garden', 'Parking', 'Security', 'Playground'],
      description: 'Family-friendly apartments with beautiful gardens in peaceful Nakuru.',
      landlord: 'Jane Wambui',
      phone: '+254 754 678 901',
      email: 'jane@nyumbanii.co.ke',
      images: [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop'
      ],
      listed: '2025-10-06'
    },
    {
      id: 11,
      propertyName: 'Thika Road Mall Residences',
      location: 'Thika Road, Nairobi',
      availableUnits: 8,
      bedrooms: 'Studio-1',
      rent: '22000-32000',
      amenities: ['Mall Access', 'Security', 'Parking', 'WiFi'],
      description: 'Convenient apartments with direct access to shopping mall and major highways.',
      landlord: 'Michael Kariuki',
      phone: '+254 765 789 012',
      email: 'michael@nyumbanii.co.ke',
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&h=600&fit=crop'
      ],
      listed: '2025-10-07'
    },
    {
      id: 12,
      propertyName: 'Diani Beach Cottages',
      location: 'Diani Beach, Kwale',
      availableUnits: 2,
      bedrooms: '2-3',
      rent: '70000-95000',
      amenities: ['Beach Access', 'Pool', 'Garden', 'Security', 'Ocean View'],
      description: 'Tropical paradise cottages steps away from the pristine Diani Beach.',
      landlord: 'Susan Mwende',
      phone: '+254 776 890 123',
      email: 'susan@nyumbanii.co.ke',
      images: [
        'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop'
      ],
      listed: '2025-10-03'
    }
  ]


  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch listings from Firestore
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const listingsRef = collection(db, 'listings');
        const q = query(listingsRef, where('status', '==', 'available'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const listingsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setListings(listingsData);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching listings:', error);
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const locations = ['all', 'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Kwale'];

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.propertyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = filterLocation === 'all' || listing.location?.includes(filterLocation);
    return matchesSearch && matchesLocation;
  });

  const handleBookViewing = () => {
    if (bookingData.name && bookingData.email && bookingData.phone && bookingData.date && bookingData.time) {
      alert(`Viewing booked successfully for ${selectedProperty.propertyName} on ${bookingData.date} at ${bookingData.time}. You will receive a confirmation email shortly.`);
      setShowBookingModal(false);
      setBookingData({ name: '', email: '', phone: '', date: '', time: '' });
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
              <button 
                onClick={() => navigate('/login')}
                className="text-gray-900 hover:text-[#003366] font-semibold transition-colors">
                  Login
              </button>
                <button 
                  onClick={() => navigate('/register')}
                  className="bg-[#003366] hover:bg-[#002244] text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                  Register
                </button>
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
            <div className="flex gap-2">
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none text-gray-900"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>
                    {loc === 'all' ? 'All Locations' : loc}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Available Properties</h2>
            <p className="text-gray-600">{filteredListings.length} properties found</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366] mx-auto mb-4"></div>
            <p className="text-gray-500 text-lg">Loading listings...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No properties found matching your search</p>
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
                    </div>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                      {listing.availableUnits} Available
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{listing.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-700">
                      <BedDouble className="w-4 h-4 mr-2 text-[#003366]" />
                      <span>{listing.bedrooms} Bedrooms</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <DollarSign className="w-4 h-4 mr-2 text-[#003366]" />
                      <span>KES {listing.rent}/month</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {listing.amenities?.slice(0, 3).map((amenity, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                        {amenity}
                      </span>
                    ))}
                    {listing.amenities?.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{listing.amenities.length - 3} more
                      </span>
                    )}
                  </div>

                  <button 
                    onClick={() => setSelectedProperty(listing)}
                    className="w-full bg-[#003366] text-white py-2 rounded-lg hover:bg-[#002244] transition font-semibold"
                  >
                    View Details
                  </button>
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
                    <div className="flex items-center text-gray-700">
                      <BedDouble className="w-5 h-5 mr-2 text-[#003366]" />
                      {selectedProperty.bedrooms} Bedrooms
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Home className="w-5 h-5 mr-2 text-[#003366]" />
                      {selectedProperty.availableUnits} Units Available
                    </div>
                    <div className="flex items-center text-gray-700 font-semibold">
                      <DollarSign className="w-5 h-5 mr-2 text-[#003366]" />
                      KES {selectedProperty.rent}/month
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Contact Landlord</h4>
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

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProperty.amenities?.map((amenity, idx) => (
                    <span key={idx} className="bg-blue-50 text-[#003366] px-3 py-1 rounded-lg text-sm flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full bg-[#003366] hover:bg-[#002244] text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Book a Viewing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Book Site Viewing</h3>
              <button onClick={() => setShowBookingModal(false)}>
                <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="font-semibold text-gray-900">{selectedProperty.propertyName}</p>
              <p className="text-sm text-gray-600">{selectedProperty.location}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={bookingData.name}
                  onChange={(e) => setBookingData({...bookingData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={bookingData.email}
                  onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={bookingData.phone}
                  onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  placeholder="+254 712 345 678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                <input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                <select
                  value={bookingData.time}
                  onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
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

            <div className="flex gap-3 mt-6">
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
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Listings;