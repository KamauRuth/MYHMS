'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	AlertCircle,
	ChevronDown,
	ChevronUp,
	CheckCircle,
	Clock,
	X,
} from 'lucide-react'

const supabase = createClient()

interface PrescriptionItem {
	id: string
	drug_id: string
	quantity_prescribed: number
	quantity_dispensed: number
	frequency: string
	route: string
	status: string
	drugs?: {
		id: string
		drug_name: string
		generic_name: string
		strength: string
	}
}

interface Prescription {
	id: string
	prescription_number: string
	patient_id: string
	visit_id: string
	prescribed_by: string
	department: string
	status: string
	prescribed_at: string
	dispensed_at: string | null
	notes: string | null
	prescription_items?: PrescriptionItem[]
}

export default function PrescriptionsPage() {
	const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
	const [loading, setLoading] = useState(true)
	const [filter, setFilter] = useState('all')
	const [expandedId, setExpandedId] = useState<string | null>(null)
	const [dispenseDialog, setDispenseDialog] = useState(false)
	const [selectedPrescription, setSelectedPrescription] =
		useState<Prescription | null>(null)
	const [selectedItem, setSelectedItem] = useState<PrescriptionItem | null>(null)
	const [dispensingQty, setDispensingQty] = useState('')
	const [dispensingError, setDispensingError] = useState('')

	useEffect(() => {
		loadPrescriptions()
	}, [filter])

	const loadPrescriptions = async () => {
		setLoading(true)
		try {
			let query = supabase
				.from('prescriptions')
				.select(
					`
          *,
          prescription_items (
            id,
            drug_id,
            quantity_prescribed,
            quantity_dispensed,
            frequency,
            route,
            status,
            drugs (id, drug_name, generic_name, strength)
          )
        `
				)
				.order('prescribed_at', { ascending: false })

			// Apply filter
			if (filter !== 'all') {
				query = query.eq('status', filter)
			}

			const { data, error } = await query

			if (error) {
				console.error('Failed to load prescriptions:', error)
			} else {
				setPrescriptions(data || [])
			}
		} finally {
			setLoading(false)
		}
	}

	const getDepartmentBadgeColor = (dept: string) => {
		const colors: Record<string, string> = {
			opd: 'bg-blue-100 text-blue-800',
			ipd: 'bg-green-100 text-green-800',
			theatre: 'bg-purple-100 text-purple-800',
			lab: 'bg-orange-100 text-orange-800',
			maternity: 'bg-pink-100 text-pink-800',
			cwc: 'bg-yellow-100 text-yellow-800',
			emergency: 'bg-red-100 text-red-800',
		}
		return colors[dept] || 'bg-gray-100 text-gray-800'
	}

	const getStatusBadge = (status: string) => {
		const colors: Record<string, string> = {
			pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
			dispensed: 'bg-green-100 text-green-800 border-green-300',
			partial: 'bg-blue-100 text-blue-800 border-blue-300',
			cancelled: 'bg-red-100 text-red-800 border-red-300',
			expired: 'bg-gray-100 text-gray-800 border-gray-300',
		}
		return colors[status] || 'bg-gray-100 text-gray-800'
	}

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'dispensed':
				return <CheckCircle className="w-4 h-4" />
			case 'pending':
				return <Clock className="w-4 h-4" />
			case 'cancelled':
				return <X className="w-4 h-4" />
			default:
				return <AlertCircle className="w-4 h-4" />
		}
	}

	const handleDispense = (prescription: Prescription, item: PrescriptionItem) => {
		setSelectedPrescription(prescription)
		setSelectedItem(item)
		setDispensingQty('')
		setDispensingError('')
		setDispenseDialog(true)
	}

	const confirmDispense = async () => {
		if (!selectedPrescription || !selectedItem || !dispensingQty) {
			setDispensingError('Please enter quantity to dispense')
			return
		}

		const qty = parseInt(dispensingQty)
		if (qty <= 0 || qty > selectedItem.quantity_prescribed - selectedItem.quantity_dispensed) {
			setDispensingError('Invalid quantity')
			return
		}

		try {
			// Update prescription item
			const { error } = await supabase
				.from('prescription_items')
				.update({
					quantity_dispensed: selectedItem.quantity_dispensed + qty,
					status: qty + selectedItem.quantity_dispensed === selectedItem.quantity_prescribed ? 'dispensed' : 'partial',
				})
				.eq('id', selectedItem.id)

			if (error) {
				setDispensingError(error.message)
				return
			}

			// Check if all items are dispensed
			const allItems = selectedPrescription.prescription_items || []
			const allDispensingComplete = allItems.every(
				(item) =>
					item.id === selectedItem.id
						? qty + selectedItem.quantity_dispensed === item.quantity_prescribed
						: item.quantity_dispensed === item.quantity_prescribed
			)

			if (allDispensingComplete) {
				// Update prescription status
				await supabase
					.from('prescriptions')
					.update({ status: 'dispensed', dispensed_at: new Date().toISOString() })
					.eq('id', selectedPrescription.id)
			}

			setDispenseDialog(false)
			loadPrescriptions()
		} catch (error: any) {
			setDispensingError(error.message)
		}
	}

	const cancelPrescription = async (id: string) => {
		try {
			const { error } = await supabase
				.from('prescriptions')
				.update({ status: 'cancelled' })
				.eq('id', id)

			if (error) throw error
			loadPrescriptions()
		} catch (error: any) {
			console.error('Failed to cancel:', error)
		}
	}

	return (
		<main className="p-6 space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold">Prescription Queue</h1>
				<p className="text-gray-600 mt-1">
					Manage prescriptions from all departments and dispense medications
				</p>
			</div>

			{/* Filter Tabs */}
			<div className="flex gap-2 flex-wrap">
				{['all', 'pending', 'partial', 'dispensed', 'cancelled'].map((status) => (
					<button
						key={status}
						onClick={() => setFilter(status)}
						className={`px-4 py-2 rounded font-medium transition ${
							filter === status
								? 'bg-blue-600 text-white shadow-md'
								: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
						}`}
					>
						{status.charAt(0).toUpperCase() + status.slice(1)}
					</button>
				))}
			</div>

			{/* Prescriptions List */}
			{loading ? (
				<Card>
					<CardContent className="p-12 text-center">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
						<p className="text-gray-500">Loading prescriptions...</p>
					</CardContent>
				</Card>
			) : prescriptions.length === 0 ? (
				<Card>
					<CardContent className="p-12 text-center">
						<AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
						<p className="text-gray-500">No prescriptions found</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-4">
					{prescriptions.map((prescription) => (
						<Card key={prescription.id} className="hover:shadow-lg transition">
							<CardContent className="p-6">
								{/* Prescription Header */}
								<div
									className="cursor-pointer flex items-start justify-between"
									onClick={() =>
										setExpandedId(expandedId === prescription.id ? null : prescription.id)
									}
								>
									<div className="flex-1">
										<div className="flex items-center gap-3 mb-2">
											<h3 className="text-lg font-semibold">
												Rx #{prescription.prescription_number}
											</h3>
											<span
												className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(prescription.status)}`}
											>
												{getStatusIcon(prescription.status)}
												{prescription.status.toUpperCase()}
											</span>
											<span
												className={`px-3 py-1 rounded text-xs font-medium ${getDepartmentBadgeColor(prescription.department)}`}
											>
												{prescription.department.toUpperCase()}
											</span>
										</div>
										<p className="text-sm text-gray-600">
											Patient ID: {prescription.patient_id?.substring(0, 12).toUpperCase()}
										</p>
										<p className="text-xs text-gray-500 mt-1">
											Prescribed: {new Date(prescription.prescribed_at).toLocaleDateString()} at{' '}
											{new Date(prescription.prescribed_at).toLocaleTimeString()}
										</p>
										{prescription.notes && (
											<p className="text-sm text-gray-600 mt-2 italic">
												Notes: {prescription.notes}
											</p>
										)}
									</div>
									<div className="text-right">
										<p className="text-sm font-semibold">
											{prescription.prescription_items?.length || 0} Items
										</p>
										{expandedId === prescription.id ? (
											<ChevronUp className="w-5 h-5 text-gray-400 mt-2" />
										) : (
											<ChevronDown className="w-5 h-5 text-gray-400 mt-2" />
										)}
									</div>
								</div>

								{/* Expanded Details */}
								{expandedId === prescription.id && (
									<div className="mt-6 pt-6 border-t space-y-4">
										<div>
											<h4 className="font-semibold mb-3">Prescribed Medications:</h4>
											<div className="space-y-3">
												{prescription.prescription_items?.map((item: PrescriptionItem) => (
													<div
														key={item.id}
														className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border"
													>
														<div className="flex justify-between items-start mb-3">
															<div className="flex-1">
																<p className="font-semibold">
																	{item.drugs?.drug_name} ({item.drugs?.strength})
																</p>
																<p className="text-xs text-gray-600">
																	Generic: {item.drugs?.generic_name}
																</p>
															</div>
															<span
																className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border whitespace-nowrap ${getStatusBadge(item.status)}`}
															>
																{getStatusIcon(item.status)}
																{item.status.toUpperCase()}
															</span>
														</div>

														<div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
															<div>
																<p className="text-gray-600 text-xs">Qty Prescribed</p>
																<p className="font-semibold">{item.quantity_prescribed}</p>
															</div>
															<div>
																<p className="text-gray-600 text-xs">Qty Dispensed</p>
																<p className="font-semibold text-green-600">
																	{item.quantity_dispensed}
																</p>
															</div>
															<div>
																<p className="text-gray-600 text-xs">Remaining</p>
																<p className="font-semibold text-orange-600">
																	{item.quantity_prescribed - item.quantity_dispensed}
																</p>
															</div>
															<div>
																<p className="text-gray-600 text-xs">Progress</p>
																<div className="w-full bg-gray-200 rounded-full h-2">
																	<div
																		className="bg-green-600 h-2 rounded-full"
																		style={{
																			width: `${(item.quantity_dispensed / item.quantity_prescribed) * 100}%`,
																		}}
																	></div>
																</div>
															</div>
														</div>

														<div className="mt-3 pt-3 border-t flex justify-between items-center">
															<div className="text-xs text-gray-600">
																<p>
																	<strong>Frequency:</strong> {item.frequency || 'As directed'}
																</p>
																<p>
																	<strong>Route:</strong> {item.route || 'Oral'}
																</p>
															</div>
															{item.quantity_dispensed < item.quantity_prescribed &&
																prescription.status !== 'cancelled' && (
																	<Button
																		size="sm"
																		onClick={() => handleDispense(prescription, item)}
																		className="bg-green-600 hover:bg-green-700"
																	>
																		Dispense
																	</Button>
																)}
														</div>
													</div>
												))}
											</div>
										</div>

										{/* Action Buttons */}
										<div className="flex gap-2 pt-4 border-t">
											{prescription.status === 'pending' ||
											prescription.status === 'partial' ? (
												<Button
													variant="destructive"
													size="sm"
													onClick={() => cancelPrescription(prescription.id)}
												>
													Cancel Prescription
												</Button>
											) : null}
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Dispense Dialog */}
			<Dialog open={dispenseDialog} onOpenChange={setDispenseDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Dispense Medication</DialogTitle>
						<DialogDescription>
							{selectedItem?.drugs?.drug_name} ({selectedItem?.drugs?.strength})
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
							<div>
								<Label className="text-xs text-gray-600">Prescribed</Label>
								<p className="text-2xl font-bold">
									{selectedItem?.quantity_prescribed}
								</p>
							</div>
							<div>
								<Label className="text-xs text-gray-600">Already Dispensed</Label>
								<p className="text-2xl font-bold text-green-600">
									{selectedItem?.quantity_dispensed}
								</p>
							</div>
						</div>

						<div>
							<Label htmlFor="qty">Quantity to Dispense</Label>
							<Input
								id="qty"
								type="number"
								min="1"
								max={
									(selectedItem?.quantity_prescribed || 0) -
									(selectedItem?.quantity_dispensed || 0)
								}
								value={dispensingQty}
								onChange={(e) => {
									setDispensingQty(e.target.value)
									setDispensingError('')
								}}
								placeholder="Enter quantity"
								className="mt-2"
							/>
							<p className="text-xs text-gray-600 mt-1">
								Max: {(selectedItem?.quantity_prescribed || 0) - (selectedItem?.quantity_dispensed || 0)}
							</p>
						</div>

						{dispensingError && (
							<div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
								{dispensingError}
							</div>
						)}
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setDispenseDialog(false)}>
							Cancel
						</Button>
						<Button
							onClick={confirmDispense}
							className="bg-green-600 hover:bg-green-700"
						>
							Confirm Dispensing
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</main>
	)
}
