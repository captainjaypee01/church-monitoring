"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const resetAdmin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reset-admin', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error.message })
    }
    setLoading(false)
  }

  const testDb = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-db')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error.message })
    }
    setLoading(false)
  }

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>Database Test & Admin Reset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testDb} disabled={loading}>
            Test Database Connection
          </Button>
          
          <Button onClick={resetAdmin} disabled={loading} variant="destructive">
            Reset Admin Password
          </Button>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
