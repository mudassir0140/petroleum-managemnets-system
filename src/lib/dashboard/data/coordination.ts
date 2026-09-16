// @ts-nocheck
export type CoordinationItem = {
  id: string;
  title: string;
  status: string;
  description?: string;
  assignedTo?: string;
  dueDate?: string;
};

export const COORDINATION_ITEMS: CoordinationItem[] = [];

export type Escalation = {
  id: string;
  title: string;
  level: string;
  status: string;
};

export const ESCALATIONS: Escalation[] = [];
