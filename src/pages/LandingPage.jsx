import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Shield,
  Clock,
  TrendingUp,
  Users,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Building2,
  Landmark,
  Building
} from 'lucide-react';
import LandingPagePricing from '../components/LandingPagePricing';
import Testimonials from '../components/Testimonials';
import ROICalculator from '../components/ROICalculator';
import VideoDemo from '../components/VideoDemo';
import LeadMagnets from '../components/LeadMagnets';

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Save Time",
      description: "Automate rent collection, maintenance requests, and tenant communication"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Reduce Costs",
      description: "Cut administrative costs and streamline property management operations"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Stay Organized",
      description: "Keep all your property data, documents, and communications in one place"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Better Communication",
      description: "Instant notifications and direct messaging between landlords and tenants"
    }
  ];

  const stats = [
    { value: "500+", label: "Properties Managed" },
    { value: "2,000+", label: "Happy Tenants" },
    { value: "KES 50M+", label: "Rent Processed" },
    { value: "98%", label: "Satisfaction Rate" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <img src="/images/Logo.svg" alt="Nyumbanii Logo" className="h-10 w-auto" />
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-blue-900 font-medium transition-colors">Features</a>
              <button onClick={() => navigate('/listings')} className="text-gray-700 hover:text-blue-900 font-medium transition-colors">Listings</button>
              <a href="#pricing" className="text-gray-700 hover:text-blue-900 font-medium transition-colors">Pricing</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-900 font-medium transition-colors">Contact</a>
              <button onClick={() => navigate('/login')} className="text-gray-900 hover:text-blue-900 font-semibold transition-colors">Login</button>
              <button onClick={() => navigate('/register')} className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold transition-colors mr-6">Register</button>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-gray-600 hover:text-blue-900 py-2">Features</a>
              <button onClick={() => navigate('/listings')} className="block w-full text-left text-gray-600 hover:text-blue-900 py-2">Listings</button>
              <a href="#pricing" className="block text-gray-600 hover:text-blue-900 py-2">Pricing</a>
              <a href="#contact" className="block text-gray-600 hover:text-blue-900 py-2">Contact</a>
              <button onClick={() => navigate('/login')} className="w-full text-blue-900 hover:text-blue-700 font-semibold py-2 text-left">Login</button>
              <button onClick={() => navigate('/register')} className="w-full bg-blue-900 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold">Register</button>
            </div>
          </div>
        )}
      </nav>

      <section id="home" className="pt-32 pb-20 px-4 relative overflow-hidden">
  {/* Left decorative image */}
  <div className="absolute left-0 top-1/3 -translate-y-1/2 w-48 md:w-64 lg:w-80 opacity-80 hidden lg:block pointer-events-none">
    <img src="/images/hero-left.png" alt="Decorative" className="w-full h-auto" />
  </div>
  
  {/* Right decorative image */}
  <div className="absolute right-0 top-1/3 -translate-y-1/2 w-48 md:w-64 lg:w-80 opacity-80 hidden lg:block pointer-events-none">
    <img src="/images/hero-right.png" alt="Decorative" className="w-full h-auto" />
  </div>

  <div className="max-w-7xl mx-auto relative z-10">
    <div className="text-center max-w-4xl mx-auto">
      <div className="flex justify-center mb-8">
        <img src="/images/hero.png" alt="Hero" className="w-24 h-24 md:w-32 md:h-32" />
      </div>

      <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4">
        Karibu <br></br> <span className="text-blue-900">Nyumbanii</span>
      </h1>
      
      <p className="text-xl md:text-2xl text-gray-600 italic mb-8">Relax, we'll take it from here.</p>

      <p className="text-lg md:text-l text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
        Bridging the gap between Landlords and Tenants, saving time, reducing costs, and keeping properties in tip-top condition.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
        <button onClick={() => navigate('/register')} className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all hover:shadow-lg hover:scale-105 w-full sm:w-auto">Register</button>
        <button onClick={() => navigate('/login')} className="bg-white border-2 border-blue-900 text-blue-900 hover:bg-blue-50 px-8 py-4 rounded-lg text-lg font-semibold transition-all hover:shadow-lg w-full sm:w-auto">Login</button>
      </div>
    </div>
  </div>

  {/* Centered Arrow - positioned relative to the section, not the content */}
  <div className="w-full flex justify-center absolute bottom-8 left-0 right-0 z-10">
    <div 
      className="animate-bounce cursor-pointer hover:scale-110 transition-transform"
      onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
    >
      <ChevronDown className="w-12 h-12 text-blue-900" strokeWidth={3} />
    </div>
  </div>
