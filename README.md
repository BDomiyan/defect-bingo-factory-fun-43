
# Jay Jay Quality - Defect Bingo

A gamified quality management application that improves garment defect detection through interactive bingo games and real-time quality monitoring.

## Features

- **Defect Bingo Game**: Interactive bingo board where QC operators mark defects to complete lines and win rewards
- **Real-time Defect Recording**: Quick and intuitive interface to record and validate defects as they are discovered
- **Quality Performance Dashboards**: Comprehensive analytics with charts and metrics to track defect patterns
- **Supervisor Validation**: QC supervisors can verify completed bingo lines to ensure accuracy
- **Leaderboards & Incentives**: Recognition system to motivate operators through gamification

## Getting Started

1. Clone this repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Visit `http://localhost:5173` in your browser

## How to Play

1. QC operators can record defects when found on the production floor
2. Each defect consists of a Garment Part + Defect Type combination
3. Operators can drag-and-drop or select pairs to mark cells on their bingo board
4. When a row, column, or diagonal is completed, a bingo is achieved
5. Supervisors validate the bingo line to ensure accuracy
6. Points are awarded for validated defects and completed bingo lines

## Technical Information

- Built with React, TypeScript, and Vite
- Styled with Tailwind CSS and shadcn/ui components
- Real-time metrics and analytics
- Mobile-responsive design

## Project Structure

- `/src/components`: UI components for the application
- `/src/hooks`: Custom React hooks for state management
- `/src/lib`: Utility functions and data models
- `/src/pages`: Main application pages

## Factories

The application is configured for use in the following factories:
- A6: Plant A6
- C5: Plant C5
- M1: Plant M1

## License

© 2023 Jay Jay Quality. All rights reserved.
