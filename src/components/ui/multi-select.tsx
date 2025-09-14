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
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className={cn("w-full justify-between min-h-10", className)}
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        <div className="flex flex-wrap gap-1 max-w-full">
          {selectedOptions.length > 0 ? (
            selectedOptions.length <= 3 ? (
              selectedOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="text-xs flex items-center gap-1"
                >
                  <span>{option.label}</span>
                  <X 
                    className="h-3 w-3 cursor-pointer hover:bg-gray-200 rounded" 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(option.value)
                    }}
                  />
                </Badge>
              ))
            ) : (
              <Badge variant="secondary" className="text-xs">
                {selectedOptions.length} selected
              </Badge>
            )
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
  )
}
