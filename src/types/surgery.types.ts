export interface SurgeryProcedure {
  id: string;
  patientId: string;
  patientName: string;
  procedureCode: string;
  procedureName: string;
  description?: string;
  category: string;
  subcategory?: string;
  
  // Classificação de porte
  complexity: SurgeryComplexity;
  estimatedDuration: number; // em minutos
  basePrice: number;
  
  // Status e datas
  status: SurgeryStatus;
  scheduledDate?: Date;
  performedDate?: Date;
  
  // Equipe médica
  surgeonId: string;
  surgeonName: string;
  assistants?: string[];
  anesthesiologist?: string;
  
  // Localização
  operatingRoom?: string;
  hospital: string;
  
  // Auditoria e aprovação
  requiresAuthorization: boolean;
  authorizationStatus: AuthorizationStatus;
  auditStatus: AuditStatus;
  auditNotes?: string;
  
  // Metadados
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export enum SurgeryComplexity {
  PORTE_1 = 'PORTE_1', // Pequeno porte
  PORTE_2 = 'PORTE_2', // Médio porte
  PORTE_3 = 'PORTE_3', // Grande porte
  PORTE_4 = 'PORTE_4', // Especial
  PORTE_ESPECIAL = 'PORTE_ESPECIAL' // Porte especial
}

export enum SurgeryStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  POSTPONED = 'POSTPONED'
}

export enum AuthorizationStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  DENIED = 'DENIED',
  EXPIRED = 'EXPIRED'
}

export enum AuditStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  PENDING_AUDIT = 'PENDING_AUDIT',
  IN_AUDIT = 'IN_AUDIT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REQUIRES_REVIEW = 'REQUIRES_REVIEW'
}

export interface CreateSurgeryRequest {
  patientId: string;
  procedureCode: string;
  procedureName: string;
  description?: string;
  category: string;
  subcategory?: string;
  complexity: SurgeryComplexity;
  estimatedDuration: number;
  scheduledDate?: string;
  surgeonId: string;
  surgeonName: string;
  assistants?: string[];
  anesthesiologist?: string;
  operatingRoom?: string;
  hospital: string;
  requiresAuthorization?: boolean;
  createdBy: string;
}

export interface UpdateSurgeryRequest {
  procedureName?: string;
  description?: string;
  complexity?: SurgeryComplexity;
  estimatedDuration?: number;
  scheduledDate?: string;
  status?: SurgeryStatus;
  surgeonId?: string;
  surgeonName?: string;
  assistants?: string[];
  anesthesiologist?: string;
  operatingRoom?: string;
  updatedBy: string;
}

export interface ConfirmPorteRequest {
  complexity: SurgeryComplexity;
  estimatedDuration: number;
  basePrice: number;
  confirmedBy: string;
  notes?: string;
}

export interface SurgerySearchFilters {
  patientId?: string;
  surgeonId?: string;
  status?: SurgeryStatus;
  complexity?: SurgeryComplexity;
  authorizationStatus?: AuthorizationStatus;
  auditStatus?: AuditStatus;
  category?: string;
  hospital?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface SurgeryStatistics {
  total: number;
  byStatus: Record<SurgeryStatus, number>;
  byComplexity: Record<SurgeryComplexity, number>;
  byAuditStatus: Record<AuditStatus, number>;
  pendingAuthorization: number;
  pendingAudit: number;
  averageDuration: number;
  totalValue: number;
}

export interface PendingSurgerySummary {
  totalPending: number;
  pendingAuthorization: number;
  pendingAudit: number;
  scheduledToday: number;
  scheduledThisWeek: number;
  recentActivity: SurgeryProcedure[];
}
