'use client';

import { useState } from 'react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	AlertCircle,
	Package,
	TrendingUp,
	TrendingDown,
	ArrowUpRight,
	ArrowDownLeft,
	Download,
	Plus,
	Filter,
	Search,
} from 'lucide-react';

// Mock data for stock movements
const mockStockMovements = [
	{
		id: 'MOV-001',
		date: '2026-04-02',
		time: '14:30',
		drug: 'Paracetamol 500mg',
		type: 'stock_in', // stock_in, stock_out, adjustment, transfer, damage, loss
		quantity: 100,
		unit: 'tablets',
		reference: 'PO-2026-045',
		user: 'John Doe',
		notes: 'Received from supplier',
	},
	{
		id: 'MOV-002',
		date: '2026-04-02',
		time: '13:15',
		drug: 'Antibiotics (Amoxicillin)',
		type: 'stock_out',
		quantity: 50,
		unit: 'capsules',
		reference: 'RX-2026-1234',
		user: 'Jane Smith',
		notes: 'Dispensed to patient',
	},
	{
		id: 'MOV-003',
		date: '2026-04-01',
		time: '11:00',
		drug: 'Vitamin C 1000mg',
		type: 'adjustment',
		quantity: -10,
		unit: 'tablets',
		reference: 'ADJ-2026-008',
		user: 'Admin',
		notes: 'Stock count variance - physical count adjustment',
	},
	{
		id: 'MOV-004',
		date: '2026-04-01',
		time: '09:45',
		drug: 'Metformin 500mg',
		type: 'damage',
		quantity: 5,
		unit: 'tablets',
		reference: 'DMG-2026-003',
		user: 'Supervisor',
		notes: 'Damaged packaging, removed from stock',
	},
	{
		id: 'MOV-005',
		date: '2026-03-31',
		time: '15:00',
		drug: 'Insulin Injection',
		type: 'transfer',
		quantity: 20,
		unit: 'vials',
		reference: 'TRF-2026-012',
		user: 'Senior Pharmacist',
		notes: 'Transferred to ICU ward stock',
	},
];

// Mock data for reconciliation records
const mockReconciliation = [
	{
		id: 'REC-001',
		date: '2026-04-02',
		drug: 'Paracetamol 500mg',
		systemQty: 450,
		physicalQty: 445,
		variance: -5,
		variancePercent: -1.11,
		lastReconciled: '2026-03-25',
		status: 'pending',
	},
	{
		id: 'REC-002',
		date: '2026-04-02',
		drug: 'Antibiotics (Amoxicillin)',
		systemQty: 180,
		physicalQty: 180,
		variance: 0,
		variancePercent: 0,
		lastReconciled: '2026-04-02',
		status: 'reconciled',
	},
	{
		id: 'REC-003',
		date: '2026-04-02',
		drug: 'Vitamin C 1000mg',
		systemQty: 200,
		physicalQty: 210,
		variance: 10,
		variancePercent: 5.0,
		lastReconciled: '2026-03-20',
		status: 'pending',
	},
];

// Mock data for stock adjustments
const mockAdjustments = [
	{
		id: 'ADJ-001',
		date: '2026-04-02',
		drug: 'Paracetamol 500mg',
		reason: 'Physical count variance',
		oldQty: 455,
		newQty: 450,
		adjustment: -5,
		approvedBy: 'Manager',
		status: 'approved',
	},
	{
		id: 'ADJ-002',
		date: '2026-04-02',
		drug: 'Damaged stock removal',
		reason: 'Damaged packaging',
		oldQty: 50,
		newQty: 45,
		adjustment: -5,
		approvedBy: 'Senior Pharmacist',
		status: 'approved',
	},
];

interface MovementFilter {
	type: string;
	searchTerm: string;
	dateFrom: string;
	dateTo: string;
}

