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
        months: "flex flex-col space-y-4 relative min-h-[380px]", 
        month: "space-y-4 w-full",
        month_caption: "flex justify-start pt-1 relative items-center mb-4", 
        caption_label: "text-xl font-black dark:text-white ml-2",
        nav: "absolute bottom-0 right-2 flex items-center gap-2 z-20", 
        button_previous: "h-9 w-9 bg-transparent p-0 opacity-50 hover:opacity-100 dark:text-white transition-opacity border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center",
        button_next: "h-9 w-9 bg-transparent p-0 opacity-50 hover:opacity-100 dark:text-white transition-opacity border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center",
        
        // 核心修正：針對 v9 的 div 結構進行 grid 佈局
        month_grid: "w-full border-collapse", 
        weekdays: "grid grid-cols-7 w-full mb-2", // 星期標題容器
        weekday: "text-gray-500 font-black text-[11px] uppercase text-center h-10 flex items-center justify-center", 
        
        weeks: "w-full flex flex-col gap-1", // 每一週的容器
        week: "grid grid-cols-7 w-full", // 關鍵：每一週強制為 7 欄 grid
        
        day: "h-9 w-9 p-0 font-medium aria-selected:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-gray-300 flex items-center justify-center mx-auto",
        day_button: "h-9 w-9 flex items-center justify-center", // v9 新增的按鈕層級
        selected: "bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white",
        today: "bg-gray-100 dark:bg-gray-800 text-primary font-black ring-1 ring-primary/30",
        outside: "text-gray-400 opacity-30", 
        disabled: "text-gray-400 opacity-20",
        hidden: "invisible",
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