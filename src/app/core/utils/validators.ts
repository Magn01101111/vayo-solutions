/**
 * Validadores y formateadores para datos chilenos.
 * Mismo contrato que el backend (utils/validators.js).
 */

// ── RUT chileno ──────────────────────────────────────────────────────────────

/**
 * Valida un RUT chileno y retorna su forma canónica "12345678-9".
 * Devuelve `null` si el RUT es inválido.
 */
export function validateRut(input: string | null | undefined): string | null {
  if (!input) return null;

  const cleaned = input.replace(/[.\-\s]/g, '').toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(cleaned)) return null;

  const body = cleaned.slice(0, -1);
  const dv   = cleaned.slice(-1);

  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = sum % 11;
  const expected =
    remainder === 0 ? '0' :
    remainder === 1 ? 'K' :
    String(11 - remainder);

  return dv === expected ? `${body}-${dv}` : null;
}

/**
 * Formatea un RUT canónico ("12345678-9") al formato con puntos ("12.345.678-9").
 */
export function formatRut(canonical: string | null | undefined): string {
  if (!canonical) return '';
  const [body, dv] = canonical.split('-');
  if (!body || !dv) return canonical;
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${withDots}-${dv}`;
}

/**
 * Formatea un RUT mientras el usuario tipea (input handler).
 * Acepta cualquier carácter, limpia, y devuelve "12.345.678-9".
 */
export function formatRutInput(input: string): string {
  const cleaned = input.replace(/[^0-9kK]/g, '').toUpperCase();
  if (cleaned.length === 0) return '';
  if (cleaned.length === 1) return cleaned;
  const body = cleaned.slice(0, -1);
  const dv   = cleaned.slice(-1);
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${withDots}-${dv}`;
}

// ── Teléfono chileno (E.164) ─────────────────────────────────────────────────

/**
 * Convierte la entrada del usuario a formato E.164 "+56912345678".
 * Acepta múltiples formatos comunes.
 */
export function normalizeChileanPhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('569')) return `+${digits}`;
  if (digits.length === 9  && digits.startsWith('9'))   return `+56${digits}`;
  if (digits.length === 8)                              return `+569${digits}`;

  return null;
}

/**
 * Formatea un teléfono E.164 "+56912345678" → "+56 9 1234 5678".
 */
export function formatPhone(e164: string | null | undefined): string {
  if (!e164 || !/^\+56\d{9}$/.test(e164)) return e164 || '';
  return `+56 ${e164.charAt(3)} ${e164.slice(4, 8)} ${e164.slice(8)}`;
}

/**
 * Filtra entrada para que sólo contenga dígitos (uso en (input) handlers).
 */
export function onlyDigits(input: string, maxLen?: number): string {
  const cleaned = input.replace(/\D/g, '');
  return maxLen ? cleaned.slice(0, maxLen) : cleaned;
}
