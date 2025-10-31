import { DashboardStats } from '../DashboardStats'

export default function DashboardStatsExample() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Admin Dashboard Stats</h3>
        <DashboardStats userRole="admin" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Leader Dashboard Stats</h3>
        <DashboardStats userRole="leader" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Client Dashboard Stats</h3>
        <DashboardStats userRole="client" />
      </div>
    </div>
  )
}