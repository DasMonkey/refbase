# Netlify Deployment Guide for RefBase

## Environment Variables Configuration

To deploy your RefBase application on Netlify, you need to configure the following environment variables in your Netlify dashboard:

### Required Environment Variables

1. **VITE_SUPABASE_URL**: `https://vfilrdjohvxypomcjmtz.supabase.co`
2. **VITE_SUPABASE_ANON_KEY**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaWxyZGpvaHZ4eXBvbWNqbXR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTY2NDgsImV4cCI6MjA2NTAzMjY0OH0.MQOhf-PCVUw6EgwsXvfl1DCXTC6I-r79KZsetqMdaCM`

### Steps to Configure in Netlify:

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** > **Environment variables**
4. Click **Add a variable** for each environment variable above
5. Set the **Key** and **Value** for each variable

### Build Configuration

The `netlify.toml` file has been configured with:
- Build command: `npm run build`
- Publish directory: `dist`
- Secrets scanning exclusion for the Supabase public keys
- SPA routing redirects

### Important Notes

- The Supabase keys shown here are **public keys** meant to be exposed in client-side applications
- These are not sensitive secrets - they're designed to be publicly visible
- The `netlify.toml` configuration tells Netlify to ignore these specific keys during security scanning

## Deploy Steps

1. Push your code to GitHub (including the new `netlify.toml` file)
2. Configure the environment variables in Netlify dashboard as described above
3. Trigger a new deploy from Netlify dashboard or push new commits

The deployment should now succeed without secrets scanning errors.