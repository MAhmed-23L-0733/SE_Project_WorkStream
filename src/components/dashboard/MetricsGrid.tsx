"use client";

import { DashboardMetrics } from "@/types";

interface MetricsGridProps {
  metrics: DashboardMetrics;
}

export const MetricsGrid = ({ metrics }: MetricsGridProps) => {
  const cards = [
    {
      label: "Total Employees",
      value: metrics.totalEmployees,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      icon: "👥"
    },
    {
      label: "Present Today",
      value: metrics.presentToday,
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      icon: "✓"
    },
    {
      label: "Absent Today",
      value: metrics.absentToday,
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      icon: "✗"
    },
    {
      label: "On Leave",
      value: metrics.onLeaveToday,
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
      icon: "📅"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bgColor} rounded-lg shadow p-6 border border-slate-200`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">{card.label}</p>
              <p className={`text-3xl font-bold ${card.textColor} mt-2`}>
                {card.value}
              </p>
            </div>
            <div className="text-3xl">{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
