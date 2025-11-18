'use client';

import { useEffect, useState } from 'react';
import { billingApi, PlansResponse, PlanType } from '@/lib/billing';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const [plans, setPlans] = useState<PlansResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [lifetimeKey, setLifetimeKey] = useState('');
  const [lifetimeLoading, setLifetimeLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponValid, setCouponValid] = useState<any>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await billingApi.getPlans();
      setPlans(data);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (planType: PlanType) => {
    try {
      setCheckoutLoading(planType);
      const { url } = await billingApi.createCheckout(planType, couponValid?.id || couponCode || undefined);
      window.location.href = url;
    } catch (err: any) {
      console.error('Failed to create checkout:', err);
      alert(err.response?.data?.message || 'Failed to create checkout session');
      setCheckoutLoading(null);
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      alert('Please enter a coupon code');
      return;
    }

    try {
      setValidatingCoupon(true);
      const validation = await billingApi.validateCoupon(couponCode);
      setCouponValid(validation);
      alert(`Coupon "${validation.name || couponCode}" is valid! ${validation.percentOff ? `${validation.percentOff}% off` : ''}`);
    } catch (err: any) {
      setCouponValid(null);
      alert(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleActivateLifetime = async () => {
    if (!lifetimeKey.trim()) {
      alert('Please enter a license key');
      return;
    }

    try {
      setLifetimeLoading(true);
      await billingApi.activateLifetime(lifetimeKey);
      alert('Lifetime deal activated successfully!');
      setLifetimeKey('');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Failed to activate lifetime deal:', err);
      alert(err.response?.data?.message || 'Failed to activate lifetime deal');
    } finally {
      setLifetimeLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isCurrentPlan = (plan: string) => {
    return user?.plan === plan;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading plans...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!plans) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-red-600 dark:text-red-400">Failed to load plans</div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
              Select the perfect plan for your content creation needs
            </p>
            
            {/* Coupon Code Input */}
            <div className="max-w-md mx-auto mb-8">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                />
                <button
                  onClick={handleValidateCoupon}
                  disabled={validatingCoupon || !couponCode.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {validatingCoupon ? 'Validating...' : 'Apply'}
                </button>
              </div>
              {couponValid && (
                <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                  ✓ Coupon "{couponValid.name || couponCode}" applied! {couponValid.percentOff ? `${couponValid.percentOff}% off` : ''}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Free Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plans.free.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(plans.free.price)}
                  </span>
                </div>
                {isCurrentPlan(plans.free.plan) && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                      Current Plan
                    </span>
                  </div>
                )}
                <ul className="text-left space-y-3 mb-6">
                  {plans.free.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  disabled={isCurrentPlan(plans.free.plan)}
                  className={`w-full py-2 px-4 rounded-md font-medium ${
                    isCurrentPlan(plans.free.plan)
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {isCurrentPlan(plans.free.plan) ? 'Current Plan' : 'Get Started'}
                </button>
              </div>
            </div>

            {/* Pro Monthly */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-indigo-500 relative">
              {plans.proMonthly.planType && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white px-3 py-1 rounded-bl-lg text-sm font-medium">
                  Popular
                </div>
              )}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plans.proMonthly.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(plans.proMonthly.price)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">/{plans.proMonthly.interval}</span>
                </div>
                {isCurrentPlan(plans.proMonthly.plan) && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                      Current Plan
                    </span>
                  </div>
                )}
                <ul className="text-left space-y-3 mb-6">
                  {plans.proMonthly.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => plans.proMonthly.planType && handleCheckout(plans.proMonthly.planType)}
                  disabled={isCurrentPlan(plans.proMonthly.plan) || checkoutLoading === plans.proMonthly.planType}
                  className={`w-full py-2 px-4 rounded-md font-medium ${
                    isCurrentPlan(plans.proMonthly.plan)
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {checkoutLoading === plans.proMonthly.planType
                    ? 'Processing...'
                    : isCurrentPlan(plans.proMonthly.plan)
                    ? 'Current Plan'
                    : 'Subscribe'}
                </button>
              </div>
            </div>

            {/* Pro Yearly */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700 relative">
              {plans.proYearly.savings && (
                <div className="absolute top-0 right-0 bg-green-600 text-white px-3 py-1 rounded-bl-lg text-sm font-medium">
                  {plans.proYearly.savings}
                </div>
              )}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plans.proYearly.name}</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(plans.proYearly.price)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">/{plans.proYearly.interval}</span>
                </div>
                {plans.proYearly.pricePerMonth && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {formatPrice(plans.proYearly.pricePerMonth)}/month
                  </div>
                )}
                {isCurrentPlan(plans.proYearly.plan) && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                      Current Plan
                    </span>
                  </div>
                )}
                <ul className="text-left space-y-3 mb-6">
                  {plans.proYearly.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => plans.proYearly.planType && handleCheckout(plans.proYearly.planType)}
                  disabled={isCurrentPlan(plans.proYearly.plan) || checkoutLoading === plans.proYearly.planType}
                  className={`w-full py-2 px-4 rounded-md font-medium ${
                    isCurrentPlan(plans.proYearly.plan)
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {checkoutLoading === plans.proYearly.planType
                    ? 'Processing...'
                    : isCurrentPlan(plans.proYearly.plan)
                    ? 'Current Plan'
                    : 'Subscribe'}
                </button>
              </div>
            </div>

            {/* Agency */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-purple-500">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plans.agency.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(plans.agency.price)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">/{plans.agency.interval}</span>
                </div>
                {isCurrentPlan(plans.agency.plan) && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                      Current Plan
                    </span>
                  </div>
                )}
                <ul className="text-left space-y-3 mb-6">
                  {plans.agency.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => plans.agency.planType && handleCheckout(plans.agency.planType)}
                  disabled={isCurrentPlan(plans.agency.plan) || checkoutLoading === plans.agency.planType}
                  className={`w-full py-2 px-4 rounded-md font-medium ${
                    isCurrentPlan(plans.agency.plan)
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {checkoutLoading === plans.agency.planType
                    ? 'Processing...'
                    : isCurrentPlan(plans.agency.plan)
                    ? 'Current Plan'
                    : 'Subscribe'}
                </button>
              </div>
            </div>
          </div>

          {/* Lifetime Deal Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold mb-2">{plans.lifetime.name}</h2>
                <div className="text-5xl font-bold mb-2">{formatPrice(plans.lifetime.price)}</div>
                <p className="text-indigo-100 mb-4">{plans.lifetime.note}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-3">Features:</h3>
                  <ul className="space-y-2">
                    {plans.lifetime.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <svg className="w-5 h-5 text-green-300 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Activate Your License:</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={lifetimeKey}
                      onChange={(e) => setLifetimeKey(e.target.value)}
                      placeholder="Enter your AppSumo license key"
                      className="w-full px-4 py-2 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                    />
                    <button
                      onClick={handleActivateLifetime}
                      disabled={lifetimeLoading || !lifetimeKey.trim()}
                      className="w-full bg-white text-indigo-600 py-2 px-4 rounded-md font-medium hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {lifetimeLoading ? 'Activating...' : 'Activate License'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

