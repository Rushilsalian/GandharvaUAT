import { TransactionTable, ClientTable } from '../DataTable'

export default function DataTableExample() {
  //todo: remove mock functionality
  const mockTransactions = [
    { date: "2024-01-15", clientName: "John Doe", type: "investment", amount: 50000, status: "completed" },
    { date: "2024-01-14", clientName: "Jane Smith", type: "payout", amount: 5000, status: "pending" },
    { date: "2024-01-13", clientName: "Bob Wilson", type: "withdrawal", amount: 25000, status: "completed" },
    { date: "2024-01-12", clientName: "Alice Johnson", type: "investment", amount: 75000, status: "completed" },
  ];

  const mockClients = [
    { name: "John Doe", email: "john@example.com", mobile: "+91-9876543210", branch: "Mumbai", totalInvestment: 150000, joinDate: "2023-06-15" },
    { name: "Jane Smith", email: "jane@example.com", mobile: "+91-9876543211", branch: "Delhi", totalInvestment: 85000, joinDate: "2023-08-22" },
    { name: "Bob Wilson", email: "bob@example.com", mobile: "+91-9876543212", branch: "Bangalore", totalInvestment: 120000, joinDate: "2023-04-10" },
    { name: "Alice Johnson", email: "alice@example.com", mobile: "+91-9876543213", branch: "Chennai", totalInvestment: 95000, joinDate: "2023-09-05" },
  ];

  return (
    <div className="p-6 space-y-8">
      <TransactionTable transactions={mockTransactions} />
      <ClientTable clients={mockClients} />
    </div>
  )
}