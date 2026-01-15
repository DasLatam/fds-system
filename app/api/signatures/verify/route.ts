import { createClient } from '@/lib/supabase/server';
import { ratelimit } from '@/lib/ratelimit';
import { logAudit, getClientIP, getUserAgent } from '@/lib/audit';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Rate limiting
    const ip = getClientIP(request) || 'unknown';
    const { success: rateLimitOk } = await ratelimit.limit(ip);
    
    if (!rateLimitOk) {
      return NextResponse.json({ 
        error: 'Demasiados intentos. Por favor espera un momento.' 
      }, { status: 429 });
    }
    
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 400 });
    }
    
    const supabase = createClient();
    
    // Buscar el contrato por token y verificar expiración
    const { data: sigRequest, error: sigError } = await supabase
      .from('signature_requests')
      .select('*, contracts(*)')
      .eq('token', token)
      .single();
    
    if (sigError || !sigRequest) {
      await logAudit({
        action: 'signature.view',
        entityType: 'signature',
        ipAddress: ip,
        userAgent: getUserAgent(request),
        metadata: { error: 'Token no encontrado', token },
      });
      
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 404 });
    }
    
    // Verificar si el token expiró
    const now = new Date();
    const expiresAt = new Date(sigRequest.expires_at);
    
    if (now > expiresAt) {
      await logAudit({
        action: 'signature.view',
        entityType: 'signature',
        entityId: sigRequest.id,
        ipAddress: ip,
        userAgent: getUserAgent(request),
        metadata: { error: 'Token expirado', expires_at: sigRequest.expires_at },
      });
      
      return NextResponse.json({ 
        error: 'Este enlace ha expirado (30 días)',
        expired: true 
      }, { status: 410 });
    }
    
    // Buscar el contrato completo
    const { data: contract, error } = await supabase
      .from('contracts')
      .select('*')
      .or(`token_locador.eq.${token},token_locatario.eq.${token}`)
      .single();
    
    if (error || !contract) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 404 });
    }
    
    // Determinar el rol
    const role = contract.token_locador === token ? 'locador' : 'locatario';
    
    // Verificar si ya firmó
    const alreadySigned = role === 'locador' 
      ? !!contract.locador_firmado_at 
      : !!contract.locatario_firmado_at;
    
    if (alreadySigned) {
      return NextResponse.json({ error: 'Este contrato ya ha sido firmado por ti' }, { status: 400 });
    }
    
    // Registrar visualización
    await supabase
      .from('signature_requests')
      .update({ viewed_at: new Date().toISOString() })
      .eq('token', token);
    
    // Audit log
    await logAudit({
      action: 'signature.view',
      entityType: 'signature',
      entityId: sigRequest.id,
      ipAddress: ip,
      userAgent: getUserAgent(request),
      metadata: { contract_id: contract.id, role },
    });
    
    return NextResponse.json({
      success: true,
      contract,
      role,
    });
    
  } catch (error: any) {
    console.error('Error en /api/signatures/verify:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}
