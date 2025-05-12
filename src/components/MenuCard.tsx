
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { MenuItem } from '@/data/menuItems';
import { Plus } from 'lucide-react';

interface MenuCardProps {
  item: MenuItem;
}

const MenuCard: React.FC<MenuCardProps> = ({ item }) => {
  const { addToCart } = useApp();
  
  return (
    <Card className="h-full flex flex-col transition-all hover:shadow-md overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-chickey-dark">{item.name}</CardTitle>
        <CardDescription className="text-sm text-gray-500">{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="font-semibold text-chickey-primary text-lg">₹{item.price.toFixed(2)}</p>
        <div className="mt-2 text-xs text-gray-500">
          <p>Contains: {item.ingredients.map(i => i.name).join(', ')}</p>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          onClick={() => addToCart(item)}
          className="w-full bg-chickey-primary hover:bg-chickey-primary/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Add to Order
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MenuCard;
