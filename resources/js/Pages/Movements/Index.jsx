import { useState } from "react";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import AppLayout from "@/Layouts/AppLayout";
import MovementTypeBadge from "@/components/movements/movement-type-badge";

const TYPE_OPTIONS = [
    { value: "all", label: "All" },
    { value: "stock_in", label: "Stock in" },
    { value: "stock_out", label: "Stock out" },
    { value: "adjustment", label: "Adjust" },
];

const signed = (quantity) => (quantity > 0 ? `+${quantity}` : `${quantity}`);

const Index = ({ movements }) => {
    const [type, setType] = useState("all");

    const visible = movements.filter(
        (movement) => type === "all" || movement.type === type
    );

    return (
        <div className="space-y-4 p-6">
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                    <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                    <Input placeholder="Search product or SKU" className="pl-8" />
                </div>

                <div
                    className="flex items-center gap-1 rounded-lg border p-1"
                    role="group"
                    aria-label="Filter movements by type"
                >
                    {TYPE_OPTIONS.map((option) => (
                        <Button
                            key={option.value}
                            type="button"
                            variant={type === option.value ? "default" : "outline"}
                            size="sm"
                            aria-pressed={type === option.value}
                            onClick={() => setType(option.value)}
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>
            </div>

            {movements.length === 0 ? (
                <div className="rounded-xl border border-sidebar-border bg-card py-12 text-center">
                    <p className="text-muted-foreground">No movements yet.</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Stock changes will show up here once inventory is added or adjusted.
                    </p>
                </div>
            ) : visible.length === 0 ? (
                <div className="rounded-xl border border-sidebar-border bg-card py-12 text-center">
                    <p className="text-muted-foreground">No movements match these filters.</p>
                    <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => setType("all")}>
                        Clear filters
                    </Button>
                </div>
            ) : (
                <div className="rounded-xl border border-sidebar-border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-left">When</TableHead>
                                <TableHead className="text-left">Product</TableHead>
                                <TableHead className="text-left">Type</TableHead>
                                <TableHead className="text-right">Change</TableHead>
                                <TableHead className="text-left">Remarks</TableHead>
                                <TableHead className="text-left">By</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visible.map((movement) => (
                                <TableRow key={movement.id}>
                                    <TableCell className="text-left">
                                        <time dateTime={movement.created_at} className="tabular-nums">
                                            {format(new Date(movement.created_at), "MMM d, yyyy · h:mm a")}
                                        </time>
                                    </TableCell>

                                    <TableCell className="text-left">
                                        <div>{movement.inventory?.product?.name}</div>
                                        <div className="text-xs text-muted-foreground">{movement.inventory?.product?.sku}</div>
                                    </TableCell>

                                    <TableCell className="text-left">
                                        <MovementTypeBadge type={movement.type} />
                                    </TableCell>

                                    <TableCell className="text-right font-medium tabular-nums">
                                        <span className={movement.quantity > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                            {signed(movement.quantity)}
                                        </span>
                                    </TableCell>

                                    <TableCell className="max-w-[10rem] truncate text-left text-sm text-muted-foreground">
                                        {movement.remarks ?? "—"}
                                    </TableCell>

                                    <TableCell className="text-left">{movement.user?.name ?? "System"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
};

Index.layout = (page) => <AppLayout title="Movements">{page}</AppLayout>;

export default Index;
