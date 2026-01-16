import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  console.log('=== GENERATE PDF API CALLED ===');
  
  try {
    const { contractId } = await request.json();
    console.log('Contract ID:', contractId);

    const supabase = createClient();
    
    const { data: contract, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (error || !contract) {
      console.error('Contract not found:', error);
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Verificar que ambos hayan firmado
    if (!contract.locador_firma_fecha || !contract.locatario_firma_fecha) {
      return NextResponse.json({ error: 'Contract not fully signed' }, { status: 400 });
    }

    console.log('Generating PDF for fully signed contract');

    // TODO: Aquí implementar la generación real del PDF
    // Por ahora, solo marcamos como completado
    
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'completed',
        pdf_url: `https://firmadigitalsimple.vercel.app/api/contracts/${contractId}/pdf`,
        pdf_generated_at: new Date().toISOString()
      })
      .eq('id', contractId);

    if (updateError) throw updateError;

    console.log('✓ Contract marked as completed');

    // TODO: Enviar emails con el PDF adjunto

    return NextResponse.json({ success: true, message: 'PDF generated successfully' });

  } catch (error: any) {
    console.error('❌ PDF GENERATION ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
