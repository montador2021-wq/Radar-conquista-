
import React from 'react';
import { PIPELINE_STAGES } from '../constants';
import { Opportunity } from '../tipos';

interface FunnelChartProps {
  opportunities: Opportunity[];
}

const FunnelChart: React.FC<FunnelChartProps> = ({ opportunities }) => {
  const getStageCount = (stageId: string) => 
    opportunities.filter(o => o.stage === stageId).length;

  const data = PIPELINE_STAGES.map(stage => ({
    ...stage,
    count: getStageCount(stage.id)
  }));

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bg-white rounded-3xl p-8 mb-8 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-black text-gray-800 tracking-tight italic">Fluxo de Conversão</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider italic">Métrica de Eficiência por Estágio</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {data.map((item, index) => {
          const percentage = (item.count / maxCount) * 100;
          const width = 100 - (index * 6); 
          
          return (
            <div key={item.id} className="group relative">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">{item.label}</span>
                <span className="text-[10px] font-bold text-gray-700">{item.count} OPS</span>
              </div>
              <div className="h-8 bg-gray-50 rounded-xl overflow-hidden relative flex items-center justify-center border border-gray-100">
                <div 
                  className={`h-full ${item.color} opacity-10 absolute left-0 top-0 transition-all duration-700`}
                  style={{ width: `${percentage}%` }}
                />
                <div 
                  className={`h-1 rounded-full ${item.color} shadow-sm transition-all duration-700`}
                  style={{ width: `${Math.max(percentage, 5)}%`, maxWidth: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FunnelChart;
