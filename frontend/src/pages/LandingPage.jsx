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

      <section id="home" className="pt-32 pb-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <img src="/images/hero.png" alt="Hero" className="w-24 h-24 md:w-32 md:h-32" />
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4">
              Karibu <span className="text-blue-900">Nyumbanii</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 italic mb-8">Relax, we'll take it from here.</p>

            <p className="text-lg md:text-xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
              Bridging the gap between Landlords and Tenants, saving time, reducing costs, and keeping properties in tip-top condition.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button onClick={() => navigate('/register')} className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all hover:shadow-lg hover:scale-105 w-full sm:w-auto">Register</button>
              <button onClick={() => navigate('/login')} className="bg-white border-2 border-blue-900 text-blue-900 hover:bg-blue-50 px-8 py-4 rounded-lg text-lg font-semibold transition-all hover:shadow-lg w-full sm:w-auto">Login</button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-12 h-12 text-blue-900" strokeWidth={3} />
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
                <div className="absolute inset-0 bg-gradient-to-br from-blue-300 via-blue-400 to-blue-500 rounded-full"></div>
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

      <section id="partners" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Trusted Partners</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow flex items-center justify-center">
              <img src="/images/Hexa Logo.png" alt="Partner 1" className="w-full h-auto max-h-16 object-contain" />
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow flex items-center justify-center">
              <img src="/images/Tech Logo.png" alt="Partner 2" className="w-full h-auto max-h-16 object-contain" />
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow flex items-center justify-center">
              <img src="/images/real.png" alt="Partner 3" className="w-full h-auto max-h-16 object-contain" />
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow flex items-center justify-center">
              <img src="/images/real1.png" alt="Partner 4" className="w-full h-auto max-h-16 object-contain" />
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow flex items-center justify-center">
              <img src="/images/real2.png" alt="Partner 5" className="w-full h-auto max-h-16 object-contain" />
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-600 mb-8">No contracts. No surprise fees.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-900 hover:to-blue-900 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-4 hover:shadow-2xl cursor-pointer">
              <div className="mb-6">
                <p className="text-4xl font-bold text-blue-900 group-hover:text-white transition-colors mb-2">
                  KES 2000<span className="text-lg text-gray-600 group-hover:text-blue-200">/month</span>
                </p>
                <h3 className="text-3xl font-bold text-blue-900 group-hover:text-white transition-colors mb-3">Intro</h3>
                <p className="text-blue-800 group-hover:text-blue-200 transition-colors">Best for less than 5 Properties</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-900 group-hover:text-white transition-colors flex-shrink-0" />
                  <span className="text-blue-900 group-hover:text-white transition-colors">All limited links</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-900 group-hover:text-white transition-colors flex-shrink-0" />
                  <span className="text-blue-900 group-hover:text-white transition-colors">Own analytics platform</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-900 group-hover:text-white transition-colors flex-shrink-0" />
                  <span className="text-blue-900 group-hover:text-white transition-colors">Chat support</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-900 group-hover:text-white transition-colors flex-shrink-0" />
                  <span className="text-blue-900 group-hover:text-white transition-colors">Calendar Access</span>
                </li>
              </ul>
              <button className="w-full bg-blue-200 group-hover:bg-white text-blue-900 py-3 rounded-xl font-semibold transition-all">Choose plan</button>
            </div>

            <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-900 hover:to-blue-900 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-4 hover:shadow-2xl cursor-pointer">
              <div className="mb-6">
                <p className="text-4xl font-bold text-blue-900 group-hover:text-white transition-colors mb-2">
                  KES 5000<span className="text-lg text-gray-600 group-hover:text-blue-200">/month</span>
                </p>
                <h3 className="text-3xl font-bold text-blue-900 group-hover:text-white transition-colors mb-3">Base</h3>
                <p className="text-blue-800 group-hover:text-blue-200 transition-colors">5-10 Properties</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-900 group-hover:text-white transition-colors flex-shrink-0" />
                  <span className="text-blue-900 group-hover:text-white transition-colors">All limited links</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-900 group-hover:text-white transition-colors flex-shrink-0" />
                  <span className="text-blue-900 group-hover:text-white transition-colors">Own analytics platform</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-900 group-hover:text-white transition-colors flex-shrink-0" />
                  <span className="text-blue-900 group-hover:text-white transition-colors">Chat support</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-900 group-hover:text-white transition-colors flex-shrink-0" />
                  <span className="text-blue-900 group-hover:text-white transition-colors">Optimize hashtags</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-900 group-hover:text-white transition-colors flex-shrink-0" />
                  <span className="text-blue-900 group-hover:text-white transition-colors">Unlimited users</span>
                </li>
              </ul>
              <button className="w-full bg-blue-200 group-hover:bg-white text-blue-900 py-3 rounded-xl font-semibold transition-all">Choose plan</button>
            </div>

            <div className="group bg-blue-900 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 rounded-2xl p-8 text-white hover:text-blue-900 relative transition-all duration-300 hover:-translate-y-4 hover:shadow-2xl cursor-pointer">
              <div className="absolute -top-3 right-6 bg-blue-700 group-hover:bg-blue-900 px-4 py-1 rounded-full text-xs font-semibold text-white transition-colors">MOST POPULAR</div>
              <div className="mb-6">
                <p className="text-4xl font-bold group-hover:text-blue-900 transition-colors mb-2">KES 10,000<span className="text-lg opacity-80 group-hover:text-gray-600 group-hover:opacity-100">/month</span></p>
                <h3 className="text-3xl font-bold group-hover:text-blue-900 transition-colors mb-3">Pro</h3>
                <p className="opacity-90 group-hover:text-blue-800 group-hover:opacity-100 transition-colors">10+ Properties</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 group-hover:text-blue-900 transition-colors" />
                  <span className="group-hover:text-blue-900 transition-colors">All limited links</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 group-hover:text-blue-900 transition-colors" />
                  <span className="group-hover:text-blue-900 transition-colors">Own analytics platform</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 group-hover:text-blue-900 transition-colors" />
                  <span className="group-hover:text-blue-900 transition-colors">Chat support</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 group-hover:text-blue-900 transition-colors" />
                  <span className="group-hover:text-blue-900 transition-colors">Optimize hashtags</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 group-hover:text-blue-900 transition-colors" />
                  <span className="group-hover:text-blue-900 transition-colors">Unlimited users</span>
                </li>
              </ul>
              <button className="w-full bg-white text-blue-900 group-hover:bg-blue-200 py-3 rounded-xl font-semibold transition-all">Choose plan</button>
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

      <section className="py-20 px-4 bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Property Management?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join hundreds of landlords and tenants already using Nyumbanii
          </p>
          <button 
            onClick={() => navigate('/register')}
            className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-all hover:shadow-xl hover:scale-105 inline-flex items-center gap-2"
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
              <h3 className="font-bold text-lg mb-4">Karibu Nyumbanii</h3>
              <p className="text-gray-400">Bridging the gap between landlords and tenants across Kenya.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
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
            <p>&copy; 2025 Karibu Nyumbanii. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 