import { ReactNode } from 'react';
import { Document } from '../models/Document';

export type { Document };

export interface Activity {
  id: number;
  text: string;
  date: string;
  icon: ReactNode;
}
