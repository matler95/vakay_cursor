// src/app/(app)/dashboard/_components/CreateTripModal.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { useActionState } from 'react';
import { createTrip } from '../actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCIES } from '@/lib/currency';

export function CreateTripModal() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createTrip, { message: '' });

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="sm" className="h-8 w-8 p-0" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Create new trip</p>
        </TooltipContent>
      </Tooltip>

      <Modal open={open} onClose={() => setOpen(false)} title="Create New Trip">
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Trip Name</Label>
            <Input id="name" name="name" placeholder="e.g., Summer in Italy" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input id="destination" name="destination" placeholder="e.g., Rome, Italy" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input id="start_date" name="start_date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input id="end_date" name="end_date" type="date" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="main_currency">Main Currency</Label>
            <Select name="main_currency" defaultValue="USD">
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{currency.symbol}</span>
                      <span>{currency.code}</span>
                      <span className="text-gray-500">- {currency.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {state.message && <p className="text-sm text-gray-600">{state.message}</p>}
          <div className="mt-4 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
