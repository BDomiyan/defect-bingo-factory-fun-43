
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

1. Clone this repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Visit `http://localhost:5173` in your browser

## How to Play

1. QC operators can record defects when found on the production floor
2. Each defect consists of a Garment Part + Defect Type combination
3. Operators provide their name, EPF number, and select their operation
4. Supervisors validate recorded defects to ensure accuracy
5. When a row, column, or diagonal is completed, a bingo is achieved
6. Points are awarded for validated defects and completed bingo lines

## Game Features

- **Combo Points**: Earn extra points for finding multiple defects in a short time
- **Streaks**: Maintain a streak of valid defects for multipliers
- **Penalties**: Invalid defects can result in penalties
- **Challenges**: Daily and weekly challenges for bonus points
- **Awards**: Special recognition for top performers
- **Supervisor Validation**: All defects are pending until validated by supervisors
- **EPF Number Tracking**: Operators are identified by unique EPF numbers
- **Operation Selection**: Defects are linked to specific operations in the production process

## Operator Management

- **Add Operators**: Admins can add new operators with their EPF numbers
- **Edit Details**: Update operator information including name, EPF, factory, and line
- **Factory Assignment**: Assign operators to specific factories and production lines
- **Search**: Quickly find operators by name, EPF, factory, or line
- **Line Configuration**: Organize operators by production line for easy management

## Technical Information

- Built with React, TypeScript, and Vite
- Styled with Tailwind CSS and shadcn/ui components
- Real-time metrics and analytics
- Mobile and tablet-responsive design

## Factories

The application is configured for use in all 13 factories:
- A6: Plant A6
- C5: Plant C5
- M1: Plant M1
- B7: Plant B7
- D2: Plant D2
- E4: Plant E4
- F8: Plant F8
- G3: Plant G3
- H9: Plant H9
- J5: Plant J5
- K1: Plant K1
- L6: Plant L6
- N2: Plant N2

## License

© 2023 Jay Jay Quality. All rights reserved.
