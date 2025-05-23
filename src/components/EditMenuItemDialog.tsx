
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus, Check, Edit } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem } from '@/data/menuItems';
import { InventoryItem } from '@/data/inventoryItems';

interface EditMenuItemDialogProps {
  menuItem: MenuItem;
  onMenuItemUpdated: (updatedMenuItem: MenuItem) => void;
}

const EditMenuItemDialog: React.FC<EditMenuItemDialogProps> = ({ menuItem, onMenuItemUpdated }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(menuItem.name);
  const [description, setDescription] = useState(menuItem.description);
  const [price, setPrice] = useState(menuItem.price.toString());
  const [category, setCategory] = useState<'main' | 'side' | 'drink' | 'dessert'>(menuItem.category);
  const [ingredients, setIngredients] = useState<{ id: string; name: string; quantity: number }[]>(
    menuItem.ingredients || []
  );
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [ingredientQuantity, setIngredientQuantity] = useState('1');

  // Fetch inventory items from Supabase
  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        const { data, error } = await supabase.from('inventory_items').select('*');
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Transform database format to match InventoryItem type
          const transformedData = data.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            minLevel: item.min_level, // Convert from snake_case to camelCase
            category: item.category as 'meat' | 'bread' | 'vegetable' | 'dairy' | 'condiment' | 'other'
          }));
          
          setInventoryItems(transformedData);
        }
      } catch (error) {
        console.error('Error fetching inventory items:', error);
        toast({
          title: 'Error',
          description: 'Failed to load inventory items.',
          variant: 'destructive'
        });
      }
    };

    if (open) {
      fetchInventoryItems();
    }
  }, [open]);

  useEffect(() => {
    // Update local state when menuItem prop changes
    setName(menuItem.name);
    setDescription(menuItem.description);
    setPrice(menuItem.price.toString());
    setCategory(menuItem.category);
    setIngredients(menuItem.ingredients || []);
  }, [menuItem]);

  const addIngredient = () => {
    if (!selectedIngredient) return;
    
    const inventoryItem = inventoryItems.find(item => item.id === selectedIngredient);
    if (!inventoryItem) return;
    
    // Check if ingredient already exists
    const existingIngredientIndex = ingredients.findIndex(i => i.id === selectedIngredient);
    
    if (existingIngredientIndex !== -1) {
      // Update existing ingredient
      const updatedIngredients = [...ingredients];
      updatedIngredients[existingIngredientIndex].quantity += Number(ingredientQuantity);
      setIngredients(updatedIngredients);
    } else {
      // Add new ingredient
      setIngredients([
        ...ingredients,
        {
          id: selectedIngredient,
          name: inventoryItem.name,
          quantity: Number(ingredientQuantity)
        }
      ]);
    }
    
    // Reset selections
    setSelectedIngredient('');
    setIngredientQuantity('1');
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(ingredient => ingredient.id !== id));
  };

  const handleSubmit = async () => {
    // Validate inputs
    if (!name.trim() || !description.trim() || !price.trim() || ingredients.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields and add at least one ingredient.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Update the menu item
      const { error: menuItemError } = await supabase
        .from('menu_items')
        .update({
          name,
          description,
          price: parseFloat(price),
          category
        })
        .eq('id', menuItem.id);

      if (menuItemError) {
        throw menuItemError;
      }

      // Delete existing menu item ingredients
      const { error: deleteError } = await supabase
        .from('menu_item_ingredients')
        .delete()
        .eq('menu_item_id', menuItem.id);

      if (deleteError) {
        throw deleteError;
      }

      // Insert updated menu item ingredients
      const menuItemIngredients = ingredients.map(ingredient => ({
        menu_item_id: menuItem.id,
        inventory_item_id: ingredient.id,
        quantity: ingredient.quantity
      }));

      const { error: ingredientsError } = await supabase
        .from('menu_item_ingredients')
        .insert(menuItemIngredients);

      if (ingredientsError) {
        throw ingredientsError;
      }

      // Create the updated menu item object
      const updatedMenuItem: MenuItem = {
        ...menuItem,
        name,
        description,
        price: parseFloat(price),
        category,
        ingredients
      };

      // Call the callback to update the parent component
      onMenuItemUpdated(updatedMenuItem);

      // Close dialog
      setOpen(false);

      toast({
        title: 'Success',
        description: 'Menu item updated successfully.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update menu item. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Menu Item</DialogTitle>
          <DialogDescription>
            Update the details and ingredients for this menu item.
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
          
          <div className="border-t pt-4 mt-2">
            <h4 className="font-medium mb-3">Ingredients</h4>
            
            <div className="grid grid-cols-[1fr,auto,auto] gap-2 items-end mb-2">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="ingredient">Select Ingredient</Label>
                <Select
                  value={selectedIngredient}
                  onValueChange={setSelectedIngredient}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an ingredient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Ingredients</SelectLabel>
                      {inventoryItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.quantity} {item.unit} available)
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  value={ingredientQuantity}
                  onChange={(e) => setIngredientQuantity(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="Qty"
                  className="w-20"
                />
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addIngredient}
                disabled={!selectedIngredient}
                className="mb-0.5"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {ingredients.length > 0 ? (
              <div className="border rounded-md mt-2">
                <div className="bg-muted py-2 px-4 rounded-t-md">
                  <div className="grid grid-cols-[1fr,auto,auto] gap-2">
                    <div>Ingredient</div>
                    <div>Quantity</div>
                    <div></div>
                  </div>
                </div>
                <div className="p-2">
                  {ingredients.map((ingredient) => (
                    <div key={ingredient.id} className="grid grid-cols-[1fr,auto,auto] gap-2 items-center py-2 border-b last:border-0">
                      <div>{ingredient.name}</div>
                      <div className="text-center">{ingredient.quantity}</div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIngredient(ingredient.id)}
                        className="h-8 w-8 text-red-500"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center p-4 border rounded-md text-muted-foreground bg-muted/30">
                No ingredients added yet. Select from the list above.
              </div>
            )}
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
            <Check className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditMenuItemDialog;
