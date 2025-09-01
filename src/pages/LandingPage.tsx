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
  Lock,
  Brain,
  Search,
  Archive,
  RefreshCw,
  Link,
  TrendingUp,
  Settings,
  Bot,
  History,
  Lightbulb,
  Github,
  ExternalLink,
  Package,
  Wrench,
  FileCode,
  Layers,
  LayoutGrid
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
      icon: Brain,
      title: "Enhanced AI Conversation Export",
      description: "Revolutionary automatic extraction of technical implementation details from conversations. Code blocks, tool outputs, error resolution, and implementation approaches captured with zero manual work."
    },
    {
      icon: Search,
      title: "Intelligent Pattern Recognition",
      description: "Extract successful implementation patterns from your conversations. Identify what works, what doesn't, and build a library of proven solutions."
    },
    {
      icon: Archive,
      title: "Conversation Knowledge Base",
      description: "Organize conversations by project, technology, and problem type. Manual import support for existing chat logs with smart categorization."
    },
    {
      icon: TrendingUp,
      title: "Success Pattern Analytics",
      description: "Track which approaches work best for your coding style. Measure implementation success rates and optimize your development process."
    },
    {
      icon: RefreshCw,
      title: "AI Context Feeding",
      description: "Feed relevant patterns and history back to AI assistants. Get smarter suggestions based on your proven successful approaches."
    },
    {
      icon: Link,
      title: "Task & Bug Integration",
      description: "Link conversations to specific bugs and features. Access AI-generated summaries and implementation guidance directly in your project workflow."
    },
    {
      icon: Settings,
      title: "MCP Server Integration",
      description: "Seamless integration with Model Context Protocol (MCP) servers. Real-time capture and sync with your development environment."
    },
    {
      icon: Database,
      title: "Cross-Project Intelligence",
      description: "Learn from patterns across all your projects. Share successful approaches while maintaining clean project organization."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your conversations stay in your account. Encrypted data transfer, API key authentication, and full control over your knowledge base."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Connect Your IDE",
      description: "Install RefBase MCP server and connect to Cursor, Claude Code, or manually import conversations"
    },
    {
      number: "02", 
      title: "Capture Conversations",
      description: "AI conversations are automatically captured with project context, or import your existing chat logs"
    },
    {
      number: "03",
      title: "Extract Patterns",
      description: "RefBase analyzes your conversations to identify successful implementation patterns and solutions"
    },
    {
      number: "04",
      title: "Reuse & Improve",
      description: "Feed relevant patterns back to AI assistants and build upon your proven successful approaches"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Martinez",
      role: "Senior Frontend Developer at Shopify",
      content: "The enhanced export is incredible! RefBase automatically captures every code block, tool output, and error resolution from my AI conversations. No more lost implementation details.",
      avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Marcus Chen", 
      role: "Full Stack Developer at Notion",
      content: "Enhanced export with zero manual work - RefBase automatically captures complete technical context. Every MCP conversation becomes a searchable implementation guide.",
      avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Elena Rodriguez",
      role: "AI Engineer at Anthropic",
      content: "Game-changer! The automatic extraction of errors, fixes, and implementation approaches means every conversation has 10x more value for future AI assistance.",
      avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=100&h=100&fit=crop&crop=face"
    }
  ];

  const faqs = [
    {
      question: "How does RefBase work with my existing AI tools?",
      answer: "RefBase integrates seamlessly with Cursor, Claude Code, and other MCP-compatible IDEs. You can also manually import conversations from ChatGPT, Claude, or any AI assistant. No workflow changes required."
    },
    {
      question: "What makes RefBase different from note-taking apps?",
      answer: "Unlike static note-taking, RefBase actively learns from your conversations. It extracts successful patterns, tracks what works for your coding style, and feeds relevant context back to AI assistants for smarter suggestions."
    },
    {
      question: "Is my conversation data private and secure?",
      answer: "Absolutely. Your data stays in your own Supabase instance with end-to-end encryption. RefBase processes conversations locally and never sends your code or sensitive information to external services."
    },
    {
      question: "How does the MCP server integration work?",
      answer: "Install the RefBase MCP server as an npm package. It connects to your IDE, automatically captures AI conversations with project context, and syncs to your RefBase knowledge base in real-time."
    },
    {
      question: "Can I use RefBase without the MCP server?",
      answer: "Yes! RefBase works great with manual conversation imports. Paste your AI chat logs, upload exported files, or use our browser extension. The MCP integration is just an optional enhancement for automation."
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
              <img 
                src="/refbase-full-logo.png" 
                alt="RefBase Logo" 
                className="h-7 w-auto"
              />
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">BETA</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#mcp-server" className="text-gray-300 hover:text-white transition-colors">MCP Server</a>
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
              <a href="#mcp-server" className="block text-gray-300 hover:text-white">MCP Server</a>
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
              <div className="inline-flex items-center space-x-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-8">
                <Zap size={16} className="text-green-400" />
                <span className="text-green-400 text-sm font-medium">🚀 Enhanced Export Now Live</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Never Lose
                <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent block">
                  AI Implementation Details
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
                Your AI Conversations + Bug Tracking + Project Intelligence
              </p>
              <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
                The complete knowledge management platform for developers. Capture AI conversations with rich technical context, 
                track bugs and solutions, extract reusable patterns, and build cross-project intelligence that grows with your team.
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
                  placeholder="Enter your email to get started"
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

          </div>
        </div>
      </section>


      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Developers Choose RefBase</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              The all-in-one AI knowledge base for modern development teams. Store conversations, track bugs, save features, and feed context to AI - all in one searchable platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-gray-900/50 border border-gray-700 p-6 rounded-xl hover:border-gray-600 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-600/20 border border-blue-600/30 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare size={24} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Store AI Conversations</h3>
              <p className="text-gray-400">
                Never lose valuable AI interactions again. Organize conversations by project, technology, and problem type with automatic categorization and full-text search.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-900/50 border border-gray-700 p-6 rounded-xl hover:border-gray-600 transition-colors"
            >
              <div className="w-12 h-12 bg-green-600/20 border border-green-600/30 rounded-lg flex items-center justify-center mb-4">
                <Brain size={24} className="text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Enhanced Export & Reports</h3>
              <p className="text-gray-400">
                Revolutionary automatic extraction of technical details from conversations. Code blocks, tool outputs, error resolution, and implementation approaches with zero manual work.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gray-900/50 border border-gray-700 p-6 rounded-xl hover:border-gray-600 transition-colors"
            >
              <div className="w-12 h-12 bg-red-600/20 border border-red-600/30 rounded-lg flex items-center justify-center mb-4">
                <Bug size={24} className="text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Bug & Task Integration</h3>
              <p className="text-gray-400">
                Track bugs, symptoms, debugging steps, and proven solutions. Link conversations to specific tasks and features with AI-generated summaries.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-gray-900/50 border border-gray-700 p-6 rounded-xl hover:border-gray-600 transition-colors"
            >
              <div className="w-12 h-12 bg-purple-600/20 border border-purple-600/30 rounded-lg flex items-center justify-center mb-4">
                <RefreshCw size={24} className="text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Smart AI Context Feeding</h3>
              <p className="text-gray-400">
                Feed relevant patterns and history back to AI assistants. Get smarter, context-aware suggestions based on your proven successful approaches.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-gray-900/50 border border-gray-700 p-6 rounded-xl hover:border-gray-600 transition-colors"
            >
              <div className="w-12 h-12 bg-yellow-600/20 border border-yellow-600/30 rounded-lg flex items-center justify-center mb-4">
                <Search size={24} className="text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Pattern Recognition</h3>
              <p className="text-gray-400">
                Extract successful implementation patterns from your conversations. Identify what works, what doesn't, and build a library of proven solutions.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true }}
              className="bg-gray-900/50 border border-gray-700 p-6 rounded-xl hover:border-gray-600 transition-colors"
            >
              <div className="w-12 h-12 bg-cyan-600/20 border border-cyan-600/30 rounded-lg flex items-center justify-center mb-4">
                <Database size={24} className="text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Cross-Project Intelligence</h3>
              <p className="text-gray-400">
                Learn from patterns across all your projects. Share successful approaches while maintaining clean project organization and searchable knowledge.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              viewport={{ once: true }}
              className="bg-gray-900/50 border border-gray-700 p-6 rounded-xl hover:border-gray-600 transition-colors"
            >
              <div className="w-12 h-12 bg-orange-600/20 border border-orange-600/30 rounded-lg flex items-center justify-center mb-4">
                <Settings size={24} className="text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">MCP Server Integration</h3>
              <p className="text-gray-400">
                Seamless integration with Model Context Protocol servers. Real-time capture and sync with Cursor, Claude Code, and your development environment.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              viewport={{ once: true }}
              className="bg-gray-900/50 border border-gray-700 p-6 rounded-xl hover:border-gray-600 transition-colors"
            >
              <div className="w-12 h-12 bg-emerald-600/20 border border-emerald-600/30 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp size={24} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Success Analytics</h3>
              <p className="text-gray-400">
                Track which approaches work best for your coding style. Measure implementation success rates and optimize your development process over time.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              viewport={{ once: true }}
              className="bg-gray-900/50 border border-gray-700 p-6 rounded-xl hover:border-gray-600 transition-colors"
            >
              <div className="w-12 h-12 bg-pink-600/20 border border-pink-600/30 rounded-lg flex items-center justify-center mb-4">
                <Shield size={24} className="text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Secure & Private</h3>
              <p className="text-gray-400">
                Your conversations stay in your account. Encrypted data transfer, API key authentication, and full control over your private knowledge base.
              </p>
            </motion.div>
          </div>
        </div>
      </section>


      {/* MCP Server Detailed Section */}
      <section id="mcp-server" className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-6">
              <Package size={16} className="text-purple-400" />
              <span className="text-purple-400 text-sm font-medium">MCP Server Tools</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">RefBase MCP Server</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              8 powerful API endpoints that enable AI assistants to seamlessly save and search your development knowledge. 
              Ready for Cursor, Claude Code, and any MCP-compatible IDE.
            </p>
            
            {/* GitHub Button */}
            <div className="flex flex-col items-center space-y-2">
              <a
                href="https://github.com/DasMonkey/refbase-mcp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Github size={20} />
                <span>View on GitHub</span>
                <ExternalLink size={16} />
              </a>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Star size={14} className="text-yellow-400" />
                  <span>Star the repo</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Bug size={14} className="text-green-400" />
                  <span>Report issues</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Wrench size={14} className="text-blue-400" />
                  <span>Contribute features</span>
                </div>
              </div>
            </div>
          </div>

          {/* API Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-600/20 border border-blue-600/30 rounded-lg flex items-center justify-center">
                  <MessageSquare size={20} className="text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Conversations API</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">POST /api/conversations</div>
                  <div className="text-white text-sm">Save AI conversations with messages, tags, and project context</div>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">GET /api/conversations</div>
                  <div className="text-white text-sm">Search conversations by query, tags, or project filters</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-400">
                Perfect for: Automatic chat history capture, solution knowledge base, pattern recognition
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-600/20 border border-red-600/30 rounded-lg flex items-center justify-center">
                  <Bug size={20} className="text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Bugs API</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">POST /api/bugs</div>
                  <div className="text-white text-sm">Save bug reports with symptoms, reproduction steps, and solutions</div>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">GET /api/bugs</div>
                  <div className="text-white text-sm">Search bugs by status, severity, symptoms, or resolution patterns</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-400">
                Perfect for: Issue tracking, debugging patterns, solution reuse, error prevention
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-600/20 border border-green-600/30 rounded-lg flex items-center justify-center">
                  <Layers size={20} className="text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Features API</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">POST /api/features</div>
                  <div className="text-white text-sm">Save feature implementations with code examples and tech stack</div>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">GET /api/features</div>
                  <div className="text-white text-sm">Search features by tech stack, implementation patterns, or complexity</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-400">
                Perfect for: Implementation patterns, architecture decisions, feature reuse, tech stack optimization
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-600/20 border border-purple-600/30 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Documents API</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">POST /api/documents</div>
                  <div className="text-white text-sm">Save documentation with content type, language, and framework tags</div>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">GET /api/documents</div>
                  <div className="text-white text-sm">Search docs by type, framework, language, or content keywords</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-400">
                Perfect for: Technical documentation, API specs, code snippets, configuration files
              </div>
            </motion.div>
          </div>



          {/* GitHub CTA */}
          <div className="text-center">
            <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-purple-500/20 rounded-2xl p-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Github size={32} className="text-purple-400" />
                <h3 className="text-2xl font-bold text-white">Open Source MCP Server</h3>
              </div>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Get the RefBase MCP server, contribute to development, or customize it for your needs. 
                Production-ready with comprehensive documentation and examples.
              </p>
              <a
                href="https://github.com/DasMonkey/refbase-mcp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Github size={20} />
                <span>View on GitHub</span>
                <ExternalLink size={16} />
              </a>
              <div className="mt-4 text-sm text-gray-400">
                ⭐ Star the repo • 🐛 Report issues • 🔧 Contribute features
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Export Highlight Section */}
      <section className="py-20 bg-gradient-to-br from-green-900/20 to-blue-900/20 border-y border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center space-x-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2 mb-6">
                <Lightbulb size={16} className="text-green-400" />
                <span className="text-green-400 text-sm font-medium">Game-Changing Enhancement</span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">10x More Value from Every AI Conversation</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Enhanced export captures complete technical context + MCP searches past conversations to provide AI with similar issue solutions for lightning-fast fixes
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="space-y-6">
                <div className="bg-gray-900/50 border border-green-500/20 p-6 rounded-xl">
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                    <FileCode size={20} className="text-green-400 mr-2" />
                    Before: Basic Dialogue
                  </h3>
                  <div className="bg-gray-800 p-4 rounded-lg font-mono text-sm text-gray-400">
                    User: My React app crashes with "Cannot read properties of undefined" when users upload large files. The progress bar shows but then everything freezes.<br/>
                    Assistant: This could be a memory issue. Try adding some error handling and chunking the file upload...
                  </div>
                  <p className="text-red-400 text-sm mt-2">❌ Missing implementation details, specific error context, and proven solution patterns</p>
                </div>

                <div className="bg-gray-900/50 border border-green-500/30 p-6 rounded-xl">
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                    <Zap size={20} className="text-green-400 mr-2" />
                    After: Enhanced Export
                  </h3>
                  <div className="bg-gray-800 p-4 rounded-lg font-mono text-sm">
                    <div className="text-gray-400">User: My React app crashes with "Cannot read properties of undefined" when users upload large files...</div>
                    <div className="text-cyan-400 text-xs mt-1">🔍 MCP: Searched 127 conversations, found FileUpload memory issue from Project Alpha with working solution</div>
                    <div className="text-gray-400 mt-2">Assistant: I found this exact issue in your previous project! The problem was file reader memory leaks. Here's the proven fix...</div>
                    <div className="text-red-400 mt-2">❌ **Errors Encountered:**</div>
                    <div className="text-red-400">Memory leak in FileReader, undefined reference in progress callback</div>
                    <div className="text-blue-400 mt-2">🔧 **Fixes Applied:**</div>
                    <div className="text-blue-400">Added FileReader cleanup, implemented chunk-based processing, fixed null checks</div>
                    <div className="text-purple-400 mt-2">📁 **Files Modified:**</div>
                    <div className="text-purple-400">src/components/FileUpload.tsx, src/utils/fileProcessor.js</div>
                    <div className="text-green-400 mt-2">💡 **Implementation Pattern:**</div>
                    <div className="text-green-400">Chunked upload with Web Workers (proven successful in 3 past projects)</div>
                  </div>
                  <p className="text-green-400 text-sm mt-2">✅ Complete technical context + intelligent past solution discovery = lightning-fast fixes</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="bg-gray-900/50 border border-green-500/20 p-8 rounded-xl">
                <h3 className="text-2xl font-bold text-white mb-6">Automatic Enhancement Features</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Code Block Preservation</h4>
                      <p className="text-gray-400 text-sm">Complete TypeScript/JavaScript syntax with line numbers</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Tool Operation Tracking</h4>
                      <p className="text-gray-400 text-sm">Edit, Read, Bash commands with success indicators</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Error Resolution Context</h4>
                      <p className="text-gray-400 text-sm">Errors encountered, fixes applied, debugging steps</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Implementation Approaches</h4>
                      <p className="text-gray-400 text-sm">Decision-making context and solution strategies</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Auto-Generated Tags</h4>
                      <p className="text-gray-400 text-sm">lang-typescript, error-resolution, code-implementation</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Search size={14} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">MCP Context Feeding</h4>
                      <p className="text-gray-400 text-sm">AI searches past conversations for similar issues and proven solutions</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-blue-400 text-sm font-medium">🧠 Intelligent Context Workflow</p>
                  <p className="text-gray-400 text-xs mt-1">AI searches your preserved conversations → finds similar issues → provides proven solutions → faster fixes every time</p>
                </div>
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-yellow-400 text-sm font-medium">💡 Pro Tip: Maximum Export Quality</p>
                  <p className="text-gray-400 text-xs mt-1">Ask AI to <strong>summarize your work into a technical report first</strong>, then export that comprehensive summary. This captures far more implementation details and context than exporting raw conversations!</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How RefBase Transforms Your AI Workflow</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              From conversation capture to intelligent pattern reuse - build your personal AI knowledge base
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
              <h2 className="text-4xl font-bold text-white mb-6">Complete Project Management Platform</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <FileText size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Project Documentation Hub</h3>
                    <p className="text-gray-400">Store PRDs, technical specs, and team documentation in one searchable location.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <LayoutGrid size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Kanban Task Management</h3>
                    <p className="text-gray-400">Visual task boards with customizable workflows for agile development teams.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Calendar size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Project Calendar & Timeline</h3>
                    <p className="text-gray-400">Track milestones, deadlines, and project progress with integrated calendar views.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Users size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Team Collaboration</h3>
                    <p className="text-gray-400">Real-time updates, comments, and notifications keep everyone aligned and productive.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <LayoutGrid size={20} className="text-blue-400" />
                    <span className="text-white font-mono text-sm">Project Dashboard</span>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm">
                    <div className="text-green-400">✓ Documentation organized and searchable</div>
                    <div className="text-blue-400">✓ Tasks moving through workflow stages</div>
                    <div className="text-yellow-400">✓ Calendar tracking project milestones</div>
                    <div className="text-purple-400">✓ Team collaboration in real-time!</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-800/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-300">Everything you need to know about RefBase</p>
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
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Never Lose AI Insights Again?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join developers who are building smarter with AI conversation knowledge that compounds over time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onGetStarted}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center"
              >
                Start Free Trial
                <ArrowRight size={20} className="ml-2" />
              </button>
              <p className="text-blue-100 text-sm">Free to start • Open source • Your data stays private</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <img 
                  src="/refbase_logo.png" 
                  alt="RefBase Logo" 
                  className="h-10 w-auto"
                />
              </div>
              <p className="text-gray-400">
                Transform your AI conversations into lasting knowledge. Built by developers who never want to ask the same question twice.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">MCP Integration</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pattern Library</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AI Context</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Developers</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">MCP Server Guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">IDE Integrations</a></li>
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
            <p>&copy; 2025 RefBase. All rights reserved. Privacy-first AI knowledge management.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};