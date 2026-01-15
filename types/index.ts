export type UserRole = 'inmobiliaria' | 'locador' | 'locatario';

export type ContractStatus = 'pendiente' | 'firmado_parcial' | 'firmado_completo' | 'rechazado' | 'cancelado';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  dni?: string;
  address?: string;
  created_at: string;
}

export interface Contract {
  id: string;
  created_by: string; // User ID de la inmobiliaria
  status: ContractStatus;
  
  // Datos del LOCADOR
  locador_nombre: string;
  locador_dni: string;
  locador_domicilio: string;
  locador_email: string;
  locador_user_id?: string;
  locador_firma?: string; // URL de la firma
  locador_firmado_at?: string;
  
  // Datos del LOCATARIO
  locatario_nombre: string;
  locatario_dni: string;
  locatario_domicilio: string;
  locatario_email: string;
  locatario_user_id?: string;
  locatario_firma?: string; // URL de la firma
  locatario_firmado_at?: string;
  
  // Datos del INMUEBLE
  inmueble_direccion: string;
  inmueble_barrio: string;
  inmueble_lote: string;
  inmueble_partido: string;
  inmueble_provincia: string;
  
  // Datos del CONTRATO
  plazo_noches: number;
  fecha_inicio: string;
  hora_inicio: string;
  fecha_fin: string;
  hora_fin: string;
  precio_total: number;
  precio_moneda: string; // 'USD' o 'ARS'
  max_personas: number;
  deposito_garantia: number;
  
  // URLs y metadatos
  pdf_original_url?: string;
  pdf_firmado_url?: string;
  token_locador?: string;
  token_locatario?: string;
  
  created_at: string;
  updated_at: string;
}

export interface SignatureRequest {
  contract_id: string;
  role: 'locador' | 'locatario';
  token: string;
  signed: boolean;
  signed_at?: string;
  rejected: boolean;
  rejected_reason?: string;
  rejected_at?: string;
}

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}
