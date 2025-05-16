
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Plus, Minus, Save } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  min_level: number;
  category: string;
  wastages?: number; // Updated from wattages to wastages
}

interface InventoryTableProps {
  category: string;
  searchTerm: string;
  onInventoryUpdated?: () => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ 
  category, 
  searchTerm,
  onInventoryUpdated 
}) => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedValues, setUpdatedValues] = useState<Record<string, number>>({});
  const [updatedWastages, setUpdatedWastages] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchInventoryItems();
  }, [category, searchTerm]);

  const fetchInventoryItems = async () => {
    try {
      setLoading(true);
      let query = supabase.from('inventory_items').select('*');
      
      // Apply category filter if not 'all'
      if (category !== 'all') {
        query = query.eq('category', category);
      }
      
      // Apply search term if present
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      // Sort by name
      query = query.order('name');
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setInventoryItems(data || []);
      
      // Reset updatedValues when fetching new items
      setUpdatedValues({});
      setUpdatedWastages({});
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateQuantity = (id: string, amount: number) => {
    const currentItem = inventoryItems.find(item => item.id === id);
    if (!currentItem) return;
    
    const currentValue = updatedValues[id] !== undefined ? updatedValues[id] : currentItem.quantity;
    const newQuantity = Math.max(0, currentValue + amount);
    setUpdatedValues(prev => ({ ...prev, [id]: newQuantity }));
  };

  const handleDirectInput = (id: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;
    
    setUpdatedValues(prev => ({ ...prev, [id]: Math.max(0, numValue) }));
  };

  const handleDirectWastageInput = (id: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;
    
    setUpdatedWastages(prev => ({ ...prev, [id]: Math.max(0, numValue) }));
  };
  
  const saveUpdatedQuantity = async (id: string) => {
    if (updatedValues[id] === undefined && updatedWastages[id] === undefined) return;
    
    try {
      const currentItem = inventoryItems.find(item => item.id === id);
      if (!currentItem) return;

      const updateData: { quantity?: number; wastages?: number } = {};
      
      if (updatedValues[id] !== undefined) {
        updateData.quantity = updatedValues[id];
      }
      
      if (updatedWastages[id] !== undefined) {
        updateData.wastages = updatedWastages[id];
      }
      
      const { error } = await supabase
        .from('inventory_items')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setInventoryItems(items => 
        items.map(item => {
          if (item.id === id) {
            return { 
              ...item, 
              quantity: updatedValues[id] !== undefined ? updatedValues[id] : item.quantity,
              wastages: updatedWastages[id] !== undefined ? updatedWastages[id] : item.wastages
            };
          }
          return item;
        })
      );
      
      // Clear the updated values after saving
      setUpdatedValues(prev => {
        const newValues = { ...prev };
        delete newValues[id];
        return newValues;
      });
      
      setUpdatedWastages(prev => {
        const newValues = { ...prev };
        delete newValues[id];
        return newValues;
      });
      
      toast({
        title: "Inventory Updated",
        description: "Inventory data has been updated successfully",
      });
      
      // Notify parent component if needed
      if (onInventoryUpdated) {
        onInventoryUpdated();
      }
      
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast({
        title: "Error",
        description: "Failed to update inventory data",
        variant: "destructive"
      });
    }
  };
  
  const getLevelIndicator = (item: InventoryItem) => {
    if (item.quantity <= item.min_level * 0.5) {
      return <Badge variant="destructive">Low</Badge>;
    }
    if (item.quantity <= item.min_level) {
      return <Badge variant="outline" className="border-orange-400 text-orange-400">Warning</Badge>;
    }
    return <Badge variant="outline" className="border-green-500 text-green-500">Good</Badge>;
  };

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Wastages</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                Loading inventory items...
              </TableCell>
            </TableRow>
          ) : inventoryItems.length > 0 ? (
            inventoryItems.map((item) => {
              const isUpdating = updatedValues[item.id] !== undefined || updatedWastages[item.id] !== undefined;
              const displayQuantity = updatedValues[item.id] !== undefined ? updatedValues[item.id] : item.quantity;
              const displayWastage = updatedWastages[item.id] !== undefined ? updatedWastages[item.id] : (item.wastages || 0);
              
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="capitalize">{item.category}</TableCell>
                  <TableCell className="font-semibold">
                    <div className={`transition-colors ${updatedValues[item.id] !== undefined ? 'text-chickey-primary' : ''}`}>
                      {displayQuantity}
                    </div>
                  </TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{getLevelIndicator(item)}</TableCell>
                  <TableCell>
                    <Input
                      value={displayWastage}
                      onChange={(e) => handleDirectWastageInput(item.id, e.target.value)}
                      className={`w-20 h-7 text-center ${updatedWastages[item.id] !== undefined ? 'border-chickey-primary' : ''}`}
                      type="number"
                      min="0"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7" 
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <Input
                        value={displayQuantity}
                        onChange={(e) => handleDirectInput(item.id, e.target.value)}
                        className="w-20 h-7 text-center"
                        type="number"
                        min="0"
                      />
                      
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7" 
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      
                      {isUpdating && (
                        <Button 
                          size="icon" 
                          className="h-7 w-7 bg-chickey-primary hover:bg-chickey-primary/90 text-white" 
                          onClick={() => saveUpdatedQuantity(item.id)}
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No inventory items found matching your criteria.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
};

export default InventoryTable;
