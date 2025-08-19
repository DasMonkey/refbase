import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Play, 
  Check, 
  Star, 
  Users, 
  FileText, 
  MessageSquare, 
  Calendar, 
  Bug, 
  Kanban,
  Folder,
  Zap,
  Shield,
  Smartphone,
  ChevronDown,
  Menu,
  X,
  Code,
  GitBranch,
  Terminal,
  Database,
  Cpu,
  Lock
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFAQ, setShowFAQ] = useState<number | null>(null);

  const features = [
    {
      icon: GitBranch,
      title: "Discord-Style Project Navigation",
      description: "Switch between projects instantly with a familiar sidebar interface. Organize complex codebases and feature sets with visual project cards."
    },
    {
      icon: FileText,
      title: "Technical Documentation Hub",
      description: "Create comprehensive PRDs, API docs, and technical specifications. Real-time collaboration with code syntax highlighting and markdown support."
    },
    {
      icon: Kanban,
      title: "Advanced Task Management",
      description: "Sprint planning, story points, and custom workflows. Drag-and-drop kanban boards with developer-focused task tracking and dependencies."
    },
    {
      icon: Bug,
      title: "Integrated Issue Tracking",
      description: "Log bugs with stack traces, reproduction steps, and severity levels. Link directly to code commits and deployment environments."
    },
    {
      icon: Calendar,
      title: "Release Planning Calendar",
      description: "Visualize sprints, releases, and deployment schedules. Integrate with CI/CD pipelines and track milestone dependencies."
    },
    {
      icon: Database,
      title: "Asset & Code Management",
      description: "Version-controlled file storage with code preview. Organize design assets, documentation, and technical artifacts in one place."
    },
    {
      icon: Terminal,
      title: "Real-time Team Communication",
      description: "Slack-style messaging with code snippets, thread discussions, and integration alerts. Keep technical conversations contextual."
    },
    {
      icon: Shield,
      title: "Enterprise Security & Permissions",
      description: "Role-based access control, SSO integration, and audit logs. SOC 2 compliant with granular permission management."
    },
    {
      icon: Cpu,
      title: "API-First Architecture",
      description: "Comprehensive REST API, webhooks, and integrations. Connect with your existing dev tools and automate workflows."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Initialize Project",
      description: "Set up your project structure with templates for different tech stacks and methodologies"
    },
    {
      number: "02", 
      title: "Define Architecture",
      description: "Document technical requirements, API specifications, and system architecture"
    },
    {
      number: "03",
      title: "Execute & Monitor",
      description: "Track development progress, manage issues, and coordinate releases in real-time"
    },
    {
      number: "04",
      title: "Ship & Scale",
      description: "Deploy with confidence using integrated monitoring and post-launch analytics"
    }
  ];

  const testimonials = [
    {
      name: "Alex Chen",
      role: "Senior Engineering Manager at Stripe",
      content: "Finally, a project management tool built for how engineering teams actually work. Cut our planning overhead by 60%.",
      avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Jordan Kim", 
      role: "VP of Engineering at Vercel",
      content: "The Discord-like navigation combined with technical depth is exactly what we needed. Our team velocity increased 3x.",
      avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Sam Rodriguez",
      role: "CTO at Linear",
      content: "Best-in-class developer experience. Integrates seamlessly with our entire tech stack and actually improves our workflow.",
      avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=100&h=100&fit=crop&crop=face"
    }
  ];

  const faqs = [
    {
      question: "How does this compare to Linear, Notion, or Jira?",
      answer: "We combine Linear's speed with Notion's flexibility and Discord's intuitive UX. Unlike traditional tools, we're built specifically for modern engineering teams with real-time collaboration, integrated technical documentation, and developer-first workflows."
    },
    {
      question: "What integrations do you support?",
      answer: "Native integrations with GitHub, GitLab, Slack, Figma, and all major CI/CD tools. Our API-first approach means you can connect any tool in your stack. We also support webhooks and custom automations."
    },
    {
      question: "Is there an API and self-hosted option?",
      answer: "Yes! Comprehensive REST API with rate limiting and authentication. Enterprise customers can deploy on-premise or in their own cloud infrastructure with full data control."
    },
    {
      question: "How do you handle enterprise security requirements?",
      answer: "SOC 2 Type II certified, GDPR compliant, with SSO (SAML/OIDC), audit logs, and granular permissions. We support VPN access, IP whitelisting, and custom security policies for enterprise deployments."
    },
    {
      question: "What's your migration and onboarding process?",
      answer: "Automated migration tools for Jira, Linear, and Notion. Dedicated customer success engineer for enterprise accounts, with custom training sessions and integration support."
    }
  ];

  const handleSignUp = async () => {
    if (!email.trim()) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email,
        password: 'temp-password-' + Math.random().toString(36).substring(7),
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        // For demo purposes, just proceed to dashboard
        onGetStarted();
      } else {
        onGetStarted();
      }
    } catch (error) {
      console.error('Sign up failed:', error);
      // For demo purposes, just proceed to dashboard
      onGetStarted();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-gray-900/95 backdrop-blur-md border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Code size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">ProjectFlow</span>
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">BETA</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How it Works</a>
              <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors">Testimonials</a>
              <a href="#faq" className="text-gray-300 hover:text-white transition-colors">FAQ</a>
              <button
                onClick={onGetStarted}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Get Started
              </button>
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-800 text-gray-300"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-gray-900 border-t border-gray-800"
          >
            <div className="px-4 py-4 space-y-4">
              <a href="#features" className="block text-gray-300 hover:text-white">Features</a>
              <a href="#how-it-works" className="block text-gray-300 hover:text-white">How it Works</a>
              <a href="#testimonials" className="block text-gray-300 hover:text-white">Testimonials</a>
              <a href="#faq" className="block text-gray-300 hover:text-white">FAQ</a>
              <button
                onClick={onGetStarted}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-8">
                <Terminal size={16} className="text-blue-400" />
                <span className="text-blue-400 text-sm font-medium">Built for Engineering Teams</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Project Management
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent block">
                  for Developers
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
                Where Discord Meets Linear
              </p>
              <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
                Ship faster with the only project management tool designed specifically for engineering teams. 
                Real-time collaboration, technical documentation, and developer workflows in one platform.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              <div className="flex items-center space-x-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work email"
                  className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 text-white placeholder-gray-400"
                />
                <button
                  onClick={handleSignUp}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 font-medium"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <>
                      Start Free Trial
                      <ArrowRight size={16} className="ml-2" />
                    </>
                  )}
                </button>
              </div>
              <button
                onClick={onGetStarted}
                className="flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <Play size={16} className="mr-2" />
                View Live Demo
              </button>
            </motion.div>

            {/* App Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
                <div className="bg-gray-900 px-6 py-4 flex items-center space-x-3 border-b border-gray-700">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-gray-400 text-sm font-mono">localhost:3000/dashboard</div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8">
                  <div className="grid grid-cols-12 gap-4 h-96">
                    {/* Sidebar */}
                    <div className="col-span-3 bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-white text-sm">
                          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                            <Code size={12} />
                          </div>
                          <span>API Platform</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-400 text-sm">
                          <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
                            <Smartphone size={12} />
                          </div>
                          <span>Mobile App</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-400 text-sm">
                          <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
                            <Database size={12} />
                          </div>
                          <span>Analytics</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Main Content */}
                    <div className="col-span-9 space-y-4">
                      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white font-medium">Sprint Planning</h3>
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-gray-900 rounded p-3 border border-gray-600">
                            <div className="text-xs text-gray-400 mb-2">TO DO</div>
                            <div className="space-y-2">
                              <div className="bg-blue-600/20 border border-blue-600/30 rounded p-2 text-xs text-blue-300">
                                API Authentication
                              </div>
                              <div className="bg-purple-600/20 border border-purple-600/30 rounded p-2 text-xs text-purple-300">
                                Database Schema
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-900 rounded p-3 border border-gray-600">
                            <div className="text-xs text-gray-400 mb-2">IN PROGRESS</div>
                            <div className="space-y-2">
                              <div className="bg-yellow-600/20 border border-yellow-600/30 rounded p-2 text-xs text-yellow-300">
                                User Dashboard
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-900 rounded p-3 border border-gray-600">
                            <div className="text-xs text-gray-400 mb-2">DONE</div>
                            <div className="space-y-2">
                              <div className="bg-green-600/20 border border-green-600/30 rounded p-2 text-xs text-green-300">
                                Project Setup
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Built for Engineering Excellence</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Every feature designed with developer workflows and technical teams in mind
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-900/50 border border-gray-700 p-6 rounded-xl hover:border-gray-600 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-600/20 border border-blue-600/30 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon size={24} className="text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Engineering-First Workflow</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              From concept to deployment, streamlined for how developers actually work
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4 mx-auto">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">Why Engineering Teams Choose ProjectFlow</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Developer-native experience</h3>
                    <p className="text-gray-400">Built by engineers, for engineers. Familiar patterns and workflows that feel natural.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Zap size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">3x faster sprint planning</h3>
                    <p className="text-gray-400">Streamlined workflows that eliminate overhead and focus on shipping code.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Lock size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Enterprise-grade security</h3>
                    <p className="text-gray-400">SOC 2 compliant with SSO, audit logs, and granular permissions for large teams.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Code size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">API-first architecture</h3>
                    <p className="text-gray-400">Integrate with your entire tech stack. Automate workflows and build custom solutions.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Terminal size={20} className="text-green-400" />
                    <span className="text-white font-mono text-sm">$ npm install @projectflow/cli</span>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm">
                    <div className="text-green-400">✓ Connected to ProjectFlow API</div>
                    <div className="text-blue-400">✓ Syncing with GitHub repository</div>
                    <div className="text-yellow-400">✓ Setting up webhooks</div>
                    <div className="text-purple-400">✓ Ready to ship!</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Trusted by Engineering Leaders</h2>
            <p className="text-xl text-gray-300">Join hundreds of engineering teams shipping faster</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-800 border border-gray-700 p-6 rounded-xl"
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-800/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Technical FAQ</h2>
            <p className="text-xl text-gray-300">Everything engineering teams need to know</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="border border-gray-700 rounded-lg bg-gray-900/50"
              >
                <button
                  onClick={() => setShowFAQ(showFAQ === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                >
                  <span className="font-semibold text-white">{faq.question}</span>
                  <ChevronDown
                    size={20}
                    className={`text-gray-400 transition-transform ${
                      showFAQ === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {showFAQ === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-300">{faq.answer}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Ship Faster?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join engineering teams at top companies who've already made the switch to better project management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onGetStarted}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center"
              >
                Start Free Trial
                <ArrowRight size={20} className="ml-2" />
              </button>
              <p className="text-blue-100 text-sm">No credit card required • 14-day free trial • SOC 2 compliant</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Code size={20} className="text-white" />
                </div>
                <span className="text-xl font-bold">ProjectFlow</span>
              </div>
              <p className="text-gray-400">
                The future of engineering project management. Built by developers, for developers.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Developers</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">SDKs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Webhooks</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ProjectFlow. All rights reserved. SOC 2 Type II Certified.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};