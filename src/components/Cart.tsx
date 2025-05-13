
import React from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Minus, Plus, TrashIcon, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Cart: React.FC = () => {
  const { cartItems, removeFromCart, updateCartItemQuantity, processOrder, inventoryItems } = useApp();
  
  const totalAmount = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Check if the current cart can be processed based on inventory
  const checkInventoryStatus = () => {
    const requiredIngredients: Record<string, number> = {};
    let insufficientItems: string[] = [];
    
    // Calculate required ingredients for the cart
    cartItems.forEach(cartItem => {
      cartItem.ingredients.forEach(ingredient => {
        const ingredientId = ingredient.id;
        const requiredAmount = ingredient.quantity * cartItem.quantity;
        
        requiredIngredients[ingredientId] = (requiredIngredients[ingredientId] || 0) + requiredAmount;
      });
    });
    
    // Check if inventory is sufficient
    Object.entries(requiredIngredients).forEach(([ingredientId, requiredAmount]) => {
      const inventoryItem = inventoryItems.find(item => item.id === ingredientId);
      if (!inventoryItem || inventoryItem.quantity < requiredAmount) {
        const itemName = inventoryItem ? inventoryItem.name : 'Unknown ingredient';
        insufficientItems.push(itemName);
      }
    });
    
    return {
      canProcess: insufficientItems.length === 0,
      insufficientItems
    };
  };
  
  const inventoryStatus = checkInventoryStatus();
  
  if (cartItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Order</CardTitle>
          <CardDescription>Your cart is empty</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Add items from the menu to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle>Your Order</CardTitle>
        <CardDescription>{cartItems.length} items in your cart</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-[calc(100vh-350px)] pr-4">
          {cartItems.map((item) => (
            <div key={item.id} className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">₹{item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-red-500" 
                    onClick={() => removeFromCart(item.id)}
                  >
                    <TrashIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between mt-1 text-sm">
                <span>Subtotal</span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
            </div>
          ))}
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex flex-col pt-2 border-t">
        <div className="flex justify-between w-full py-2">
          <span className="font-semibold">Total Amount</span>
          <span className="font-bold text-chickey-primary">₹{totalAmount.toFixed(2)}</span>
        </div>
        
        {!inventoryStatus.canProcess && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs text-red-500">
                    Insufficient inventory for: 
                    <Badge variant="outline" className="ml-2 text-red-500 border-red-200">
                      {inventoryStatus.insufficientItems.length} items
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Missing: {inventoryStatus.insufficientItems.join(', ')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        
        <Button 
          onClick={processOrder} 
          className="w-full bg-chickey-primary hover:bg-chickey-primary/90 text-white"
          disabled={!inventoryStatus.canProcess}
        >
          Place Order
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Cart;
