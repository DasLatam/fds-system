export default function FooterActualizado() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">FDS</h3>
            <p className="text-sm">
              Sistema profesional de firma digital con validez legal en Argentina.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/legal/terminos" className="hover:text-white transition-colors">
                  Términos y Condiciones
                </a>
              </li>
              <li>
                <a href="/legal/privacidad" className="hover:text-white transition-colors">
                  Política de Privacidad
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Marco Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="http://servicios.infoleg.gob.ar/infolegInternet/anexos/70000-74999/70749/texact.htm" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  📜 Ley 25.506 - Firma Digital →
                </a>
              </li>
              <li>
                <a 
                  href="http://servicios.infoleg.gob.ar/infolegInternet/anexos/235000-239999/235975/norma.htm" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  ⚖️ Código Civil y Comercial (Arts. 286-288) →
                </a>
              </li>
              <li>
                <a 
                  href="http://servicios.infoleg.gob.ar/infolegInternet/anexos/60000-64999/64790/texact.htm" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  🔒 Ley 25.326 - Datos Personales →
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">Contacto</h4>
            <p className="text-sm">
              Email: firmadigitalsimple@daslatam.org<br />
              Web: firmadigitalsimple.vercel.app
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 text-center text-sm">
          <p>© 2026 DasLATAM. Todos los derechos reservados.</p>
          <p className="mt-2 text-gray-500">
            FDS cumple con la Ley 25.506 de Firma Digital y el Código Civil y Comercial de Argentina
          </p>
        </div>
      </div>
    </footer>
  );
}
