'use client';

import { Database } from '@/types/database.types';
import { useState, useEffect } from 'react';
import { updateTripDetails } from '../actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import Lottie from 'lottie-react';
import { CURRENCIES } from '@/lib/currency';
import { 
  FormModal, 
  StandardInput, 
  StandardDateInput, 
  FormSection, 
  FormRow, 
  FormField 
} from '@/components/ui';

type Trip = Database['public']['Tables']['trips']['Row'];

interface EditTripModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onTripUpdated: () => void;
}

export function EditTripModal({ trip, isOpen, onClose, onTripUpdated }: EditTripModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [animationData, setAnimationData] = useState(null);
  const [isAnimationReady, setIsAnimationReady] = useState(false);

  // Load the Lottie animation data immediately when component mounts
  useEffect(() => {
    const loadAnimation = async () => {
      try {
        const response = await fetch('/success.json');
        const data = await response.json();
        setAnimationData(data);
        setIsAnimationReady(true);
      } catch (error) {
        console.error('Failed to load animation:', error);
        // Fallback: still allow success state even if animation fails
        setIsAnimationReady(true);
      }
    };
    loadAnimation();
  }, []);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Add a longer delay to ensure the spinner shows
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const result = await updateTripDetails(null, formData);
      
      if (result.status === 'success') {
        // Only show success if animation is ready
        if (isAnimationReady) {
          setShowSuccess(true);
        } else {
          // Wait for animation to be ready
          const checkAnimation = setInterval(() => {
            if (isAnimationReady) {
              setShowSuccess(true);
              clearInterval(checkAnimation);
            }
          }, 50);
        }
      } else {
        setError(result.message || 'Failed to update trip');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnimationComplete = () => {
    onClose();
    onTripUpdated();
    setShowSuccess(false);
    setMessage('');
  };

  // Clear error when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsSubmitting(false);
      setShowSuccess(false);
    }
  }, [isOpen]);

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
        {/* Success animation view - no container */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-32 h-32 mb-4">
            {animationData && (
              <Lottie 
                animationData={animationData}
                loop={false}
                autoplay={true}
                onComplete={handleAnimationComplete}
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </div>
          <h2 className="text-xl font-semibold text-green-800 mb-2">Success!</h2>
        </div>
      </div>
    );
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Trip Details"
      description="Update your trip information and settings."
      size="md"
      onSubmit={handleSubmit}
      submitText="Save Changes"
      cancelText="Cancel"
      loading={isSubmitting}
    >
      <div className="space-y-6">
        <input type="hidden" name="trip_id" value={trip.id} />
        
        <FormSection title="Basic Information">
          <StandardInput
            label="Trip Name"
            name="name"
            defaultValue={trip.name}
            required
          />

          <StandardInput
            label="Destination"
            name="destination"
            defaultValue={trip.destination || ''}
            placeholder="e.g., Rome, Italy"
          />
        </FormSection>

        <FormSection title="Dates">
          <FormRow cols={2}>
            <StandardDateInput
              label="Start Date"
              name="start_date"
              defaultValue={trip.start_date || ''}
              required
            />
            
            <StandardDateInput
              label="End Date"
              name="end_date"
              defaultValue={trip.end_date || ''}
              required
            />
          </FormRow>
        </FormSection>

        <FormSection title="Settings">
          <FormField label="Main Currency">
            <Select name="main_currency" defaultValue={trip.main_currency || 'USD'}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{currency.symbol}</span>
                      <span>{currency.code}</span>
                      <span className="text-gray-500">- {currency.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </FormSection>

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}
        
        {message && (
          <p className={`text-sm ${message.includes('error') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </div>
    </FormModal>
  );
}
