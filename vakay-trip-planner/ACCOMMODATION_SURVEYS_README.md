# Accommodation Surveys Feature

## Overview
The Accommodation Surveys feature allows trip planners to create surveys for trip members to vote on their preferred lodging options. After voting concludes, the winning option can be seamlessly added to the trip's official accommodation list.

## Features

### 1. Survey Management
- **Create Surveys**: Trip participants can create surveys with multiple accommodation options
- **Edit Surveys**: Survey creators can modify survey details and options
- **Delete Surveys**: Survey creators can remove surveys (cascade deletes options and votes)
- **Close Surveys**: Survey creators can close surveys to stop voting

### 2. Voting System
- **Vote/Unvote**: Participants can vote for their preferred options or change their votes
- **One Vote Per Option**: Users can only vote once per option (enforced by unique constraint)
- **Real-time Updates**: Vote counts update immediately after voting
- **Voting Restrictions**: Voting is disabled on closed surveys

### 3. Integration
- **Seamless Addition**: Winning options can be added to the main accommodation list
- **Data Preservation**: All survey details (name, location, URL) are preserved when adding to accommodations
- **Existing Workflow**: Uses the existing AddAccommodationModal for consistency

## Database Schema

### Tables

#### `accommodation_surveys`
- `id`: UUID primary key
- `trip_id`: References trips table
- `created_by`: References auth.users table
- `name`: Survey name
- `status`: 'open' or 'closed'
- `created_at`, `updated_at`: Timestamps

#### `survey_options`
- `id`: UUID primary key
- `survey_id`: References accommodation_surveys table
- `accommodation_name`: Name of the accommodation option
- `location`: Address/location
- `url`: Website or booking URL
- `created_at`: Timestamp

#### `survey_votes`
- `id`: UUID primary key
- `option_id`: References survey_options table
- `user_id`: References auth.users table
- `created_at`: Timestamp
- **Unique constraint**: (option_id, user_id) ensures one vote per user per option

### Row Level Security (RLS)
- **accommodation_surveys**: Trip participants can view, creators can modify
- **survey_options**: Trip participants can view, survey owners can manage
- **survey_votes**: Trip participants can view and vote, users can remove their own votes

## API Endpoints

### `/api/accommodation-surveys`
- `GET`: Fetch surveys for a trip with options and vote counts
- `POST`: Create a new survey with options

### `/api/accommodation-surveys/[id]`
- `PUT`: Update survey details and options
- `DELETE`: Delete a survey

### `/api/accommodation-surveys/vote`
- `POST`: Vote or unvote on an option

## Components

### `SurveyListView`
- Main view for displaying all surveys
- Handles survey creation, editing, and deletion
- Shows voting interface and results
- Integrates with accommodation addition

### `AddEditSurveyModal`
- Form for creating and editing surveys
- Dynamic option management (add/remove options)
- Validation and error handling

### `DeleteSurveyModal`
- Confirmation dialog for survey deletion
- Shows impact of deletion

### Integration with `AccommodationView`
- Toggle switch to enable/disable surveys
- Navigation between accommodation list and survey view
- Seamless workflow integration

## User Experience

### Survey Creation
1. User enables surveys via toggle switch
2. Clicks "View Surveys" to access survey interface
3. Creates survey with multiple accommodation options
4. Survey is immediately available for voting

### Voting Process
1. Trip participants see all open surveys
2. Users can vote for their preferred options
3. Vote counts update in real-time
4. Users can change their votes until survey closes

### Survey Completion
1. Survey creator closes the survey
2. Winning option is highlighted with vote count
3. "Add to Accommodations" button appears
4. Clicking button opens AddAccommodationModal with prefilled data
5. User can add additional details and save to main accommodation list

## Technical Implementation

### State Management
- Local state for survey toggle and view switching
- API calls for CRUD operations
- Real-time data updates after actions

### Error Handling
- Form validation
- API error responses
- User-friendly error messages

### Performance
- Efficient database queries with joins
- Indexed foreign keys
- Optimized vote counting

## Security Features

### Authentication
- All endpoints require valid user session
- User ownership verification for modifications

### Authorization
- Trip participant verification
- Survey creator permissions
- Voting restrictions on closed surveys

### Data Integrity
- Foreign key constraints
- Unique vote constraints
- Cascade deletions

## Future Enhancements

### Potential Features
- Survey templates
- Advanced voting options (ranked choice, multiple selections)
- Survey analytics and reporting
- Email notifications for survey updates
- Survey sharing and collaboration

### Technical Improvements
- Real-time updates with WebSockets
- Advanced caching strategies
- Survey result export functionality
- Integration with external accommodation APIs

## Usage Examples

### Creating a Survey
```typescript
// User enables surveys and navigates to survey view
// Creates survey with options:
{
  name: "Hotel Preferences for Paris",
  options: [
    { accommodation_name: "Hotel ABC", location: "123 Champs-Élysées", url: "https://..." },
    { accommodation_name: "Airbnb Downtown", location: "456 Rue de Rivoli", url: "https://..." }
  ]
}
```

### Voting Process
```typescript
// Users vote on options
POST /api/accommodation-surveys/vote
{
  optionId: "uuid",
  action: "vote" // or "unvote"
}
```

### Adding Winner to Accommodations
```typescript
// After survey closes, winner data is prefilled:
{
  name: "Hotel ABC",
  address: "123 Champs-Élysées",
  booking_url: "https://..."
}
```

## Migration and Setup

### Database Setup
Run the SQL migration file:
```bash
psql -d your_database -f setup-accommodation-surveys.sql
```

### Component Integration
The feature is automatically available after:
1. Database migration
2. Component deployment
3. Feature toggle enabled by user

### Testing
- Test survey creation and management
- Verify voting functionality
- Test survey closure and winner selection
- Verify accommodation integration
- Test RLS policies and permissions
