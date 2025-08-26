
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, TrendingUp, Activity, Scale } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { format } from 'date-fns';

const HealthStats = () => {
  const { profile, isLoading } = useProfile();
  
  // Mock data - in a real app, this would come from the API
  const healthData = {
    weight: {
      current: profile?.weight || 70,
      history: [68, 69, 70, 72, 71, 70, 70],
      unit: 'kg',
    },
    heartRate: {
      resting: 64,
      max: 180,
      avg: 72,
      unit: 'bpm',
    },
    caloriesBurned: {
      today: 350,
      thisWeek: 1850,
      thisMonth: 7200,
    },
    steps: {
      today: 7521,
      goal: 10000,
      thisWeek: 45200,
    },
    workouts: {
      completed: 8,
      minutesActive: 320,
      thisMonth: 12,
    },
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fitness-orange"></div>
      </div>
    );
  }

  return (
    <main className="container">
      <section className="mobile-section">
        <div className="mb-6 flex items-center">
          <Link to="/profile" className="mr-2">
            <ArrowLeft className="text-fitness-orange" />
          </Link>
          <h1 className="text-2xl font-bold">Estatísticas de Saúde</h1>
        </div>

        <div className="space-y-6">
          {/* Weight Section */}
          <div className="bg-fitness-darkGray p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Scale className="h-5 w-5 text-fitness-orange mr-2" />
                <h2 className="text-lg font-semibold">Peso</h2>
              </div>
              <span className="text-xl font-bold text-fitness-orange">
                {healthData.weight.current} {healthData.weight.unit}
              </span>
            </div>
            <div className="h-20 bg-fitness-dark rounded flex items-end p-1">
              {healthData.weight.history.map((weight, index) => (
                <div
                  key={index}
                  className="flex-1 mx-0.5"
                  style={{
                    height: `${(weight / Math.max(...healthData.weight.history)) * 100}%`,
                  }}
                >
                  <div className="bg-fitness-orange w-full h-full rounded-t"></div>
                </div>
              ))}
            </div>
            <p className="text-xs mt-2 text-gray-400">Últimos 7 dias</p>
          </div>

          {/* Heart Rate Section */}
          <div className="bg-fitness-darkGray p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Heart className="h-5 w-5 text-fitness-orange mr-2" />
                <h2 className="text-lg font-semibold">Frequência Cardíaca</h2>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="text-center">
                <p className="text-xs text-gray-400">Em repouso</p>
                <p className="text-xl font-semibold">{healthData.heartRate.resting} <span className="text-xs">bpm</span></p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Média</p>
                <p className="text-xl font-semibold">{healthData.heartRate.avg} <span className="text-xs">bpm</span></p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Máxima</p>
                <p className="text-xl font-semibold">{healthData.heartRate.max} <span className="text-xs">bpm</span></p>
              </div>
            </div>
          </div>

          {/* Calories Section */}
          <div className="bg-fitness-darkGray p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-fitness-orange mr-2" />
                <h2 className="text-lg font-semibold">Calorias Queimadas</h2>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-center">
                <p className="text-xs text-gray-400">Hoje</p>
                <p className="text-xl font-semibold">{healthData.caloriesBurned.today}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Esta semana</p>
                <p className="text-xl font-semibold">{healthData.caloriesBurned.thisWeek}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Este mês</p>
                <p className="text-xl font-semibold">{healthData.caloriesBurned.thisMonth}</p>
              </div>
            </div>
          </div>

          {/* Steps Section */}
          <div className="bg-fitness-darkGray p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-fitness-orange mr-2" />
                <h2 className="text-lg font-semibold">Passos</h2>
              </div>
              <span className="text-sm">{healthData.steps.today} / {healthData.steps.goal}</span>
            </div>
            <div className="relative w-full bg-fitness-dark h-2 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 bg-fitness-orange h-2 rounded-full"
                style={{ width: `${(healthData.steps.today / healthData.steps.goal) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs mt-2 text-gray-400">
              Você deu {healthData.steps.thisWeek} passos esta semana
            </p>
          </div>

          {/* Workouts Summary */}
          <div className="bg-fitness-darkGray p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Resumo de Atividades</h2>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-xs text-gray-400">Treinos</p>
                <p className="text-xl font-semibold">{healthData.workouts.completed}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Minutos ativos</p>
                <p className="text-xl font-semibold">{healthData.workouts.minutesActive}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Este mês</p>
                <p className="text-xl font-semibold">{healthData.workouts.thisMonth}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HealthStats;
