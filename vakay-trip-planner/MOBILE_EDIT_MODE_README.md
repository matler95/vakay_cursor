# Mobile Edit Mode

## Overview

The Mobile Edit Mode provides a native-like mobile editing experience for trip itineraries with a split-screen layout optimized for touch devices.

## Features

### Split-Screen Layout
- **Upper Half**: Calendar view with touch-friendly day selection
- **Bottom Half**: Edit controls for assigning locations and transfers
- **No Scrolling**: Everything fits on screen without scrolling

### Touch Interactions
- **Single Tap**: Toggle individual day selection
- **Long Press (400ms) + Drag**: Select multiple consecutive days
- **Visual Feedback**: Pressed state, selection highlighting, and smooth transitions

### Mobile Optimizations
- iPhone 13 size reference with responsive design
- Touch-friendly button sizes (44px minimum)
- Haptic feedback simulation
- Prevents body scrolling during edit mode
- Optimized spacing and typography for mobile

## How to Use

### Entering Mobile Edit Mode
1. Navigate to a trip's itinerary page
2. Click the "Edit" button
3. On mobile devices (< 768px), the MobileEditMode component automatically activates

### Selecting Days
1. **Individual Selection**: Tap any day to select/deselect it
2. **Range Selection**: 
   - Long press on a day (400ms)
   - Drag to select multiple consecutive days
   - Release to confirm selection

### Assigning Locations
1. Select one or more days using the methods above
2. Choose a location from the "Assign Location" dropdown
3. Optionally select a transfer location for the last day
4. Click "Assign to Selected Days"

### Saving Changes
- Click "Save" to persist changes to the database
- Click "Cancel" to discard changes and exit edit mode
- Click the X button to exit without saving

## Technical Implementation

### Component Structure
```
MobileEditMode
├── Header (Edit controls, Save/Cancel buttons)
├── Calendar Section (Upper half)
│   ├── Weekday headers
│   └── Calendar grid with touch events
└── Edit Controls (Bottom half)
    ├── Selection info
    ├── Location selectors
    ├── Assign button
    └── Instructions
```

### Touch Event Handling
- `onTouchStart`: Initiates selection and starts long press timer
- `onTouchMove`: Handles drag selection for range selection
- `onTouchEnd`: Finalizes selection and clears timers

### State Management
- `selectedRange`: For consecutive day selections
- `selectedDates`: For individual day selections
- `draftItinerary`: Local changes before saving
- `isSelecting`: Tracks drag selection state

### Mobile Detection
- Automatically detects mobile devices (< 768px)
- Applies mobile-specific optimizations
- Prevents body scrolling during edit mode

## Responsive Design

### iPhone 13 Compatibility
- Screen dimensions: 390x844px
- Calendar day height: 65px minimum
- Touch targets: 44px minimum
- Optimized spacing and typography

### Breakpoints
- Mobile: < 768px (MobileEditMode active)
- Desktop: ≥ 768px (Standard CalendarGrid active)

## Browser Support

- Modern mobile browsers (iOS Safari, Chrome Mobile)
- Touch event support required
- Haptic feedback (optional, gracefully degrades)

## Performance Considerations

- Debounced touch events (400ms long press)
- Efficient state updates with useCallback
- Minimal re-renders with proper dependency arrays
- Touch event cleanup on component unmount

## Accessibility

- Touch-friendly button sizes
- Clear visual feedback for selections
- Proper ARIA labels and roles
- Keyboard navigation support (desktop mode)
