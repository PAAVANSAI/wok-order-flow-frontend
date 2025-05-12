
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
    
    const newQuantity = Math.max(0, currentItem.quantity + amount);
    setUpdatedValues(prev => ({ ...prev, [id]: newQuantity }));
  };

  const handleDirectInput = (id: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;
    
    setUpdatedValues(prev => ({ ...prev, [id]: Math.max(0, numValue) }));
  };
  
  const saveUpdatedQuantity = async (id: string) => {
    if (updatedValues[id] === undefined) return;
    
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({ quantity: updatedValues[id] })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setInventoryItems(items => 
        items.map(item => 
          item.id === id ? { ...item, quantity: updatedValues[id] } : item
        )
      );
      
      // Clear the updated value after saving
      setUpdatedValues(prev => {
        const newValues = { ...prev };
        delete newValues[id];
        return newValues;
      });
      
      toast({
        title: "Inventory Updated",
        description: "Inventory quantity has been updated successfully",
      });
      
      // Notify parent component if needed
      if (onInventoryUpdated) {
        onInventoryUpdated();
      }
      
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast({
        title: "Error",
        description: "Failed to update inventory quantity",
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
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Loading inventory items...
              </TableCell>
            </TableRow>
          ) : inventoryItems.length > 0 ? (
            inventoryItems.map((item) => {
              const isUpdating = updatedValues[item.id] !== undefined;
              const displayQuantity = isUpdating ? updatedValues[item.id] : item.quantity;
              
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="capitalize">{item.category}</TableCell>
                  <TableCell className="font-semibold">
                    <div className={`transition-colors ${isUpdating ? 'text-chickey-primary' : ''}`}>
                      {displayQuantity}
                    </div>
                  </TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{getLevelIndicator(item)}</TableCell>
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
                        className="w-16 h-7 text-center"
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
              <TableCell colSpan={6} className="h-24 text-center">
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
