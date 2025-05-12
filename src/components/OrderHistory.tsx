
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const OrderHistory: React.FC = () => {
  const [date, setDate] = useState<Date>(new Date());
  const { getOrdersByDate } = useApp();
  
  const orders = getOrdersByDate(date);
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Order History</CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <CalendarIcon className="h-4 w-4" />
                {format(date, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No orders found for {format(date, "PPP")}
          </p>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Total orders: <span className="font-semibold">{orders.length}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Total revenue: <span className="font-semibold text-chickey-primary">₹{totalRevenue.toFixed(2)}</span>
              </p>
            </div>
            
            <ScrollArea className="h-[300px]">
              {orders.map((order) => (
                <Card key={order.id} className="mb-4 border border-gray-200">
                  <CardHeader className="py-2 px-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {format(new Date(order.timestamp), "h:mm a")}
                      </p>
                      <p className="text-sm font-bold text-chickey-primary">
                        ₹{order.total.toFixed(2)}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[180px]">Item</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((item) => (
                          <TableRow key={`${order.id}-${item.id}`}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell className="text-right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderHistory;
