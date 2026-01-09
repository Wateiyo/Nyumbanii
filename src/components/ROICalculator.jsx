import React, { useState } from 'react';
import { Calculator, TrendingUp, Clock, DollarSign, CheckCircle } from 'lucide-react';

const ROICalculator = () => {
  const [properties, setProperties] = useState(5);
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [hourlyRate, setHourlyRate] = useState(500);

  // Calculations
  const monthlyHours = hoursPerWeek * 4;
  const timeSavedPercentage = 75; // Nyumbanii saves 75% of admin time
  const hoursSaved = (monthlyHours * timeSavedPercentage) / 100;
  const moneySaved = hoursSaved * hourlyRate;
  const yearlyMoneySaved = moneySaved * 12;

  // Cost of Nyumbanii (based on pricing tiers)
  const getNyumbaaniCost = () => {
    if (properties <= 5) return 2999;
    if (properties <= 20) return 5999;
    if (properties <= 50) return 9999;
    return 14999;
  };

  const nyumbaaniMonthlyCost = getNyumbaaniCost();
  const netMonthlySavings = moneySaved - nyumbaaniMonthlyCost;
  const netYearlySavings = netMonthlySavings * 12;
  const roi = ((netYearlySavings / (nyumbaaniMonthlyCost * 12)) * 100).toFixed(0);

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-900 px-4 py-2 rounded-full font-semibold mb-4">
            <Calculator className="w-5 h-5" />
            ROI Calculator
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Calculate Your Savings with Nyumbanii
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See how much time and money you can save by automating your property management
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Input Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Current Situation</h3>

            <div className="space-y-8">
              {/* Number of Properties */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Number of Properties You Manage
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={properties}
                  onChange={(e) => setProperties(parseInt(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-900"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">1</span>
                  <span className="text-3xl font-bold text-blue-900">{properties}</span>
                  <span className="text-sm text-gray-500">100+</span>
                </div>
              </div>

              {/* Hours per Week */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Hours Spent on Property Management Per Week
                </label>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(parseInt(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-900"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">1 hr</span>
                  <span className="text-3xl font-bold text-blue-900">{hoursPerWeek} hrs</span>
                  <span className="text-sm text-gray-500">40+ hrs</span>
                </div>
              </div>

              {/* Hourly Rate */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Your Time Value (KES per hour)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                    KES
                  </span>
                  <input
                    type="number"
                    min="100"
                    max="5000"
                    step="100"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(parseInt(e.target.value) || 500)}
                    className="w-full pl-16 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-900 focus:outline-none text-2xl font-bold text-blue-900"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Estimate based on your salary or what you'd pay someone to manage properties
                </p>
              </div>
            </div>

            {/* What gets automated */}
            <div className="mt-8 p-6 bg-blue-50 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-3">Tasks Nyumbanii Automates:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Rent collection & payment tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Maintenance request management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Tenant communication & notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Document storage & organization</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Property listings & viewing bookings</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right: Results Section */}
          <div className="space-y-6">
            {/* Main Results Card */}
            <div className="bg-blue-900 text-white rounded-2xl shadow-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-7 h-7" />
                Your Potential Savings
              </h3>

              <div className="space-y-3">
                {/* Time Saved */}
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs text-blue-100">Time Saved Per Month</span>
                  </div>
                  <p className="text-2xl font-bold">{hoursSaved.toFixed(0)} hours</p>
                  <p className="text-xs text-blue-200 mt-0.5">
                    {(hoursSaved / 8).toFixed(1)} work days back!
                  </p>
                </div>

                {/* Money Saved */}
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs text-blue-100">Cost Savings Per Month</span>
                  </div>
                  <p className="text-2xl font-bold">KES {moneySaved.toLocaleString()}</p>
                  <p className="text-xs text-blue-200 mt-0.5">
                    KES {yearlyMoneySaved.toLocaleString()} per year
                  </p>
                </div>

                {/* Net Savings */}
                <div className="bg-white rounded-lg p-3 text-gray-900">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Nyumbanii Cost</p>
                      <p className="text-base font-bold text-gray-700">
                        KES {nyumbaaniMonthlyCost.toLocaleString()}/mo
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 mb-0.5">Net Monthly Savings</p>
                      <p className="text-base font-bold text-green-600">
                        KES {netMonthlySavings.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="border-t pt-2">
                    <p className="text-xs text-gray-600 mb-0.5">Total Net Savings (First Year)</p>
                    <p className="text-xl font-bold text-green-600">
                      KES {netYearlySavings.toLocaleString()}
                    </p>
                    <div className="mt-1.5 inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                      <TrendingUp className="w-3 h-3" />
                      {roi}% ROI
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Benefits */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="font-bold text-gray-900 mb-4">Beyond the Numbers:</h4>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Improved tenant satisfaction</strong> with faster response times</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Better decision-making</strong> with real-time analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Professional image</strong> for your property business</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Scale your portfolio</strong> without adding staff</span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <button
              onClick={() => window.location.href = '/register'}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white py-4 rounded-lg font-semibold text-lg transition-all"
            >
              Start Your 14-Day Free Trial
            </button>
            <p className="text-center text-sm text-gray-500">
              No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ROICalculator;
