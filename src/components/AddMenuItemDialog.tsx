
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Check } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem } from '@/data/menuItems';
import { v4 as uuidv4 } from 'uuid';

interface AddMenuItemDialogProps {
  onMenuItemAdded: (menuItem: MenuItem) => void;
}

const AddMenuItemDialog: React.FC<AddMenuItemDialogProps> = ({ onMenuItemAdded }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<'main' | 'side' | 'drink' | 'dessert'>('main');

  const handleSubmit = async () => {
    // Validate inputs
    if (!name.trim() || !description.trim() || !price.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Generate a unique ID for the menu item
      const menuItemId = uuidv4();
      
      // Insert the menu item with empty ingredients
      const { error: menuItemError } = await supabase
        .from('menu_items')
        .insert({
          id: menuItemId,
          name,
          description,
          price: parseFloat(price),
          category
        });

      if (menuItemError) {
        throw menuItemError;
      }

      // Create the new menu item object to be added to the UI
      const newMenuItem: MenuItem = {
        id: menuItemId,
        name,
        description,
        price: parseFloat(price),
        category,
        ingredients: [] // Empty ingredients as per requirement
      };

      // Call the callback to update the parent component
      onMenuItemAdded(newMenuItem);

      // Reset form and close dialog
      resetForm();
      setOpen(false);

      toast({
        title: 'Success',
        description: 'Menu item added successfully.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast({
        title: 'Error',
        description: 'Failed to add menu item. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setCategory('main');
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="bg-chickey-primary hover:bg-chickey-primary/90 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add Menu Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Menu Item</DialogTitle>
          <DialogDescription>
            Create a new item to add to your menu. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter item name"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="Enter price"
                type="text"
                inputMode="decimal"
              />
            </div>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a brief description"
              rows={3}
            />
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={(value: 'main' | 'side' | 'drink' | 'dessert') => setCategory(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Categories</SelectLabel>
                  <SelectItem value="main">Main Course</SelectItem>
                  <SelectItem value="side">Side Dish</SelectItem>
                  <SelectItem value="drink">Drink</SelectItem>
                  <SelectItem value="dessert">Dessert</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="bg-chickey-primary hover:bg-chickey-primary/90 text-white"
          >
            <Check className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMenuItemDialog;
