import React, { useState } from 'react';
import { Download, BookOpen, FileCheck, Wrench, ArrowRight } from 'lucide-react';
import LeadMagnetModal from './LeadMagnetModal';

const LeadMagnets = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState('ebook');

  const resources = [
    {
      id: 'ebook',
      icon: <BookOpen className="w-8 h-8" />,
      title: 'Property Management eBook',
      description: 'Complete 50-page guide to modern property management',
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      highlight: 'FREE Download',
      pages: '50 pages'
    },
    {
      id: 'checklist',
      icon: <FileCheck className="w-8 h-8" />,
      title: 'Rent Collection Checklist',
      description: 'Never miss a payment with this proven system',
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      highlight: 'FREE Download',
      pages: 'Step-by-step'
    },
    {
      id: 'maintenance',
      icon: <Wrench className="w-8 h-8" />,
      title: 'Maintenance Guide',
      description: 'Reduce costs and improve tenant satisfaction',
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      highlight: 'FREE Download',
      pages: 'Best practices'
    }
  ];

  const openModal = (resourceId) => {
    setSelectedResource(resourceId);
    setModalOpen(true);
  };

  return (
    <>
      <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full font-semibold mb-4">
              <Download className="w-5 h-5" />
              Free Resources
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Get Your Free Property Management Resources
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Download our expert guides and checklists to streamline your property management today
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className={`${resource.bgColor} border-2 ${resource.borderColor} rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group`}
                onClick={() => openModal(resource.id)}
              >
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full text-sm font-bold text-gray-900 mb-4 shadow-sm">
                  {resource.highlight}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${resource.gradient} text-white rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {resource.icon}
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {resource.title}
                </h3>
                <p className="text-gray-700 mb-4 min-h-[3rem]">
                  {resource.description}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-6">
                  <span className="font-medium">{resource.pages}</span>
                  <span className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    PDF
                  </span>
                </div>

                {/* Button */}
                <button className="w-full bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white py-3 rounded-lg font-semibold transition-all group-hover:shadow-lg flex items-center justify-center gap-2">
                  Download Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>

          {/* Trust Bar */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold text-blue-900 mb-2">2,000+</p>
                <p className="text-gray-600">Downloads This Month</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-blue-900 mb-2">100%</p>
                <p className="text-gray-600">Free, No Credit Card</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-blue-900 mb-2">4.9/5</p>
                <p className="text-gray-600">Average Rating</p>
              </div>
            </div>
          </div>

          {/* Bonus CTA */}
          <div className="mt-12 bg-gradient-to-r from-blue-900 to-purple-900 rounded-2xl p-8 md:p-12 text-white text-center">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Want the Full Solution?
            </h3>
            <p className="text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
              These guides are great, but imagine having all of this automated in one platform. Try Nyumbanii free for 14 days.
            </p>
            <button
              onClick={() => window.location.href = '/register'}
              className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-bold transition-all hover:shadow-2xl hover:scale-105 inline-flex items-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Modal */}
      <LeadMagnetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        resourceType={selectedResource}
      />
    </>
  );
};

export default LeadMagnets;
