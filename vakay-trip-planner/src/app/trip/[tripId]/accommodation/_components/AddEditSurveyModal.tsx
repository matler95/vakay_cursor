'use client';

import { useState, useEffect } from 'react';
import { Database } from '@/types/database.types';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  FormModal, 
  StandardInput, 
  StandardUrlInput, 
  FormSection, 
  FormRow 
} from '@/components/ui';

type Survey = Database['public']['Tables']['accommodation_surveys']['Row'] & {
  options: Array<Database['public']['Tables']['survey_options']['Row'] & {
    vote_count: number;
    user_has_voted: boolean;
  }>;
};

interface AddEditSurveyModalProps {
  tripId: string;
  survey?: Survey | null;
  isOpen: boolean;
  onClose: () => void;
  onSurveyCreated: () => void;
  onSurveyUpdated: () => void;
}

interface SurveyOption {
  accommodation_name: string;
  location: string;
  url: string;
}

export function AddEditSurveyModal({
  tripId,
  survey,
  isOpen,
  onClose,
  onSurveyCreated,
  onSurveyUpdated
}: AddEditSurveyModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    options: [{ accommodation_name: '', location: '', url: '' }] as SurveyOption[]
  });

  const isEditing = !!survey;

  useEffect(() => {
    if (isOpen && survey) {
      setFormData({
        name: survey.name,
        options: survey.options.map(opt => ({
          accommodation_name: opt.accommodation_name,
          location: opt.location || '',
          url: opt.url || ''
        }))
      });
    } else if (isOpen) {
      setFormData({
        name: '',
        options: [{ accommodation_name: '', location: '', url: '' }]
      });
    }
  }, [isOpen, survey]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOptionChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { accommodation_name: '', location: '', url: '' }]
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 1) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      alert('Please enter a survey name');
      return false;
    }

    if (formData.options.length === 0) {
      alert('Please add at least one option');
      return false;
    }

    for (const option of formData.options) {
      if (!option.accommodation_name.trim()) {
        alert('Please enter accommodation names for all options');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const url = isEditing 
        ? `/api/accommodation-surveys/${survey.id}`
        : '/api/accommodation-surveys';
      
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing 
        ? { name: formData.name, options: formData.options }
        : { tripId, name: formData.name, options: formData.options };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        if (isEditing) {
          onSurveyUpdated();
        } else {
          onSurveyCreated();
        }
      } else {
        const error = await response.json();
        alert(error.error || `Failed to ${isEditing ? 'update' : 'create'} survey`);
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert(`Failed to ${isEditing ? 'update' : 'create'} survey`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Survey' : 'Create Survey'}
      description={isEditing ? 'Update your accommodation survey' : 'Create a new accommodation survey for trip members to vote on'}
      size="xl"
      onSubmit={handleSubmit}
      submitText={isEditing ? 'Update Survey' : 'Create Survey'}
      cancelText="Cancel"
      loading={isLoading}
    >
      <div className="space-y-4 sm:space-y-6">
        <FormSection title="Survey Information">
          <StandardInput
            label="Survey Name"
            name="name"
            placeholder="e.g., Hotel Preferences for Paris"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
          />
        </FormSection>

        <FormSection title="Accommodation Options">
          <div className="space-y-3 sm:space-y-4">
            {formData.options.map((option, index) => (
              <div key={index} className="p-3 sm:p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base">Option {index + 1}</h4>
                  {formData.options.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="text-red-600 hover:text-red-700 h-8 px-2 py-1"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline ml-1">Remove</span>
                    </Button>
                  )}
                </div>
                
                <FormRow cols={2}>
                  <StandardInput
                    label="Accommodation Name"
                    name={`option-${index}-name`}
                    placeholder="e.g., Hotel ABC, Airbnb Downtown"
                    value={option.accommodation_name}
                    onChange={(e) => handleOptionChange(index, 'accommodation_name', e.target.value)}
                    required
                  />
                  
                  <StandardInput
                    label="Location"
                    name={`option-${index}-location`}
                    placeholder="e.g., 123 Main St, Downtown"
                    value={option.location}
                    onChange={(e) => handleOptionChange(index, 'location', e.target.value)}
                  />
                </FormRow>
                
                <StandardUrlInput
                  label="Website/Booking URL"
                  name={`option-${index}-url`}
                  placeholder="https://www.booking.com/..."
                  value={option.url}
                  onChange={(e) => handleOptionChange(index, 'url', e.target.value)}
                />
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addOption}
              className="w-full justify-center"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Option
            </Button>
          </div>
        </FormSection>
      </div>
    </FormModal>
  );
}
