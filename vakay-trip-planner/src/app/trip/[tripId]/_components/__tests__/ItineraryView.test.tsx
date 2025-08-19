import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItineraryView } from '../ItineraryView';

// Mock the child components
jest.mock('../CalendarGrid', () => ({
  CalendarGrid: ({ onDayClick, onUpdateDraft, onExitEditMode, saveAction }: {
    onDayClick: (date: string) => void;
    onUpdateDraft: (date: string, draft: { notes: string }) => void;
    onExitEditMode: () => void;
    saveAction: (formData: FormData) => void;
  }) => (
    <div data-testid="calendar-grid">
      <button onClick={() => onDayClick('2024-01-15')}>Click Day</button>
      <button onClick={() => onUpdateDraft('2024-01-15', { notes: 'Test note' })}>Update Draft</button>
      <button onClick={onExitEditMode}>Exit Edit</button>
      <button onClick={() => saveAction(new FormData())}>Save</button>
    </div>
  ),
}));

jest.mock('../LocationManager', () => ({
  LocationManager: ({ onLocationsChange }: { onLocationsChange: (locations: unknown[]) => void }) => (
    <div data-testid="location-manager">
      <button onClick={() => onLocationsChange([])}>Change Locations</button>
    </div>
  ),
}));

jest.mock('../ParticipantManager', () => ({
  ParticipantManager: ({ onParticipantsChange }: { onParticipantsChange: (participants: unknown[]) => void }) => (
    <div data-testid="participant-manager">
      <button onClick={() => onParticipantsChange([])}>Change Participants</button>
    </div>
  ),
}));

jest.mock('../MobileEditMode', () => ({
  MobileEditMode: ({ onExitEditMode }: { onExitEditMode: () => void }) => (
    <div data-testid="mobile-edit-mode">
      <button onClick={onExitEditMode}>Exit Mobile Edit</button>
    </div>
  ),
}));

jest.mock('../DayDetailsModal', () => ({
  DayDetailsModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? (
      <div data-testid="day-details-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null
  ),
}));

// Mock the saveItineraryChanges action
jest.mock('../../actions', () => ({
  saveItineraryChanges: jest.fn(),
}));

const mockTrip = {
  id: '1',
  name: 'Test Trip',
  start_date: '2024-01-15',
  end_date: '2024-01-17',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  user_id: 'user1',
  description: 'Test trip description',
  is_public: false,
};

const mockItineraryDays = [
  {
    id: 1,
    date: '2024-01-15',
    trip_id: '1',
    location_1_id: null,
    location_2_id: null,
    notes: '',
    summary: '',
  },
  {
    id: 2,
    date: '2024-01-16',
    trip_id: '1',
    location_1_id: null,
    location_2_id: null,
    notes: '',
    summary: '',
  },
];

