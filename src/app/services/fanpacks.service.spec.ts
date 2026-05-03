import {
  calculateFanpackTotal,
  getCompletePackMaxQuantity,
} from './fanpacks.service';

describe('fanpack cart helpers', () => {
  it('calculates member quantities with unit price', () => {
    const total = calculateFanpackTotal(
      { unitPrice: 4, completePackPrice: null },
      [{ id: 'jin' }, { id: 'suga' }],
      { jin: 2, suga: 1 },
      0,
    );

    expect(total).toBe(12);
  });

  it('adds explicit complete packs with the discounted price', () => {
    const total = calculateFanpackTotal(
      { unitPrice: 5, completePackPrice: 30 },
      [{ id: 'jin' }, { id: 'suga' }],
      { jin: 1 },
      2,
    );

    expect(total).toBe(65);
  });

  it('ignores complete pack price when the discount is not configured', () => {
    const total = calculateFanpackTotal(
      { unitPrice: 5, completePackPrice: null },
      [{ id: 'jk' }],
      { jk: 1 },
      3,
    );

    expect(total).toBe(5);
  });

  it('uses the lowest active member stock as complete pack max quantity', () => {
    const maxQuantity = getCompletePackMaxQuantity([
      { stock: 6, isActive: true },
      { stock: 2, isActive: true },
      { stock: 0, isActive: false },
    ]);

    expect(maxQuantity).toBe(2);
  });
});
