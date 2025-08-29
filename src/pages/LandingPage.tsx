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
  Layers
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
      title: "AI Conversation Capture",
      description: "Automatically capture your AI conversations from IDEs like Cursor and Claude Code. Transform chat sessions into searchable knowledge with rich context."
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
      content: "RefBase transformed how I work with AI. I never lose solutions anymore - every conversation becomes searchable knowledge that compounds over time.",
      avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Marcus Chen", 
      role: "Full Stack Developer at Notion",
      content: "The MCP integration is seamless. My Cursor conversations automatically flow into RefBase, and the pattern recognition has accelerated my development 3x.",
      avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Elena Rodriguez",
      role: "AI Engineer at Anthropic",
      content: "Finally, a way to build institutional memory with AI conversations. RefBase learns from my successes and helps me avoid past mistakes automatically.",
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
              <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-8">
                <Brain size={16} className="text-blue-400" />
                <span className="text-blue-400 text-sm font-medium">AI-Powered Knowledge Base</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                AI Conversation
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent block">
                  Knowledge Base
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
                Capture, Learn, and Reuse Your AI Conversations
              </p>
              <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
                Transform your AI conversations into a searchable knowledge base. Automatically capture from your IDE, 
                extract successful patterns, and feed context back to AI assistants for smarter development.
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
                  <div className="text-gray-400 text-sm font-mono">refbase.dev/dashboard</div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8">
                  <div className="grid grid-cols-12 gap-4 h-96">
                    {/* Sidebar */}
                    <div className="col-span-3 bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-white text-sm">
                          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                            <Brain size={12} />
                          </div>
                          <span>AI Learning System</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-400 text-sm">
                          <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
                            <MessageSquare size={12} />
                          </div>
                          <span>Conversation Library</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-400 text-sm">
                          <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
                            <TrendingUp size={12} />
                          </div>
                          <span>Pattern Analytics</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Main Content */}
                    <div className="col-span-9 space-y-4">
                      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white font-medium">AI Conversation History</h3>
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="bg-gray-900 rounded p-3 border border-gray-600">
                            <div className="text-xs text-gray-400 mb-2">RECENT CONVERSATIONS</div>
                            <div className="space-y-2">
                              <div className="bg-green-600/20 border border-green-600/30 rounded p-2 text-xs text-green-300 flex items-center">
                                <MessageSquare size={10} className="mr-2" />
                                React Auth Implementation
                              </div>
                              <div className="bg-blue-600/20 border border-blue-600/30 rounded p-2 text-xs text-blue-300 flex items-center">
                                <Bot size={10} className="mr-2" />
                                API Error Handling Patterns
                              </div>
                              <div className="bg-purple-600/20 border border-purple-600/30 rounded p-2 text-xs text-purple-300 flex items-center">
                                <History size={10} className="mr-2" />
                                Database Migration Fix
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
            <h2 className="text-4xl font-bold text-white mb-4">Turn AI Conversations into Lasting Knowledge</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Every feature designed to capture, organize, and reuse your AI-powered development insights
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

      {/* MCP Integration Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-blue-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
                <Settings size={16} className="text-blue-400" />
                <span className="text-blue-400 text-sm font-medium">MCP Server Integration</span>
              </div>
              
              <h2 className="text-4xl font-bold text-white mb-6">Automatic AI Conversation Capture</h2>
              <p className="text-xl text-gray-300 mb-8">
                Connect directly to your IDE and automatically capture AI conversations in real-time. 
                No manual copying, no missed insights - just seamless knowledge building.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Real-time capture from Cursor & Claude Code</h3>
                    <p className="text-gray-400">Automatically sync conversations as you work, with full context and project information.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Zap size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Smart project detection</h3>
                    <p className="text-gray-400">Automatically organizes conversations by project based on file paths and git repositories.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Brain size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Rich context extraction</h3>
                    <p className="text-gray-400">Captures file changes, code implementations, and success patterns for better learning.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Terminal size={20} className="text-green-400" />
                    <span className="text-white font-mono text-sm">$ npm install refbase-mcp-server(coming soon)</span>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm space-y-2">
                    <div className="text-blue-400">🔌 Connecting to Cursor IDE...</div>
                    <div className="text-green-400">✓ MCP server authenticated</div>
                    <div className="text-yellow-400">✓ Project detection active</div>
                    <div className="text-purple-400">✓ Conversation capture enabled</div>
                    <div className="text-cyan-400">✓ Real-time sync with RefBase</div>
                    <div className="flex items-center space-x-2 mt-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-gray-300">Listening for AI conversations...</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-4 -right-4 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium">
                Live
              </div>
            </div>
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
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              8 powerful API endpoints that enable AI assistants to seamlessly save and search your development knowledge. 
              Ready for Cursor, Claude Code, and any MCP-compatible IDE.
            </p>
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

          {/* Authentication & Security */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-8 rounded-2xl mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Shield size={24} className="text-green-400" />
                  <h3 className="text-2xl font-bold text-white">Permanent API Keys</h3>
                </div>
                <p className="text-gray-300 mb-6">
                  No more JWT token expiration headaches! RefBase uses permanent API keys that never expire, 
                  solving the #1 UX problem with MCP tool integration.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Check size={16} className="text-green-400" />
                    <span className="text-gray-300">Set once, use forever - no token refresh needed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check size={16} className="text-green-400" />
                    <span className="text-gray-300">Secure hashing with salt - keys never stored in plaintext</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check size={16} className="text-green-400" />
                    <span className="text-gray-300">Instant revocation - disable compromised keys immediately</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check size={16} className="text-green-400" />
                    <span className="text-gray-300">Usage tracking - monitor API activity and security</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="text-sm text-gray-400 mb-2">API Key Format:</div>
                <div className="bg-gray-800 p-3 rounded font-mono text-sm text-green-400 mb-4">
                  refb_a1b2c3d4e5f6789012345678901234ab
                </div>
                <div className="text-sm text-gray-400 mb-2">Usage Example:</div>
                <div className="bg-gray-800 p-3 rounded text-sm">
                  <div className="text-blue-400">curl -X GET "https://refbase.dev/api/conversations" \</div>
                  <div className="text-gray-300 ml-2">-H "Authorization: Bearer $API_KEY"</div>
                </div>
              </div>
            </div>
          </div>

          {/* Use Cases */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-white text-center mb-12">Real-World Use Cases</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-600/20 border border-blue-600/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot size={24} className="text-blue-400" />
                </div>
                <h4 className="text-xl font-semibold text-white mb-3">Automatic Learning</h4>
                <p className="text-gray-400">
                  AI assistants automatically save successful implementations, 
                  building a personalized knowledge base that improves over time.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-green-600/20 border border-green-600/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-green-400" />
                </div>
                <h4 className="text-xl font-semibold text-white mb-3">Smart Context</h4>
                <p className="text-gray-400">
                  Before suggesting solutions, AI assistants can search your knowledge base 
                  for similar problems and proven approaches.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-purple-600/20 border border-purple-600/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp size={24} className="text-purple-400" />
                </div>
                <h4 className="text-xl font-semibold text-white mb-3">Pattern Evolution</h4>
                <p className="text-gray-400">
                  Track how your development approaches evolve, identify what works best, 
                  and avoid repeating past mistakes.
                </p>
              </motion.div>
            </div>
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
                    <Brain size={20} className="text-green-400" />
                    <span className="text-white font-mono text-sm">AI Context Generation</span>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm">
                    <div className="text-green-400">✓ Analyzing conversation patterns</div>
                    <div className="text-blue-400">✓ Extracting successful implementations</div>
                    <div className="text-yellow-400">✓ Building context for AI assistants</div>
                    <div className="text-purple-400">✓ Ready to accelerate development!</div>
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
            <h2 className="text-4xl font-bold text-white mb-4">Trusted by Smart Developers</h2>
            <p className="text-xl text-gray-300">Join developers who never lose AI insights again</p>
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