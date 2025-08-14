# Calendar & Itinerary Redesign

This document outlines the comprehensive redesign of the calendar and itinerary system for the Vakay trip planner application.

## 🎯 Overview

The new calendar system provides a fast, low-friction way to assign locations to days, manage transfer days, and handle bulk operations. It's designed to make the common path cheapest while maintaining flexibility for complex scenarios.

## ✨ Key Features

### 1. **Range Selection & Bulk Operations**
- **Click & Drag**: Select consecutive days by clicking and dragging
- **Shift + Click**: Extend selection with keyboard modifier
- **Visual Feedback**: Clear indication of selected range with blue highlighting
- **Floating Action Bar**: Quick actions for selected range (assign location, mark transfer, add notes)

### 2. **Enhanced Location Management**
- **Auto-create Locations**: Type unknown places and create them automatically
- **Smart Suggestions**: Integrates with existing location search API
- **Quick Assignment**: Drag locations from sidebar or use quick-select buttons
- **Usage Statistics**: Track how often locations are used and when last used

### 3. **Advanced Transfer Day Support**
- **Full Day Transfers**: Mark entire days as travel days
- **AM/PM Splits**: Morning in one location, afternoon in another
- **Custom Time Splits**: Specify exact times for location changes
- **Visual Indicators**: Arrow icons and split pills show transfer information

### 4. **Consecutive Day Grouping**
- **Visual Bands**: Connected visual elements show consecutive days in same location
- **Smart Grouping**: Automatically detects and highlights location blocks
- **Range Operations**: Apply changes to entire blocks at once

### 5. **Undo System**
- **Action History**: Track all user actions with timestamps
- **Undo Snackbar**: Quick undo for recent actions
- **Action Log**: Detailed history panel for debugging and complex undo operations

## 🏗️ Component Architecture

### Core Components

#### `CalendarGrid`
- **Purpose**: Main calendar view with range selection and visual grouping
- **Features**: 
  - Mouse and keyboard range selection
  - Consecutive day grouping overlay
  - Integration with RangeActionBar
- **Props**: `trip`, `itineraryDays`, `locations`, `isEditing`, `onUpdateDraft`, `onBulkUpdate`

#### `RangeActionBar`
- **Purpose**: Floating action bar for bulk operations on selected date ranges
- **Features**:
  - Location assignment
  - Transfer day marking
  - Bulk notes addition
  - Modal-based configuration
- **Props**: `selectedRange`, `locations`, `onAssignLocation`, `onAssignTransfer`, `onAddNotes`, `onClear`

#### `DayEditor`
- **Purpose**: Comprehensive day editing interface
- **Features**:
  - Location search with autocomplete
  - Transfer day configuration
  - Notes and custom fields
  - Auto-location creation
- **Props**: `isOpen`, `onClose`, `date`, `dayData`, `locations`, `onUpdateDraft`, `onCreateLocation`

#### `LocationsSidebar`
- **Purpose**: Location management and quick assignment
- **Features**:
  - Search and filtering (All, Used, Unused, Favorites)
  - Usage statistics and last used dates
  - Quick location assignment
  - Edit and delete actions
- **Props**: `locations`, `itineraryDays`, `tripId`, `onLocationSelect`, `onEditLocation`, `onDeleteLocation`, `onCreateLocation`

#### `UndoManager`
- **Purpose**: Action tracking and undo functionality
- **Features**:
  - Action history with timestamps
  - Undo snackbar
  - Action log panel
  - Global undo management
- **Props**: `className` (optional)

### Enhanced Existing Components

#### `DayCard`
- **New Features**:
  - Range selection support (`onMouseDown`, `onMouseEnter`, `onKeyDown`)
  - Visual range indicators (`isInRange`)
  - Enhanced accessibility (ARIA labels, keyboard navigation)
  - Transfer day visual indicators

## 🎨 User Experience Flows

### 1. **Assign Location to Range**
```
1. Click and drag to select consecutive days
2. Floating action bar appears
3. Choose "Assign Location" 
4. Select location from dropdown or search
5. All selected days get the location assigned
6. Undo snackbar appears with option to reverse
```

### 2. **Mark Transfer Day**
```
1. Select a single day or range
2. Choose "Mark Transfer" from action bar
3. Configure from/to locations
4. Choose transfer type (full day, AM/PM, custom times)
5. Apply transfer settings
6. Visual indicators show transfer information
```

### 3. **Create New Location**
```
1. Type unknown place name in location search
2. System suggests creating new location
3. Fill in location details (name, description, color)
4. Location is created and assigned automatically
5. Option to edit location details later
```

### 4. **Bulk Operations**
```
1. Select multiple non-consecutive days (Ctrl/Cmd + Click)
2. Use bulk action panel for common operations
3. Apply changes to all selected days
4. Undo available for bulk operations
```

## 🚀 Implementation Details

### State Management
- **Draft Itinerary**: Local state for unsaved changes
- **Selection State**: Range selection and multi-select management
- **Action History**: Undo system state management
- **UI State**: Modal states, sidebar visibility, etc.

### Data Flow
```
User Action → Component State → Draft Update → Parent Component → Save Action
     ↓
Undo Manager ← Action History ← Action Recording
```

