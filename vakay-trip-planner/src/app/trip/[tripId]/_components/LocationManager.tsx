// src/app/trip/[tripId]/_components/LocationManager.tsx
'use client';

import { Database } from '@/types/database.types';
// --- NEW: Import useState for managing the color selection ---
import { useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { addLocation, deleteLocation } from '../actions';

type Location = Database['public']['Tables']['locations']['Row'];

interface LocationManagerProps {
  tripId: string;
  locations: Location[];
}

// --- NEW: Define the array of preset colors ---
const presetColors = [
  { name: 'Red', hex: '#FF383C' }, { name: 'Orange', hex: '#FF8D28' },
  { name: 'Yellow', hex: '#FFCC00' }, { name: 'Green', hex: '#34C759' },
  { name: 'Mint', hex: '#00C8B3' }, { name: 'Teal', hex: '#00C3D0' },
  { name: 'Cyan', hex: '#00C0E8' }, { name: 'Blue', hex: '#0088FF' },
  { name: 'Indigo', hex: '#6155F5' }, { name: 'Purple', hex: '#CB30E0' },
  { name: 'Pink', hex: '#FF2D55' }, { name: "Brown", hex: "#AC7F5E" }, { name: "Gray", hex: "#8E8E93" }
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
    >
      {pending ? 'Adding...' : 'Add Location'}
    </button>
  );
}

export function LocationManager({ tripId, locations }: LocationManagerProps) {
  const [state, formAction] = useActionState(addLocation, { message: '' });

  // --- NEW: State to manage the selected color and custom picker visibility ---
  const [selectedColor, setSelectedColor] = useState(presetColors[7].hex); // Default to Blue
  const [isCustom, setIsCustom] = useState(false);

  return (
    <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
      <h2 className="text-xl font-semibold">Locations</h2>
      <p className="mt-1 text-sm text-gray-500">Define places for your trip and give them a color.</p>
      
      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="trip_id" value={tripId} />
        {/* This hidden input sends the actual selected color hex code to the server */}
        <input type="hidden" name="color" value={selectedColor} />
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-900">Location Name</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="e.g., Paris"
          />
        </div>

        {/* --- NEW: The refined color selection UI --- */}
        <div>
          <label className="block text-sm font-medium text-gray-900">Color</label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {presetColors.map((color) => (
              <button
                type="button"
                key={color.name}
                onClick={() => {
                  setSelectedColor(color.hex);
                  setIsCustom(false);
                }}
                className={`h-8 w-8 rounded-full border-2 ${selectedColor === color.hex && !isCustom ? 'border-indigo-600' : 'border-transparent'}`}
                style={{ backgroundColor: color.hex }}
                aria-label={color.name}
              />
            ))}
            {/* The "Custom" button */}
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-gray-100 ${isCustom ? 'border-indigo-600' : 'border-transparent'}`}
              aria-label="Custom Color"
            >
              🎨
            </button>
            {/* The color picker, which only shows up if 'Custom' is selected */}
            {isCustom && (
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-md border-gray-300 bg-white"
              />
            )}
          </div>
        </div>
        
        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </form>
      {state?.message && <p className="mt-2 text-sm text-green-600">{state.message}</p>}

      {/* List of existing locations */}
      <div className="mt-6 space-y-2">
        <h3 className="text-md font-semibold">Defined Locations:</h3>
        {locations.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {locations.map((loc) => (
              <li key={loc.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div
                    className="h-6 w-6 flex-shrink-0 rounded-full border"
                    style={{ backgroundColor: loc.color }}
                  ></div>
                  <span className="font-medium">{loc.name}</span>
                </div>

                {/* --- NEW: Delete button form --- */}
                <form action={deleteLocation.bind(null, loc.id, tripId)}>
                  <button
                    type="submit"
                    className="text-xs text-red-500 hover:text-red-700"
                    aria-label={`Delete ${loc.name}`}
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No locations defined yet.</p>
        )}
      </div>
    </div>
  );
}