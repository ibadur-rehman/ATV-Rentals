import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ParsedSmsMessage {
  timestamp?: string;
  content?: string;
  template?: string;
  [key: string]: any;
}

export function parseSentSmsMessages(sentSmsMessages: any): ParsedSmsMessage[] {
  if (!sentSmsMessages) return [];
  
  try {
    // If it's already an array, return it
    if (Array.isArray(sentSmsMessages)) {
      return sentSmsMessages;
    }
    
    // If it's a string, try to parse it
    if (typeof sentSmsMessages === 'string') {
      const parsed = JSON.parse(sentSmsMessages);
      return Array.isArray(parsed) ? parsed : [];
    }
    
    return [];
  } catch (error) {
    console.error('Error parsing sentSmsMessages:', error);
    return [];
  }
}
