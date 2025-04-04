# Supabase Setup Guide for Defect Bingo

This guide will help you set up your Supabase database and configure your application to use it for data storage and authentication.

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign in or create an account
2. Create a new project
3. Choose a name for your project and set a secure database password
4. Select a region close to your users
5. Wait for the project to be created (this may take a few minutes)

## 2. Set Up Database Tables

You can set up the database tables in two ways:

### Option 1: Using the SQL Editor

1. In your Supabase project dashboard, navigate to the **SQL Editor** section
2. Create a new query
3. Copy the contents of the `supabase-setup.sql` file from this repository
4. Run the query to create all necessary tables and set up permissions

### Option 2: Creating Tables Manually

If you prefer to create tables using the UI:

1. Go to the **Table Editor** section of your Supabase dashboard
2. Create each of the following tables with their respective columns:

#### Users Table
- id (uuid, primary key, default: gen_random_uuid())
- created_at (timestamp with time zone, default: now())
- name (text, not null)
- email (text, not null, unique)
- password (text)
- role (text, not null, default: 'user')
- epf_number (text, not null, unique)
- employee_id (text)
- plant_id (uuid, references plants.id)
- line_number (text)
- avatar_url (text)

#### Plants Table
- id (uuid, primary key, default: gen_random_uuid())
- created_at (timestamp with time zone, default: now())
- name (text, not null)
- lines (text array, default: ARRAY['L1']::TEXT[])

#### Operations Table
- id (uuid, primary key, default: gen_random_uuid())
- created_at (timestamp with time zone, default: now())
- name (text, not null, unique)

#### Defects Table
- id (uuid, primary key, default: gen_random_uuid())
- created_at (timestamp with time zone, default: now())
- garment_part (text, not null)
- defect_type (text, not null)
- validated (boolean, default: false)
- validated_by (uuid, references users.id)
- validated_at (timestamp with time zone)
- created_by (uuid, not null, references users.id)

#### Bingo Cards Table
- id (uuid, primary key, default: gen_random_uuid())
- created_at (timestamp with time zone, default: now())
- user_id (uuid, not null, references users.id)
- completed (boolean, default: false)
- completed_at (timestamp with time zone)
- score (integer, default: 0)

3. Set up Row Level Security (RLS) policies for each table as defined in the `supabase-setup.sql` file

## 3. Add Initial Data (Optional)

You can add initial data to your tables:

1. Insert default operations (Cutting, Sewing, Finishing)
2. Create an admin user
3. Add a default plant

## 4. Configure the Application

1. Update your `.env.local` file with your Supabase URL and anon key:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase dashboard under **Project Settings** > **API**.

## 5. Integrate Authentication (Future Step)

Currently, the application uses the Supabase client for data operations but still uses local storage for authentication. The next steps would be to:

1. Update the `auth-context.tsx` file to use Supabase authentication
2. Set up email/password authentication in Supabase
3. Configure social login providers if needed

## 6. Testing the Integration

1. Start your application using `npm run dev`
2. Go to the Admin page
3. Try adding a new user, plant, or operation
4. Verify that the data is being stored in your Supabase database

## Troubleshooting

If you encounter issues:

1. Check browser console for errors
2. Verify that your Supabase URL and anon key are correct
3. Check that your database schema matches the expected structure
4. Ensure that Row Level Security policies are properly configured

## Next Steps

1. Complete the authentication integration
2. Set up proper error handling for database operations
3. Implement real-time subscriptions for live updates
4. Add proper password hashing and security features 