import { create } from 'zustand';

interface MeasurementStore {
  conversionRates: Record<string, number>;
  convert: (value: number, fromUnit: string, toUnit: string) => number;
  updateConversionRate: (key: string, rate: number) => void;
}

export const useMeasurementStore = create<MeasurementStore>((set, get) => ({
  conversionRates: {
    'g_to_oz': 0.035274,
    'ml_to_cup': 0.00422675,
    'oz_to_g': 28.3495,
  },
  convert: (value, fromUnit, toUnit) => {
    const key = `${fromUnit}_to_${toUnit}`;
    const rate = get().conversionRates[key];
    if (!rate) throw new Error(`Unsupported conversion: ${key}`);
    return value * rate;
  },
  updateConversionRate: (key, rate) => set((state) => ({
    conversionRates: { ...state.conversionRates, [key]: rate },
  })),
}));
