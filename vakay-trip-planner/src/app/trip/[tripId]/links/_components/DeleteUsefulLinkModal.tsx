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
      description={`Are you sure you want to delete the useful link "${link.title}"? This action cannot be undone. The link will be permanently removed.${link.description ? ` Description: ${link.description}` : ''}${link.category ? ` Category: ${link.category}` : ''}${link.url ? ` URL: ${link.url}` : ''}`}
      confirmText="Delete Link"
      cancelText="Cancel"
      variant="destructive"
      onConfirm={handleDelete}
      loading={isLoading}
    />
  );
}
