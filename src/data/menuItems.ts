
export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'main' | 'side' | 'drink' | 'dessert';
  ingredients: Ingredient[];
  imageUrl?: string;
}

export const menuItems: MenuItem[] = [
  {
    id: 'burger-classic',
    name: 'Classic Chicken Burger',
    description: 'Juicy chicken patty with lettuce, mayo and cheese',
    price: 199.99,
    category: 'main',
    ingredients: [
      { id: 'chicken-patty', name: 'Chicken Patty', quantity: 1 },
      { id: 'burger-bun', name: 'Burger Bun', quantity: 1 },
      { id: 'cheese', name: 'Cheese', quantity: 1 },
      { id: 'mayonnaise', name: 'Mayonnaise', quantity: 1 }
    ]
  },
  {
    id: 'burger-spicy',
    name: 'Spicy Chicken Burger',
    description: 'Spicy chicken patty with jalapenos and hot sauce',
    price: 249.99,
    category: 'main',
    ingredients: [
      { id: 'chicken-patty', name: 'Chicken Patty', quantity: 1 },
      { id: 'burger-bun', name: 'Burger Bun', quantity: 1 },
      { id: 'cheese', name: 'Cheese', quantity: 1 },
      { id: 'sauce-packets', name: 'Hot Sauce', quantity: 2 }
    ]
  },
  {
    id: 'chicken-sandwich',
    name: 'Chicken Sandwich',
    description: 'Grilled chicken with fresh veggies on bread',
    price: 179.99,
    category: 'main',
    ingredients: [
      { id: 'chicken-patty', name: 'Chicken Patty', quantity: 1 },
      { id: 'sandwich-bread', name: 'Sandwich Bread', quantity: 2 },
      { id: 'onion', name: 'Onion', quantity: 0.5 },
      { id: 'mayonnaise', name: 'Mayonnaise', quantity: 1 }
    ]
  },
  {
    id: 'chicken-popcorn',
    name: 'Chicken Popcorn',
    description: 'Crispy bite-sized chicken pieces',
    price: 149.99,
    category: 'side',
    ingredients: [
      { id: 'chicken-popcorn', name: 'Chicken Popcorn', quantity: 10 },
      { id: 'sauce-packets', name: 'Sauce', quantity: 1 }
    ]
  },
  {
    id: 'french-fries',
    name: 'French Fries',
    description: 'Crispy, golden french fries',
    price: 99.99,
    category: 'side',
    ingredients: [
      { id: 'french-fries', name: 'French Fries', quantity: 1 }
    ]
  },
  {
    id: 'veg-burger',
    name: 'Veggie Burger',
    description: 'Plant-based patty with fresh vegetables',
    price: 189.99,
    category: 'main',
    ingredients: [
      { id: 'veg-burger-patty', name: 'Veg Burger Patty', quantity: 1 },
      { id: 'burger-bun', name: 'Burger Bun', quantity: 1 },
      { id: 'onion', name: 'Onion', quantity: 0.5 },
      { id: 'capsicum', name: 'Capsicum', quantity: 0.5 },
      { id: 'cheese', name: 'Cheese', quantity: 1 }
    ]
  },
  {
    id: 'soda',
    name: 'Soda',
    description: 'Refreshing carbonated drink',
    price: 49.99,
    category: 'drink',
    ingredients: []
  },
  {
    id: 'ice-cream',
    name: 'Ice Cream',
    description: 'Creamy vanilla ice cream',
    price: 79.99,
    category: 'dessert',
    ingredients: []
  }
];
