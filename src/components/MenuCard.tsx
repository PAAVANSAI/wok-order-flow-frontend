
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { MenuItem } from '@/data/menuItems';
import { Plus, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MenuCardProps {
  item: MenuItem;
}

const MenuCard: React.FC<MenuCardProps> = ({ item }) => {
  const { addToCart, inventoryItems } = useApp();
  
  // Check if all ingredients are in stock
  const checkIngredientStock = () => {
    if (!item.ingredients || item.ingredients.length === 0) return true;
    
    return item.ingredients.every(ingredient => {
      const inventoryItem = inventoryItems.find(invItem => invItem.id === ingredient.id);
      return inventoryItem && inventoryItem.quantity >= ingredient.quantity;
    });
  };
  
  const hasStock = checkIngredientStock();
  
  const renderIngredientList = () => {
    if (!item.ingredients || item.ingredients.length === 0) {
      return <p className="text-xs text-gray-400">No ingredients listed</p>;
    }
    
    return (
      <div className="mt-2">
        <p className="text-xs text-gray-500 mb-1">Ingredients:</p>
        <ul className="text-xs text-gray-400 space-y-0.5">
          {item.ingredients.map((ingredient, index) => {
            const inventoryItem = inventoryItems.find(invItem => invItem.id === ingredient.id);
            const isLowStock = inventoryItem && inventoryItem.quantity < ingredient.quantity;
            
            return (
              <li key={index} className={`flex items-center ${isLowStock ? 'text-amber-600' : ''}`}>
                {isLowStock && <AlertCircle className="h-3 w-3 mr-1 inline" />}
                {ingredient.name} ({ingredient.quantity} {inventoryItem?.unit || 'unit(s)'})
              </li>
            );
          })}
        </ul>
      </div>
    );
  };
  
  return (
    <Card className="h-full flex flex-col transition-all hover:shadow-md overflow-hidden animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-chickey-dark">{item.name}</CardTitle>
        <CardDescription className="text-sm text-gray-500">{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="font-semibold text-chickey-primary text-lg">₹{item.price.toFixed(2)}</p>
        {renderIngredientList()}
      </CardContent>
      <CardFooter className="pt-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <Button 
                  onClick={() => addToCart(item)}
                  className={`w-full transition-all duration-300 hover:scale-105 active:scale-95 
                    ${hasStock 
                      ? 'bg-chickey-primary hover:bg-chickey-primary/90 text-white' 
                      : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  disabled={!hasStock}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add to Order
                </Button>
              </div>
            </TooltipTrigger>
            {!hasStock && (
              <TooltipContent>
                <p>Some ingredients are out of stock</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
};

export default MenuCard;
