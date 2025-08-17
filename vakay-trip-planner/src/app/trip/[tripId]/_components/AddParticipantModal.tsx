'use client';

import { useState } from 'react';
import { inviteUser } from '../actions';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, User, Crown } from 'lucide-react';
import { 
  FormModal, 
  StandardInput, 
  FormSection, 
  FormRow, 
  FormField 
} from '@/components/ui';

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
  const [participants, setParticipants] = useState<ParticipantEntry[]>([
    { id: '1', email: '', role: 'traveler' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string>('');

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessage('');
    
    // Filter out empty emails
    const validParticipants = participants.filter(p => p.email.trim() !== '');
    
    if (validParticipants.length === 0) {
      setIsSubmitting(false);
      setMessage('Please add at least one email address.');
      return;
    }

    try {
      // Submit each participant
      for (const participant of validParticipants) {
        const participantFormData = new FormData();
        participantFormData.append('email', participant.email.trim());
        participantFormData.append('trip_id', tripId);
        
        const result = await inviteUser(null, participantFormData);
        if (result.message && result.message.includes('error')) {
          throw new Error(result.message);
        }
      }
      
      setIsSubmitting(false);
      setMessage('Invitation sent!');
      setTimeout(() => {
        onParticipantAdded();
        onClose();
        // Reset form
        setParticipants([{ id: '1', email: '', role: 'traveler' }]);
        setMessage('');
      }, 1500);
    } catch (error) {
      setIsSubmitting(false);
      setMessage(error instanceof Error ? error.message : 'Failed to send invitations');
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Participants"
      description="Invite friends and family to join your trip. They'll receive an email invitation."
      size="lg"
      onSubmit={handleSubmit}
      submitText={`Send ${participants.filter(p => p.email.trim() !== '').length} Invite${participants.filter(p => p.email.trim() !== '').length !== 1 ? 's' : ''}`}
      cancelText="Cancel"
      loading={isSubmitting}
    >
      <div className="space-y-6">
        <div className="space-y-4">
          {participants.map((participant, index) => (
            <div key={participant.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <FormSection title={`Participant ${index + 1}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-600">Participant Details</span>
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
                
                <StandardInput
                  label="Email Address"
                  name={`email-${participant.id}`}
                  type="email"
                  placeholder="friend@example.com"
                  value={participant.email}
                  onChange={(e) => updateParticipantEntry(participant.id, 'email', e.target.value)}
                  required
                />

                <FormField label="Role">
                  <Select
                    value={participant.role}
                    onValueChange={(value) => updateParticipantEntry(participant.id, 'role', value)}
                  >
                    <SelectTrigger className="h-10">
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
                </FormField>
              </FormSection>
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

        {message && (
          <p className={`text-sm ${message.includes('error') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </div>
    </FormModal>
  );
}
