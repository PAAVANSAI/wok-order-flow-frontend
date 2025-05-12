
import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, PlusCircle, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { InventoryItem } from '@/data/inventoryItems';

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  price: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Price must be a positive number"
  }),
  category: z.enum(["main", "side", "drink", "dessert"]),
  ingredients: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Quantity must be a positive number"
    })
  })).min(1, "At least one ingredient is required")
});

type FormValues = z.infer<typeof formSchema>;

interface AddMenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemAdded: () => void;
}

const AddMenuItemDialog: React.FC<AddMenuItemDialogProps> = ({
  open, 
  onOpenChange,
  onItemAdded
}) => {
  const { inventoryItems } = useApp();
  const [loading, setLoading] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState<InventoryItem[]>([]);
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "main",
      ingredients: []
    }
  });
  
  useEffect(() => {
    // Fetch available ingredients from Supabase
    const fetchInventoryItems = async () => {
      try {
        const { data, error } = await supabase
          .from('inventory_items')
          .select('*')
          .order('name', { ascending: true });
          
        if (error) throw error;
        
        setAvailableIngredients(data || []);
      } catch (error) {
        console.error('Error fetching inventory items:', error);
        toast({
          title: "Error fetching ingredients",
          description: "Could not load available ingredients. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    // Only fetch if dialog is open
    if (open) {
      fetchInventoryItems();
    }
  }, [open]);
  
  const addIngredient = () => {
    const currentIngredients = form.getValues().ingredients || [];
    form.setValue("ingredients", [
      ...currentIngredients, 
      { id: "", name: "", quantity: "1" }
    ]);
  };
  
  const removeIngredient = (index: number) => {
    const currentIngredients = form.getValues().ingredients || [];
    form.setValue("ingredients", 
      currentIngredients.filter((_, i) => i !== index)
    );
  };
  
  const handleIngredientSelect = (index: number, itemId: string) => {
    const selectedItem = availableIngredients.find(item => item.id === itemId);
    if (!selectedItem) return;
    
    const currentIngredients = form.getValues().ingredients || [];
    const updatedIngredients = [...currentIngredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      id: selectedItem.id,
      name: selectedItem.name
    };
    
    form.setValue("ingredients", updatedIngredients);
  };
  
  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // Insert the new menu item
      const { data: menuItemData, error: menuItemError } = await supabase
        .from('menu_items')
        .insert({
          name: values.name,
          description: values.description,
          price: parseFloat(values.price),
          category: values.category
        })
        .select()
        .single();
        
      if (menuItemError) throw menuItemError;
      
      // Insert the ingredients
      const ingredientsToInsert = values.ingredients.map(ingredient => ({
        menu_item_id: menuItemData.id,
        inventory_item_id: ingredient.id,
        quantity: parseFloat(ingredient.quantity)
      }));
      
      const { error: ingredientError } = await supabase
        .from('menu_item_ingredients')
        .insert(ingredientsToInsert);
        
      if (ingredientError) throw ingredientError;
      
      toast({
        title: "Menu item added",
        description: `${values.name} has been added to the menu.`
      });
      
      // Reset form
      form.reset({
        name: "",
        description: "",
        price: "",
        category: "main",
        ingredients: []
      });
      
      // Close dialog and notify parent
      onOpenChange(false);
      onItemAdded();
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast({
        title: "Error adding menu item",
        description: "There was a problem adding the menu item. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Menu Item</DialogTitle>
          <DialogDescription>
            Create a new menu item with ingredients from your inventory.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Chicken Burger" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="main">Main Course</SelectItem>
                        <SelectItem value="side">Side</SelectItem>
                        <SelectItem value="drink">Drink</SelectItem>
                        <SelectItem value="dessert">Dessert</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Delicious chicken burger with cheese" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="199.99"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Ingredients</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIngredient}
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Ingredient
                </Button>
              </div>
              
              {form.getValues().ingredients?.map((_, index) => (
                <div key={index} className="flex items-end gap-2">
                  <FormField
                    control={form.control}
                    name={`ingredients.${index}.id`}
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormLabel className={index > 0 ? "sr-only" : undefined}>
                          Ingredient
                        </FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleIngredientSelect(index, value);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ingredient" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableIngredients.map(item => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name} ({item.quantity} {item.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name={`ingredients.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormLabel className={index > 0 ? "sr-only" : undefined}>
                          Qty
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeIngredient(index)}
                    className="mb-2"
                  >
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Remove ingredient</span>
                  </Button>
                </div>
              ))}
              
              {form.getValues().ingredients?.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No ingredients added. Click "Add Ingredient" to add ingredients to this menu item.
                </p>
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Menu Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMenuItemDialog;