</section>

      <section className="py-16 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-blue-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Why Choose Nyumbanii?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Everything you need to manage your properties efficiently and professionally</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-900 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-blue-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                Take control of your operations with innovative, easy-to-use software.
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center mt-1">
                    <CheckCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <p className="text-lg">Put your day-to-day management on autopilot</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center mt-1">
                    <CheckCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <p className="text-lg">Execute data-informed decisions and planning</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center mt-1">
                    <CheckCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <p className="text-lg">Say goodbye to emails, phone calls, and paper forms</p>
                </div>
              </div>
            </div>
            <div className="relative flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-2xl aspect-square">
                <div className="absolute inset-0 bg-blue-400 rounded-full"></div>
                <div className="absolute inset-0 flex items-center justify-center p-8 md:p-12 lg:p-16">
                  <img
                    src="/images/laptop.png"
                    alt="App Dashboard"
                    className="w-full h-auto object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <img src="/images/revenue.png" alt="Stats Dashboard" className="w-full h-auto rounded-lg shadow-lg" />
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Stats at Your Fingertips
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                All your most important reports all in one place. Track work requests across all locations, 
                keep maintenance logs, and see work orders by technician, property, or location.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                List Properties and Set up Site Viewing Dates
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                List your properties, book site viewing dates for current and new tenants.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <img src="/images/listing.png" alt="Property Listings" className="w-full h-auto rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-3xl font-bold mb-6">27 May</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-900 pl-4 py-2">
                  <p className="font-semibold">Maintenance: A7</p>
                  <p className="text-sm text-gray-500">01:00 PM - 02:00 PM</p>
                </div>
                <div className="border-l-4 border-blue-900 pl-4 py-2">
                  <p className="font-semibold">Maintenance: A15</p>
                  <p className="text-sm text-gray-500">02:00 PM - 03:00 PM</p>
                </div>
                <div className="border-l-4 border-yellow-500 pl-4 py-2">
                  <p className="font-semibold">Unpaid Rent: A6</p>
                  <p className="text-sm text-gray-500">Reminder</p>
                </div>
              </div>
              <button className="mt-6 text-blue-900 font-semibold flex items-center gap-2">
                View all Tasks <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Receive Alerts, Assign Work Orders
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                As soon as a request comes in, automatically create a Work Order and assign it to the right person on your team. 
                Track work from the initial request to completion and have full visibility on what gets done.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get started in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md text-center">
              <div className="w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">1</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Sign Up</h3>
              <p className="text-gray-600">Create your free account in less than 2 minutes. No credit card required.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md text-center">
              <div className="w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">2</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Add Properties</h3>
              <p className="text-gray-600">Add your properties, units, and tenants to the platform with ease.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md text-center">
              <div className="w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">3</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Relax & Manage</h3>
              <p className="text-gray-600">Sit back and let Nyumbanii handle rent collection, maintenance, and more.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <LandingPagePricing />

      {/* Video Demo Section */}
      <VideoDemo />

      {/* Testimonials Section */}
      <Testimonials />

      {/* ROI Calculator Section */}
      <ROICalculator />

      {/* Lead Magnets Section */}
      <LeadMagnets />

      <section id="contact" className="py-20 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Here for <span className="text-blue-900">You!</span> Talk To Us or Book a <span className="text-blue-900">Free Demo</span> Today
            </h2>
          </div>

          <div className="bg-gray-50 rounded-2xl shadow-lg p-8">
            <div className="space-y-6">
              <input type="text" placeholder="Jane Doe" className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-blue-900 outline-none transition text-gray-700 placeholder-gray-400 bg-transparent" />
              <input type="email" placeholder="example@email.com" className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-blue-900 outline-none transition text-gray-700 placeholder-gray-400 bg-transparent" />
              <textarea placeholder="I need help getting started on Nyumbanii." rows={4} className="w-full px-4 py-3 border-b-2 border-gray-300 focus:border-blue-900 outline-none transition resize-none text-gray-700 placeholder-gray-400 bg-transparent"></textarea>
              <div className="flex justify-center pt-4">
                <button className="bg-blue-900 hover:bg-blue-800 text-white px-12 py-3 rounded-lg font-semibold transition-all hover:shadow-lg hover:scale-105">Send Message</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-blue-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Property Management?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join hundreds of landlords and tenants already using Nyumbanii
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-all inline-flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4"> <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <img src="/images/logo-light.svg" alt="Nyumbanii Logo" className="h-10 w-auto" />
            </div> Karibu Nyumbanii</h3>
              <p className="text-gray-400">Bridging the gap between landlords and tenants.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <button onClick={() => navigate('/listings')} className="hover:text-white font-medium transition-colors">Listings</button>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Nyumbanii. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 