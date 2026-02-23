# Chess Learner

An interactive, premium web application designed to help users master the rules of chess and practice specific piece movements through dynamic, role-based learning.

![Chess Learner Screenshot](chess-app/public/screenshot.png) (Optional: Placeholder for a screenshot)

## 🚀 Live Demo
Check out the live application here: **[https://pksi.github.io/chess_learner/](https://pksi.github.io/chess_learner/)**

## ✨ Features

- **Dynamic Game Modes**:
  - **Beginner**: Standard chess rules with move hints.
  - **Intermediate**: Standard chess rules without hints for a more challenging experience.
  - **Expert**: Random piece placement to master movement in irregular or chaotic board states.
- **Role-Based Learning**: Deep dive into individual pieces! Select a role (e.g., Knight, Bishop) to practice their specific move patterns in a dedicated simplified board.
- **High-Quality SVG Visuals**: Uses the elegant C. Burnett chess set for sharp, professional rendering on any device, including high-density mobile screens (iPad/iPhone).
- **Fullscreen Mode**: Switch to a distraction-free, board-centric view for maximum focus.
- **Intelligent Tutor Analysis**: Real-time feedback on your moves, including specific warnings when attempting to play out of turn.
- **Interactive Audio**: Immersive sound effects for move execution and immediate feedback on illegal attempts.
- **Robust Move Validation**: Powered by `chess.js` with custom logic to handle practice scenarios that bypass traditional king-check constraints during learning.

## 🛠️ Technology Stack

- **Framework**: [React](https://reactjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Game Logic**: [Chess.js](https://github.com/jhlywa/chess.js)
- **Styling**: Vanilla CSS (Modern design patterns, Glassmorphism)

## 📂 Project Structure

- `/chess-app`: The main React application source code.
  - `src/components`: UI components (Chessboard, Sidebars).
  - `src/hooks`: Custom hooks for game state and logic (`useChessGame`).
  - `src/assets`: Design tokens and global styles.

## 🔨 Development

To run the project locally:

1. Navigate to the `chess-app` directory:
   ```bash
   cd chess-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🚢 Deployment

The project is configured for automated deployment to GitHub Pages:
```bash
npm run deploy
```

## 📜 License

This project is open-source and available for educational purposes.
