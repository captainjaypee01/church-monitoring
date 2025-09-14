"use client"

import * as React from "react"
import { ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { Input } from "@/components/ui/input"

export interface Option {
  value: string
  label: string
  email?: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  emptyMessage = "No items found",
  disabled = false,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const handleSelect = React.useCallback((optionValue: string) => {
    const newSelected = selected.includes(optionValue)
      ? selected.filter((item) => item !== optionValue)
      : [...selected, optionValue]
    onChange(newSelected)
  }, [selected, onChange])

  const handleRemove = React.useCallback((optionValue: string) => {
    onChange(selected.filter((item) => item !== optionValue))
  }, [selected, onChange])

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase()) ||
    option.email?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedOptions = options.filter((option) => selected.includes(option.value))

  return (
    <div className="space-y-3">
      <div className="relative">
      <Button
        type="button"
        variant="outline"
        className={cn("w-full justify-between min-h-10", className)}
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOptions.length > 0 ? (
            <span className="text-sm font-medium">
              {selectedOptions.length} leader{selectedOptions.length > 1 ? 's' : ''} selected
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>
      
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-auto">
          <div className="p-2 border-b">
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">{emptyMessage}</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 cursor-pointer rounded"
                  onClick={() => handleSelect(option.value)}
                >
                  <div className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary",
                    selected.includes(option.value) 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-background"
                  )}>
                    {selected.includes(option.value) && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{option.label}</span>
                    {option.email && (
                      <span className="text-xs text-muted-foreground">{option.email}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
      </div>
      
      {/* Selected Leaders Display */}
      {selectedOptions.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span>Selected Leaders:</span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {selectedOptions.length}
            </span>
          </div>
          <div className="grid gap-2 max-h-32 overflow-y-auto">
            {selectedOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm transition-colors"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-medium text-gray-900 truncate">{option.label}</span>
                  {option.email && (
                    <span className="text-xs text-gray-500 truncate">{option.email}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(option.value)}
                  className="ml-3 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Remove leader"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
