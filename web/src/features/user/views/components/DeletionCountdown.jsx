import { useEffect, useState } from 'react'
import { Statistic } from 'antd'

export default function DeletionCountdown({ target }) {
  const [deadline, setDeadline] = useState(() => target ? new Date(target).getTime() : null)

  useEffect(() => {
    setDeadline(target ? new Date(target).getTime() : null)
  }, [target])

  if (!deadline) return null

  return (
    <Statistic.Countdown
      title="Time until deletion"
      value={deadline}
      format="D[d] HH:mm:ss"
    />
  )
}
