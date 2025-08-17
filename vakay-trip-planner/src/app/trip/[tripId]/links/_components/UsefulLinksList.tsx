// Useful links list component
'use client';

import { Database } from '@/types/database.types';
import { Link as LinkIcon, MapPin, Phone, Star, Edit, Trash2, Search, ExternalLink, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { EditUsefulLinkModal } from './EditUsefulLinkModal';
import { DeleteUsefulLinkModal } from './DeleteUsefulLinkModal';

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
      <div className="p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <LinkIcon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No useful links yet</h3>
        <p className="text-gray-500 mb-4">
          Add your first useful link to start organizing your trip resources
        </p>
      </div>
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

      {/* Mobile cards */}
      <div className="sm:hidden space-y-4">
        {filteredSorted.map((link) => (
          <div key={link.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getCategoryIcon(link.category)}</span>
                  <h4 className="font-medium text-gray-900 truncate">{link.title}</h4>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getCategoryColor(link.category)}`}>
                  {getCategoryLabel(link.category)}
                </span>
              </div>
            </div>

            {link.description && (
              <p className="text-sm text-gray-600">{link.description}</p>
            )}

            <div className="space-y-2">
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

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(link.url, '_blank')}
                  className="p-0 text-gray-500"
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit
                </Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setEditingLink(link)} 
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400" 
                  aria-label="Edit">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setDeletingLink(link)} 
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50" 
                  aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Link</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Details</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSorted.map((link) => (
                <tr key={link.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 text-gray-600 mt-1">
                            <span className="text-lg">{getCategoryIcon(link.category)}</span>
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-gray-900 truncate max-w-[200px]">{link.title}</span>
                              {link.is_favorite && (
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                          </div>
                        </div>
                        {link.description && (
                          <p className="text-sm text-gray-500 mt-1 truncate max-w-[300px]">{link.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(link.category)}`}>
                      {getCategoryLabel(link.category)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      {link.address && (
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <MapPin className="h-3 w-3 text-gray-500" />
                          <span className="truncate max-w-[200px]">{link.address}</span>
                        </div>
                      )}
                      {link.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <Phone className="h-3 w-3 text-gray-500" />
                          <span>{link.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(link.url, '_blank')}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setEditingLink(link)} 
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setDeletingLink(link)} 
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
