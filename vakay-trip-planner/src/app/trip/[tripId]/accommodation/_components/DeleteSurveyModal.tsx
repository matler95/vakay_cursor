'use client';

import { useState } from 'react';
import { Database } from '@/types/database.types';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StandardModal } from '@/components/ui/standard-modal';

type Survey = Database['public']['Tables']['accommodation_surveys']['Row'] & {
  options: Array<Database['public']['Tables']['survey_options']['Row'] & {
    vote_count: number;
    user_has_voted: boolean;
  }>;
};

interface DeleteSurveyModalProps {
  survey: Survey;
  isOpen: boolean;
  onClose: () => void;
  onSurveyDeleted: () => void;
}

export function DeleteSurveyModal({
  survey,
  isOpen,
  onClose,
  onSurveyDeleted
}: DeleteSurveyModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/accommodation-surveys/${survey.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onSurveyDeleted();
      } else {
        alert('Failed to delete survey');
      }
    } catch (error) {
      console.error('Error deleting survey:', error);
      alert('Failed to delete survey');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Survey"
      description="Are you sure you want to delete this survey? This action cannot be undone."
      size="md"
      showFooter={false}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-800">
            <p className="font-medium">This will permanently delete:</p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>The survey "{survey.name}"</li>
              <li>All {survey.options.length} accommodation options</li>
              <li>All votes cast by participants</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Survey'}
          </Button>
        </div>
      </div>
    </StandardModal>
  );
}
