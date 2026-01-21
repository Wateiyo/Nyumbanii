import React, { useState } from 'react';
import { Download, BookOpen, FileCheck, Wrench, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LeadMagnetModal from './LeadMagnetModal';

const LeadMagnets = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState('ebook');

  const resources = [
    {
      id: 'ebook',
      icon: <BookOpen className="w-8 h-8" />,
      title: 'Property Management eBook',
      description: 'Complete guide to property management',
      iconBg: 'bg-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      highlight: 'FREE Download',
      pages: '25 pages'
    },
    {
      id: 'checklist',
      icon: <FileCheck className="w-8 h-8" />,
      title: 'Rent Collection Checklist',
      description: '60+ actionable steps to achieve 95% on-time payments',
      iconBg: 'bg-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      highlight: 'FREE Download',
      pages: '6 pages'
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

  const handleResourceClick = (resourceId) => {
    if (resourceId === 'checklist') {
      navigate('/resources/rent-collection-checklist');
    } else if (resourceId === 'maintenance') {
      navigate('/resources/maintenance-guide');
    } else if (resourceId === 'ebook') {
      navigate('/resources/property-management-ebook');
    } else {
      setSelectedResource(resourceId);
      setModalOpen(true);
    }
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
                className={`${resource.bgColor} border-2 ${resource.borderColor} rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group`}
                onClick={() => handleResourceClick(resource.id)}
              >
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-white px-2 py-1 rounded-full text-xs font-bold text-gray-900 mb-3 shadow-sm">
                  {resource.highlight}
                </div>

                {/* Icon */}
                <div className={`w-12 h-12 ${resource.iconBg} text-white rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  {resource.icon}
                </div>

                {/* Content */}
                <p className="text-xl font-bold text-gray-900 mb-2">
                  {resource.title}
                </p>
                <p className="text-sm text-gray-700 mb-4">
                  {resource.description}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
                  <span className="font-medium">{resource.pages}</span>
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    PDF
                  </span>
                </div>

                {/* Button */}
                <button className="w-full bg-blue-900 hover:bg-blue-800 text-white py-2 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2">
                  Download Now
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
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
