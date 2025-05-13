
import { format, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export type DateRange = {
  start: Date;
  end: Date;
};

export type FilterPeriod = 'month' | 'year' | 'all';

export const formatDate = (date: string | number | Date): string => {
  return format(typeof date === 'string' ? parseISO(date) : date, 'yyyy-MM-dd');
};

export const formatDisplayDate = (date: string | number | Date): string => {
  return format(typeof date === 'string' ? parseISO(date) : date, 'dd MMM yyyy');
};

export const getMonthRange = (date: Date): DateRange => {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date)
  };
};

export const getYearRange = (date: Date): DateRange => {
  return {
    start: startOfYear(date),
    end: endOfYear(date)
  };
};

export const isDateInRange = (date: Date | string, range: DateRange): boolean => {
  const checkDate = typeof date === 'string' ? parseISO(date) : date;
  return checkDate >= range.start && checkDate <= range.end;
};