export default function StockManagementPage() {
	const [activeTab, setActiveTab] = useState('movements');
	const [movements, setMovements] = useState(mockStockMovements);
	const [reconciliation, setReconciliation] = useState(mockReconciliation);
	const [adjustments, setAdjustments] = useState(mockAdjustments);
	const [filter, setFilter] = useState<MovementFilter>({
		type: 'all',
		searchTerm: '',
		dateFrom: '',
		dateTo: '',
	});
	const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
	const [showReconcileDialog, setShowReconcileDialog] = useState(false);
	const [selectedReconciliation, setSelectedReconciliation] = useState<
		(typeof mockReconciliation)[0] | null
	>(null);

	const getMovementIcon = (type: string) => {
		switch (type) {
			case 'stock_in':
				return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
			case 'stock_out':
				return <ArrowUpRight className="w-4 h-4 text-red-600" />;
			case 'adjustment':
				return <TrendingUp className="w-4 h-4 text-blue-600" />;
			case 'transfer':
				return <ArrowUpRight className="w-4 h-4 text-orange-600" />;
			case 'damage':
				return <AlertCircle className="w-4 h-4 text-red-600" />;
			case 'loss':
				return <TrendingDown className="w-4 h-4 text-red-600" />;
			default:
				return <Package className="w-4 h-4" />;
		}
	};

	const getMovementLabel = (type: string) => {
		const labels: Record<string, string> = {
			stock_in: 'Stock In',
			stock_out: 'Stock Out',
			adjustment: 'Adjustment',
			transfer: 'Transfer',
			damage: 'Damage',
			loss: 'Loss',
		};
		return labels[type] || type;
	};

	const getMovementColor = (type: string) => {
		const colors: Record<string, string> = {
			stock_in: 'bg-green-50 text-green-700',
			stock_out: 'bg-red-50 text-red-700',
			adjustment: 'bg-blue-50 text-blue-700',
			transfer: 'bg-orange-50 text-orange-700',
			damage: 'bg-red-50 text-red-700',
			loss: 'bg-red-50 text-red-700',
		};
		return colors[type] || 'bg-gray-50 text-gray-700';
	};

	const filteredMovements = movements.filter((m) => {
		if (filter.type !== 'all' && m.type !== filter.type) return false;
		if (
			filter.searchTerm &&
			!m.drug.toLowerCase().includes(filter.searchTerm.toLowerCase())
		)
			return false;
		if (
			filter.dateFrom &&
			new Date(m.date) < new Date(filter.dateFrom)
		)
			return false;
		if (filter.dateTo && new Date(m.date) > new Date(filter.dateTo))
			return false;
		return true;
	});

	const handleReconcile = (rec: (typeof mockReconciliation)[0]) => {
		setSelectedReconciliation(rec);
		setShowReconcileDialog(true);
	};

	const confirmReconciliation = () => {
		if (selectedReconciliation) {
			setReconciliation((prev) =>
				prev.map((r) =>
					r.id === selectedReconciliation.id
						? { ...r, status: 'reconciled' }
						: r
				)
			);
			setShowReconcileDialog(false);
			setSelectedReconciliation(null);
		}
	};

	const exportStockMovements = () => {
		const csv = [
			['Date', 'Time', 'Drug', 'Type', 'Quantity', 'Unit', 'Reference', 'User', 'Notes'].join(','),
			...filteredMovements.map((m) =>
				[
					m.date,
					m.time,
					m.drug,
					getMovementLabel(m.type),
					m.quantity,
					m.unit,
					m.reference,
					m.user,
					m.notes,
				].join(',')
			),
		].join('\n');

		const blob = new Blob([csv], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `stock-movements-${new Date().toISOString().split('T')[0]}.csv`;
		a.click();
		window.URL.revokeObjectURL(url);
	};

	const stats = {
		totalMovements: movements.length,
		pendingReconciliations: reconciliation.filter(
			(r) => r.status === 'pending'
		).length,
		varianceAlerts: reconciliation.filter((r) => Math.abs(r.variancePercent) > 2)
			.length,
	};

	return (
		<main className="p-6 space-y-6">
			{/* Header */}
			<div className="flex justify-between items-start">
				<div>
					<h1 className="text-3xl font-bold">Stock Management</h1>
					<p className="text-gray-600 mt-1">
						Monitor inventory movements, reconcile stock, and manage adjustments
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={exportStockMovements}
						disabled={filteredMovements.length === 0}
					>
						<Download className="w-4 h-4 mr-2" />
						Export
					</Button>
				</div>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">
							Total Movements (Today)
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{stats.totalMovements}</div>
						<p className="text-xs text-gray-500 mt-1">
							Across all movement types
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">
							Pending Reconciliations
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-orange-600">
							{stats.pendingReconciliations}
						</div>
						<p className="text-xs text-gray-500 mt-1">
							Awaiting physical verification
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">
							Variance Alerts
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-red-600">
							{stats.varianceAlerts}
						</div>
						<p className="text-xs text-gray-500 mt-1">
							Variance &gt; 2%
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="movements">Stock Movements</TabsTrigger>
					<TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
					<TabsTrigger value="adjustments">Adjustments</TabsTrigger>
				</TabsList>

				{/* Stock Movements Tab */}
				<TabsContent value="movements" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Stock Movement Log</CardTitle>
							<CardDescription>
								Complete history of all inventory movements
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Filters */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<div className="space-y-2">
									<Label className="text-sm">Movement Type</Label>
									<Select
										value={filter.type}
										onValueChange={(val) =>
											setFilter({ ...filter, type: val })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Types</SelectItem>
											<SelectItem value="stock_in">Stock In</SelectItem>
											<SelectItem value="stock_out">Stock Out</SelectItem>
											<SelectItem value="adjustment">Adjustment</SelectItem>
											<SelectItem value="transfer">Transfer</SelectItem>
											<SelectItem value="damage">Damage</SelectItem>
											<SelectItem value="loss">Loss</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label className="text-sm">Search Drug</Label>
									<div className="relative">
										<Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
										<Input
											placeholder="Search..."
											className="pl-8"
											value={filter.searchTerm}
											onChange={(e) =>
												setFilter({
													...filter,
													searchTerm: e.target.value,
												})
											}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label className="text-sm">From Date</Label>
									<Input
										type="date"
										value={filter.dateFrom}
										onChange={(e) =>
											setFilter({ ...filter, dateFrom: e.target.value })
										}
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-sm">To Date</Label>
									<Input
										type="date"
										value={filter.dateTo}
										onChange={(e) =>
											setFilter({ ...filter, dateTo: e.target.value })
										}
									/>
								</div>
							</div>

							{/* Table */}
							<div className="border rounded-lg overflow-hidden">
								<Table>
									<TableHeader>
										<TableRow className="bg-gray-50">
											<TableHead>Date & Time</TableHead>
											<TableHead>Drug</TableHead>
											<TableHead>Type</TableHead>
											<TableHead>Quantity</TableHead>
											<TableHead>Reference</TableHead>
											<TableHead>User</TableHead>
											<TableHead>Notes</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredMovements.length > 0 ? (
											filteredMovements.map((movement) => (
												<TableRow key={movement.id}>
													<TableCell className="text-sm">
														<div className="font-medium">{movement.date}</div>
														<div className="text-xs text-gray-500">
															{movement.time}
														</div>
													</TableCell>
													<TableCell className="font-medium">
														{movement.drug}
													</TableCell>
													<TableCell>
														<div
															className={`flex items-center gap-2 px-2 py-1 rounded-lg w-fit text-xs font-medium ${getMovementColor(
																movement.type
															)}`}
														>
															{getMovementIcon(movement.type)}
															{getMovementLabel(movement.type)}
														</div>
													</TableCell>
													<TableCell>
														<span className="font-semibold">
															{movement.quantity > 0
																? `+${movement.quantity}`
																: movement.quantity}
														</span>{' '}
														<span className="text-gray-500 text-sm">
															{movement.unit}
														</span>
													</TableCell>
													<TableCell className="text-sm text-gray-600">
														{movement.reference}
													</TableCell>
													<TableCell className="text-sm text-gray-600">
														{movement.user}
													</TableCell>
													<TableCell className="text-sm text-gray-600 max-w-xs truncate">
														{movement.notes}
													</TableCell>
												</TableRow>
											))
										) : (
											<TableRow>
												<TableCell colSpan={7} className="text-center py-8">
													<p className="text-gray-500">
														No movements found matching your filters
													</p>
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Reconciliation Tab */}
				<TabsContent value="reconciliation" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Stock Reconciliation</CardTitle>
							<CardDescription>
								Compare system quantities with physical stock counts
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="border rounded-lg overflow-hidden">
								<Table>
									<TableHeader>
										<TableRow className="bg-gray-50">
											<TableHead>Drug</TableHead>
											<TableHead>System Qty</TableHead>
											<TableHead>Physical Qty</TableHead>
											<TableHead>Variance</TableHead>
											<TableHead>Variance %</TableHead>
											<TableHead>Last Reconciled</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Action</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{reconciliation.map((rec) => (
											<TableRow key={rec.id}>
												<TableCell className="font-medium">
													{rec.drug}
												</TableCell>
												<TableCell className="text-right">
													{rec.systemQty}
												</TableCell>
												<TableCell className="text-right">
													{rec.physicalQty}
												</TableCell>
												<TableCell className="text-right">
													<span
														className={
															rec.variance === 0
																? 'text-gray-600'
																: rec.variance > 0
																	? 'text-green-600'
																	: 'text-red-600'
														}
													>
														{rec.variance > 0
															? `+${rec.variance}`
															: rec.variance}
													</span>
												</TableCell>
												<TableCell className="text-right">
													<span
														className={
															Math.abs(rec.variancePercent) > 2
																? 'font-semibold text-orange-600'
																: 'text-gray-600'
														}
													>
														{rec.variancePercent > 0
															? `+${rec.variancePercent.toFixed(2)}`
															: rec.variancePercent.toFixed(2)}
														%
													</span>
												</TableCell>
												<TableCell className="text-sm text-gray-600">
													{rec.lastReconciled}
												</TableCell>
												<TableCell>
													<span
														className={`px-2 py-1 rounded-full text-xs font-medium ${
															rec.status === 'reconciled'
																? 'bg-green-100 text-green-800'
																: 'bg-orange-100 text-orange-800'
														}`}
													>
														{rec.status === 'reconciled'
															? '✓ Reconciled'
															: '⏳ Pending'}
													</span>
												</TableCell>
												<TableCell>
													<Button
														size="sm"
														variant={
															rec.status === 'reconciled'
																? 'outline'
																: 'default'
														}
														disabled={rec.status === 'reconciled'}
														onClick={() => handleReconcile(rec)}
													>
														{rec.status === 'reconciled'
															? 'Done'
															: 'Reconcile'}
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							{/* Reconcile Dialog */}
							{selectedReconciliation && (
								<Dialog
									open={showReconcileDialog}
									onOpenChange={setShowReconcileDialog}
								>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Reconcile Stock</DialogTitle>
											<DialogDescription>
												Verify physical count for {selectedReconciliation.drug}
											</DialogDescription>
										</DialogHeader>
										<div className="space-y-4">
											<div className="grid grid-cols-2 gap-4">
												<div>
													<Label className="text-sm">System Quantity</Label>
													<div className="text-2xl font-bold mt-2">
														{selectedReconciliation.systemQty}
													</div>
												</div>
												<div>
													<Label className="text-sm">Physical Quantity</Label>
													<div className="text-2xl font-bold mt-2">
														{selectedReconciliation.physicalQty}
													</div>
												</div>
											</div>
											<div>
												<Label className="text-sm text-orange-600 font-semibold">
													Variance: {selectedReconciliation.variance > 0 ? '+' : ''}
													{selectedReconciliation.variance} (
													{selectedReconciliation.variancePercent.toFixed(2)}%)
												</Label>
											</div>
											<div>
												<Label className="text-sm">Notes</Label>
												<Textarea
													placeholder="Add notes about this reconciliation..."
													className="mt-2"
												/>
											</div>
										</div>
										<DialogFooter>
											<Button
												variant="outline"
												onClick={() => setShowReconcileDialog(false)}
											>
												Cancel
											</Button>
											<Button onClick={confirmReconciliation}>
												Confirm Reconciliation
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Adjustments Tab */}
				<TabsContent value="adjustments" className="space-y-4">
					<div className="flex justify-between">
						<div>
							<h3 className="text-lg font-semibold">Stock Adjustments</h3>
							<p className="text-sm text-gray-600">
								Record manual stock adjustments and corrections
							</p>
						</div>
						<Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
							<DialogTrigger asChild>
								<Button>
									<Plus className="w-4 h-4 mr-2" />
									New Adjustment
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-md">
								<DialogHeader>
									<DialogTitle>Create Stock Adjustment</DialogTitle>
									<DialogDescription>
										Record a manual adjustment to inventory
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4">
									<div>
										<Label htmlFor="drug" className="text-sm">
											Drug
										</Label>
										<Input
											id="drug"
											placeholder="Select drug..."
											className="mt-2"
										/>
									</div>
									<div>
										<Label htmlFor="reason" className="text-sm">
											Reason
										</Label>
										<Select>
											<SelectTrigger className="mt-2">
												<SelectValue placeholder="Select reason" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="variance">Physical Count Variance</SelectItem>
												<SelectItem value="damage">Damage</SelectItem>
												<SelectItem value="loss">Loss/Theft</SelectItem>
												<SelectItem value="expiry">Expired Stock</SelectItem>
												<SelectItem value="return">Returned to Supplier</SelectItem>
												<SelectItem value="other">Other</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<Label htmlFor="oldQty" className="text-sm">
												Current Qty
											</Label>
											<Input
												id="oldQty"
												type="number"
												placeholder="0"
												className="mt-2"
											/>
										</div>
										<div>
											<Label htmlFor="newQty" className="text-sm">
												New Qty
											</Label>
											<Input
												id="newQty"
												type="number"
												placeholder="0"
												className="mt-2"
											/>
										</div>
									</div>
									<div>
										<Label htmlFor="notes" className="text-sm">
											Notes
										</Label>
										<Textarea
											id="notes"
											placeholder="Add adjustment notes..."
											className="mt-2"
										/>
									</div>
								</div>
								<DialogFooter>
									<Button
										variant="outline"
										onClick={() => setShowAdjustmentDialog(false)}
									>
										Cancel
									</Button>
									<Button>Create Adjustment</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>

					<Card>
						<CardContent className="pt-6">
							<div className="border rounded-lg overflow-hidden">
								<Table>
									<TableHeader>
										<TableRow className="bg-gray-50">
											<TableHead>Date</TableHead>
											<TableHead>Drug</TableHead>
											<TableHead>Reason</TableHead>
											<TableHead>Old Qty</TableHead>
											<TableHead>New Qty</TableHead>
											<TableHead>Adjustment</TableHead>
											<TableHead>Approved By</TableHead>
											<TableHead>Status</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{adjustments.map((adj) => (
											<TableRow key={adj.id}>
												<TableCell className="text-sm">
													{adj.date}
												</TableCell>
												<TableCell className="font-medium">
													{adj.drug}
												</TableCell>
												<TableCell className="text-sm">
													{adj.reason}
												</TableCell>
												<TableCell className="text-right text-sm">
													{adj.oldQty}
												</TableCell>
												<TableCell className="text-right text-sm">
													{adj.newQty}
												</TableCell>
												<TableCell className="text-right">
													<span
														className={
															adj.adjustment > 0
																? 'text-green-600 font-semibold'
																: 'text-red-600 font-semibold'
														}
													>
														{adj.adjustment > 0
															? `+${adj.adjustment}`
															: adj.adjustment}
													</span>
												</TableCell>
												<TableCell className="text-sm text-gray-600">
													{adj.approvedBy}
												</TableCell>
												<TableCell>
													<span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
														✓ {adj.status}
													</span>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</main>
	);
}

