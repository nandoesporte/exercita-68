
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface DataTableProps<TData> {
  columns: {
    accessorKey: string;
    header: string;
    cell?: ({ row }: { row: { original: TData } }) => React.ReactNode;
    hideOnMobile?: boolean;
  }[];
  data: TData[];
  isLoading?: boolean;
  cardView?: boolean; // Force card view regardless of screen size
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  cardView = false,
}: DataTableProps<TData>) {
  const isMobile = useIsMobile();
  const shouldUseCards = cardView || isMobile;
  
  if (isLoading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full py-8 sm:py-12 text-center border rounded-md">
        <p className="text-muted-foreground text-sm sm:text-base">Nenhum dado disponível</p>
      </div>
    );
  }

  // Card view for mobile and when forced
  if (shouldUseCards) {
    return (
      <div className="space-y-3">
        {data.map((row, rowIndex) => (
          <Card key={rowIndex} className="w-full">
            <CardContent className="p-4">
              <div className="grid gap-2">
                {columns
                  .filter(column => !column.hideOnMobile)
                  .map((column, colIndex) => (
                    <div key={colIndex} className="flex justify-between items-start">
                      <span className="font-medium text-sm text-muted-foreground min-w-0 flex-shrink-0 mr-3">
                        {column.header}:
                      </span>
                      <div className="text-sm text-right min-w-0 flex-1">
                        {column.cell
                          ? column.cell({ row: { original: row } })
                          : (row as any)[column.accessorKey]}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              {columns.map((column, i) => (
                <TableHead key={i} className="px-4 py-3">
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column, colIndex) => (
                  <TableCell 
                    key={`${rowIndex}-${colIndex}`}
                    className="px-4 py-3"
                  >
                    {column.cell
                      ? column.cell({ row: { original: row } })
                      : (row as any)[column.accessorKey]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
