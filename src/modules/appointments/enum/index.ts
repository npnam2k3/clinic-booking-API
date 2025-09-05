export enum StatusAppointment {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELED = 'canceled',
  COMPLETED = 'completed',
}

export enum CancellationParty {
  PATIENT = 'patient',
  CLINIC = 'clinic',
  SYSTEM = 'system',
}

export enum ReasonCode {
  REQUESTED_BY_CUSTOMER = 'REQUESTED_BY_CUSTOMER',
  NO_SHOW = 'NO_SHOW',
  DOCTOR_OFF = 'DOCTOR_OFF',
  CLINIC_RESCHEDULE = 'CLINIC_RESCHEDULE',
  AUTO_EXPIRED = 'AUTO_EXPIRED',
}
