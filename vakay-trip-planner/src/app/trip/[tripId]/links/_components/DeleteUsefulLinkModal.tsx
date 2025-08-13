// Delete useful link modal
'use client';

import { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Database } from '@/types/database.types';

type UsefulLink = Database['public']['Tables']['useful_links']['Row'];

interface DeleteUsefulLinkModalProps {
  link: UsefulLink;
  isOpen: boolean;
  onClose: () => void;
  onLinkDeleted: () => void;
}

export function DeleteUsefulLinkModal({
  link,
  isOpen,
  onClose,
  onLinkDeleted,
}: DeleteUsefulLinkModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/useful-links/${link.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onLinkDeleted();
        onClose();
      } else {
        console.error('Failed to delete useful link');
      }
    } catch (error) {
      console.error('Error deleting useful link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Delete Useful Link</h2>
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

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-3 mb-6">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Are you sure you want to delete this useful link?
              </h3>
              <p className="text-sm text-gray-600">
                This action cannot be undone. The link "{link.title}" will be permanently removed.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete Link'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
