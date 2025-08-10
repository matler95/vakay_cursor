'use client';

import { useState, useEffect } from 'react';
import { Database } from '@/types/database.types';
import { X, Bed, Calendar, FileText, FileEdit, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Add missing type alias for Accommodation
type Accommodation = Database['public']['Tables']['accommodations']['Row'];

type ParticipantOption = { id: string; name: string };

interface EditAccommodationModalProps {
  accommodation: Accommodation;
  isOpen: boolean;
  onClose: () => void;
  onAccommodationUpdated: () => void;
}

export function EditAccommodationModal({
  accommodation,
  isOpen,
  onClose,
  onAccommodationUpdated
}: EditAccommodationModalProps) {
  const supabase = createClientComponentClient<Database>();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({});

  const [participantOptions, setParticipantOptions] = useState<ParticipantOption[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (accommodation) {
      setFormData({
        name: accommodation.name,
        address: accommodation.address,
        check_in_date: accommodation.check_in_date,
        check_in_time: accommodation.check_in_time,
        check_out_date: accommodation.check_out_date,
        check_out_time: accommodation.check_out_time,
        booking_confirmation: accommodation.booking_confirmation,
        booking_url: (accommodation as any).booking_url || '',
        contact_phone: accommodation.contact_phone,
        notes: accommodation.notes
      });
    }
  }, [accommodation]);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      // Load trip id for this accommodation
      const { data: acc } = await supabase
        .from('accommodations')
        .select('trip_id')
        .eq('id', accommodation.id)
        .single();
      if (!acc) return;
      const { data: tp } = await supabase
        .from('trip_participants')
        .select('user_id')
        .eq('trip_id', acc.trip_id);
      const ids = (tp || []).map(p => p.user_id);
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', ids);
        setParticipantOptions((profiles || []).map(p => ({ id: p.id, name: p.full_name || 'Unknown' })));
      }
      // Load selected participants
      const { data: aps } = await supabase
        .from('accommodation_participants')
        .select('participant_user_id')
        .eq('accommodation_id', accommodation.id);
      setSelectedParticipants(new Set((aps || []).map(r => r.participant_user_id)));
    };
    load();
  }, [isOpen, supabase, accommodation.id]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipants(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/accommodation/${accommodation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          participants: Array.from(selectedParticipants),
        }),
      });

      if (response.ok) {
        onAccommodationUpdated();
      } else {
        console.error('Failed to update accommodation');
        alert('Failed to update accommodation. Please try again.');
      }
    } catch (error) {
      console.error('Error updating accommodation:', error);
      alert('Failed to update accommodation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bed className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Accommodation</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <FileEdit className="h-4 w-4" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Accommodation Name *</Label>
                <Input
                  id="name"
                  value={(formData as any).name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Hotel name, Airbnb, etc."
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={(formData as any).address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Full address"
                  required
                />
              </div>
            </div>
          </div>

          {/* Check-in/Check-out */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Check-in & Check-out
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="check_in_date">Check-in Date *</Label>
                <Input
                  id="check_in_date"
                  type="date"
                  value={(formData as any).check_in_date || ''}
                  onChange={(e) => handleInputChange('check_in_date', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="check_out_date">Check-out Date *</Label>
                <Input
                  id="check_out_date"
                  type="date"
                  value={(formData as any).check_out_date || ''}
                  onChange={(e) => handleInputChange('check_out_date', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <Label>Participants</Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {participantOptions.map(p => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedParticipants.has(p.id)}
                    onChange={() => toggleParticipant(p.id)}
                  />
                  <span>{p.name}</span>
                </label>
              ))}
              {participantOptions.length === 0 && (
                <p className="text-sm text-gray-500">No participants found</p>
              )}
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Additional Details
            </h3>
            
            <div>
              <Label htmlFor="booking_confirmation">Booking Confirmation</Label>
              <Input
                id="booking_confirmation"
                value={(formData as any).booking_confirmation || ''}
                onChange={(e) => handleInputChange('booking_confirmation', e.target.value)}
                placeholder="Confirmation number"
              />
            </div>
            <div>
              <Label htmlFor="booking_url">Booking URL</Label>
              <Input
                id="booking_url"
                type="url"
                value={(formData as any).booking_url || ''}
                onChange={(e) => handleInputChange('booking_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
            
            <div>
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                value={(formData as any).contact_phone || ''}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                placeholder="Phone number"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={(formData as any).notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes, special requests, etc."
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? 'Updating...' : 'Update Accommodation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
