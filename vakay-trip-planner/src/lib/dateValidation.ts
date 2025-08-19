// Date validation utilities

export interface DateValidationResult {
  isValid: boolean;
  error?: string;
}

export interface DateRangeValidationResult {
  isValid: boolean;
  error?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Validates if a date string is valid
 */
export function validateDate(dateString: string): DateValidationResult {
  if (!dateString) {
    return { isValid: false, error: 'Date is required' };
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }

  return { isValid: true };
}

/**
 * Validates if a date is not in the past
 */
export function validateFutureDate(dateString: string): DateValidationResult {
  const validation = validateDate(dateString);
  if (!validation.isValid) {
    return validation;
  }

  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today) {
    return { isValid: false, error: 'Date cannot be in the past' };
  }

  return { isValid: true };
}

/**
 * Validates if a date is not too far in the future (e.g., within 10 years)
 */
export function validateReasonableFutureDate(dateString: string, maxYears: number = 10): DateValidationResult {
  const validation = validateDate(dateString);
  if (!validation.isValid) {
    return validation;
  }

  const date = new Date(dateString);
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + maxYears);

  if (date > maxDate) {
    return { isValid: false, error: `Date cannot be more than ${maxYears} years in the future` };
  }

  return { isValid: true };
}

/**
 * Validates a date range (start date must be before end date)
 */
export function validateDateRange(startDateString: string, endDateString: string): DateRangeValidationResult {
  const startValidation = validateDate(startDateString);
  if (!startValidation.isValid) {
    return { isValid: false, error: `Start date: ${startValidation.error}` };
  }

  const endValidation = validateDate(endDateString);
  if (!endValidation.isValid) {
    return { isValid: false, error: `End date: ${endValidation.error}` };
  }

  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);

  if (startDate >= endDate) {
    return { 
      isValid: false, 
      error: 'End date must be after start date',
      startDate,
      endDate
    };
  }

  return { 
    isValid: true, 
    startDate, 
    endDate 
  };
}

/**
 * Validates trip dates with business logic
 */
export function validateTripDates(startDateString: string, endDateString: string): DateRangeValidationResult {
  // First validate basic date format
  const basicValidation = validateDateRange(startDateString, endDateString);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  const startDate = basicValidation.startDate!;
  const endDate = basicValidation.endDate!;

  // Validate start date is not in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate < today) {
    return { 
      isValid: false, 
      error: 'Trip start date cannot be in the past',
      startDate,
      endDate
    };
  }

  // Validate trip duration is reasonable (not too short, not too long)
  const tripDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (tripDurationDays < 1) {
    return { 
      isValid: false, 
      error: 'Trip must be at least 1 day long',
      startDate,
      endDate
    };
  }

  if (tripDurationDays > 365) {
    return { 
      isValid: false, 
      error: 'Trip cannot be longer than 1 year',
      startDate,
      endDate
    };
  }

  return { 
    isValid: true, 
    startDate, 
    endDate 
  };
}

/**
 * Validates accommodation dates (check-in must be before check-out)
 */
export function validateAccommodationDates(checkInString: string, checkOutString: string, tripStartDate?: string, tripEndDate?: string): DateRangeValidationResult {
  const basicValidation = validateDateRange(checkInString, checkOutString);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  const checkIn = basicValidation.startDate!;
  const checkOut = basicValidation.endDate!;

  // If trip dates are provided, validate accommodation is within trip
  if (tripStartDate && tripEndDate) {
    const tripStart = new Date(tripStartDate);
    const tripEnd = new Date(tripEndDate);

    if (checkIn < tripStart) {
      return { 
        isValid: false, 
        error: 'Check-in date cannot be before trip start date',
        startDate: checkIn,
        endDate: checkOut
      };
    }

    if (checkOut > tripEnd) {
      return { 
        isValid: false, 
        error: 'Check-out date cannot be after trip end date',
        startDate: checkIn,
        endDate: checkOut
      };
    }
  }

  return { 
    isValid: true, 
    startDate: checkIn, 
    endDate: checkOut 
  };
}

/**
 * Validates transportation dates
 */
export function validateTransportationDates(departureString: string, arrivalString: string, tripStartDate?: string, tripEndDate?: string): DateRangeValidationResult {
  const basicValidation = validateDateRange(departureString, arrivalString);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  const departure = basicValidation.startDate!;
  const arrival = basicValidation.endDate!;

  // If trip dates are provided, validate transportation is within trip
  if (tripStartDate && tripEndDate) {
    const tripStart = new Date(tripStartDate);
    const tripEnd = new Date(tripEndDate);

    if (departure < tripStart) {
      return { 
        isValid: false, 
        error: 'Departure date cannot be before trip start date',
        startDate: departure,
        endDate: arrival
      };
    }

    if (arrival > tripEnd) {
      return { 
        isValid: false, 
        error: 'Arrival date cannot be after trip end date',
        startDate: departure,
        endDate: arrival
      };
    }
  }

  return { 
    isValid: true, 
    startDate: departure, 
    endDate: arrival 
  };
}

/**
 * Formats a date for display
 */
export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formats a date range for display
 */
export function formatDateRangeForDisplay(startDateString: string, endDateString: string): string {
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);
  
  const startFormatted = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  
  const endFormatted = endDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Gets the number of days between two dates
 */
export function getDaysBetween(startDateString: string, endDateString: string): number {
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);
  
  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}
