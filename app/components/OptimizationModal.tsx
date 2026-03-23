import React, { useState, useEffect } from 'react';
import { JobMatch, OptimizationDiagnosis, OptimizationStep } from '../../types';
import { ProgressBar } from './ProgressBar';
import { ProcessSteps, StepItem } from './ProcessSteps';

interface OptimizationModalProps {
  job: JobMatch | null;
  resumeText: string;
  onClose: () => void;
}

export const OptimizationModal: React.FC<OptimizationModalProps> = ({ job, resumeText, onClose }) => {
  const [diagnosis, setDiagnosis] = useState<OptimizationDiagnosis | null>(null);
  const [steps, setSteps] = useState<OptimizationStep[]>([]);
  const [isLoadingDiagnosis, setIsLoadingDiagnosis] = useState(false);
  const [isLoadingDeep, setIsLoadingDeep] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processStatus, setProcessStatus] = useState<StepItem[]>([]);

  useEffect(() => {
    if (job) {
      handleRunDiagnosis();
    }
  }, [job]);

  const handleRunDiagnosis = async () => {
    if (!job) return;
    setIsLoadingDiagnosis(true);
    setDiagnosis(null);
    setSteps([]);
    setError(null);
    setProcessStatus([
      { id: 'read', label: '读取简历内容', status: 'loading', subText: '正在提取核心工作经历...' },
      { id: 'jd', label: '解析岗位 JD', status: 'pending' },
      { id: 'mapping', label: '语义差异分析', status: 'pending' }
    ]);

    try {
      await new Promise(r => setTimeout(r, 600));
      setProcessStatus(prev => prev.map(s =>
        s.id === 'read' ? { ...s, status: 'completed', subText: `✔ 已读取简历（共计识别约 ${Math.floor(resumeText.length / 100)} 个描述片段）` } :
        s.id === 'jd' ? { ...s, status: 'loading', subText: `正在定位 "${job.title}" 的核心能力要求...` } : s
      ));

      await new Promise(r => setTimeout(r, 800));

      // ✅ 调用后端 API
      const res = await fetch('/api/optimize-diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, job })
      });
      if (!res.ok) throw new Error(await res.text());
      const result: OptimizationDiagnosis = await res.json();

      setProcessStatus(prev => prev.map(s =>
        s.id === 'jd' ? { ...s, status: 'completed', subText: '✔ 已解析 JD（识别多项核心能力维度）' } :
        s.id === 'mapping' ? { ...s, status: 'loading', subText: '正在匹配你的经历 -> 寻找强化点...' } : s
      ));
      await new Promise(r => setTimeout(r, 600));
      setDiagnosis(result);
      setProcessStatus(prev => prev.map(s =>
        s.id === 'mapping' ? { ...s, status: 'completed', subText: `✔ 匹配完毕：发现 ${result.coreGaps.length} 个可强化能力点` } : s
      ));
    } catch (e) {
      setError('诊断生成失败');
    } finally {
      setIsLoadingDiagnosis(false);
    }
  };

  const handleRunDeepOptimization = async () => {
    if (!job) return;
    setIsLoadingDeep(true);
    setSteps([]);
    try {
      // ✅ 调用后端 API
      const res = await fetch('/api/optimize-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, job })
      });
      if (!res.ok) throw new Error(await res.text());
      const result: OptimizationStep[] = await res.json();

      for (let i = 1; i <= result.length; i++) {
        setSteps(result.slice(0, i));
        await new Promise(r => setTimeout(r, 800));
      }
    } catch (e) {
      setError('深度优化失败');
    } finally {
      setIsLoadingDeep(false);
    }
  };

  if (!job) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/20">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50/80">
          <div>
            <h3 className="text-xl font-bold text-gray-900">AI 简历深度重构</h3>
            <p className="text-sm text-gray-500 mt-1">针对 {job.company} · {job.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-8 scroll-smooth">
          {(isLoadingDiagnosis || (!diagnosis && !error)) && (
            <div className="px-4 py-6">
              <ProcessSteps steps={processStatus} />
              <div className="mt-8">
                <ProgressBar isLoading={isLoadingDiagnosis} label="AI 专家诊断中..." />
              </div>
            </div>
          )}

          {diagnosis && (
            <div className="space-y-6 animate-fade-in">
              <section className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">专家诊断报告</span>
                    <span className="text-xs font-bold">建议匹配分: {diagnosis.score}%</span>
                  </div>
                  <p className="text-lg font-medium leading-relaxed">{diagnosis.matchOverview}</p>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
                  <h4 className="text-xs font-bold text-orange-800 uppercase tracking-widest mb-3">待强化点</h4>
                  <ul className="space-y-2">
                    {diagnosis.coreGaps.map((gap, i) => (
                      <li key={i} className="text-sm text-orange-900 flex items-start">
                        <span className="mr-2 opacity-50">•</span> {gap}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-green-50 p-5 rounded-2xl border border-green-100">
                  <h4 className="text-xs font-bold text-green-800 uppercase tracking-widest mb-3">快速改进</h4>
                  <ul className="space-y-2">
                    {diagnosis.quickWins.map((win, i) => (
                      <li key={i} className="text-sm text-green-900 flex items-start">
                        <span className="mr-2 opacity-50">→</span> {win}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {!isLoadingDeep && steps.length === 0 && (
                <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-xs text-blue-600 font-bold mb-4 px-10">
                    本功能为深度语义优化，并非简单关键词替换，请耐心等待。
                  </p>
                  <button
                    onClick={handleRunDeepOptimization}
                    className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl hover:-translate-y-1 flex items-center justify-center mx-auto space-x-2"
                  >
                    <span>生成深度重构建议</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {isLoadingDeep && (
            <div className="py-6 flex flex-col items-center space-y-4 px-10 border-t border-gray-100 pt-8">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-center">
                <h4 className="text-sm font-bold text-gray-900 tracking-wide">深度语义重构中...</h4>
                <p className="text-xs text-gray-500 mt-1 italic">正在重写简历段落，使之更贴合业务价值导向</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {steps.map((step, i) => (
              <div key={i} className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm animate-fade-in group hover:shadow-md transition-shadow">
                <div className="bg-gray-50 px-5 py-3 border-b flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">{step.section}</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase tracking-tighter">逐条优化结果 #{i+1}</span>
                </div>
                <div className="p-6 space-y-5">
                  <div className="opacity-50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">原始描述</p>
                    <p className="text-xs text-gray-600 line-through decoration-red-300 italic">{step.original}</p>
                  </div>
                  <div className="bg-blue-50/40 p-5 rounded-2xl border-l-4 border-blue-500">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter mb-1">优化方案</p>
                    <p className="text-sm text-gray-900 font-medium leading-relaxed">{step.improved}</p>
                  </div>
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">重构逻辑</p>
                    <p className="text-xs text-gray-500 italic">{step.reasoning}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center text-sm font-medium border border-red-100">{error}</div>}
        </div>

        <div className="p-6 border-t bg-gray-50/80 flex justify-between items-center">
          <p className="text-[10px] text-gray-400 max-w-[200px]">语义优化核心：场景、动作、结果、价值 (STAR)</p>
          <button
            onClick={onClose}
            className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg active:scale-95"
          >
            退出查看
          </button>
        </div>
      </div>
    </div>
  );
};