'use client';

import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  MapPin, 
  Copy, 
  RotateCcw 
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface QuickActionsProps {
  onSelectAll: () => void;
  onClearAll: () => void;
  onCopyPreviousDay: () => void;
  onResetToDefault: () => void;
  isEditing: boolean;
  hasSelections: boolean;
}

export function QuickActions({
  onSelectAll,
  onClearAll,
  onCopyPreviousDay,
  onResetToDefault,
  isEditing,
  hasSelections
}: QuickActionsProps) {
  if (!isEditing) return null;

  return (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSelectAll}
                  className="text-xs h-8"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Select All
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Select all trip days</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearAll}
                  disabled={!hasSelections}
                  className="text-xs h-8"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear all selections</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCopyPreviousDay}
                  className="text-xs h-8"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Previous
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy previous day&apos;s itinerary</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResetToDefault}
                  className="text-xs h-8"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset to default itinerary</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Keyboard Shortcuts Hint */}
      <div className="mt-2 text-xs text-gray-500">
        <span className="font-medium">Keyboard shortcuts:</span> 
        <kbd className="mx-1 px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+A</kbd> Select All, 
        <kbd className="mx-1 px-1 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd> Cancel
      </div>
    </div>
  );
}
