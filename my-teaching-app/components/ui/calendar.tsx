// components/ui/calendar.tsx
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={className}
      classNames={{
        months: "flex flex-col space-y-4 relative min-h-[400px]", 
        month: "space-y-4 w-full",
        caption: "flex justify-start pt-1 relative items-center mb-4", 
        caption_label: "text-xl font-black dark:text-white ml-2",
        // 導覽按鈕移至右下角
        nav: "absolute bottom-0 right-2 flex items-center gap-2 z-20", 
        nav_button: "h-9 w-9 bg-transparent p-0 opacity-50 hover:opacity-100 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center",
        
        // 核心修正：強制使用 HTML 原生表格配合 Tailwind 分配寬度，確保 7 欄換行
        table: "w-full border-collapse",
        head_row: "flex w-full mb-2", 
        head_cell: "text-gray-500 font-black text-[11px] uppercase text-center flex-1 h-9 flex items-center justify-center", 
        row: "flex w-full", // 確保每一行寬度撐滿
        cell: "h-11 flex-1 text-center text-sm p-0 relative flex items-center justify-center focus-within:relative focus-within:z-20", 
        
        day: "h-9 w-9 p-0 font-medium aria-selected:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-gray-300 flex items-center justify-center",
        day_selected: "bg-primary text-white hover:bg-primary",
        day_today: "bg-gray-100 dark:bg-gray-800 text-primary font-black ring-1 ring-primary/30",
        day_outside: "text-gray-400 opacity-20", 
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") return <ChevronLeft className="h-5 w-5" />;
          return <ChevronRight className="h-5 w-5" />;
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }