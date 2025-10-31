import { DashboardCharts } from '../TrendChart'

export default function TrendChartExample() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Admin Dashboard Charts</h3>
        <DashboardCharts userRole="admin" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Leader Dashboard Charts</h3>
        <DashboardCharts userRole="leader" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Client Dashboard Charts</h3>
        <DashboardCharts userRole="client" />
      </div>
    </div>
  )
}