'use client';

import { Database } from '@/types/database.types';
import { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { inviteUser } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Trash2, User, Crown } from 'lucide-react';

type Participant = {
  role: string | null;
  profiles: {
    id: string;
    full_name: string | null;
  };
}

interface AddParticipantModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  onParticipantAdded: () => void;
}

interface ParticipantEntry {
  id: string;
  email: string;
  role: string;
}

const roles = [
  { value: 'traveler', label: 'Traveler', icon: User },
  { value: 'admin', label: 'Admin', icon: Crown }
];

export function AddParticipantModal({ tripId, isOpen, onClose, onParticipantAdded }: AddParticipantModalProps) {
  const [state, formAction] = useActionState(inviteUser, { message: '' });
  const [participants, setParticipants] = useState<ParticipantEntry[]>([
    { id: '1', email: '', role: 'traveler' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addParticipantEntry = () => {
    const newId = (participants.length + 1).toString();
    setParticipants([...participants, { id: newId, email: '', role: 'traveler' }]);
  };

  const removeParticipantEntry = (id: string) => {
    if (participants.length > 1) {
      setParticipants(participants.filter(p => p.id !== id));
    }
  };

  const updateParticipantEntry = (id: string, field: 'email' | 'role', value: string) => {
    setParticipants(participants.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    
    // Filter out empty emails
    const validParticipants = participants.filter(p => p.email.trim() !== '');
    
    if (validParticipants.length === 0) {
      setIsSubmitting(false);
      return;
    }

    // Submit each participant
    for (const participant of validParticipants) {
      const participantFormData = new FormData();
      participantFormData.append('email', participant.email.trim());
      participantFormData.append('trip_id', tripId);
      
      await formAction(participantFormData);
    }

    setIsSubmitting(false);
    onParticipantAdded();
    onClose();
    // Reset form
    setParticipants([{ id: '1', email: '', role: 'traveler' }]);
  };

  // Watch for successful state changes
  useEffect(() => {
    if (state?.message && !state.message.includes('error')) {
      // Success - refresh participants
      onParticipantAdded();
    }
  }, [state, onParticipantAdded]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 p-6 border border-gray-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Invite Participants</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {participants.map((participant, index) => (
              <div key={participant.id} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex-grow space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Participant {index + 1}</span>
                    {participants.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParticipantEntry(participant.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`email-${participant.id}`}>Email Address</Label>
                    <Input
                      id={`email-${participant.id}`}
                      name={`email-${participant.id}`}
                      type="email"
                      placeholder="friend@example.com"
                      value={participant.email}
                      onChange={(e) => updateParticipantEntry(participant.id, 'email', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={participant.role}
                      onValueChange={(value) => updateParticipantEntry(participant.id, 'role', value)}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const role = roles.find(r => r.value === participant.role);
                              const Icon = role?.icon || User;
                              return (
                                <>
                                  <Icon className="h-4 w-4" />
                                  <span>{role?.label || 'Traveler'}</span>
                                </>
                              );
                            })()}
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => {
                          const Icon = role.icon;
                          return (
                            <SelectItem key={role.value} value={role.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{role.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addParticipantEntry}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Participant
          </Button>

          {state?.message && (
            <p className={`text-sm ${state.message.includes('error') ? 'text-red-600' : 'text-green-600'}`}>
              {state.message}
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || participants.every(p => p.email.trim() === '')}
              className="flex-1"
            >
              {isSubmitting ? 'Sending...' : `Send ${participants.filter(p => p.email.trim() !== '').length} Invite${participants.filter(p => p.email.trim() !== '').length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
