
import React from 'react';
import StatCard from './StatCard';

interface DashboardStats {
  progress: { completed: number; total: number };
  budget: { total: number; spent: number; remaining: number };
  relevance: { high: number; medium: number; low: number };
}

interface DashboardProps {
  stats: DashboardStats;
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
    const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard bgColor="bg-blue-50">
        <h3 className="text-sm font-medium text-blue-800">Progreso General</h3>
        <p className="text-3xl font-bold text-blue-900 mt-1">{stats.progress.completed} / {stats.progress.total}</p>
        <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
          <div 
            className="bg-blue-600 h-2 rounded-full" 
            style={{width: `${stats.progress.total > 0 ? (stats.progress.completed / stats.progress.total) * 100 : 0}%`}}
          ></div>
        </div>
      </StatCard>
      <StatCard bgColor="bg-green-50">
        <h3 className="text-sm font-medium text-green-800">Presupuesto</h3>
        <p className="text-2xl font-bold text-green-900 mt-1">{formatCurrency(stats.budget.spent)} / {formatCurrency(stats.budget.total)}</p>
        <p className="text-sm text-green-600 mt-1">Resta: {formatCurrency(stats.budget.remaining)}</p>
      </StatCard>
      <StatCard bgColor="bg-yellow-50">
        <h3 className="text-sm font-medium text-yellow-800">Relevancia</h3>
        <div className="flex justify-around items-center mt-2">
            <div className="text-center">
                <p className="text-2xl font-bold text-yellow-900">{stats.relevance.high}</p>
                <p className="text-xs text-red-500 font-medium">Alta</p>
            </div>
            <div className="text-center">
                <p className="text-2xl font-bold text-yellow-900">{stats.relevance.medium}</p>
                <p className="text-xs text-yellow-600 font-medium">Media</p>
            </div>
            <div className="text-center">
                <p className="text-2xl font-bold text-yellow-900">{stats.relevance.low}</p>
                <p className="text-xs text-blue-500 font-medium">Baja</p>
            </div>
        </div>
      </StatCard>
    </div>
  );
};

export default Dashboard;
