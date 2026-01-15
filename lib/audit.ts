import { createClient } from '@/lib/supabase/server';

export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.register'
  | 'user.update'
  | 'user.accept_terms'
  | 'user.enable_2fa'
  | 'user.disable_2fa'
  | 'contract.create'
  | 'contract.view'
  | 'contract.update'
  | 'contract.delete'
  | 'contract.send'
  | 'signature.view'
  | 'signature.sign'
  | 'signature.reject'
  | 'signature.consent'
  | 'data.export'
  | 'data.delete';

export type AuditEntityType =
  | 'user'
  | 'contract'
  | 'signature'
  | 'audit_log';

interface LogAuditParams {
  userId?: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export async function logAudit({
  userId,
  action,
  entityType,
  entityId,
  ipAddress,
  userAgent,
  metadata,
}: LogAuditParams) {
  try {
    const supabase = createClient();
    
    const { error } = await supabase.from('audit_logs').insert({
      user_id: userId || null,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      metadata: metadata || null,
    });
    
    if (error) {
      console.error('Error logging audit:', error);
    }
  } catch (error) {
    console.error('Error in logAudit:', error);
  }
}

// Función para obtener la IP del request
export function getClientIP(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (real) {
    return real;
  }
  
  return undefined;
}

// Función para obtener el user agent
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}
