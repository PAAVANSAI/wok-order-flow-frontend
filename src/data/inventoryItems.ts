
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minLevel: number;
  category: 'meat' | 'bread' | 'vegetable' | 'dairy' | 'condiment' | 'other';
}

export const inventoryItems: InventoryItem[] = [
  {
    id: 'chicken-patty',
    name: 'Chicken Patty',
    quantity: 50,
    unit: 'pieces',
    minLevel: 10,
    category: 'meat'
  },
  {
    id: 'chicken-popcorn',
    name: 'Chicken Popcorn',
    quantity: 200,
    unit: 'pieces',
    minLevel: 50,
    category: 'meat'
  },
  {
    id: 'french-fries',
    name: 'French Fries',
    quantity: 40,
    unit: 'servings',
    minLevel: 10,
    category: 'other'
  },
  {
    id: 'sandwich-bread',
    name: 'Sandwich Bread',
    quantity: 60,
    unit: 'slices',
    minLevel: 20,
    category: 'bread'
  },
  {
    id: 'burger-bun',
    name: 'Burger Bun',
    quantity: 40,
    unit: 'pieces',
    minLevel: 15,
    category: 'bread'
  },
  {
    id: 'veg-burger-patty',
    name: 'Veg Burger Patty',
    quantity: 25,
    unit: 'pieces',
    minLevel: 10,
    category: 'vegetable'
  },
  {
    id: 'onion',
    name: 'Onion',
    quantity: 20,
    unit: 'pieces',
    minLevel: 5,
    category: 'vegetable'
  },
  {
    id: 'capsicum',
    name: 'Capsicum',
    quantity: 15,
    unit: 'pieces',
    minLevel: 5,
    category: 'vegetable'
  },
  {
    id: 'cheese',
    name: 'Cheese',
    quantity: 60,
    unit: 'slices',
    minLevel: 20,
    category: 'dairy'
  },
  {
    id: 'mayonnaise',
    name: 'Mayonnaise',
    quantity: 40,
    unit: 'servings',
    minLevel: 10,
    category: 'condiment'
  },
  {
    id: 'sauce-packets',
    name: 'Sauce Packets',
    quantity: 100,
    unit: 'packets',
    minLevel: 30,
    category: 'condiment'
  }
];