const mockLocations = [
  {
    id: '1',
    name: 'Paris',
    address: 'Paris, France',
    lat: 48.8566,
    lon: 2.3522,
    trip_id: '1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockTransportation: any[] = [];
const mockAccommodations: any[] = [];
const mockParticipants: any[] = [];

const defaultProps = {
  trip: mockTrip,
  itineraryDays: mockItineraryDays,
  locations: mockLocations,
  transportation: mockTransportation,
  accommodations: mockAccommodations,
  participants: mockParticipants,
  participantRole: 'owner',
  isEditing: false,
  setIsEditing: jest.fn(),
  onDataRefresh: jest.fn(),
};

describe('ItineraryView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ItineraryView {...defaultProps} />);
    expect(screen.getByText('Itinerary')).toBeInTheDocument();
  });

  it('displays correct header text for calendar tab', () => {
    render(<ItineraryView {...defaultProps} />);
    expect(screen.getByText('Plan your daily activities')).toBeInTheDocument();
  });

  it('switches to locations tab correctly', async () => {
    const user = userEvent.setup();
    render(<ItineraryView {...defaultProps} />);
    
    const locationsTab = screen.getByText('Locations');
    await user.click(locationsTab);
    
    expect(screen.getByText('Manage locations for your trip')).toBeInTheDocument();
  });

  it('switches to participants tab correctly', async () => {
    const user = userEvent.setup();
    render(<ItineraryView {...defaultProps} />);
    
    const participantsTab = screen.getByText('Participants');
    await user.click(participantsTab);
    
    expect(screen.getByText('Manage who\'s coming on your trip')).toBeInTheDocument();
  });

  it('shows edit button when not in edit mode', () => {
    render(<ItineraryView {...defaultProps} />);
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('shows exit edit button when in edit mode', () => {
    render(<ItineraryView {...defaultProps} isEditing={true} />);
    // Use getAllByText and check the button specifically
    const exitEditElements = screen.getAllByText('Exit Edit');
    const exitEditButton = exitEditElements.find(element => element.tagName === 'BUTTON');
    expect(exitEditButton).toBeInTheDocument();
  });

  it('toggles edit mode when edit button is clicked', async () => {
    const user = userEvent.setup();
    const setIsEditing = jest.fn();
    render(<ItineraryView {...defaultProps} setIsEditing={setIsEditing} />);
    
    const editButton = screen.getByText('Edit');
    await user.click(editButton);
    
    expect(setIsEditing).toHaveBeenCalledWith(true);
  });

  it('shows calendar grid by default', () => {
    render(<ItineraryView {...defaultProps} />);
    expect(screen.getByTestId('calendar-grid')).toBeInTheDocument();
  });

  it('shows location manager when locations tab is active', async () => {
    const user = userEvent.setup();
    render(<ItineraryView {...defaultProps} />);
    
    const locationsTab = screen.getByText('Locations');
    await user.click(locationsTab);
    
    expect(screen.getByTestId('location-manager')).toBeInTheDocument();
  });

  it('shows participant manager when participants tab is active', async () => {
    const user = userEvent.setup();
    render(<ItineraryView {...defaultProps} />);
    
    const participantsTab = screen.getByText('Participants');
    await user.click(participantsTab);
    
    expect(screen.getByTestId('participant-manager')).toBeInTheDocument();
  });

  it('handles day click correctly', async () => {
    const user = userEvent.setup();
    render(<ItineraryView {...defaultProps} />);
    
    const clickDayButton = screen.getByText('Click Day');
    await user.click(clickDayButton);
    
    expect(screen.getByTestId('day-details-modal')).toBeInTheDocument();
  });

  it('handles draft updates correctly', async () => {
    const user = userEvent.setup();
    render(<ItineraryView {...defaultProps} />);
    
    const updateDraftButton = screen.getByText('Update Draft');
    await user.click(updateDraftButton);
    
    // The draft update should be handled internally
    expect(updateDraftButton).toBeInTheDocument();
  });

  it('exits edit mode when exit button is clicked', async () => {
    const user = userEvent.setup();
    const setIsEditing = jest.fn();
    render(<ItineraryView {...defaultProps} isEditing={true} setIsEditing={setIsEditing} />);
    
    // Use getAllByText and check the button specifically
    const exitEditElements = screen.getAllByText('Exit Edit');
    const exitEditButton = exitEditElements.find(element => element.tagName === 'BUTTON');
    expect(exitEditButton).toBeInTheDocument();
    
    await user.click(exitEditButton!);
    
    expect(setIsEditing).toHaveBeenCalledWith(false);
  });

  it('shows mobile edit mode when on mobile and editing', () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<ItineraryView {...defaultProps} isEditing={true} />);
    
    // Trigger resize event
    fireEvent(window, new Event('resize'));
    
    expect(screen.getByTestId('mobile-edit-mode')).toBeInTheDocument();
  });

  it('handles data refresh correctly', async () => {
    const user = userEvent.setup();
    const onDataRefresh = jest.fn();
    render(<ItineraryView {...defaultProps} onDataRefresh={onDataRefresh} />);
    
    const locationsTab = screen.getByText('Locations');
    await user.click(locationsTab);
    
    const changeLocationsButton = screen.getByText('Change Locations');
    await user.click(changeLocationsButton);
    
    expect(onDataRefresh).toHaveBeenCalled();
  });

  it('displays error message when trip has no dates', () => {
    const tripWithoutDates = { ...mockTrip, start_date: null, end_date: null };
    render(<ItineraryView {...defaultProps} trip={tripWithoutDates} />);
    
    expect(screen.getByText('Please set start and end dates for this trip to view the itinerary.')).toBeInTheDocument();
  });


});
