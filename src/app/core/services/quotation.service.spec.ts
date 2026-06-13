import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { QuotationService } from './quotation.service';
import { StorageService } from './storage.service';
import { CompanyService } from './company.service';
import { ApiService } from './api.service';
import { ProductCardData } from '../models/ui.models';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeProduct(id: string, price: number, name = 'Producto'): ProductCardData {
  return {
    id,
    name,
    sku: '',
    price: String(price),
    category: '',
    categorySlug: '',
    shortStatus: '',
    stockLabel: '',
    tags: [],
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

describe('QuotationService', () => {
  let service: QuotationService;

  const storageSpy = jasmine.createSpyObj<StorageService>('StorageService', [
    'getItem',
    'setItem',
    'removeItem',
  ]);

  const companySpy = jasmine.createSpyObj<CompanyService>('CompanyService', [
    'getPublicCompany',
  ]);

  const apiSpy = jasmine.createSpyObj<ApiService>('ApiService', ['post', 'get', 'patch']);

  beforeEach(() => {
    // Reiniciar mocks entre tests
    storageSpy.getItem.and.returnValue(null);
    storageSpy.setItem.and.stub();
    storageSpy.removeItem.and.stub();
    companySpy.getPublicCompany.and.returnValue(
      of({ ok: true, data: { ivaPercent: 19 } } as any),
    );
    apiSpy.post.and.returnValue(of({ ok: false, error: 'error' }));

    TestBed.configureTestingModule({
      providers: [
        QuotationService,
        { provide: StorageService, useValue: storageSpy },
        { provide: CompanyService, useValue: companySpy },
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(QuotationService);
  });

  // ── parsePrice ─────────────────────────────────────────────────────────────

  describe('parsePrice', () => {
    it('extrae el número de un precio formateado', () => {
      expect(service.parsePrice('$10.000')).toBe(10000);
    });

    it('retorna 0 para "Consultar"', () => {
      expect(service.parsePrice('Consultar')).toBe(0);
    });

    it('retorna 0 para string vacío', () => {
      expect(service.parsePrice('')).toBe(0);
    });

    it('maneja precio numérico como string', () => {
      expect(service.parsePrice('99990')).toBe(99990);
    });
  });

  // ── addItem / cart ─────────────────────────────────────────────────────────

  describe('addItem', () => {
    it('agrega un producto al carrito', () => {
      service.addItem(makeProduct('p1', 10000));
      expect(service.items().length).toBe(1);
      expect(service.items()[0].id).toBe('p1');
    });

    it('incrementa qty si el producto ya está en el carrito', () => {
      const p = makeProduct('p1', 10000);
      service.addItem(p);
      service.addItem(p);
      expect(service.items().length).toBe(1);
      expect(service.items()[0].qty).toBe(2);
    });

    it('NO agrega producto sin precio (price=0)', () => {
      service.addItem(makeProduct('p0', 0));
      expect(service.items().length).toBe(0);
    });

    it('NO agrega producto con precio "Consultar"', () => {
      const p = { ...makeProduct('pC', 0), price: 'Consultar' } as ProductCardData;
      service.addItem(p);
      expect(service.items().length).toBe(0);
    });
  });

  // ── computed: subtotal ─────────────────────────────────────────────────────

  describe('subtotal', () => {
    it('es 0 con carrito vacío', () => {
      expect(service.subtotal()).toBe(0);
    });

    it('suma precio × cantidad de cada ítem', () => {
      service.addItem(makeProduct('p1', 10000));
      service.addItem(makeProduct('p1', 10000)); // qty=2
      service.addItem(makeProduct('p2', 5000));
      expect(service.subtotal()).toBe(10000 * 2 + 5000);
    });
  });

  // ── computed: discount ─────────────────────────────────────────────────────

  describe('discount', () => {
    beforeEach(() => {
      service.addItem(makeProduct('p1', 100000));
    });

    it('es 0 sin cupón', () => {
      expect(service.discount()).toBe(0);
    });

    it('calcula descuento porcentual correctamente', () => {
      // Simula un cupón del 10%
      (service as any)._coupon.set({
        code: 'TEST10',
        type: 'percentage',
        value: 10,
        description: '',
        discount: 10000,
      });
      expect(service.discount()).toBe(10000);
    });

    it('calcula descuento fijo correctamente', () => {
      (service as any)._coupon.set({
        code: 'FIXED5K',
        type: 'fixed',
        value: 5000,
        description: '',
        discount: 5000,
      });
      expect(service.discount()).toBe(5000);
    });

    it('descuento fijo no supera el subtotal', () => {
      (service as any)._coupon.set({
        code: 'BIG',
        type: 'fixed',
        value: 999999,
        description: '',
        discount: 999999,
      });
      expect(service.discount()).toBe(100000); // capped al subtotal
    });
  });

  // ── computed: iva ─────────────────────────────────────────────────────────

  describe('iva', () => {
    it('calcula 19% de la base imponible', () => {
      service.addItem(makeProduct('p1', 100000));
      // sin cupón, taxableBase = 100000, IVA = round(100000 * 0.19) = 19000
      expect(service.iva()).toBe(19000);
    });

    it('calcula IVA sobre la base tras aplicar descuento', () => {
      service.addItem(makeProduct('p1', 100000));
      (service as any)._coupon.set({
        code: 'DESC',
        type: 'fixed',
        value: 10000,
        description: '',
        discount: 10000,
      });
      // taxableBase = 90000, IVA = round(90000 * 0.19) = 17100
      expect(service.iva()).toBe(17100);
    });

    it('usa ivaPercent configurable', () => {
      (service as any)._ivaPercent.set(21);
      service.addItem(makeProduct('p1', 100000));
      expect(service.iva()).toBe(Math.round(100000 * 0.21));
    });
  });

  // ── computed: total ────────────────────────────────────────────────────────

  describe('total', () => {
    it('total = taxableBase + IVA + envío', () => {
      service.addItem(makeProduct('p1', 100000));
      service.setShippingMethod('rm'); // costo: 8990
      const expected = 100000 + 19000 + 8990;
      expect(service.total()).toBe(expected);
    });

    it('total con pickup (costo $0)', () => {
      service.addItem(makeProduct('p1', 100000));
      service.setShippingMethod('pickup'); // costo: 0
      expect(service.total()).toBe(100000 + 19000);
    });
  });

  // ── removeItem / undoRemove ───────────────────────────────────────────────

  describe('removeItem / undoRemove', () => {
    it('remueve un ítem del carrito', () => {
      service.addItem(makeProduct('p1', 10000));
      service.removeItem('p1');
      expect(service.items().length).toBe(0);
    });

    it('permite deshacer la última eliminación', () => {
      service.addItem(makeProduct('p1', 10000));
      service.removeItem('p1');
      service.undoRemove();
      expect(service.items().length).toBe(1);
      expect(service.lastRemoved()).toBeNull();
    });
  });

  // ── clearAll ───────────────────────────────────────────────────────────────

  describe('clearAll', () => {
    it('limpia el carrito, cupón y paso', () => {
      service.addItem(makeProduct('p1', 10000));
      (service as any)._coupon.set({ code: 'X', type: 'fixed', value: 100, description: '', discount: 100 });
      service.clearAll();
      expect(service.items().length).toBe(0);
      expect(service.coupon()).toBeNull();
      expect(service.step()).toBe(1);
    });
  });
});
