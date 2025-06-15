# Sales Management System Setup Guide

## Prerequisites

Before starting, make sure you have:
- Node.js 18+ installed
- A Supabase account
- A Resend account (for email functionality)

## Step 1: Database Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the project to be ready

2. **Set up the Database Schema**
   - In your Supabase dashboard, go to the SQL Editor
   - Copy the contents of `database/schema.sql`
   - Paste and run the SQL script

3. **Get your Supabase credentials**
   - Go to Settings → API
   - Copy your Project URL and anon/public key

## Step 2: Email Service Setup

1. **Create a Resend Account**
   - Go to [resend.com](https://resend.com)
   - Sign up and verify your account

2. **Get your API Key**
   - In the Resend dashboard, go to API Keys
   - Create a new API key
   - Copy the key (you won't see it again)

3. **Add a Domain (Optional but Recommended)**
   - Go to Domains in Resend dashboard
   - Add your domain and verify it
   - This allows you to send from your own domain

## Step 3: Environment Configuration

1. **Copy the environment template**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your environment variables**
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   
   # Resend Configuration
   RESEND_API_KEY=re_your-api-key-here
   FROM_EMAIL=noreply@yourdomain.com
   ```

## Step 4: Install and Run

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   - Navigate to http://localhost:3000
   - You should see the login page

## Step 5: First Steps

1. **Create an Account**
   - Click "Sign Up" and create your admin account
   - Verify your email if required

2. **Create Your First Form**
   - Go to Dashboard → Forms
   - Click "Create Form"
   - Add fields like Name, Email, Phone
   - Save and activate the form

3. **Test Form Submission**
   - Copy the form URL from the forms page
   - Open it in a new tab/window
   - Submit a test lead
   - Check if it appears in the Leads section

4. **Send a Test Email**
   - Go to Dashboard → Emails → Compose
   - Select your test lead
   - Write a simple message
   - Send the email

## Troubleshooting

### Database Issues
- Make sure you ran the complete SQL schema
- Check that RLS policies are enabled
- Verify your Supabase URL and key are correct

### Email Issues
- Verify your Resend API key is correct
- Check that your FROM_EMAIL is verified in Resend
- Look at the browser console for error messages

### Authentication Issues
- Make sure your Supabase project has Auth enabled
- Check that the redirect URLs are configured correctly
- Verify the environment variables are loaded

### Form Submission Issues
- Check the browser console for JavaScript errors
- Verify the form ID exists in the database
- Make sure the leads table has proper permissions

## Production Deployment

### Vercel (Recommended)

1. **Connect to Vercel**
   - Push your code to GitHub
   - Connect the repository to Vercel
   - Add your environment variables in Vercel dashboard

2. **Configure Environment Variables**
   - Add all the variables from your .env.local
   - Make sure NEXT_PUBLIC_ variables are included

3. **Update Supabase Settings**
   - In Supabase, go to Authentication → URL Configuration
   - Add your Vercel domain to allowed redirect URLs

### Other Platforms

The app can be deployed to:
- Netlify
- Railway
- DigitalOcean App Platform
- Any platform supporting Next.js

## Next Steps

Once everything is working:

1. **Customize the branding**
   - Update the app name in the navigation
   - Change colors in tailwind.config.ts
   - Add your logo

2. **Create email templates**
   - Go to Dashboard → Emails → Templates
   - Create reusable templates with variables

3. **Set up your forms**
   - Create forms for different lead sources
   - Embed them on your website
   - Share direct links on social media

4. **Monitor analytics**
   - Check the Dashboard for lead statistics
   - Review the Analytics page for trends
   - Track email performance

## Support

If you run into issues:
1. Check the browser console for errors
2. Review the Supabase logs
3. Verify all environment variables are set correctly
4. Make sure the database schema is complete
