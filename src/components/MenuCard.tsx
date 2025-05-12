
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { MenuItem } from '@/data/menuItems';
import { Plus, Pencil } from 'lucide-react';
import EditMenuItemDialog from './EditMenuItemDialog';

interface MenuCardProps {
  item: MenuItem;
  onItemUpdated?: () => void;
}

const MenuCard: React.FC<MenuCardProps> = ({ item, onItemUpdated }) => {
  const { addToCart } = useApp();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const handleItemUpdated = () => {
    if (onItemUpdated) {
      onItemUpdated();
    }
  };
  
  return (
    <>
      <Card className="h-full flex flex-col transition-all hover:shadow-md overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-bold text-chickey-dark">{item.name}</CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
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
      
      <EditMenuItemDialog 
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onItemUpdated={handleItemUpdated}
        menuItem={item}
      />
    </>
  );
};

export default MenuCard;