### Performance Optimizations
- **Debounced Search**: Location search with 150ms debounce
- **Memoized Calculations**: Consecutive day grouping and filtering
- **Virtual Scrolling**: Large calendar views with efficient rendering
- **Caching**: Search results cached for 5 minutes

## 📱 Mobile Considerations

### Touch Interactions
- **Long Press**: Start range selection on mobile
- **Swipe**: Extend selection with touch gestures
- **Bottom Sheet**: Day editor opens as bottom sheet on mobile
- **Responsive Layout**: Sidebar collapses to overlay on small screens

### Performance
- **Touch Events**: Optimized for mobile touch interactions
- **Gesture Recognition**: Smooth range selection with touch
- **Responsive Design**: Adapts layout for different screen sizes

## ♿ Accessibility Features

### Keyboard Navigation
- **Tab Order**: Logical tab sequence through calendar
- **Arrow Keys**: Navigate between days
- **Shift + Click**: Range selection with keyboard
- **Escape**: Close modals and clear selections

### Screen Reader Support
- **ARIA Labels**: Descriptive labels for all interactive elements
- **Role Attributes**: Proper semantic roles for calendar elements
- **Live Regions**: Updates announced for dynamic content
- **Focus Management**: Proper focus handling in modals

### Visual Accessibility
- **High Contrast**: Clear visual indicators for selections
- **Color Independence**: Information not conveyed by color alone
- **Focus Indicators**: Clear focus states for keyboard navigation

## 🔧 Configuration & Customization

### Location Colors
- **Default Palette**: 13 predefined colors for locations
- **Custom Colors**: Hex color picker for custom colors
- **Auto-assignment**: Smart color assignment for new locations

### Transfer Types
- **Full Day**: Entire day marked as transfer
- **AM/PM Split**: Morning/afternoon location changes
- **Custom Times**: Specific time-based location changes

### View Modes
- **Calendar Grid**: Month view with visual grouping
- **List View**: Day-by-day list for detailed editing
- **Timeline View**: Future enhancement for time-based visualization

## 🧪 Testing Scenarios

### Core Functionality
1. **Range Selection**: Test mouse drag, keyboard selection, touch interactions
2. **Location Assignment**: Test single day, range, and bulk assignment
3. **Transfer Days**: Test all transfer types and configurations
4. **Undo System**: Test action history and undo functionality

### Edge Cases
1. **Long Trips**: Test with 30+ day itineraries
2. **Many Locations**: Test with 50+ locations
3. **Complex Transfers**: Test multi-day transfers and overlapping assignments
4. **Mobile Devices**: Test on various screen sizes and orientations

### Performance Tests
1. **Large Calendars**: Test rendering performance with long trips
2. **Search Performance**: Test location search with large datasets
3. **Memory Usage**: Monitor memory usage during extended editing sessions

## 🚀 Future Enhancements

### Planned Features
- **Map Integration**: Visual map view of itinerary
- **Travel Time Calculation**: Automatic travel time between locations
- **Template System**: Save and reuse common itinerary patterns
- **Collaboration**: Real-time editing with multiple users
- **Export Options**: PDF, calendar formats, travel apps

### Technical Improvements
- **Offline Support**: Work offline with sync when connection restored
- **Progressive Web App**: Installable app with offline capabilities
- **Advanced Analytics**: Trip statistics and optimization suggestions
- **Integration APIs**: Connect with travel booking platforms

## 📚 API Integration

### Location Search
- **Endpoint**: `/api/locations/search`
- **Features**: Fuzzy search, category filtering, result caching
- **Response**: Structured location data with metadata

### Itinerary Management
- **Actions**: Create, update, delete itinerary days
- **Validation**: Business rules for transfer days and conflicts
- **Optimistic Updates**: Immediate UI feedback with server sync

## 🐛 Troubleshooting

### Common Issues
1. **Range Selection Not Working**: Check if editing mode is enabled
2. **Location Not Saving**: Verify location exists in database
3. **Undo Not Working**: Check if action history is properly initialized
4. **Performance Issues**: Monitor for large datasets or memory leaks

### Debug Tools
- **Action History Panel**: View recent actions and undo options
- **Console Logging**: Detailed logging for debugging
- **Performance Monitoring**: Track render times and memory usage

## 📖 Usage Examples

### Basic Calendar Usage
```tsx
<CalendarGrid
  trip={trip}
  itineraryDays={itineraryDays}
  locations={locations}
  isEditing={isEditing}
  onUpdateDraft={handleUpdateDraft}
  onBulkUpdate={handleBulkUpdate}
/>
```

### Range Action Bar
```tsx
<RangeActionBar
  selectedRange={selectedRange}
  locations={locations}
  onAssignLocation={handleBulkLocationAssign}
  onAssignTransfer={handleBulkTransferAssign}
  onAddNotes={handleBulkNotes}
  onClear={clearSelection}
/>
```

### Day Editor
```tsx
<DayEditor
  isOpen={isDayEditorOpen}
  onClose={() => setIsDayEditorOpen(false)}
  date={selectedDate}
  dayData={dayData}
  locations={locations}
  onUpdateDraft={handleUpdateDraft}
  onCreateLocation={handleCreateLocation}
/>
```

This redesign provides a comprehensive, user-friendly calendar system that addresses all the requirements while maintaining performance and accessibility standards.
