
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AddInventoryItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemsAdded: () => void;
}

const AddInventoryItemDialog: React.FC<AddInventoryItemDialogProps> = ({ 
  open, 
  onOpenChange,
  onItemsAdded
}) => {
  const [items, setItems] = useState<{
    name: string;
    quantity: number;
    unit: string;
    minLevel: number;
    category: string;
  }[]>([{
    name: '',
    quantity: 0,
    unit: 'pieces',
    minLevel: 10,
    category: 'other'
  }]);

  const categoryOptions = [
    { id: 'meat', name: 'Meat' },
    { id: 'bread', name: 'Bread' },
    { id: 'vegetable', name: 'Vegetables' },
    { id: 'dairy', name: 'Dairy' },
    { id: 'condiment', name: 'Condiments' },
    { id: 'other', name: 'Other' }
  ];
  
  const unitOptions = ['pieces', 'slices', 'servings', 'packets', 'kg', 'liters'];

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addNewItemRow = () => {
    setItems([...items, {
      name: '',
      quantity: 0,
      unit: 'pieces',
      minLevel: 10,
      category: 'other'
    }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return; // Keep at least one item
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleSubmit = async () => {
    // Validate items
    const invalidItems = items.filter(item => 
      !item.name.trim() || 
      item.quantity < 0 ||
      !item.category ||
      !item.unit
    );
    
    if (invalidItems.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields correctly for each item",
        variant: "destructive"
      });
      return;
    }

    try {
      // Insert items into Supabase
      for (const item of items) {
        const { error } = await supabase
          .from('inventory_items')
          .insert({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            min_level: item.minLevel,
            category: item.category
          });
          
        if (error) throw error;
      }
      
      // Success notification
      toast({
        title: "Items Added",
        description: `Successfully added ${items.length} item(s) to inventory`,
      });
      
      // Reset form and close dialog
      setItems([{
        name: '',
        quantity: 0,
        unit: 'pieces',
        minLevel: 10,
        category: 'other'
      }]);
      
      // Notify parent to refresh data
      onItemsAdded();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error adding inventory items:', error);
      toast({
        title: "Error",
        description: "Failed to add inventory items. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Inventory Items</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {items.map((item, index) => (
            <div key={index} className="space-y-3 p-4 border rounded-lg relative">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Item #{index + 1}</h4>
                {items.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeItemRow(index)} 
                    className="h-8 w-8 p-0 text-red-500 absolute top-2 right-2"
                  >
                    ✕
                  </Button>
                )}
              </div>
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor={`name-${index}`}>Item Name</Label>
                  <Input 
                    id={`name-${index}`} 
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    placeholder="Enter item name"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor={`category-${index}`}>Category</Label>
                    <Select 
                      value={item.category}
                      onValueChange={(value) => handleItemChange(index, 'category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor={`unit-${index}`}>Unit</Label>
                    <Select 
                      value={item.unit}
                      onValueChange={(value) => handleItemChange(index, 'unit', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {unitOptions.map(unit => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                    <Input 
                      id={`quantity-${index}`}
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor={`minLevel-${index}`}>Minimum Level</Label>
                    <Input 
                      id={`minLevel-${index}`}
                      type="number"
                      value={item.minLevel}
                      onChange={(e) => handleItemChange(index, 'minLevel', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <Button 
            type="button"
            variant="outline"
            className="w-full"
            onClick={addNewItemRow}
          >
            + Add Another Item
          </Button>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Save All Items</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddInventoryItemDialog;
