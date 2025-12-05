import { cn } from '@/lib/utils'
import { formatStatus } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-active'
      case 'inactive':
        return 'status-dead'
      case 'harvested':
        return 'status-harvested'
      case 'dead':
        return 'status-dead'
      case 'healthy':
        return 'status-healthy'
      case 'warning':
        return 'status-warning'
      case 'sick':
        return 'status-sick'
      case 'seedling':
        return 'status-seedling'
      case 'flowering':
        return 'status-flowering'
      case 'fruiting':
        return 'status-fruiting'
      case 'ripening':
        return 'status-ripening'
      case 'mature':
        return 'status-mature'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <span className={cn('status-badge', getStatusClass(status), className)}>
      {formatStatus(status)}
    </span>
  )
}
