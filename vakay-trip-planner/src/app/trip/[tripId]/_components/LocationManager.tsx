// src/app/trip/[tripId]/_components/LocationManager.tsx
'use client';

import { Database } from '@/types/database.types';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteLocation } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EditButton, DeleteButton, EmptyState } from '@/components/ui';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Trash2, AlertTriangle, CopyCheck, X, MapPin, Edit } from 'lucide-react';
import { AddLocationModal } from './AddLocationModal';
import { EditLocationModal } from './EditLocationModal';
import { MultiEditLocationsModal } from './MultiEditLocationsModal';
import { ConfirmationModal } from '@/components/ui';

type Location = Database['public']['Tables']['locations']['Row'];

interface LocationManagerProps {
  tripId: string;
  locations: Location[];
  onLocationsChange?: (locations: Location[]) => void;
  isDeleteMode?: boolean;
  setIsDeleteMode?: (value: boolean) => void;
  isAddLocationModalOpen?: boolean;
  setIsAddLocationModalOpen?: (value: boolean) => void;
}

export function LocationManager({ tripId, locations, onLocationsChange, isDeleteMode, setIsDeleteMode, isAddLocationModalOpen, setIsAddLocationModalOpen }: LocationManagerProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<Location | null>(null);
  const [isMultiEditModalOpen, setIsMultiEditModalOpen] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // Use props if provided, otherwise fall back to internal state
  const deleteMode = isDeleteMode ?? false;
  const setDeleteMode = setIsDeleteMode ?? (() => {});
  const addModalOpen = isAddLocationModalOpen ?? false;
  const setAddModalOpen = setIsAddLocationModalOpen ?? (() => {});

  const handleLocationAdded = async () => {
    console.log('Location added, calling onLocationsChange callback...');
    // Call the parent callback to refresh locations data
    if (onLocationsChange) {
      console.log('onLocationsChange callback exists, calling it...');
      await onLocationsChange(locations);
      console.log('onLocationsChange callback completed');
    } else {
      console.log('No onLocationsChange callback provided');
    }
  };

  const handleEditClick = (location: Location) => {
    setLocationToEdit(location);
    setIsEditModalOpen(true);
  };

  const handleLocationUpdated = async () => {
    console.log('Location updated, calling onLocationsChange callback...');
    // Call the parent callback to refresh locations data
    if (onLocationsChange) {
      console.log('onLocationsChange callback exists, calling it...');
      await onLocationsChange(locations);
      console.log('onLocationsChange callback completed');
    } else {
      console.log('No onLocationsChange callback provided');
    }
  };

  const handleMultiEditClick = () => {
    if (selectedLocations.size > 0) {
      setIsMultiEditModalOpen(true);
    }
  };

  const handleDeleteClick = (location: Location) => {
    setLocationToDelete(location);
  };

  const handleBulkDeleteClick = () => {
    if (selectedLocations.size > 0) {
      setLocationToDelete({ id: -1, name: `${selectedLocations.size} locations`, color: '', trip_id: tripId } as Location);
    }
  };

  const confirmDelete = async () => {
    if (!locationToDelete) return;

    setIsDeleting(true);

    try {
      if (locationToDelete.id === -1) {
        // Bulk delete
        for (const locationId of selectedLocations) {
          await deleteLocation(parseInt(locationId), tripId);
        }
        setSelectedLocations(new Set());
        setDeleteMode(false);
      } else {
        // Single delete
        await deleteLocation(locationToDelete.id, tripId);
      }

      // Call the parent callback to refresh locations data
      if (onLocationsChange) {
        console.log('Location deleted, calling onLocationsChange callback...');
        await onLocationsChange(locations);
      }
    } catch (error) {
      console.error('Error deleting location(s):', error);
    } finally {
      setIsDeleting(false);
      setLocationToDelete(null);
    }
  };

  const cancelDelete = () => {
    setLocationToDelete(null);
  };

  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
    setSelectedLocations(new Set());
  };

  const toggleLocationSelection = (locationId: string) => {
    const newSelected = new Set(selectedLocations);
    if (newSelected.has(locationId)) {
      newSelected.delete(locationId);
    } else {
      newSelected.add(locationId);
    }
    setSelectedLocations(newSelected);
  };

  const selectAll = () => {
    setSelectedLocations(new Set(locations.map(loc => loc.id.toString())));
  };

  const deselectAll = () => {
    setSelectedLocations(new Set());
  };

  return (
    <div className="space-y-4">

        
      {/* Floating toolbar - appears when selections are made */}
      {deleteMode && selectedLocations.size > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-4 max-w-[calc(100vw-2rem)]">
            <div className="flex items-center gap-1 sm:gap-2">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
              <span className="text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                {selectedLocations.size} location{selectedLocations.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                onClick={selectAll}
                size="sm"
                variant="outline"
                className="h-6 sm:h-7 px-1 sm:px-2 text-xs"
              >
                All
              </Button>
              <Button
                onClick={deselectAll}
                size="sm"
                variant="outline"
                className="h-6 sm:h-7 px-1 sm:px-2 text-xs"
              >
                Clear
              </Button>
              <Button
                onClick={handleMultiEditClick}
                size="sm"
                variant="outline"
                className="h-6 sm:h-7 px-2 sm:px-3 text-xs"
              >
                Edit
              </Button>
              <Button
                onClick={handleBulkDeleteClick}
                size="sm"
                variant="destructive"
                className="h-6 sm:h-7 px-2 sm:px-3 text-xs"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* List of existing locations */}
      <div className="space-y-2">
        {locations.length > 0 ? (
          <div className="space-y-2">
            {locations.map((location) => (
              <div
                key={location.id}
                className={`flex items-center justify-between p-2 sm:p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors ${
                  deleteMode && selectedLocations.has(location.id.toString()) 
                    ? 'bg-red-50 border-red-200' 
                    : ''
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  {deleteMode && (
                    <input
                      type="checkbox"
                      checked={selectedLocations.has(location.id.toString())}
                      onChange={() => toggleLocationSelection(location.id.toString())}
                      className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                  )}
                  <div
                    className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: location.color }}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 text-sm sm:text-base">{location.name}</span>
                    {location.description && (
                      <span className="text-xs text-gray-500 mt-1">{location.description}</span>
                    )}
                  </div>
                </div>

                {!deleteMode && (
                  <div className="flex items-center gap-1">
                    <EditButton
                      onClick={() => handleEditClick(location)}
                      tooltip={`Edit ${location.name}`}
                    />
                    <DeleteButton
                      onClick={() => handleDeleteClick(location)}
                      tooltip={`Delete ${location.name}`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={MapPin}
            title="No locations defined yet"
            description="Click the + button to add your first location."
          />
        )}
      </div>

      {/* Add Location Modal */}
      <AddLocationModal
        tripId={tripId}
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onLocationAdded={handleLocationAdded}
      />

      {/* Edit Location Modal */}
      {locationToEdit && (
        <EditLocationModal
          location={locationToEdit}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setLocationToEdit(null);
          }}
          onLocationUpdated={handleLocationUpdated}
        />
      )}

      {/* Multi-Edit Locations Modal */}
      {isMultiEditModalOpen && (
        <MultiEditLocationsModal
          tripId={tripId}
          selectedLocationIds={Array.from(selectedLocations)}
          locations={locations}
          isOpen={isMultiEditModalOpen}
          onClose={() => {
            setIsMultiEditModalOpen(false);
            setSelectedLocations(new Set());
          }}
          onLocationsUpdated={handleLocationUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!locationToDelete}
        onClose={() => setLocationToDelete(null)}
        title={`Delete Location${locationToDelete?.id === -1 ? 's' : ''}`}
        description={
          locationToDelete?.id === -1 
            ? `Are you sure you want to delete ${selectedLocations.size} location${selectedLocations.size !== 1 ? 's' : ''}? This action cannot be undone.`
            : `Are you sure you want to delete "${locationToDelete?.name}"? This action cannot be undone.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </div>
  );
}