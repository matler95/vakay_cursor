'use client';

import { Database } from '@/types/database.types';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { Calendar, ArrowRight, Star, MapPin, Edit3 } from 'lucide-react';
import { format, isToday } from 'date-fns';

type ItineraryDay = Database['public']['Tables']['itinerary_days']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];

interface PremiumDayCardProps {
  date: Date;
  dayData: ItineraryDay | undefined;
  locations: Location[];
  isEditing: boolean;
  isSelected: boolean;
  selectionCount: number;
  onSelectDate: () => void;
  onUpdateDraft: (dateStr: string, updatedValues: Partial<ItineraryDay>) => void;
  isListView?: boolean;
}

export function PremiumDayCard({ 
  date, 
  dayData, 
  locations, 
  isEditing, 
  isSelected, 

  onSelectDate, 
  onUpdateDraft, 
  isListView = false 
}: PremiumDayCardProps) {
  const locationsMap = new Map(locations.map((loc) => [loc.id, loc]));
  const location1 = dayData?.location_1_id ? locationsMap.get(dayData.location_1_id) ?? null : null;
  const location2 = dayData?.location_2_id ? locationsMap.get(dayData.location_2_id) ?? null : null;
  
  const [transferEnabled, setTransferEnabled] = useState<boolean>(!!dayData?.location_2_id);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  useEffect(() => {
    setTransferEnabled(!!dayData?.location_2_id);
  }, [dayData?.location_2_id]);

  const dateStr = date.toISOString().split('T')[0];
  const isCurrentDay = isToday(date);
  const hasContent = location1 || location2 || dayData?.notes;

  // Enhanced color logic with gradients
  const getDayStyle = () => {
    if (location1 && location2) {
      return {
        background: `linear-gradient(135deg, ${location1.color}05 0%, ${location2.color}05 100%)`,
        borderLeft: `2px solid ${location1.color}`,
        borderRight: `2px solid ${location2.color}`,
      };
    } else if (location1) {
      return {
        background: `${location1.color}05`,
        borderLeft: `2px solid ${location1.color}`,
      };
    }
    return {};
  };

  const dayStyle = getDayStyle();

  // Clean location selector component
  const LocationSelector = ({ 
    value, 
    onValueChange, 
    placeholder, 
    disabled = false,
    className = "",
    isPrimary = false
  }: {
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
    className?: string;
    isPrimary?: boolean;
  }) => (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={`h-8 text-sm border-gray-200 ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-48 w-56">
        {locations.map((loc) => (
          <SelectItem key={loc.id} value={loc.id.toString()} className="text-sm">
            <div className="flex items-center gap-2 py-1">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: loc.color }}
              />
              <span className="font-medium">{loc.name}</span>
              {isPrimary && loc.id.toString() === value && (
                <Star className="h-3 w-3 text-yellow-500 ml-auto" />
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );



  return (
    <>
      <Card 
        className={`
          relative transition-all duration-300 group cursor-pointer
          ${isCurrentDay ? 'ring-2 ring-blue-500/20 shadow-md' : ''}
          ${isEditing ? 'hover:shadow-lg' : 'hover:shadow-md'}
          ${isSelected ? 'ring-2 ring-blue-600/30 shadow-lg' : ''}
          ${isListView ? 'w-full' : 'h-[140px]'}
        `}
        style={dayStyle}
        onClick={isEditing ? onSelectDate : () => setIsEditModalOpen(true)}
      >
        {/* Selection Checkbox */}
        {isEditing && (
          <div 
            className="absolute top-2 left-2 z-10" 
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox 
              checked={isSelected} 
              onCheckedChange={onSelectDate}
              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
          </div>
        )}

        {/* Clean Header - Day Number and Weekday */}
        <CardHeader className={`pb-2 ${isEditing ? 'pl-10' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <time 
                dateTime={date.toISOString()} 
                className={`
                  font-bold text-lg tracking-tight
                  ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}
                `}
              >
                {format(date, 'd')}
              </time>
              <span className="text-sm text-gray-500 font-medium">
                {format(date, 'EEE')}
              </span>
            </div>
            
            {isCurrentDay && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs font-medium">
                Today
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Clean, Minimal Content - Always Same Height */}
          <div className="space-y-2">
            {/* Primary Location - Minimal Display */}
            {isEditing ? (
              <LocationSelector
                value={dayData?.location_1_id?.toString() || ''}
                onValueChange={(value) => onUpdateDraft(dateStr, { location_1_id: value ? Number(value) : null })}
                placeholder="Location..."
                isPrimary={true}
              />
            ) : (
              <div className="flex items-center gap-2 min-h-[32px]">
                {location1 ? (
                  <>
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: location1.color }}
                    />
                    <span className="text-sm font-medium text-gray-900 truncate">{location1.name}</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">No location</span>
                )}
              </div>
            )}
            
            {/* Transfer Location - Minimal Display - CONTAINED WITHIN CARD */}
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={transferEnabled}
                  onCheckedChange={(checked) => {
                    setTransferEnabled(checked === true);
                    if (checked !== true) {
                      onUpdateDraft(dateStr, { location_2_id: null });
                    }
                  }}
                  className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                />
                {transferEnabled && (
                  <LocationSelector
                    value={dayData?.location_2_id?.toString() || ''}
                    onValueChange={(value) => onUpdateDraft(dateStr, { location_2_id: value ? Number(value) : null })}
                    placeholder="Transfer..."
                  />
                )}
              </div>
            ) : (
              location2 && (
                <div className="flex items-center gap-2 min-h-[20px]">
                  <ArrowRight className="h-3 w-3 text-purple-500" />
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: location2.color }}
                  />
                  <span className="text-xs text-gray-600 truncate">{location2.name}</span>
                </div>
              )
            )}
            
            {/* Status Indicator - Only show if there's content */}
            {hasContent && !isEditing && (
              <div className="flex items-center gap-1 text-gray-400 mt-auto">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-xs text-gray-500">Planned</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              {format(date, 'EEEE, MMMM d')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Primary Location */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                Primary Location
              </label>
              <LocationSelector
                value={dayData?.location_1_id?.toString() || ''}
                onValueChange={(value) => onUpdateDraft(dateStr, { location_1_id: value ? Number(value) : null })}
                placeholder="Select your main destination..."
                isPrimary={true}
              />
            </div>

            {/* Transfer Location */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-purple-500" />
                  Transfer Location
                </label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={transferEnabled}
                    onCheckedChange={(checked) => {
                      setTransferEnabled(checked === true);
                      if (checked !== true) {
                        onUpdateDraft(dateStr, { location_2_id: null });
                      }
                    }}
                    className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                  <span className="text-xs text-gray-500">Enable transfer</span>
                </div>
              </div>
              
              {transferEnabled && (
                <LocationSelector
                  value={dayData?.location_2_id?.toString() || ''}
                  onValueChange={(value) => onUpdateDraft(dateStr, { location_2_id: value ? Number(value) : null })}
                  placeholder="Select transfer destination..."
                />
              )}
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-green-500" />
                Notes & Details
              </label>
              <Textarea
                placeholder="Add notes, activities, or important details for this day..."
                value={dayData?.notes || ''}
                onChange={(e) => onUpdateDraft(dateStr, { notes: e.target.value })}
                className="text-sm resize-none min-h-[80px] border-gray-200"
              />
              <div className="text-right">
                <span className="text-xs text-gray-400">
                  {(dayData?.notes?.length || 0)}/500
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
