import React from 'react';
import { Star, Quote } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Wanjiku",
      role: "Property Owner",
      location: "Nairobi",
      image: "/images/testimonial-1.jpg",
      rating: 5,
      text: "Nyumbanii has transformed how I manage my 15 properties. Rent tracking is centralized, and I can track maintenance requests in real-time. I've saved at least 20 hours per month!",
      properties: "15 properties"
    },
    {
      name: "David Ochieng",
      role: "Property Manager",
      location: "Mombasa",
      image: "/images/testimonial-2.jpg",
      rating: 5,
      text: "Managing multiple properties for different landlords used to be chaotic. Now everything is organized in one place. The maintenance workflow with cost estimates is a game-changer.",
      properties: "50+ units managed"
    },
    {
      name: "Grace Mutua",
      role: "Landlord",
      location: "Kisumu",
      image: "/images/testimonial-3.jpg",
      rating: 5,
      text: "The tenant communication feature is incredible. No more endless phone calls. Tenants submit maintenance requests, I approve estimates, and everything is documented. Worth every shilling!",
      properties: "8 properties"
    }
  ];

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join hundreds of satisfied landlords and property managers who have transformed their property management
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 text-blue-100">
                <Quote className="w-12 h-12" fill="currentColor" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-gray-700 mb-6 leading-relaxed relative z-10">
                "{testimonial.text}"
              </p>

              {/* User Info */}
              <div className="flex items-center gap-4 border-t pt-6">
                <div className="w-14 h-14 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-xl">
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role} • {testimonial.location}</p>
                  <p className="text-xs text-blue-900 font-medium mt-1">{testimonial.properties}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-md">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-blue-900 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="text-gray-700 font-medium">
              <span className="text-blue-900 font-bold">500+</span> landlords trust Nyumbanii
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
