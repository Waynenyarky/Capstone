import { useState, useCallback, useRef } from 'react'
import { App } from 'antd'

export default function useCmsUndoRedo(initialData) {
  const { message } = App.useApp()
  const [data, setData] = useState(initialData)
  const historyRef = useRef([])
  const historyIndexRef = useRef(-1)

  const pushHistory = useCallback((newData) => {
    if (!historyRef.current) {
      historyRef.current = []
    }
    const next = historyIndexRef.current + 1
    historyRef.current = historyRef.current.slice(0, next)
    historyRef.current.push(JSON.parse(JSON.stringify(newData)))
    historyIndexRef.current = next
  }, [])

  const updateData = useCallback((newData) => {
    setData(newData)
    pushHistory(newData)
  }, [pushHistory])

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current -= 1
    const entry = historyRef.current[historyIndexRef.current]
    setData(JSON.parse(JSON.stringify(entry)))
    message.success('Undo successful')
  }, [message])

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current += 1
    const entry = historyRef.current[historyIndexRef.current]
    setData(JSON.parse(JSON.stringify(entry)))
    message.success('Redo successful')
  }, [message])

  const resetHistory = useCallback((newData) => {
    historyRef.current = [JSON.parse(JSON.stringify(newData))]
    historyIndexRef.current = 0
    setData(newData)
  }, [])

  const canUndo = historyIndexRef.current > 0
  const canRedo = historyRef.current && historyIndexRef.current < historyRef.current.length - 1

  return {
    data,
    updateData,
    undo,
    redo,
    resetHistory,
    canUndo,
    canRedo,
  }
}
