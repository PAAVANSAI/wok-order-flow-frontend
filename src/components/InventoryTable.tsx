
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Plus, Minus, Package, Save } from 'lucide-react';

const InventoryTable: React.FC = () => {
  const { inventoryItems, updateInventoryItem } = useApp();
  const [updatedValues, setUpdatedValues] = useState<Record<string, number>>({});
  
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
  
  const saveUpdatedQuantity = (id: string) => {
    if (updatedValues[id] !== undefined) {
      updateInventoryItem(id, updatedValues[id]);
      // Clear the updated value after saving
      setUpdatedValues(prev => {
        const newValues = { ...prev };
        delete newValues[id];
        return newValues;
      });
    }
  };
  
  const getLevelIndicator = (item: typeof inventoryItems[0]) => {
    if (item.quantity <= item.minLevel * 0.5) {
      return <Badge variant="destructive">Low</Badge>;
    }
    if (item.quantity <= item.minLevel) {
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
          {inventoryItems.map((item) => {
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
          })}
        </TableBody>
      </Table>
    </Card>
  );
};

export default InventoryTable;
