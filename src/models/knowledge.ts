/**
 * Knowledge Base Model - Document and Q&A management
 */

export interface KnowledgeItem {
  id: string;
  question: string;
  answer: string;
  type: 'manual' | 'csv' | 'pdf';
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    uploadedBy?: string;
  };
}

export interface CreateKnowledgeDTO {
  question: string;
  answer: string;
  type?: 'manual' | 'csv';
}

export interface UpdateKnowledgeDTO {
  question?: string;
  answer?: string;
}

export interface CSVUploadResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  failedCount: number;
  errors?: string[];
}

export interface KnowledgeStats {
  total: number;
  byType: {
    manual: number;
    csv: number;
    pdf: number;
  };
  lastUpdated: Date;
}
