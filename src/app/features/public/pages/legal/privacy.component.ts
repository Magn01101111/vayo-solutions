import { Component } from '@angular/core';

@Component({
  selector: 'app-privacy',
  standalone: true,
  template: `
    <div class="legal-page">
      <h1>Política de privacidad</h1>
      <p>Última actualización: junio 2026</p>
      <h2>1. Datos que recopilamos</h2>
      <p>Recopilamos nombre, RUT, correo electrónico, teléfono y dirección para procesar cotizaciones y ventas. No compartimos esta información con terceros.</p>
      <h2>2. Uso de la información</h2>
      <p>Los datos se utilizan exclusivamente para: generar cotizaciones, gestionar ventas, enviar comprobantes por correo y mantener el historial del cliente.</p>
      <h2>3. Seguridad</h2>
      <p>Implementamos medidas de seguridad (JWT, HTTPS, contraseñas hasheadas con bcrypt) para proteger tu información personal.</p>
      <h2>4. Derechos ARCO</h2>
      <p>Puedes solicitar acceder, rectificar, cancelar u oponerte al tratamiento de tus datos escribiendo a contacto&#64;vayo.cl.</p>
      <h2>5. Cookies</h2>
      <p>Utilizamos cookies técnicas necesarias para el funcionamiento del sitio. No usamos cookies de rastreo ni publicitarias.</p>
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
export class PrivacyComponent {}
