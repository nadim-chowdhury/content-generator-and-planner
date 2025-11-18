'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    category: 'General',
    question: 'What is Content Generator & Planner?',
    answer: 'Content Generator & Planner is an AI-powered platform that helps you create engaging content ideas, plan your content calendar, and optimize your posts for various social media platforms.',
  },
  {
    category: 'General',
    question: 'How does the AI content generation work?',
    answer: 'Our AI uses advanced language models to generate creative content ideas based on your niche, platform, and preferences. Simply provide a topic or keyword, and our AI will create multiple content variations for you.',
  },
  {
    category: 'Pricing',
    question: 'What is included in the Free plan?',
    answer: 'The Free plan includes 5 AI idea generations per day, basic idea management, calendar planner, and CSV export functionality.',
  },
  {
    category: 'Pricing',
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.',
  },
  {
    category: 'Pricing',
    question: 'Do you offer refunds?',
    answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied, contact our support team for a full refund.',
  },
  {
    category: 'Features',
    question: 'Which platforms are supported?',
    answer: 'We support Facebook, Twitter/X, Instagram, Threads, LinkedIn, Reddit, Quora, Pinterest, TikTok, and YouTube.',
  },
  {
    category: 'Features',
    question: 'Can I collaborate with my team?',
    answer: 'Yes! The Agency plan includes team collaboration features, allowing you to invite team members, assign roles, and work together on content planning.',
  },
  {
    category: 'Features',
    question: 'Can I export my content?',
    answer: 'Yes, you can export your ideas to CSV, PDF, Google Sheets, and Notion. Pro and Agency plans have access to all export formats.',
  },
  {
    category: 'Technical',
    question: 'Is my data secure?',
    answer: 'Absolutely. We use industry-standard encryption, secure authentication, and follow GDPR compliance practices to protect your data.',
  },
  {
    category: 'Technical',
    question: 'What languages are supported?',
    answer: 'Our platform supports multiple languages including English, Spanish, French, German, Hindi, Bengali, Arabic, and many more.',
  },
  {
    category: 'Billing',
    question: 'How does billing work?',
    answer: 'Billing is handled securely through Stripe. You can pay monthly or yearly, and all payments are processed automatically.',
  },
  {
    category: 'Billing',
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.',
  },
];

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const categories = ['All', ...Array.from(new Set(faqData.map((item) => item.category)))];

  const filteredFAQs =
    selectedCategory === 'All'
      ? faqData
      : faqData.filter((item) => item.category === selectedCategory);

  const toggleItem = (index: number) => {
    const newOpen = new Set(openItems);
    if (newOpen.has(index)) {
      newOpen.delete(index);
    } else {
      newOpen.add(index);
    }
    setOpenItems(newOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Find answers to common questions about our platform
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map((item, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {item.question}
                  </h3>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                    openItems.has(index) ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openItems.has(index) && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-12 text-center bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Still have questions?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Can't find the answer you're looking for? Please contact our support team.
          </p>
          <a
            href="mailto:support@example.com"
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

