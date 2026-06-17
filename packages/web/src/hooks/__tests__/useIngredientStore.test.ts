import { renderHook, act } from '@testing-library/react-hooks';
import { useIngredientStore } from '../../contexts/stores/useIngredientStore';

describe('useIngredientStore', () => {
  it('should create and rename an ingredient', () => {
    const { result } = renderHook(() => useIngredientStore());
    const ingredient = {
      id: '1',
      name: 'Butter',
      default_measurement_value: { numerator: 1, denominator: 1, unit: 'oz' },
      labels: new Set(['dairy']),
    };

    act(() => {
      result.current.createIngredient(ingredient as any);
    });

    expect(result.current.ingredients).toHaveLength(1);
    expect(result.current.ingredients[0].name).toBe('Butter');

    act(() => {
      result.current.renameIngredient('1', 'Salted Butter');
    });

    expect(result.current.ingredients[0].name).toBe('Salted Butter');
  });

  it('should add and remove labels', () => {
    const { result } = renderHook(() => useIngredientStore());
    const ingredient = {
      id: '2',
      name: 'Sugar',
      default_measurement_// ... implementation
    };

    act(() => {
      result.current.createIngredient(ingredient as any);
    });

    act(() => {
      result.current.addLabels(['2'], ['baking']);
    });

    expect(result.current.ingredients[0].labels.has('baking')).toBe(true);

    act(() => {
      result.// ... implementation
    });
  });
});
