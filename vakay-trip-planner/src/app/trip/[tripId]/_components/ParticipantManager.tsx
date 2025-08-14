// src/app/trip/[tripId]/_components/ParticipantManager.tsx
'use client';


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { removeParticipant, removeMultipleParticipants } from '../actions';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Trash2, AlertTriangle, User, Crown, CopyCheck, X, UsersRound } from 'lucide-react';
import { AddParticipantModal } from './AddParticipantModal';


export type Participant = {
  role: string | null;
  profiles: {
    id: string;
    full_name: string | null;
  };
}

interface ParticipantManagerProps {
  tripId: string;
  participants: Participant[];
  currentUserRole: string | null;
}

export function ParticipantManager({ tripId, participants, currentUserRole }: ParticipantManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const isAdmin = currentUserRole === 'admin';

  const handleParticipantAdded = () => {
    router.refresh();
  };

  const handleDeleteClick = (participant: Participant) => {
    if (!isAdmin) return;
    setParticipantToDelete(participant);
  };

  const handleBulkDeleteClick = () => {
    if (!isAdmin) return;
    if (selectedParticipants.size > 0) {
      setParticipantToDelete({ 
        role: 'traveler', 
        profiles: { 
          id: '-1', 
          full_name: `${selectedParticipants.size} participants` 
        } 
      } as Participant);
    }
  };

  const confirmDelete = async () => {
    if (!participantToDelete || !isAdmin) return;

    setIsDeleting(true);

    try {
      if (participantToDelete.profiles.id === '-1') {
        const result = await removeMultipleParticipants(Array.from(selectedParticipants), tripId);
        if (result?.message) {
          // Success message handled by server action
        }
        setSelectedParticipants(new Set());
        setIsDeleteMode(false);
      } else {
        const result = await removeParticipant(participantToDelete.profiles.id, tripId);
        if (result?.message) {
          // Success message handled by server action
        }
      }
    } catch (error) {
      console.error('Error removing participant(s):', error);
    }

    setIsDeleting(false);
    setParticipantToDelete(null);
    router.refresh();
  };

  const cancelDelete = () => {
    setParticipantToDelete(null);
  };

  const toggleDeleteMode = () => {
    if (!isAdmin) return;
    setIsDeleteMode(!isDeleteMode);
    setSelectedParticipants(new Set());
  };

  const toggleParticipantSelection = (participantId: string) => {
    const newSelected = new Set(selectedParticipants);
    if (newSelected.has(participantId)) {
      newSelected.delete(participantId);
    } else {
      newSelected.add(participantId);
    }
    setSelectedParticipants(newSelected);
  };

  const selectAll = () => {
    setSelectedParticipants(new Set(participants.map(p => p.profiles.id)));
  };

  const deselectAll = () => {
    setSelectedParticipants(new Set());
  };

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'traveler':
        return 'Traveler';
      default:
        return 'Traveler';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          </h2>
        <div className="flex items-center gap-1 sm:gap-2">
          {isAdmin && participants.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={toggleDeleteMode}
                size="sm"
                variant="outline"
                className="h-7 w-7 sm:h-8 sm:w-8 px-2 sm:px-3"
              >
                {isDeleteMode ? 
                <X className="h-3 w-3 sm:h-4 sm:w-4"/>:
                <CopyCheck className="h-3 w-3 sm:h-4 sm:w-4"/>}
              </Button>
              </TooltipTrigger>
            <TooltipContent>
              <p>{isDeleteMode ? 
                'Cancel':
                'Select participants'}
              </p>
            </TooltipContent>
          </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIsModalOpen(true)}
                size="sm"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Invite participants</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Floating toolbar - appears when selections are made */}
      {isAdmin && isDeleteMode && selectedParticipants.size > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-4 max-w-[calc(100vw-2rem)]">
            <div className="flex items-center gap-1 sm:gap-2">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
              <span className="text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                {selectedParticipants.size} participant{selectedParticipants.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                onClick={selectAll}
                size="sm"
                variant="outline"
                className="h-6 sm:h-7 px-1 sm:px-2 text-xs"
              >
                All
              </Button>
              <Button
                onClick={deselectAll}
                size="sm"
                variant="outline"
                className="h-6 sm:h-7 px-1 sm:px-2 text-xs"
              >
                Clear
              </Button>
              <Button
                onClick={handleBulkDeleteClick}
                size="sm"
                variant="destructive"
                className="h-6 sm:h-7 px-2 sm:px-3 text-xs"
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* List of existing participants */}
      <div className="space-y-2">
        {participants.length > 0 ? (
          <div className="space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.profiles?.id}
                className={`flex items-center justify-between p-2 sm:p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors ${
                  isAdmin && isDeleteMode && selectedParticipants.has(participant.profiles.id) 
                    ? 'bg-red-50 border-red-200' 
                    : ''
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  {isAdmin && isDeleteMode && (
                    <input
                      type="checkbox"
                      checked={selectedParticipants.has(participant.profiles.id)}
                      onChange={() => toggleParticipantSelection(participant.profiles.id)}
                      className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                  )}
                  <div className="scale-75 sm:scale-100">
                    {getRoleIcon(participant.role)}
                  </div>
                  <span className="font-medium text-gray-900 text-sm sm:text-base">
                    {participant.profiles?.full_name || 'New User'}
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm text-gray-500 capitalize">
                    {getRoleLabel(participant.role)}
                  </span>
                  {isAdmin && !isDeleteMode && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => handleDeleteClick(participant)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                          aria-label={`Remove ${participant.profiles?.full_name || 'participant'}`}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Remove {participant.profiles?.full_name || 'participant'}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No participants yet.</p>
            <p className="text-xs mt-1">Click the + button to invite your first participant.</p>
          </div>
        )}
      </div>

      {/* Add Participant Modal */}
      <AddParticipantModal
        tripId={tripId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onParticipantAdded={handleParticipantAdded}
      />

      {/* Delete Confirmation Modal (admins only) */}
      {isAdmin && participantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Remove Participant{participantToDelete.profiles.id === '-1' ? 's' : ''}</h3>
                <p className="text-sm text-gray-600">
                  {participantToDelete.profiles.id === '-1' 
                    ? `Are you sure you want to remove ${selectedParticipants.size} participant${selectedParticipants.size !== 1 ? 's' : ''} from this trip? This action cannot be undone.`
                    : `Are you sure you want to remove "${participantToDelete.profiles?.full_name || 'this participant'}" from this trip? This action cannot be undone.`
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={cancelDelete}
                variant="outline"
                className="flex-1"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                variant="destructive"
                className="flex-1"
                disabled={isDeleting}
              >
                {isDeleting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> : null}
                {isDeleting ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}