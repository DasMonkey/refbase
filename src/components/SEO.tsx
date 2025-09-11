import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title = "RefBase - AI Conversation Knowledge Base for Developers | MCP Server Integration",
  description = "Transform your AI coding conversations into searchable knowledge. RefBase captures Claude Code, Cursor IDE conversations with MCP server integration. Never lose coding solutions again.",
  keywords = "AI conversation management, MCP server, developer knowledge base, AI coding assistant, Claude Code, Cursor IDE, pattern recognition, bug tracking, coding solutions, TypeScript, React, Supabase, development productivity, AI-assisted coding, implementation patterns",
  image = "https://refbase.dev/og-image.png",
  url = "https://refbase.dev",
  type = "website"
}) => {
  return (
    <Helmet>
      {/* Basic SEO */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="RefBase" />
      
      {/* Twitter Card */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
    </Helmet>
  );
};

// Pre-defined SEO configurations for different pages
export const seoConfigs = {
  home: {
    title: "RefBase - AI Conversation Knowledge Base for Developers | MCP Server Integration",
    description: "Transform your AI coding conversations into searchable knowledge. RefBase captures Claude Code, Cursor IDE conversations with MCP server integration. Never lose coding solutions again.",
    url: "https://refbase.dev"
  },
  features: {
    title: "RefBase Features - AI Conversation Management & MCP Integration",
    description: "Discover RefBase features: AI conversation capture, MCP server integration, pattern recognition, bug tracking, and cross-project knowledge base for developers.",
    url: "https://refbase.dev/#features"
  },
  mcpServer: {
    title: "RefBase MCP Server - Claude Code & Cursor IDE Integration",
    description: "RefBase MCP server provides seamless integration with Claude Code and Cursor IDE. Automatic conversation capture and AI context feeding for developers.",
    url: "https://refbase.dev/#mcp-server"
  },
  howItWorks: {
    title: "How RefBase Works - AI-Powered Development Knowledge Management",
    description: "Learn how RefBase transforms your AI coding conversations into a searchable knowledge base. Step-by-step guide to AI-powered development workflow.",
    url: "https://refbase.dev/#how-it-works"
  },
  dashboard: {
    title: "RefBase Dashboard - Your AI Conversation Knowledge Base",
    description: "Access your RefBase dashboard to manage AI conversations, view patterns, track bugs, and organize your development knowledge base.",
    url: "https://refbase.dev/dashboard"
  }
};