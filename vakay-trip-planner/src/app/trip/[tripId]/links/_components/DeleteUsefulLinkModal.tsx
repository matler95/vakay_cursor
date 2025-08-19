// Delete useful link modal
'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Database } from '@/types/database.types';
import { ConfirmationModal } from '@/components/ui';

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

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Useful Link"
      description={`Are you sure you want to delete this useful link? This action cannot be undone. The link "${link.title}" will be permanently removed.`}
      confirmText="Delete Link"
      cancelText="Cancel"
      variant="destructive"
      onConfirm={handleDelete}
      loading={isLoading}
    >
      {/* Link Details */}
      <div className="mb-6">
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Title:</span>
            <span>{link.title}</span>
          </div>
          {link.description && (
            <div className="flex justify-between">
              <span className="font-medium">Description:</span>
              <span className="text-sm text-gray-600">{link.description}</span>
            </div>
          )}
          {link.category && (
            <div className="flex justify-between">
              <span className="font-medium">Category:</span>
              <span className="capitalize">{link.category}</span>
            </div>
          )}
          {link.url && (
            <div className="flex justify-between">
              <span className="font-medium">URL:</span>
              <span className="text-sm text-blue-600 truncate max-w-[200px]">{link.url}</span>
            </div>
          )}
        </div>
      </div>
    </ConfirmationModal>
  );
}
