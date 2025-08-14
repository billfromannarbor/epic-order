# Epic Order Game - Refactored Structure

This document describes the new modular structure of the Epic Order game, which has been broken down from a single large file into multiple, more maintainable components.

## File Structure

```
src/
├── components/
│   ├── index.ts                 # Component exports
│   ├── epic-order-game.tsx      # Main game component (simplified)
│   ├── SetupScreen.tsx          # Game setup and configuration
│   ├── GameScreen.tsx           # Main gameplay interface
│   ├── ResultsScreen.tsx        # Score display and results
│   ├── SortableEventCard.tsx    # Draggable event card component
│   ├── DirectionsCard.tsx       # Game instructions display
│   ├── DemoAnimation.tsx        # Gameplay preview animation
│   ├── Encouragement.tsx        # Score-based encouragement messages
│   └── Toast.tsx                # Toast notification component
├── hooks/
│   └── useGameLogic.ts          # Game state management and logic
├── services/
│   └── gameDataService.ts       # Data fetching and mock data
├── types/
│   └── game.ts                  # TypeScript types and interfaces
└── utils/
    └── gameUtils.ts             # Utility functions
```

## Component Breakdown

### Main Components

1. **EpicOrderGame** (`epic-order-game.tsx`)
   - Main orchestrator component
   - Manages settings state
   - Renders appropriate screen based on game step
   - Handles toast notifications

2. **SetupScreen** (`SetupScreen.tsx`)
   - Game configuration interface
   - Player count, age range, timeline settings
   - Topic selection
   - Start game button

3. **GameScreen** (`GameScreen.tsx`)
   - Main gameplay interface
   - Timeline display
   - Event stockpile
   - Drag and drop functionality
   - Game controls

4. **ResultsScreen** (`ResultsScreen.tsx`)
   - Score display
   - Performance feedback
   - Play again options

### Supporting Components

5. **SortableEventCard** (`SortableEventCard.tsx`)
   - Individual draggable event cards
   - Visual feedback for correct/incorrect placement
   - Tooltip display

6. **DirectionsCard** (`DirectionsCard.tsx`)
   - Game instructions
   - Collapsible help text

7. **DemoAnimation** (`DemoAnimation.tsx`)
   - Visual preview of gameplay
   - Animated demonstration

8. **Encouragement** (`Encouragement.tsx`)
   - Score-based motivational messages
   - Confetti animation for high scores

9. **Toast** (`Toast.tsx`)
   - Notification system
   - Error messages (e.g., "Timeline is full")

## Custom Hooks

### useGameLogic
- Centralized game state management
- Timer logic for single and multiplayer modes
- Drag and drop event handling
- Scoring and validation logic
- Game lifecycle management

## Services

### gameDataService
- API integration for game data
- Fallback mock data
- Data validation and formatting

## Types and Utilities

### Types (`game.ts`)
- All TypeScript interfaces and types
- Game settings, timeline, and event definitions
- Status enums for visual feedback

### Utilities (`gameUtils.ts`)
- Date formatting functions
- Array manipulation helpers
- Time formatting utilities

## Benefits of This Structure

1. **Maintainability**: Each component has a single responsibility
2. **Reusability**: Components can be easily reused or modified
3. **Testing**: Individual components can be tested in isolation
4. **Readability**: Code is easier to understand and navigate
5. **Collaboration**: Multiple developers can work on different components
6. **Debugging**: Issues can be isolated to specific components
7. **Performance**: Components can be optimized individually

## Usage

The main game component can still be used exactly as before:

```tsx
import { EpicOrderGame } from './components';

function App() {
  return <EpicOrderGame />;
}
```

## Migration Notes

- All functionality from the original single file has been preserved
- The game behavior remains identical
- Import paths have been updated to use the new structure
- The main component is now much cleaner and easier to understand

## Future Enhancements

With this modular structure, it's now much easier to:
- Add new game modes
- Implement additional UI components
- Add new scoring systems
- Integrate with different data sources
- Add accessibility features
- Implement unit tests for individual components
