// Vietnamese date formatting utilities
import { format, parseISO, isValid, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { vi } from 'date-fns/locale';

export const formatVietnameseDate = (date: Date | string, formatStr: string = 'dd/MM/yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    
    return format(dateObj, formatStr, { locale: vi });
  } catch (error) {
    return '';
  }
};

export const formatVietnameseDateTime = (date: Date | string): string => {
  return formatVietnameseDate(date, 'dd/MM/yyyy HH:mm');
};

export const formatVietnameseTime = (date: Date | string): string => {
  return formatVietnameseDate(date, 'HH:mm');
};

export const formatVietnameseDateLong = (date: Date | string): string => {
  return formatVietnameseDate(date, 'EEEE, dd MMMM yyyy');
};

export const formatVietnameseDateShort = (date: Date | string): string => {
  return formatVietnameseDate(date, 'dd/MM/yy');
};

export const formatRelativeTime = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    
    const now = new Date();
    const diffMinutes = differenceInMinutes(now, dateObj);
    const diffHours = differenceInHours(now, dateObj);
    const diffDays = differenceInDays(now, dateObj);
    
    if (diffMinutes < 1) {
      return 'Vừa xong';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return formatVietnameseDate(dateObj, 'dd/MM/yyyy');
    }
  } catch (error) {
    return '';
  }
};

export const formatBusinessHours = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    
    const hour = dateObj.getHours();
    
    if (hour >= 6 && hour < 12) {
      return `Sáng ${formatVietnameseTime(dateObj)}`;
    } else if (hour >= 12 && hour < 18) {
      return `Chiều ${formatVietnameseTime(dateObj)}`;
    } else if (hour >= 18 && hour < 22) {
      return `Tối ${formatVietnameseTime(dateObj)}`;
    } else {
      return `Đêm ${formatVietnameseTime(dateObj)}`;
    }
  } catch (error) {
    return '';
  }
};

export const formatDateRange = (startDate: Date | string, endDate: Date | string): string => {
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    if (!isValid(start) || !isValid(end)) return '';
    
    const startFormatted = formatVietnameseDate(start);
    const endFormatted = formatVietnameseDate(end);
    
    if (startFormatted === endFormatted) {
      return startFormatted;
    }
    
    return `${startFormatted} - ${endFormatted}`;
  } catch (error) {
    return '';
  }
};

export const isToday = (date: Date | string): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return false;
    
    const today = new Date();
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  } catch (error) {
    return false;
  }
};

export const isYesterday = (date: Date | string): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return false;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return (
      dateObj.getDate() === yesterday.getDate() &&
      dateObj.getMonth() === yesterday.getMonth() &&
      dateObj.getFullYear() === yesterday.getFullYear()
    );
  } catch (error) {
    return false;
  }
};

export const getVietnameseWeekday = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    
    const weekdays = [
      'Chủ nhật',
      'Thứ hai',
      'Thứ ba',
      'Thứ tư',
      'Thứ năm',
      'Thứ sáu',
      'Thứ bảy'
    ];
    
    return weekdays[dateObj.getDay()];
  } catch (error) {
    return '';
  }
};

export const getVietnameseMonth = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    
    const months = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
      'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
      'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    
    return months[dateObj.getMonth()];
  } catch (error) {
    return '';
  }
};

export const formatWorkingDays = (startDate: Date | string, endDate: Date | string): number => {
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    if (!isValid(start) || !isValid(end)) return 0;
    
    let workingDays = 0;
    const current = new Date(start);
    
    while (current <= end) {
      const dayOfWeek = current.getDay();
      // Monday to Saturday (1-6) are working days in Vietnam
      if (dayOfWeek >= 1 && dayOfWeek <= 6) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return workingDays;
  } catch (error) {
    return 0;
  }
};

export const parseVietnameseDate = (dateString: string): Date | null => {
  try {
    // Support various Vietnamese date formats
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // dd/mm/yyyy
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // dd-mm-yyyy
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, // yyyy/mm/dd
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // yyyy-mm-dd
    ];
    
    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        let day, month, year;
        
        if (format.source.startsWith('^(\\d{4})')) {
          // yyyy format
          [, year, month, day] = match;
        } else {
          // dd format
          [, day, month, year] = match;
        }
        
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        if (isValid(date)) {
          return date;
        }
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

export const getQuarterVietnamese = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    
    const month = dateObj.getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    
    return `Quý ${quarter}`;
  } catch (error) {
    return '';
  }
};

export const formatFiscalYear = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    
    // Vietnamese fiscal year typically follows calendar year
    return `Năm ${dateObj.getFullYear()}`;
  } catch (error) {
    return '';
  }
};
