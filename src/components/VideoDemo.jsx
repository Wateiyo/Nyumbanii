import React, { useState } from 'react';
import { Play, Video, CheckCircle } from 'lucide-react';

const VideoDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  // You can replace this with your actual video URL (YouTube, Vimeo, or hosted video)
  // For now, this is a placeholder that shows how to embed
  const demoVideoUrl = 'https://www.youtube.com/embed/YOUR_VIDEO_ID';

  const features = [
    'Property & Tenant Management',
    'Rent Tracking & Record Keeping',
    'Maintenance Request Workflow',
    'Real-time Analytics Dashboard',
    'Multi-user Collaboration',
    'Mobile-Friendly Interface'
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-900 px-4 py-2 rounded-full font-semibold mb-4">
            <Video className="w-5 h-5" />
            Product Demo
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            See Nyumbanii in Action
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Watch a 3-minute walkthrough of the platform and discover how easy property management can be
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 items-center">
          {/* Video Player */}
          <div className="lg:col-span-3">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-900 aspect-video">
              {!isPlaying ? (
                // Thumbnail with Play Button
                <div className="relative w-full h-full">
                  {/* You can replace this with an actual thumbnail image */}
                  <div className="absolute inset-0 bg-blue-900 flex items-center justify-center">
                    <img
                      src="/images/video-thumbnail.jpg"
                      alt="Video Demo Thumbnail"
                      className="w-full h-full object-cover opacity-60"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <div className="text-center mb-6">
                        <h3 className="text-2xl md:text-3xl font-bold mb-2">
                          Complete Platform Walkthrough
                        </h3>
                        <p className="text-blue-100">3 minutes • See all features</p>
                      </div>
                      <button
                        onClick={() => setIsPlaying(true)}
                        className="group w-20 h-20 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-2xl"
                      >
                        <Play className="w-10 h-10 text-blue-900 ml-1 group-hover:scale-110 transition-transform" fill="currentColor" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Video Player (iframe for YouTube/Vimeo or video tag for hosted)
                <div className="w-full h-full">
                  {/* YouTube/Vimeo Embed */}
                  <iframe
                    className="w-full h-full"
                    src={`${demoVideoUrl}?autoplay=1`}
                    title="Nyumbanii Product Demo"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>

                  {/* Alternative: Self-hosted video */}
                  {/* <video
                    className="w-full h-full"
                    controls
                    autoPlay
                    src="/videos/nyumbanii-demo.mp4"
                  >
                    Your browser does not support the video tag.
                  </video> */}
                </div>
              )}
            </div>

            {/* Video Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-900">3 min</p>
                <p className="text-sm text-gray-600">Video Duration</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-900">6</p>
                <p className="text-sm text-gray-600">Key Features</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-purple-900">Easy</p>
                <p className="text-sm text-gray-600">Setup Process</p>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              What You'll Learn:
            </h3>
            <ul className="space-y-4">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700 font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 p-6 bg-blue-900 rounded-xl text-white">
              <h4 className="font-bold text-lg mb-2">Ready to Get Started?</h4>
              <p className="text-blue-100 text-sm mb-4">
                Sign up today and get full access to all features during your 14-day free trial.
              </p>
              <button
                onClick={() => window.location.href = '/register'}
                className="w-full bg-white text-blue-900 hover:bg-gray-100 py-3 rounded-lg font-semibold transition-all"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-16 bg-gray-50 rounded-2xl p-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Need a Personalized Demo?
            </h3>
            <p className="text-gray-600">
              Schedule a free 1-on-1 demo with our team to see how Nyumbanii fits your specific needs
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '#contact'}
              className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Book a Live Demo
            </button>
            <button
              onClick={() => window.location.href = '/register'}
              className="bg-white border-2 border-blue-900 text-blue-900 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Try It Yourself
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoDemo;
