import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Building2,
  Landmark,
  Building,
  Plus,
  Minus,
  Facebook,
  Twitter,
  Instagram
} from 'lucide-react';
import LandingPagePricing from '../components/LandingPagePricing';
import Testimonials from '../components/Testimonials';
import ROICalculator from '../components/ROICalculator';
import VideoDemo from '../components/VideoDemo';
import LeadMagnets from '../components/LeadMagnets';
import InstallPrompt from '../components/InstallPrompt';

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "Is my data safe with Nyumbanii?",
      answer: "Absolutely. We use bank-level encryption to protect your data. Your information is never shared with third parties, and we comply with international data protection standards. All data is stored securely with automated backups."
    },
    {
      question: "How much does Nyumbanii cost?",
      answer: "We offer flexible pricing based on the number of properties you manage. Plans start at KES 2,999/month for up to 5 properties. We also offer a 14-day free trial with no credit card required, so you can try all features risk-free."
    },
    {
      question: "Can I try Nyumbanii before committing?",
      answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card required to start, and you can cancel anytime during the trial period."
    },
    {
      question: "How long does it take to set up?",
      answer: "You can create your account in less than 2 minutes. Adding your first property takes about 5 minutes. Most landlords are fully operational within their first day on the platform."
    },
    {
      question: "Do tenants need to create accounts?",
      answer: "Yes, tenants create free accounts to access their portal. They can view payment history, submit maintenance requests, communicate with you, and access important documents—all in one place."
    },
    {
      question: "How does rent tracking work?",
      answer: "Nyumbanii helps you track and record rent payments for your records. Tenants and landlords handle payments outside the platform (via M-Pesa, bank transfer, cash, etc.), then record the transaction in Nyumbanii for tracking and reporting purposes."
    },
    {
      question: "Can I manage multiple properties?",
      answer: "Yes! Nyumbanii is designed to handle multiple properties, units, and tenants from a single dashboard. You can manage everything from small apartments to large commercial buildings."
    },
    {
      question: "What happens to my data if I cancel?",
      answer: "You can export all your data at any time. If you cancel, your data remains accessible for 30 days, giving you plenty of time to download everything you need. After that, it's permanently deleted from our servers."
    },
    {
      question: "Do you offer customer support?",
      answer: "Yes! We provide email support to all users, with priority support for premium plans. Our team typically responds within 24 hours, and we also have comprehensive guides and video tutorials."
    },
    {
      question: "Can I upgrade or downgrade my plan?",
      answer: "Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated accordingly."
    }
  ];

  const features = [
    {
      image: "/images/revenue.png",
      title: "Stats at Your Fingertips",
      description: "Track maintenance, requests, and work orders across every property—clearly and in real time."
    },
    {
      image: "/images/listing.png",
      title: "List Properties and Set up Site Viewing Dates",
      description: "Publish listings and schedule site visits for new and existing tenants with just a few clicks."
    },
    {
      image: "/images/maintenance.png",
      title: "Receive Alerts, Assign Work Orders",
      description: "Follow every task from start to finish with automated alerts and easy work order assignments."
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
      {/* PWA Install Prompt */}
      <InstallPrompt />

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
        Karibu <br /> <span className="text-blue-900">Nyumbanii</span>
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

      {/* Why Choose Nyumbanii Section */}
      <section id="features" className="py-20 px-4 pb-0">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-2">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">Why Choose Nyumbanii?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              One platform for all your property operations.
            </p>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <ROICalculator />

      <section id="how-it-works" className="pt-8 pb-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get started in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md text-center">
              <div className="w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">1</div>
              <p className="text-2xl font-semibold text-gray-900 mb-4">Sign Up</p>
              <p className="text-gray-600">Create your free account in less than 2 minutes. No credit card required.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md text-center">
              <div className="w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">2</div>
              <p className="text-2xl font-semibold text-gray-900 mb-4">Add Properties</p>
              <p className="text-gray-600">Add your properties, units, and tenants to the platform with ease.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md text-center">
              <div className="w-16 h-16 bg-blue-900 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">3</div>
              <p className="text-2xl font-semibold text-gray-900 mb-4">Relax & Manage</p>
              <p className="text-gray-600">Sit back and let Nyumbanii handle rent tracking, maintenance, and more.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Features</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img src={feature.image} alt={feature.title} className="w-full h-48 object-cover" />
                </div>
                <p className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</p>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <LandingPagePricing />

      {/* Video Demo Section */}
      <VideoDemo />

      {/* Testimonials Section */}
      <Testimonials />

      {/* Lead Magnets Section */}
      <LeadMagnets />

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Everything you need to know about Nyumbanii</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  {openFaqIndex === index ? (
                    <Minus className="w-5 h-5 text-blue-900 flex-shrink-0" />
                  ) : (
                    <Plus className="w-5 h-5 text-blue-900 flex-shrink-0" />
                  )}
                </button>
                {openFaqIndex === index && (
                  <div className="px-6 pb-4 text-gray-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
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
              <div className="font-bold text-lg mb-4"> <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <img src="/images/logo-light.svg" alt="Nyumbanii Logo" className="h-10 w-auto" />
            </div> Nyumbanii</div>
              <p className="text-gray-400 mb-4">Bridging the gap between landlords and tenants.</p>
              <div className="flex gap-4">
                <a
                  href="https://web.facebook.com/nyumbaniii/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="https://x.com/Nyumbanii_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="https://www.instagram.com/nyumbanii_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div>
              <p className="font-semibold mb-4">Product</p>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <button onClick={() => navigate('/listings')} className="hover:text-white font-medium transition-colors">Listings</button>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-4">Company</p>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-4">Legal</p>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => navigate('/privacy-policy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => navigate('/terms-of-service')} className="hover:text-white transition-colors">Terms of Service</button></li>
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