'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Database } from '@/types/database.types';
import { ClipboardList, Plus, ArrowLeft, Edit, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StandardList } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import { CompactRow } from '@/components/ui/standard-lists';
import { AddEditSurveyModal } from './AddEditSurveyModal';
import { DeleteSurveyModal } from './DeleteSurveyModal';
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddAccommodationModalOpen, setIsAddAccommodationModalOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [deletingSurvey, setDeletingSurvey] = useState<Survey | null>(null);
  const [winningOption, setWinningOption] = useState<any>(null);

  useEffect(() => {
    fetchSurveys();
  }, [tripId]);

  const fetchSurveys = async () => {
    try {
      const response = await fetch(`/api/accommodation-surveys?tripId=${tripId}`);
      if (response.ok) {
        const data = await response.json();
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

  const handleVote = async (optionId: string, action: 'vote' | 'unvote') => {
    try {
      const response = await fetch('/api/accommodation-surveys/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId, action })
      });

      if (response.ok) {
        await fetchSurveys();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update vote');
      }
    } catch (error) {
      console.error('Error updating vote:', error);
      alert('Failed to update vote');
    }
  };

  const handleCloseSurvey = async (surveyId: string) => {
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
    }
  };

  const handleAddToAccommodations = (survey: Survey) => {
    // Find the winning option (highest vote count)
    const winning = survey.options.reduce((prev, current) => 
      (current.vote_count > prev.vote_count) ? current : prev
    );
    
    setWinningOption({
      name: winning.accommodation_name,
      address: winning.location || '',
      booking_url: winning.url || ''
    });
    setIsAddAccommodationModalOpen(true);
  };

  const getWinningOption = (survey: Survey) => {
    if (survey.options.length === 0) return null;
    return survey.options.reduce((prev, current) => 
      (current.vote_count > prev.vote_count) ? current : prev
    );
  };

  const handleSurveyCreated = async () => {
    setIsAddEditModalOpen(false);
    setEditingSurvey(null);
    await fetchSurveys();
  };

  const handleSurveyUpdated = async () => {
    setIsAddEditModalOpen(false);
    setEditingSurvey(null);
    await fetchSurveys();
  };

  const handleSurveyDeleted = async () => {
    setIsDeleteModalOpen(false);
    setDeletingSurvey(null);
    await fetchSurveys();
  };

  const handleAccommodationAdded = async () => {
    setIsAddAccommodationModalOpen(false);
    setWinningOption(null);
    // Navigate back to accommodation view after adding
    router.push(`/trip/${tripId}/accommodation`);
  };

  const openEditModal = (survey: Survey) => {
    setEditingSurvey(survey);
    setIsAddEditModalOpen(true);
  };

  const openDeleteModal = (survey: Survey) => {
    setDeletingSurvey(survey);
    setIsDeleteModalOpen(true);
  };

  const handleBackToAccommodation = () => {
    router.push(`/trip/${tripId}?tab=accommodation`);
  };

  const emptyState = (
    <EmptyState
      icon={ClipboardList}
      title="No surveys yet"
      description="Create your first accommodation survey to get started."
    />
  );

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
            onClick={() => setIsAddEditModalOpen(true)} 
            size="sm"
            className="w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Create Survey</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>
      </div>

      {/* Surveys List */}
      <StandardList 
        emptyState={emptyState}
        loading={isLoading}
        loadingMessage="Loading surveys..."
      >
        {surveys.map((survey) => {
          const winning = getWinningOption(survey);
          const isOwner = survey.created_by === currentUserId;
          const isClosed = survey.status === 'closed';

          return (
            <div key={survey.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Survey Header */}
              <div className="px-3 sm:px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base leading-tight truncate">
                      {survey.name}
                    </h3>
                    <Badge variant={survey.status === 'open' ? 'default' : 'secondary'} className="w-fit">
                      {survey.status === 'open' ? 'Open' : 'Closed'}
                    </Badge>
                  </div>
                  {isOwner && (
                    <div className="flex flex-wrap gap-2">
                      {survey.status === 'open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCloseSurvey(survey.id)}
                          className="text-xs px-2 py-1 h-8"
                        >
                          <span className="hidden sm:inline">Close Survey</span>
                          <span className="sm:hidden">Close</span>
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
                        onClick={() => openDeleteModal(survey)}
                        className="text-xs px-2 py-1 h-8"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline ml-1">Delete</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Survey Options */}
              <div className="p-3 sm:p-4 space-y-3">
                {survey.options.map((option) => (
                  <CompactRow
                    key={option.id}
                    className="justify-between"
                    border={false}
                    padding="sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm leading-tight truncate">
                        {option.accommodation_name}
                      </div>
                      {option.location && (
                        <div className="text-xs text-gray-500 leading-tight truncate mt-1">
                          {option.location}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <div className="text-center">
                        <div className="text-base sm:text-lg font-bold text-blue-600">
                          {option.vote_count}
                        </div>
                        <div className="text-xs text-gray-500 leading-tight">votes</div>
                      </div>
                      {!isClosed && (
                        <Button
                          variant={option.user_has_voted ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => handleVote(
                            option.id, 
                            option.user_has_voted ? 'unvote' : 'vote'
                          )}
                          disabled={!isOwner && option.user_has_voted}
                          className="text-xs px-3 py-1 h-8 min-w-[60px]"
                        >
                          {option.user_has_voted ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Voted</span>
                              <span className="sm:hidden">✓</span>
                            </>
                          ) : (
                            'Vote'
                          )}
                        </Button>
                      )}
                    </div>
                  </CompactRow>
                ))}

                {/* Survey Footer */}
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
                      >
                        <span className="hidden sm:inline">Add to Accommodations</span>
                        <span className="sm:hidden">Add to List</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
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
          }}
          onSurveyCreated={handleSurveyCreated}
          onSurveyUpdated={handleSurveyUpdated}
        />
      )}

      {isDeleteModalOpen && deletingSurvey && (
        <DeleteSurveyModal
          survey={deletingSurvey}
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingSurvey(null);
          }}
          onSurveyDeleted={handleSurveyDeleted}
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
