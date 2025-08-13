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
import { Calendar, ArrowRight, Star, MapPin, Edit3, Plus, ArrowUpRight } from 'lucide-react';
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
  isInRange?: boolean;
  rangeStart?: boolean;
  rangeEnd?: boolean;
  isConsecutiveBlock?: boolean;
  isBlockStart?: boolean;
  isBlockEnd?: boolean;
  draftItinerary?: Map<string, ItineraryDay>;
  onSelectDate: (dateStr: string, event: React.MouseEvent) => void;
  onMouseDown?: (dateStr: string) => void;
  onMouseEnter?: (dateStr: string) => void;
  onUpdateDraft: (dateStr: string, updatedValues: Partial<ItineraryDay>) => void;
  isListView?: boolean;
}

export function PremiumDayCard({ 
  date, 
  dayData, 
  locations, 
  isEditing, 
  isSelected, 
  isInRange = false,
  rangeStart = false,
  rangeEnd = false,
  isConsecutiveBlock = false,
  isBlockStart = false,
  isBlockEnd = false,
  draftItinerary,
  onSelectDate, 
  onMouseDown,
  onMouseEnter,
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
  const isTransferDay = location1 && location2;

  // Enhanced color logic with gradients, range selection, and consecutive blocks
  const getDayStyle = () => {
    let style: React.CSSProperties = {};
    
    // Range selection styling (highest priority)
    if (isInRange) {
      style.background = '#f0f9ff'; // Light blue for range
      style.borderTop = rangeStart ? '2px solid #3b82f6' : '1px solid #dbeafe';
      style.borderBottom = rangeEnd ? '2px solid #3b82f6' : '1px solid #dbeafe';
      style.borderLeft = rangeStart ? '2px solid #3b82f6' : '1px solid #dbeafe';
      style.borderRight = rangeEnd ? '2px solid #3b82f6' : '1px solid #dbeafe';
    } else if (location1 && location2) {
      // Transfer day styling
      style.background = `linear-gradient(135deg, ${location1.color}05 0%, ${location2.color}05 100%)`;
      style.borderLeft = `2px solid ${location1.color}`;
      style.borderRight = `2px solid ${location2.color}`;
    } else if (location1 && isConsecutiveBlock) {
      // Consecutive block styling
      style.background = `${location1.color}05`;
      style.borderLeft = isBlockStart ? `2px solid ${location1.color}` : '1px solid transparent';
      style.borderRight = isBlockEnd ? `2px solid ${location1.color}` : '1px solid transparent';
      style.borderTop = isBlockStart ? `2px solid ${location1.color}` : '1px solid transparent';
      style.borderBottom = isBlockEnd ? `2px solid ${location1.color}` : '1px solid transparent';
    } else if (location1) {
      // Single location styling
      style.background = `${location1.color}05`;
      style.borderLeft = `2px solid ${location1.color}`;
    }
    
    return style;
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
          relative transition-all duration-300 group overflow-hidden cursor-pointer
          ${isCurrentDay ? 'ring-2 ring-blue-500/20 shadow-md' : ''}
          ${isSelected ? 'ring-2 ring-blue-600/30 shadow-lg' : ''}
          ${isInRange ? 'ring-1 ring-blue-300' : ''}
          ${isListView ? 'w-full' : 'h-[160px] w-full'}
          hover:shadow-md hover:scale-[1.02] transition-all duration-200
        `}
        style={dayStyle}
        onClick={isEditing ? (e) => onSelectDate(dateStr, e) : () => setIsEditModalOpen(true)}
        onMouseDown={isEditing && onMouseDown ? () => onMouseDown(dateStr) : undefined}
        onMouseEnter={isEditing && onMouseEnter ? () => onMouseEnter(dateStr) : undefined}
      >
        {/* Selection Checkbox - Only visible in edit mode */}
        {isEditing && (
          <div 
            className="absolute top-2 left-2 z-10" 
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox 
              checked={isSelected} 
              onCheckedChange={() => onSelectDate(dateStr, {} as React.MouseEvent)}
              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
          </div>
        )}

        {/* Range Selection Indicators */}
        {isInRange && (
          <>
            {rangeStart && (
              <div className="absolute top-0 left-0 w-0 h-0 border-l-[8px] border-l-blue-600 border-t-[8px] border-t-transparent" />
            )}
            {rangeEnd && (
              <div className="absolute top-0 right-0 w-0 h-0 border-r-[8px] border-r-blue-600 border-t-[8px] border-t-transparent" />
            )}
          </>
        )}

        {/* Clean Header - Day Number and Weekday */}
        <CardHeader className={`pb-2 pt-3 px-3 h-[60px] ${isEditing ? 'pl-10' : ''}`}>
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

        <CardContent className="pt-0 px-3 pb-3 h-[100px] flex flex-col">
          {/* Clean, Minimal Content - Fixed Height Distribution */}
          <div className="space-y-2 h-full flex flex-col justify-between">
            {/* Primary Location - Fixed Height */}
            <div className="h-[32px] flex items-center">
              {isEditing ? (
                <LocationSelector
                  value={dayData?.location_1_id?.toString() || ''}
                  onValueChange={(value) => onUpdateDraft(dateStr, { location_1_id: value ? Number(value) : null })}
                  placeholder="Location..."
                  isPrimary={true}
                />
              ) : (
                <div className="flex items-center gap-2 w-full">
                  {location1 ? (
                    <>
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: location1.color }}
                      />
                      <span className="text-sm font-medium text-gray-900 truncate flex-1">{location1.name}</span>
                      <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">No location</span>
                  )}
                </div>
              )}
            </div>
            
            {/* Transfer Location - Fixed Height */}
            <div className="h-[28px] flex items-center">
              {isEditing ? (
                <div className="flex items-center gap-2 w-full">
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
                    <div className="flex-1">
                      <LocationSelector
                        value={dayData?.location_2_id?.toString() || ''}
                        onValueChange={(value) => onUpdateDraft(dateStr, { location_2_id: value ? Number(value) : null })}
                        placeholder="Transfer..."
                      />
                    </div>
                  )}
                </div>
              ) : (
                location2 && (
                  <div className="flex items-center gap-2 w-full">
                    <ArrowRight className="h-3 w-3 text-purple-500 flex-shrink-0" />
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: location2.color }}
                    />
                    <span className="text-xs text-gray-600 truncate flex-1">{location2.name}</span>
                  </div>
                )
              )}
            </div>
            
            {/* Enhanced Transfer Display - Show both locations when not editing */}
            {!isEditing && location1 && location2 && (
              <div className="h-[20px] flex items-center gap-2">
                <div className="flex items-center gap-1 w-full">
                  {/* Origin location */}
                  <div className="flex items-center gap-1 flex-1">
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: location1.color }}
                    />
                    <span className="text-xs text-gray-600 truncate">{location1.name}</span>
                  </div>
                  
                  {/* Transfer arrow */}
                  <ArrowRight className="h-3 w-3 text-purple-500 flex-shrink-0" />
                  
                  {/* Destination location */}
                  <div className="flex items-center gap-1 flex-1 justify-end">
                    <span className="text-xs text-gray-600 truncate">{location2.name}</span>
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: location2.color }}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Transfer Type Indicator - Show transfer type based on existing data */}
            {isEditing && transferEnabled && location2 && (
              <div className="h-[20px] flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>Type:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                    <span className="text-xs">Transfer day</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Action Area - Edit Button or Status */}
            <div className="h-[20px] flex items-center justify-between">
              {isEditing ? (
                <div className="w-full flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                    className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 min-w-[60px]"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                </div>
              ) : (
                hasContent ? (
                  <div className="flex items-center gap-1 text-gray-400">
                    {isTransferDay ? (
                      <>
                        <ArrowUpRight className="h-3 w-3 text-purple-500" />
                        <span className="text-xs text-gray-500">Transfer</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span className="text-xs text-gray-500">Planned</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditModalOpen(true)}
                      className="h-6 px-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 min-w-[60px]"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                    
                    {/* Smart suggestion: show if this day is between two different locations */}
                    {draftItinerary && (() => {
                      const currentDate = new Date(date);
                      const prevDate = new Date(currentDate);
                      prevDate.setDate(prevDate.getDate() - 1);
                      const prevDateStr = prevDate.toISOString().split('T')[0];
                      const prevDay = draftItinerary.get(prevDateStr);
                      
                      const nextDate = new Date(currentDate);
                      nextDate.setDate(nextDate.getDate() + 1);
                      const nextDateStr = nextDate.toISOString().split('T')[0];
                      const nextDay = draftItinerary.get(nextDateStr);
                      
                      if (prevDay?.location_1_id && nextDay?.location_1_id && 
                          prevDay.location_1_id !== nextDay.location_1_id) {
                        return (
                          <div className="flex items-center gap-1 text-xs text-purple-500">
                            <ArrowUpRight className="h-3 w-3" />
                            <span className="hidden sm:inline">Transfer suggested</span>
                            <span className="sm:hidden">Transfer</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )
              )}
            </div>
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
