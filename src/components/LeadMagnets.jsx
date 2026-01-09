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
      iconBg: 'bg-blue-600',
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
      iconBg: 'bg-green-600',
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
      iconBg: 'bg-purple-600',
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
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-full font-semibold mb-4">
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
                <div className={`w-16 h-16 ${resource.iconBg} text-white rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
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
                <button className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2">
                  Download Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>

          {/* Trust Bar */}
          <div className="bg-gray-50 rounded-2xl shadow-lg p-8">
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
