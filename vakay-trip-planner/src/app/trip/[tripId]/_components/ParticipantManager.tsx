// src/app/trip/[tripId]/_components/ParticipantManager.tsx
'use client';


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { removeParticipant, removeMultipleParticipants } from '../actions';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Trash2, UserRoundPlus, UsersRound, Crown, User, AlertTriangle } from 'lucide-react';
import { AddParticipantModal } from './AddParticipantModal';
import { ConfirmationModal } from '@/components/ui';
import { EditButton, DeleteButton, EmptyState } from '@/components/ui';


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
  onParticipantsChange?: (participants: Participant[]) => void;
  isDeleteMode?: boolean;
  setIsDeleteMode?: (value: boolean) => void;
  isAddParticipantModalOpen?: boolean;
  setIsAddParticipantModalOpen?: (value: boolean) => void;
}

export function ParticipantManager({ tripId, participants, currentUserRole, onParticipantsChange, isDeleteMode, setIsDeleteMode, isAddParticipantModalOpen, setIsAddParticipantModalOpen }: ParticipantManagerProps) {
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // Use props if provided, otherwise fall back to internal state
  const deleteMode = isDeleteMode ?? false;
  const setDeleteMode = setIsDeleteMode ?? (() => {});
  const addModalOpen = isAddParticipantModalOpen ?? false;
  const setAddModalOpen = setIsAddParticipantModalOpen ?? (() => {});

  const isAdmin = currentUserRole === 'admin';

  const handleParticipantAdded = async () => {
    // Call the parent callback to refresh participants data
    if (onParticipantsChange) {
      await onParticipantsChange(participants);
    }
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
        setDeleteMode(false);
      } else {
        const result = await removeParticipant(participantToDelete.profiles.id, tripId);
        if (result?.message) {
          // Success message handled by server action
        }
      }

      // Call the parent callback to refresh participants data
      if (onParticipantsChange) {
        await onParticipantsChange(participants);
      }
    } catch (error) {
      console.error('Error removing participant(s):', error);
    } finally {
      setIsDeleting(false);
      setParticipantToDelete(null);
    }
  };

  const cancelDelete = () => {
    setParticipantToDelete(null);
  };

  const toggleDeleteMode = () => {
    if (!isAdmin) return;
    setDeleteMode(!deleteMode);
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

      {/* Floating toolbar - appears when selections are made */}
      {isAdmin && deleteMode && selectedParticipants.size > 0 && (
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
                  isAdmin && deleteMode && selectedParticipants.has(participant.profiles.id) 
                    ? 'bg-red-50 border-red-200' 
                    : ''
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  {isAdmin && deleteMode && (
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
                  {isAdmin && !deleteMode && (
                    <DeleteButton
                      onClick={() => handleDeleteClick(participant)}
                      tooltip={`Remove ${participant.profiles?.full_name || 'participant'}`}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={UsersRound}
            title="No participants yet"
            description="Click the + button to invite your first participant."
          />
        )}
      </div>

      {/* Add Participant Modal */}
      <AddParticipantModal
        tripId={tripId}
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onParticipantAdded={handleParticipantAdded}
      />

      {/* Delete Confirmation Modal (admins only) */}
      <ConfirmationModal
        isOpen={isAdmin && !!participantToDelete}
        onClose={() => setParticipantToDelete(null)}
        title={`Remove Participant${participantToDelete?.profiles.id === '-1' ? 's' : ''}`}
        description={
          participantToDelete?.profiles.id === '-1' 
            ? `Are you sure you want to remove ${selectedParticipants.size} participant${selectedParticipants.size !== 1 ? 's' : ''} from this trip? This action cannot be undone.`
            : `Are you sure you want to remove "${participantToDelete?.profiles?.full_name || 'this participant'}" from this trip? This action cannot be undone.`
        }
        confirmText="Remove"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </div>
  );
}