
# Jay Jay Quality - Defect Bingo

A gamified quality management application that improves garment defect detection through interactive bingo games and real-time quality monitoring across 13 factories.

## Features

- **Defect Bingo Game**: Interactive bingo board where QC operators mark defects to complete lines and win rewards
- **Real-time Defect Recording**: Quick and intuitive interface to record and validate defects as they are discovered
- **Quality Performance Dashboards**: Comprehensive analytics with charts and metrics to track defect patterns
- **Supervisor Validation**: QC supervisors can verify completed bingo lines to ensure accuracy
- **Leaderboards & Incentives**: Recognition system to motivate operators through gamification
- **Multi-Factory Support**: Designed to work across all 13 factories with consistent data sharing
- **Operator Management**: Admin can add, edit, and remove operators with their EPF numbers and details

## Getting Started
# Setup Instructions for Local Development

## Prerequisites
- Node.js (v14 or later)
- npm (Node Package Manager)
- Git

## Clone the Repository
```bash
git clone <repository-url>
cd <repository-directory>
```

## Install Dependencies
```bash
npm install
```

## Setup Supabase

### Option 1: Use Existing Supabase Database
1. Ensure you have the Supabase URL and API key.
2. Create a `.env` file in the root of the project and add the following:
   ```env
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```

### Option 2: Connect to Your Own Supabase Database
1. Go to [Supabase](https://supabase.io/) and create a new project.
2. Set up your database schema according to the project requirements.
3. Obtain your Supabase URL and API key from the project settings.
4. Create a `.env` file in the root of the project and add the following:
   ```env
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```

## Run the Application
```bash
npm run dev
```

## Access the Application
Open your browser and go to `http://localhost:8080` (or the port specified in the terminal).

## Additional Notes
- Ensure your database tables and structure match the expected schema for the application to function correctly.
