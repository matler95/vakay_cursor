'use client';

import { Database } from '@/types/database.types';
import { useState, useEffect } from 'react';
import { updateTripDetails } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import Lottie from 'lottie-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCIES } from '@/lib/currency';

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    setIsSubmitting(true);
    setError(null);
    
    const formData = new FormData(event.currentTarget);
    
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
      {showSuccess ? (
        // Success animation view - no container
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
      ) : (
        // Form view
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Edit Trip Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="trip_id" value={trip.id} />
            
            <div className="space-y-2">
              <Label htmlFor="name">Trip Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={trip.name}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                name="destination"
                defaultValue={trip.destination || ''}
                placeholder="e.g., Rome, Italy"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  defaultValue={trip.start_date || ''}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  defaultValue={trip.end_date || ''}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="main_currency">Main Currency</Label>
              <Select name="main_currency" defaultValue={trip.main_currency || 'USD'}>
                <SelectTrigger>
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
            </div>

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

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
