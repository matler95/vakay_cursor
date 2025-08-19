'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Database } from '@/types/database.types';
import { ClipboardList, Plus, ArrowLeft, Edit, CheckCircle, ChevronRight, ChevronDown, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StandardList, EmptyState, ConfirmationModal } from '@/components/ui';
import { AddEditSurveyModal } from './AddEditSurveyModal';
import { AddAccommodationModal } from './AddAccommodationModal';

type Survey = Database['public']['Tables']['accommodation_surveys']['Row'] & {
  options: Array<Database['public']['Tables']['survey_options']['Row'] & {
    vote_count: number;
    user_has_voted: boolean;
  }>;
};

interface SurveyListViewProps {
  tripId: string;
  currentUserId: string;
  tripName?: string;
}

export function SurveyListView({ 
  tripId, 
  currentUserId,
  tripName
}: SurveyListViewProps) {
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isAddAccommodationModalOpen, setIsAddAccommodationModalOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [winningOption, setWinningOption] = useState<any>(null);
  const [expandedSurveys, setExpandedSurveys] = useState<Set<string>>(new Set());
  const [deletingSurvey, setDeletingSurvey] = useState<Survey | null>(null);
  const [expandedVoteDetails, setExpandedVoteDetails] = useState<Set<string>>(new Set());
  const [voterDetails, setVoterDetails] = useState<Record<string, Array<{ user_id: string; full_name: string | null }>>>({});
  const [loadingVoterDetails, setLoadingVoterDetails] = useState<Set<string>>(new Set());
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const [loadingVotes, setLoadingVotes] = useState<Set<string>>(new Set());
  const [loadingAddToAccommodations, setLoadingAddToAccommodations] = useState<Set<string>>(new Set());
  const [loadingCreateSurvey, setLoadingCreateSurvey] = useState(false);

  useEffect(() => {
    fetchSurveys();
  }, [tripId]);

  const fetchSurveys = async () => {
    try {
      const response = await fetch(`/api/accommodation-surveys?tripId=${tripId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched surveys data:', data);
        console.log('Surveys array:', data.surveys);
        console.log('First survey options:', data.surveys?.[0]?.options);
        setSurveys(data.surveys || []);
      } else {
        console.error('Failed to fetch surveys');
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = useCallback(async (optionId: string, action: 'vote' | 'unvote') => {
    // Prevent duplicate votes
    if (loadingVotes.has(optionId)) return;
    
    setLoadingVotes(prev => new Set(prev).add(optionId));
    
    // Optimistically update the UI immediately
    setSurveys(prevSurveys => 
      prevSurveys.map(survey => ({
        ...survey,
        options: survey.options.map(option => {
          if (option.id === optionId) {
            const newVoteCount = action === 'vote' 
              ? option.vote_count + 1 
              : Math.max(0, option.vote_count - 1);
            
            return {
              ...option,
              vote_count: newVoteCount,
              user_has_voted: action === 'vote'
            };
          }
          return option;
        })
      }))
    );

    try {
      const response = await fetch('/api/accommodation-surveys/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, action })
      });

      if (!response.ok) {
        const error = await response.json();
        // Revert optimistic update on error
        await fetchSurveys();
        alert(error.error || 'Failed to update vote');
      }
    } catch (error) {
      console.error('Error updating vote:', error);
      // Revert optimistic update on error
      await fetchSurveys();
      alert('Failed to update vote');
    } finally {
      setLoadingVotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(optionId);
        return newSet;
      });
    }
  }, [loadingVotes]);

  const handleCloseSurvey = useCallback(async (surveyId: string) => {
    setLoadingActions(prev => new Set(prev).add(`close-${surveyId}`));
    
    try {
      const response = await fetch(`/api/accommodation-surveys/${surveyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' })
      });

      if (response.ok) {
        await fetchSurveys();
      } else {
        alert('Failed to close survey');
      }
    } catch (error) {
      console.error('Error closing survey:', error);
      alert('Failed to close survey');
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(`close-${surveyId}`);
        return newSet;
      });
    }
  }, []);

  const handleReopenSurvey = useCallback(async (surveyId: string) => {
    setLoadingActions(prev => new Set(prev).add(`reopen-${surveyId}`));
    
    try {
      const response = await fetch(`/api/accommodation-surveys/${surveyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'open' })
      });

      if (response.ok) {
        await fetchSurveys();
      } else {
        alert('Failed to reopen survey');
      }
    } catch (error) {
      console.error('Error reopening survey:', error);
      alert('Failed to reopen survey');
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(`reopen-${surveyId}`);
        return newSet;
      });
    }
  }, []);

  const handleDeleteSurvey = useCallback(async (surveyId: string) => {
    setLoadingActions(prev => new Set(prev).add(`delete-${surveyId}`));
    
    try {
      const response = await fetch(`/api/accommodation-surveys/${surveyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSurveys();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete survey');
      }
    } catch (error) {
      console.error('Error deleting survey:', error);
      alert('Failed to delete survey');
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(`delete-${surveyId}`);
        return newSet;
      });
    }
  }, []);

  const handleAddToAccommodations = useCallback((survey: Survey) => {
    setLoadingAddToAccommodations(prev => new Set(prev).add(survey.id));
    
    // Find the winning option (highest vote count)
    const winning = survey.options.reduce((prev, current) => 
      (current.vote_count > prev.vote_count) ? current : prev
    );
    
    setWinningOption({
      name: winning.accommodation_name,
      address: winning.location || '',
      url: winning.url || ''
    });
    setIsAddAccommodationModalOpen(true);
  }, []);

  const toggleSurveyExpansion = useCallback((surveyId: string) => {
    setExpandedSurveys(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(surveyId)) {
        newExpanded.delete(surveyId);
      } else {
        newExpanded.add(surveyId);
      }
      return newExpanded;
    });
  }, []);

  const fetchVoterDetails = useCallback(async (optionId: string) => {
    // Prevent duplicate requests
    if (loadingVoterDetails.has(optionId)) return;
    
    setLoadingVoterDetails(prev => new Set(prev).add(optionId));
    
    try {
      const response = await fetch(`/api/accommodation-surveys/vote-details?optionId=${optionId}`);
      if (response.ok) {
        const data = await response.json();
        setVoterDetails(prev => ({
          ...prev,
          [optionId]: data.voters || []
        }));
      } else {
        console.error('Failed to fetch voter details:', response.status, response.statusText);
        // Set empty array to prevent repeated failed requests
        setVoterDetails(prev => ({
          ...prev,
          [optionId]: []
        }));
      }
    } catch (error) {
      console.error('Error fetching voter details:', error);
      // Set empty array to prevent repeated failed requests
      setVoterDetails(prev => ({
        ...prev,
        [optionId]: []
      }));
    } finally {
      setLoadingVoterDetails(prev => {
        const newSet = new Set(prev);
        newSet.delete(optionId);
        return newSet;
      });
    }
  }, [loadingVoterDetails]);

  const toggleVoteDetails = useCallback(async (optionId: string) => {
    setExpandedVoteDetails(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(optionId)) {
        newExpanded.delete(optionId);
      } else {
        newExpanded.add(optionId);
        // Fetch voter details if not already loaded and not currently loading
        if (!voterDetails[optionId] && !loadingVoterDetails.has(optionId)) {
          fetchVoterDetails(optionId);
        }
      }
      return newExpanded;
    });
  }, [voterDetails, loadingVoterDetails, fetchVoterDetails]);

  const getWinningOption = useCallback((survey: Survey) => {
    if (survey.options.length === 0) return null;
    return survey.options.reduce((winner, option) => 
      option.vote_count > winner.vote_count ? option : winner
    );
  }, []);

  const calculateVotePercentage = useCallback((voteCount: number, totalVotes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((voteCount / totalVotes) * 100);
  }, []);

  const getTotalVotes = useCallback((survey: Survey) => {
    return survey.options.reduce((total, option) => total + option.vote_count, 0);
  }, []);

  const handleSurveyCreated = useCallback(async () => {
    setIsAddEditModalOpen(false);
    setEditingSurvey(null);
    setLoadingCreateSurvey(false);
    
    // Fetch surveys and then auto-expand the newest one
    const response = await fetch(`/api/accommodation-surveys?tripId=${tripId}`);
    if (response.ok) {
      const data = await response.json();
      const newSurveys = data.surveys || [];
      setSurveys(newSurveys);
      
      // Auto-expand the newly created survey (first in the list)
      if (newSurveys.length > 0) {
        setExpandedSurveys(prev => new Set(prev).add(newSurveys[0].id));
      }
    }
  }, [tripId]);

  const handleSurveyUpdated = useCallback(async () => {
    setIsAddEditModalOpen(false);
    setEditingSurvey(null);
    setLoadingCreateSurvey(false);
    await fetchSurveys();
  }, []);

  const handleAccommodationAdded = useCallback(async () => {
    setIsAddAccommodationModalOpen(false);
    setWinningOption(null);
    // Clear loading state for all surveys
    setLoadingAddToAccommodations(new Set());
    // Navigate back to accommodation view after adding
    router.push(`/trip/${tripId}/accommodation`);
  }, [router, tripId]);

  const openEditModal = useCallback((survey: Survey) => {
    setEditingSurvey(survey);
    setIsAddEditModalOpen(true);
  }, []);

  const handleBackToAccommodation = useCallback(() => {
    window.location.href = `/trip/${tripId}?tab=accommodation`;
  }, [tripId]);

  const emptyState = useMemo(() => (
    <EmptyState
      icon={ClipboardList}
      title="No surveys yet"
      description="Create your first accommodation survey to get started."
    />
  ), []);

  // Memoize survey data to prevent unnecessary re-renders
  const surveyData = useMemo(() => 
    surveys.map((survey) => {
      const winning = getWinningOption(survey);
      const isOwner = survey.created_by === currentUserId;
      const isClosed = survey.status === 'closed';
      const isExpanded = expandedSurveys.has(survey.id);
      const totalVotes = getTotalVotes(survey);

      return {
        survey,
        winning,
        isOwner,
        isClosed,
        isExpanded,
        totalVotes
      };
    }), [surveys, expandedSurveys, currentUserId, getWinningOption, getTotalVotes]
  );

  // Memoized component for survey options to prevent unnecessary re-renders
  const SurveyOption = memo(({ 
    option, 
    isClosed, 
    totalVotes, 
    isExpanded, 
    expandedVoteDetails, 
    voterDetails, 
    loadingVoterDetails,
    onVote, 
    onToggleVoteDetails,
    calculateVotePercentage 
  }: {
    option: any;
    isClosed: boolean;
    totalVotes: number;
    isExpanded: boolean;
    expandedVoteDetails: Set<string>;
    voterDetails: Record<string, Array<{ user_id: string; full_name: string | null }>>;
    loadingVoterDetails: Set<string>;
    onVote: (optionId: string, action: 'vote' | 'unvote') => void;
    onToggleVoteDetails: (optionId: string) => void;
    calculateVotePercentage: (voteCount: number, totalVotes: number) => number;
  }) => {
    const votePercentage = calculateVotePercentage(option.vote_count, totalVotes);
    
    return (
      <div
        key={option.id}
        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        {/* Checkbox for voting */}
        <div className="flex-shrink-0">
          <input
            type="checkbox"
            checked={option.user_has_voted}
            onChange={() => handleVote(
              option.id, 
              option.user_has_voted ? 'unvote' : 'vote'
            )}
            disabled={isClosed || loadingVotes.has(option.id)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {loadingVotes.has(option.id) && (
            <div className="mt-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}
        </div>

        {/* Option details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {option.url ? (
              <a
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-800 text-sm leading-tight underline"
                onClick={(e) => e.stopPropagation()}
              >
                {option.accommodation_name}
              </a>
            ) : (
              <div className="font-medium text-gray-900 text-sm leading-tight">
                {option.accommodation_name}
              </div>
            )}
            {option.url && (
              <a
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
                title="View accommodation details"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          {option.location && (
            <div className="text-xs text-gray-500 leading-tight mt-1">
              📍 {option.location}
            </div>
          )}
        </div>

        {/* Vote display with percentage and chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <div className="text-sm font-semibold text-blue-600">
              {votePercentage}%
            </div>
            <div className="text-xs text-gray-500">
              {option.vote_count} vote{option.vote_count !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVoteDetails(option.id);
            }}
            className="p-1 hover:bg-blue-50 rounded transition-colors"
            title="Click to see who voted"
          >
            {expandedVoteDetails.has(option.id) ? (
              <ChevronDown className="h-4 w-4 text-blue-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-blue-600" />
            )}
          </button>
        </div>

        {/* Voter Details - Show when expanded */}
        {expandedVoteDetails.has(option.id) && (
          <div className="ml-6 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-2">
              Voters:
            </div>
            {voterDetails[option.id] && voterDetails[option.id].length > 0 ? (
              <div className="space-y-1">
                {voterDetails[option.id].map((voter, index) => (
                  <div key={voter.user_id} className="text-xs text-gray-600">
                    • {voter.full_name || 'Unknown User'}
                  </div>
                ))}
              </div>
            ) : loadingVoterDetails.has(option.id) ? (
              <div className="text-xs text-gray-500 italic">
                Loading voters...
              </div>
            ) : voterDetails[option.id] && voterDetails[option.id].length === 0 ? (
              <div className="text-xs text-gray-500 italic">
                No votes yet
              </div>
            ) : (
              <div className="text-xs text-gray-500 italic">
                Click to see voters
              </div>
            )}
          </div>
        )}
      </div>
    );
  });

  SurveyOption.displayName = 'SurveyOption';

  return (
    <div className="space-y-6">
      {/* Header with back button - Sticky */}
      <div className="sticky top-16 z-30 bg-gray-50 -mx-4 px-4 py-3 border-b border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleBackToAccommodation}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Accommodation Surveys
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {tripName ? `Vote on preferred lodging options for ${tripName}` : 'Vote on preferred lodging options'}
              </p>
            </div>
          </div>
          <Button 
            onClick={() => {
              setLoadingCreateSurvey(true);
              setIsAddEditModalOpen(true);
            }} 
            size="sm"
            className="w-full sm:w-auto justify-center"
            disabled={loadingCreateSurvey}
          >
            {loadingCreateSurvey ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Create Survey</span>
                <span className="sm:hidden">Create</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Surveys List */}
      <StandardList 
        emptyState={emptyState}
        loading={isLoading}
        loadingMessage="Loading surveys..."
      >
        {surveyData.map(({ survey, winning, isOwner, isClosed, isExpanded, totalVotes }) => (
          <div key={survey.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Survey Header - Clickable to expand/collapse */}
              <div 
                className="px-3 sm:px-4 py-3 border-b border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleSurveyExpansion(survey.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      )}
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base leading-tight truncate">
                        {survey.name}
                      </h3>
                    </div>
                    <Badge variant={survey.status === 'open' ? 'default' : 'secondary'} className="w-fit">
                      {survey.status === 'open' ? 'Open' : 'Closed'}
                    </Badge>
                    {totalVotes > 0 && (
                      <span className="text-xs text-gray-500">
                        {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {isOwner && (
                    <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                      {survey.status === 'open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCloseSurvey(survey.id)}
                          className="text-xs px-2 py-1 h-8"
                          disabled={loadingActions.has(`close-${survey.id}`)}
                        >
                          {loadingActions.has(`close-${survey.id}`) ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1" />
                              Closing...
                            </>
                          ) : (
                            <>
                              <span className="hidden sm:inline">Close Survey</span>
                              <span className="sm:hidden">Close</span>
                            </>
                          )}
                        </Button>
                      )}
                      {survey.status === 'closed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReopenSurvey(survey.id)}
                          className="text-xs px-2 py-1 h-8"
                          disabled={loadingActions.has(`reopen-${survey.id}`)}
                        >
                          {loadingActions.has(`reopen-${survey.id}`) ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1" />
                              Reopening...
                            </>
                          ) : (
                            <>
                              <span className="hidden sm:inline">Reopen Survey</span>
                              <span className="sm:hidden">Reopen</span>
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(survey)}
                        className="text-xs px-2 py-1 h-8"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline ml-1">Edit</span>
                      </Button>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => setDeletingSurvey(survey)}
                           className="text-xs px-2 py-1 h-8 text-red-600 border-red-600 hover:bg-red-50"
                           disabled={loadingActions.has(`delete-${survey.id}`)}
                         >
                           {loadingActions.has(`delete-${survey.id}`) ? (
                             <>
                               <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1" />
                               Deleting...
                             </>
                           ) : (
                             <>
                               <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                               <span className="hidden sm:inline ml-1">Delete</span>
                             </>
                           )}
                         </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Survey Options - Only show when expanded */}
              {isExpanded && (
                <div className="p-3 sm:p-4 space-y-3">
                  {survey.options.map((option) => (
                    <SurveyOption
                      key={option.id}
                      option={option}
                      isClosed={isClosed}
                      totalVotes={totalVotes}
                      isExpanded={isExpanded}
                      expandedVoteDetails={expandedVoteDetails}
                      voterDetails={voterDetails}
                      loadingVoterDetails={loadingVoterDetails}
                      onVote={handleVote}
                      onToggleVoteDetails={toggleVoteDetails}
                      calculateVotePercentage={calculateVotePercentage}
                    />
                  ))}

                  {/* Survey Footer - Only show when expanded */}
                  {isClosed && winning && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle className="h-4 w-5 text-green-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-gray-900 leading-tight">
                              Winner: {winning.accommodation_name}
                            </span>
                            <span className="text-xs text-gray-500 leading-tight block sm:inline sm:ml-2">
                              ({winning.vote_count} votes)
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleAddToAccommodations(survey)}
                          size="sm"
                          className="w-full sm:w-auto justify-center"
                          disabled={loadingAddToAccommodations.has(survey.id)}
                        >
                          {loadingAddToAccommodations.has(survey.id) ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <span className="hidden sm:inline">Add to Accommodations</span>
                              <span className="sm:hidden">Add to List</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
        ))}
      </StandardList>

      {/* Modals */}
      {isAddEditModalOpen && (
        <AddEditSurveyModal
          tripId={tripId}
          survey={editingSurvey}
          isOpen={isAddEditModalOpen}
          onClose={() => {
            setIsAddEditModalOpen(false);
            setEditingSurvey(null);
            setLoadingCreateSurvey(false);
          }}
          onSurveyCreated={handleSurveyCreated}
          onSurveyUpdated={handleSurveyUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingSurvey && (
        <ConfirmationModal
          isOpen={!!deletingSurvey}
          onClose={() => setDeletingSurvey(null)}
          onConfirm={() => {
            handleDeleteSurvey(deletingSurvey.id);
            setDeletingSurvey(null);
          }}
          title="Delete Survey"
          description={`Are you sure you want to delete "${deletingSurvey.name}"? This action cannot be undone and will remove all votes and options.`}
          confirmText="Delete Survey"
          cancelText="Cancel"
          variant="destructive"
          loading={loadingActions.has(`delete-${deletingSurvey?.id}`)}
        />
      )}

      {isAddAccommodationModalOpen && winningOption && (
        <AddAccommodationModal
          tripId={tripId}
          isOpen={isAddAccommodationModalOpen}
          onClose={() => {
            setIsAddAccommodationModalOpen(false);
            setWinningOption(null);
          }}
          onAccommodationAdded={handleAccommodationAdded}
          prefilledData={winningOption}
        />
      )}
    </div>
  );
}
