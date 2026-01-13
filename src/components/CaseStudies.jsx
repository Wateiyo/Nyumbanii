import React, { useState } from 'react';
import { TrendingUp, Clock, DollarSign, Users, ArrowRight, CheckCircle } from 'lucide-react';

const CaseStudies = () => {
  const [selectedCase, setSelectedCase] = useState(0);

  const caseStudies = [
    {
      title: "Riverside Apartments: From Chaos to Control",
      company: "Riverside Property Management",
      location: "Nairobi, Kenya",
      properties: "30 units",
      challenge: "Managing 30 units across 3 buildings was overwhelming. Rent tracking was manual, maintenance requests came via phone calls, and tracking expenses was a nightmare. The property manager spent 40+ hours per month on administrative tasks.",
      solution: "Implemented Nyumbanii in January 2025. All tenants were onboarded within 2 weeks. Digital rent tracking, maintenance requests, and centralized communication transformed operations.",
      results: [
        {
          icon: <Clock className="w-6 h-6" />,
          metric: "75%",
          description: "Reduction in admin time",
          detail: "From 40 hours to 10 hours per month"
        },
        {
          icon: <DollarSign className="w-6 h-6" />,
          metric: "KES 120K",
          description: "Annual cost savings",
          detail: "Reduced staffing and operational costs"
        },
        {
          icon: <TrendingUp className="w-6 h-6" />,
          metric: "98%",
          description: "Tenant satisfaction",
          detail: "Up from 75% before implementation"
        },
        {
          icon: <Users className="w-6 h-6" />,
          metric: "100%",
          description: "On-time rent tracking",
          detail: "Digital reminders and record keeping"
        }
      ],
      quote: "Nyumbanii gave us back our time. We're now focused on growth instead of drowning in paperwork.",
      author: "Jane Muthoni, Property Manager",
      image: "/images/case-study-1.jpg"
    },
    {
      title: "Greenview Estate: Scaling Property Portfolio",
      company: "Greenview Investments Ltd",
      location: "Mombasa, Kenya",
      properties: "50+ units",
      challenge: "A rapidly growing property portfolio needed a scalable solution. Managing multiple properties, tracking maintenance costs, and coordinating with 3 different maintenance teams was becoming impossible with spreadsheets.",
      solution: "Adopted Nyumbanii Professional Plan in March 2025. Integrated all properties, invited property managers and maintenance staff to the platform. Implemented the maintenance workflow with cost estimates and approvals.",
      results: [
        {
          icon: <TrendingUp className="w-6 h-6" />,
          metric: "2x",
          description: "Portfolio growth",
          detail: "Scaled from 25 to 50 units in 6 months"
        },
        {
          icon: <DollarSign className="w-6 h-6" />,
          metric: "35%",
          description: "Maintenance cost reduction",
          detail: "Better tracking and vendor management"
        },
        {
          icon: <Clock className="w-6 h-6" />,
          metric: "48 hrs",
          description: "Average response time",
          detail: "Down from 5 days for maintenance"
        },
        {
          icon: <Users className="w-6 h-6" />,
          metric: "3",
          description: "Team members onboarded",
          detail: "Seamless collaboration"
        }
      ],
      quote: "We couldn't have scaled this fast without Nyumbanii. The platform grows with us.",
      author: "Patrick Omondi, CEO",
      image: "/images/case-study-2.jpg"
    },
    {
      title: "Urban Homes: Maximizing Occupancy",
      company: "Urban Homes Kenya",
      location: "Kisumu, Kenya",
      properties: "15 units",
      challenge: "High vacancy rates due to slow response to inquiries and complicated viewing processes. Missing out on potential tenants because of disorganized property listings and no easy way for prospective tenants to schedule viewings.",
      solution: "Started using Nyumbanii in February 2025. Listed all available properties on the platform with detailed information and photos. Enabled online viewing bookings, making it easy for prospective tenants to schedule visits.",
      results: [
        {
          icon: <TrendingUp className="w-6 h-6" />,
          metric: "90%",
          description: "Occupancy rate",
          detail: "Up from 65% in 3 months"
        },
        {
          icon: <Clock className="w-6 h-6" />,
          metric: "14 days",
          description: "Average time to rent",
          detail: "Down from 45 days"
        },
        {
          icon: <DollarSign className="w-6 h-6" />,
          metric: "KES 180K",
          description: "Additional revenue",
          detail: "From reduced vacancy period"
        },
        {
          icon: <Users className="w-6 h-6" />,
          metric: "50+",
          description: "Viewing requests",
          detail: "In first 2 months"
        }
      ],
      quote: "The property listing feature is a game-changer. We fill units 3x faster now.",
      author: "Lucy Atieno, Landlord",
      image: "/images/case-study-3.jpg"
    }
  ];

  const currentCase = caseStudies[selectedCase];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Success Stories
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See how property owners and managers are achieving remarkable results with Nyumbanii
          </p>
        </div>

        {/* Case Study Tabs */}
        <div className="flex flex-col md:flex-row gap-4 mb-12 justify-center">
          {caseStudies.map((cs, index) => (
            <button
              key={index}
              onClick={() => setSelectedCase(index)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedCase === index
                  ? 'bg-blue-900 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cs.company}
            </button>
          ))}
        </div>

        {/* Case Study Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Details */}
          <div>
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="text-3xl font-bold text-gray-900 mb-3">
                {currentCase.title}
              </h3>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {currentCase.properties}
                </span>
                <span>•</span>
                <span>{currentCase.location}</span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  The Challenge
                </h4>
                <p className="text-gray-700 leading-relaxed pl-10">
                  {currentCase.challenge}
                </p>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  The Solution
                </h4>
                <p className="text-gray-700 leading-relaxed pl-10">
                  {currentCase.solution}
                </p>
              </div>

              {/* Quote */}
              <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6 rounded-xl">
                <p className="text-lg italic mb-3">"{currentCase.quote}"</p>
                <p className="text-sm text-blue-100">— {currentCase.author}</p>
              </div>
            </div>
          </div>

          {/* Right: Results */}
          <div>
            <div className="bg-gray-50 rounded-xl p-8">
              <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-7 h-7 text-green-600" />
                The Results
              </h4>

              <div className="grid sm:grid-cols-2 gap-6">
                {currentCase.results.map((result, index) => (
                  <div
                    key={index}
                    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-900 mb-4">
                      {result.icon}
                    </div>
                    <div className="text-4xl font-bold text-blue-900 mb-2">
                      {result.metric}
                    </div>
                    <div className="text-gray-900 font-semibold mb-1">
                      {result.description}
                    </div>
                    <div className="text-sm text-gray-600">
                      {result.detail}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-gray-700 mb-4 font-medium">
                  Ready to achieve similar results?
                </p>
                <button className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg inline-flex items-center gap-2 group">
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Trust Indicators */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="bg-green-50 p-6 rounded-xl text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">14-Day Free Trial</p>
            <p className="text-sm text-gray-600">No credit card required</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-xl text-center">
            <CheckCircle className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">Easy Setup</p>
            <p className="text-sm text-gray-600">Get started in under 10 minutes</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-xl text-center">
            <CheckCircle className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">Free Support</p>
            <p className="text-sm text-gray-600">We're here to help you succeed</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CaseStudies;
