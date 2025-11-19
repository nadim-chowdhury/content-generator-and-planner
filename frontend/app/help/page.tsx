'use client';

import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Rocket, 
  Brain, 
  CreditCard, 
  Wrench,
  Mail,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Help Center</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Find answers to common questions and learn how to use GenPlan
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="w-5 h-5 text-primary" />
                <CardTitle>Getting Started</CardTitle>
              </div>
              <CardDescription>
                Learn the basics of using GenPlan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>
                  <Link href="#getting-started" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Creating your account
                  </Link>
                </li>
                <li>
                  <Link href="#first-idea" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Generating your first idea
                  </Link>
                </li>
                <li>
                  <Link href="#planner" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Using the planner
                  </Link>
                </li>
                <li>
                  <Link href="#teams" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Setting up teams
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-primary" />
                <CardTitle>AI Features</CardTitle>
              </div>
              <CardDescription>
                Master our AI-powered tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>
                  <Link href="#ai-generation" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    AI idea generation
                  </Link>
                </li>
                <li>
                  <Link href="#viral-score" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Viral score prediction
                  </Link>
                </li>
                <li>
                  <Link href="#ai-tools" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    AI tools overview
                  </Link>
                </li>
                <li>
                  <Link href="#quotas" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Understanding quotas
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <CardTitle>Billing & Plans</CardTitle>
              </div>
              <CardDescription>
                Manage your subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>
                  <Link href="#pricing" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Pricing plans
                  </Link>
                </li>
                <li>
                  <Link href="#subscription" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Managing subscriptions
                  </Link>
                </li>
                <li>
                  <Link href="#trial" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Free trial
                  </Link>
                </li>
                <li>
                  <Link href="#refunds" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Refunds & cancellations
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-5 h-5 text-primary" />
                <CardTitle>Troubleshooting</CardTitle>
              </div>
              <CardDescription>
                Solve common issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>
                  <Link href="#login-issues" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Login problems
                  </Link>
                </li>
                <li>
                  <Link href="#email-verification" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Email verification
                  </Link>
                </li>
                <li>
                  <Link href="#api-errors" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    API errors
                  </Link>
                </li>
                <li>
                  <Link href="#contact" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Contact support
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <section id="getting-started" className="mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-6">Getting Started</h2>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Creating Your Account</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-3">
                <li>Click "Sign Up" on the homepage</li>
                <li>Enter your email address and create a password</li>
                <li>Verify your email address (check your inbox)</li>
                <li>Complete your profile setup</li>
                <li>Start generating content ideas!</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Generating Your First Idea</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-3">
                <li>Navigate to the "Ideas" section</li>
                <li>Click "Generate Ideas"</li>
                <li>Select your niche, platform, and tone</li>
                <li>Choose the number of ideas (10-30)</li>
                <li>Click "Generate" and wait for AI to create your ideas</li>
                <li>Review and save your favorite ideas</li>
              </ol>
            </CardContent>
          </Card>
        </section>

        <section id="ai-generation" className="mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-6">AI Features</h2>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>AI Idea Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Our AI-powered generator creates unique content ideas tailored to your niche and platform. Each idea includes:
              </p>
              <ul className="space-y-2">
                {['Engaging title and description', 'Platform-specific optimization', 'Viral score prediction (0-100)', 'Hashtag suggestions', 'Caption and script options'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Understanding Quotas</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Free plan users can generate 5 ideas per day. Quotas reset daily at midnight UTC. Pro plan users have unlimited generation.
              </p>
            </CardContent>
          </Card>
        </section>

        <section id="pricing" className="mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-6">Billing & Plans</h2>
          <Card>
            <CardHeader>
              <CardTitle>Pricing Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <strong>Free:</strong> 5 ideas per day, basic features
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <strong>Pro:</strong> Unlimited ideas, all AI tools, team collaboration
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <strong>Agency:</strong> Everything in Pro, plus multiple workspaces, priority support
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section id="contact" className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Need More Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                If you can't find the answer you're looking for, our support team is here to help.
              </p>
              <ul className="space-y-2 mb-6">
                <li>Email: support@genplan.com</li>
                <li>Response time: Within 24 hours</li>
                <li>Pro users: Priority support with faster response times</li>
              </ul>
              <Button asChild>
                <Link href="/faq">View FAQ</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
