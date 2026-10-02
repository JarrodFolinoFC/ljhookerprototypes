/**
 * Shape returned by PropertyMe `GET /jobtasks` (ChangedJobTaskRequest).
 * Mirrors the swagger payload verbatim so it can be stored as-is.
 */
export interface PropertyMeJobTask {
  LotReference: string
  TenantReference: string
  OwnerReference: string
  ContactReference: string
  ManagerName: string
  IsLetterStatement: boolean
  StatementId: string
  TaskType: string
  Timestamp: number
  OwnerAttending: boolean
  TenantAttending: boolean
  SupplierReference: string
  DisplayNumber: string
  Number: number
  Status: string
  ReportedContactType: string
  Access: string
  MainPhotoDocumentId: string
  DocumentLinkTextName: string
  QuoteId: string
  SupplierInstructions: string
  Id: string
  CustomerId: string
  DueDate: string | null
  CreatedOn: string
  ClosedOn: string | null
  Summary: string
  Description: string
  LotId: string
  TenantContactId: string
  OwnerContactId: string
  ContactId: string
  ManagerMemberId: string
  Labels: string
  UpdatedOn: string
}

/**
 * One row in the history table: a job task as it looked at a given poll.
 * Each 4-hourly sync appends one snapshot per changed job task.
 */
export interface JobTaskSnapshot {
  retrievedAt: string
  task: PropertyMeJobTask
}

/** A derived event: a job task's DueDate differs from its previous snapshot. */
export interface DueDateChange {
  /** Stable key: `${jobTaskId}:${changedAt}` */
  key: string
  jobTaskId: string
  displayNumber: string
  summary: string
  lotReference: string
  status: string
  taskType: string
  previousDueDate: string | null
  newDueDate: string | null
  /** PropertyMe `UpdatedOn` of the snapshot carrying the new due date. */
  changedAt: string
  /** When our sync picked the change up. */
  detectedAt: string
  changedBy: string
  /** New minus previous, in whole days. Positive = pushed out. Null if either side is empty. */
  shiftDays: number | null
}
