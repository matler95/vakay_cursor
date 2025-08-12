// src/app/trip/[tripId]/_components/LocationManager.tsx
'use client';

import { Database } from '@/types/database.types';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteLocation } from '../actions';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Trash2, AlertTriangle, CopyCheck, X, MapPin, Edit } from 'lucide-react';
import { AddLocationModal } from './AddLocationModal';
import { EditLocationModal } from './EditLocationModal';
import { MultiEditLocationsModal } from './MultiEditLocationsModal';

type Location = Database['public']['Tables']['locations']['Row'];

interface LocationManagerProps {
  tripId: string;
  locations: Location[];
  onLocationsChange?: (locations: Location[]) => void;
}

export function LocationManager({ tripId, locations, onLocationsChange }: LocationManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<Location | null>(null);
  const [isMultiEditModalOpen, setIsMultiEditModalOpen] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleLocationAdded = () => {
    // Refresh the page to get updated locations
    router.refresh();
    
    // Also notify parent component if callback is provided
    if (onLocationsChange) {
      // We'll need to fetch the updated locations here
      // For now, just refresh the page
    }
  };

  const handleEditClick = (location: Location) => {
    setLocationToEdit(location);
    setIsEditModalOpen(true);
  };

  const handleLocationUpdated = () => {
    // Refresh the page to get updated locations
    router.refresh();
    
    // Also notify parent component if callback is provided
    if (onLocationsChange) {
      // We'll need to fetch the updated locations here
      // For now, just refresh the page
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

    if (locationToDelete.id === -1) {
      // Bulk delete
      for (const locationId of selectedLocations) {
        await deleteLocation(parseInt(locationId), tripId);
      }
      setSelectedLocations(new Set());
      setIsDeleteMode(false);
    } else {
      // Single delete
      await deleteLocation(locationToDelete.id, tripId);
    }

    setIsDeleting(false);
    setLocationToDelete(null);
    router.refresh();
  };

  const cancelDelete = () => {
    setLocationToDelete(null);
  };

  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" /> Locations
        </h2>
        <div className="flex items-center gap-1 sm:gap-2">
          {locations.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={toggleDeleteMode}
                size="sm"
                variant="outline"
                className="h-7 w-7 sm:h-8 sm:w-8 px-2 sm:px-3"
              >
                {isDeleteMode ? 
                <X className="h-3 w-3 sm:h-4 sm:w-4"/>:
                <CopyCheck className="h-3 w-3 sm:h-4 sm:w-4"/>}
              </Button>
              </TooltipTrigger>
            <TooltipContent>
              <p>{isDeleteMode ? 
                'Cancel':
                'Select locations'}
              </p>
            </TooltipContent>
          </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIsModalOpen(true)}
                size="sm"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add locations</p>
            </TooltipContent>
          </Tooltip>
          </div>
        </div>
        
      {/* Floating toolbar - appears when selections are made */}
      {isDeleteMode && selectedLocations.size > 0 && (
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
                  isDeleteMode && selectedLocations.has(location.id.toString()) 
                    ? 'bg-red-50 border-red-200' 
                    : ''
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  {isDeleteMode && (
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

                {!isDeleteMode && (
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => handleEditClick(location)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                          aria-label={`Edit ${location.name}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit {location.name}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => handleDeleteClick(location)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                          aria-label={`Delete ${location.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete {location.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No locations defined yet.</p>
            <p className="text-xs mt-1">Click the + button to add your first location.</p>
          </div>
        )}
      </div>

      {/* Add Location Modal */}
      <AddLocationModal
        tripId={tripId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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
      {locationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Location{locationToDelete.id === -1 ? 's' : ''}</h3>
                <p className="text-sm text-gray-600">
                  {locationToDelete.id === -1 
                    ? `Are you sure you want to delete ${selectedLocations.size} location${selectedLocations.size !== 1 ? 's' : ''}? This action cannot be undone.`
                    : `Are you sure you want to delete "${locationToDelete.name}"? This action cannot be undone.`
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={cancelDelete} variant="outline" className="flex-1" disabled={isDeleting}>
                Cancel
              </Button>
              <Button onClick={confirmDelete} variant="destructive" className="flex-1" disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}