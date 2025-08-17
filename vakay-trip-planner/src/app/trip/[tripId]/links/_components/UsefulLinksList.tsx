// Useful links list component
'use client';

import { Database } from '@/types/database.types';
import { Link as LinkIcon, MapPin, Phone, Star, Edit, Trash2, Search, ExternalLink, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { EditUsefulLinkModal } from './EditUsefulLinkModal';
import { DeleteUsefulLinkModal } from './DeleteUsefulLinkModal';
import { 
  StandardList, 
  CompactRow, 
  EditButton, 
  DeleteButton,
  EmptyState
} from '@/components/ui';

type UsefulLink = Database['public']['Tables']['useful_links']['Row'];

interface UsefulLinksListProps {
  usefulLinks: UsefulLink[];
  tripId: string;
  onLinkUpdated: () => void;
}

export function UsefulLinksList({ 
  usefulLinks, 
  tripId,
  onLinkUpdated
}: UsefulLinksListProps) {
  const [editingLink, setEditingLink] = useState<UsefulLink | null>(null);
  const [deletingLink, setDeletingLink] = useState<UsefulLink | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'restaurant':
        return '🍽️';
      case 'accommodation':
        return '🏨';
      case 'poi':
        return '📍';
      case 'activity':
        return '🎯';
      case 'shopping':
        return '🛍️';
      case 'transport':
        return '🚌';
      default:
        return '🔗';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'restaurant':
        return 'Restaurant';
      case 'accommodation':
        return 'Accommodation';
      case 'poi':
        return 'Point of Interest';
      case 'activity':
        return 'Activity';
      case 'shopping':
        return 'Shopping';
      case 'transport':
        return 'Transport';
      default:
        return 'Other';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'restaurant':
        return 'bg-green-100 text-green-700';
      case 'accommodation':
        return 'bg-indigo-100 text-indigo-700';
      case 'poi':
        return 'bg-blue-100 text-blue-700';
      case 'activity':
        return 'bg-purple-100 text-purple-700';
      case 'shopping':
        return 'bg-pink-100 text-pink-700';
      case 'transport':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredSorted = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const filtered = usefulLinks.filter((link) => {
      if (!term) return true;
      return (
        link.title.toLowerCase().includes(term) ||
        link.description?.toLowerCase().includes(term) ||
        link.address?.toLowerCase().includes(term) ||
        link.category.toLowerCase().includes(term)
      );
    });
    // Sort by favorite first, then by creation date
    return filtered.sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    });
  }, [usefulLinks, searchTerm]);

  if (usefulLinks.length === 0) {
    return (
      <EmptyState
        icon={LinkIcon}
        title="No useful links yet"
        description="Add your first useful link to start organizing your trip resources"
      />
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      {/* Search */}
      <div className="mb-4">
        <div className="w-full sm:max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Standardized List */}
      <StandardList>
        {filteredSorted.map((link) => (
          <CompactRow
            key={link.id}
            leftIcon={<span className="text-lg">{getCategoryIcon(link.category)}</span>}
            clickable={false}
            actions={
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(link.url, '_blank')}
                  className="p-0 text-gray-500"
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit
                </Button>
                <EditButton 
                  onClick={() => setEditingLink(link)}
                  tooltip="Edit link"
                />
                <DeleteButton 
                  onClick={() => setDeletingLink(link)}
                  tooltip="Delete link"
                />
              </div>
            }
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900 truncate">{link.title}</h4>
                {link.is_favorite && (
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                )}
              </div>
              
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getCategoryColor(link.category)} mb-2 inline-block`}>
                {getCategoryLabel(link.category)}
              </span>
              
              {link.description && (
                <p className="text-sm text-gray-600 mb-2">{link.description}</p>
              )}
              
              <div className="space-y-1">
                {link.address && (
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <MapPin className="h-3.5 w-3.5 text-gray-500" />
                    <span className="truncate">{link.address}</span>
                  </div>
                )}
                {link.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <Phone className="h-3.5 w-3.5 text-gray-500" />
                    <span>{link.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </CompactRow>
        ))}
      </StandardList>

      {/* Modals */}
      {editingLink && (
        <EditUsefulLinkModal
          link={editingLink}
          isOpen={!!editingLink}
          onClose={() => setEditingLink(null)}
          onLinkUpdated={() => {
            setEditingLink(null);
            onLinkUpdated();
          }}
        />
      )}

      {deletingLink && (
        <DeleteUsefulLinkModal
          link={deletingLink}
          isOpen={!!deletingLink}
          onClose={() => setDeletingLink(null)}
          onLinkDeleted={() => {
            setDeletingLink(null);
            onLinkUpdated();
          }}
        />
      )}
    </div>
  );
}
