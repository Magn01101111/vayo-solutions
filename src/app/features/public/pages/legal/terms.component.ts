import { Component } from '@angular/core';

@Component({
  selector: 'app-terms',
  standalone: true,
  template: `
    <div class="legal-page">
      <h1>Términos y condiciones</h1>
      <p>Última actualización: junio 2026</p>
      <h2>1. Aceptación</h2>
      <p>Al utilizar el sitio web de VAYO Solutions y solicitar cotizaciones, aceptas estos términos.</p>
      <h2>2. Cotizaciones</h2>
      <p>Las cotizaciones generadas tienen una vigencia de 30 días corridos desde su emisión. Los precios pueden variar según disponibilidad y cambios del proveedor.</p>
      <h2>3. Datos personales</h2>
      <p>La información proporcionada (RUT, dirección, teléfono) se utiliza exclusivamente para la gestión de cotizaciones y ventas, conforme a nuestra Política de Privacidad.</p>
      <h2>4. Propiedad intelectual</h2>
      <p>Todo el contenido del sitio (imágenes, descripciones, marcas) es propiedad de VAYO Solutions o de sus proveedores.</p>
      <h2>5. Contacto</h2>
      <p>Para cualquier consulta sobre estos términos, escríbenos a contacto&#64;vayo.cl.</p>
    </div>
  `,
  styles: [`
    .legal-page {
      max-width: 720px;
      margin: 2rem auto;
      padding: 0 1rem;
      line-height: 1.7;
    }
    h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.25rem; margin-top: 1.5rem; }
    p { color: var(--color-text-secondary); }
  `],
})
export class TermsComponent {}
