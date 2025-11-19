"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, ChevronDown, Mail, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    category: "General",
    question: "What is GenPlan?",
    answer:
      "GenPlan is an AI-powered platform that helps you create engaging content ideas, plan your content calendar, and optimize your posts for various social media platforms.",
  },
  {
    category: "General",
    question: "How does the AI content generation work?",
    answer:
      "Our AI uses advanced language models to generate creative content ideas based on your niche, platform, and preferences. Simply provide a topic or keyword, and our AI will create multiple content variations for you.",
  },
  {
    category: "Pricing",
    question: "What is included in the Free plan?",
    answer:
      "The Free plan includes 5 AI idea generations per day, basic idea management, calendar planner, and CSV export functionality.",
  },
  {
    category: "Pricing",
    question: "Can I upgrade or downgrade my plan?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.",
  },
  {
    category: "Pricing",
    question: "Do you offer refunds?",
    answer:
      "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team for a full refund.",
  },
  {
    category: "Features",
    question: "Which platforms are supported?",
    answer:
      "We support Facebook, Twitter/X, Instagram, Threads, LinkedIn, Reddit, Quora, Pinterest, TikTok, and YouTube.",
  },
  {
    category: "Features",
    question: "Can I collaborate with my team?",
    answer:
      "Yes! The Agency plan includes team collaboration features, allowing you to invite team members, assign roles, and work together on content planning.",
  },
  {
    category: "Features",
    question: "Can I export my content?",
    answer:
      "Yes, you can export your ideas to CSV, PDF, Google Sheets, and Notion. Pro and Agency plans have access to all export formats.",
  },
  {
    category: "Technical",
    question: "Is my data secure?",
    answer:
      "Absolutely. We use industry-standard encryption, secure authentication, and follow GDPR compliance practices to protect your data.",
  },
  {
    category: "Technical",
    question: "What languages are supported?",
    answer:
      "Our platform supports multiple languages including English, Spanish, French, German, Hindi, Bengali, Arabic, and many more.",
  },
  {
    category: "Billing",
    question: "How does billing work?",
    answer:
      "Billing is handled securely through Stripe. You can pay monthly or yearly, and all payments are processed automatically.",
  },
  {
    category: "Billing",
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.",
  },
];

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const categories = [
    "All",
    ...Array.from(new Set(faqData.map((item) => item.category))),
  ];

  const filteredFAQs =
    selectedCategory === "All"
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">
              Frequently Asked Questions
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Find answers to common questions about GenPlan
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map((item, index) => (
            <Card key={index} className="overflow-hidden">
              <button
                onClick={() => toggleItem(index)}
                className="w-full text-left"
              >
                <CardHeader className="hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{item.question}</CardTitle>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-muted-foreground transition-transform shrink-0",
                        openItems.has(index) && "transform rotate-180"
                      )}
                    />
                  </div>
                </CardHeader>
              </button>
              {openItems.has(index) && (
                <CardContent className="pt-0">
                  <p className="text-muted-foreground leading-relaxed">
                    {item.answer}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Contact Support */}
        <Card className="mt-12 bg-primary/5">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Still have questions?</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Can't find the answer you're looking for? Please contact our
              support team.
            </p>
            <Button asChild>
              <Link href="/help">
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
