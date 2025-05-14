
import React from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Minus, Plus, TrashIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from 'react';

const Cart: React.FC = () => {
  const { cartItems, removeFromCart, updateCartItemQuantity, processOrder } = useApp();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [orderTotal, setOrderTotal] = useState(0);
  
  const totalAmount = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  const handlePlaceOrder = () => {
    // Generate a short order ID for display purposes
    const displayOrderId = `ORD-${Math.floor(Math.random() * 10000)}`;
    setOrderId(displayOrderId);
    setOrderTotal(totalAmount);
    
    // Process the order first
    processOrder();
    
    // Then show confirmation
    setShowConfirmation(true);
  };

  if (cartItems.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Your Order</CardTitle>
          <CardDescription>Your cart is empty</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-center text-muted-foreground py-8">Add items from the menu to get started</p>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button 
            disabled
            className="w-full bg-chickey-primary hover:bg-chickey-primary/90 text-white opacity-50 cursor-not-allowed"
          >
            Place Order
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle>Your Order</CardTitle>
          <CardDescription>{cartItems.length} items in your cart</CardDescription>
          
          {/* Place order button moved up into the header */}
          <Button 
            onClick={handlePlaceOrder} 
            className="w-full bg-chickey-primary hover:bg-chickey-primary/90 text-white mt-3
            transition-all duration-300 hover:scale-105 active:scale-95 animate-fade-in"
          >
            Place Order - ₹{totalAmount.toFixed(2)}
          </Button>
        </CardHeader>
        
        <CardContent className="flex-grow overflow-hidden pb-0">
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
                      className="h-7 w-7 transition-transform duration-200 hover:scale-110 active:scale-95" 
                      onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7 transition-transform duration-200 hover:scale-110 active:scale-95" 
                      onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-red-500 transition-transform duration-200 hover:scale-110 active:scale-95" 
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
        
        <CardFooter className="flex flex-col mt-4 pt-4 border-t">
          <div className="flex justify-between w-full py-2">
            <span className="font-semibold">Total Amount</span>
            <span className="font-bold text-chickey-primary">₹{totalAmount.toFixed(2)}</span>
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="max-w-md animate-scale-in">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-16 w-16 text-green-600 animate-fade-in" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <AlertDialogTitle className="text-center text-2xl">Order Placed Successfully!</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              <div className="space-y-2 mt-3">
                <p><span className="font-medium">Order ID:</span> {orderId}</p>
                <p><span className="font-medium">Amount:</span> ₹{orderTotal.toFixed(2)}</p>
                <p><span className="font-medium">Preparation Time:</span> 15-20 minutes</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <AlertDialogAction className="bg-chickey-primary hover:bg-chickey-primary/90 transition-all duration-200 hover:scale-105 active:scale-95">
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Cart;
