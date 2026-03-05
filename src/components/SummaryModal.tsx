import React from 'react';

interface SummaryModalProps {
  isOpen: boolean;
  summary: string | null;
  generating: boolean;
  error: string | null;
  onClose: () => void;
  onCopy: () => void;
  onRegenerate: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  summary,
  generating,
  error,
  onClose,
  onCopy,
  onRegenerate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">📊 工作简报</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {generating ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">正在生成简报...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={onRegenerate}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                重新生成
              </button>
            </div>
          ) : (
            <div>
              <div className="prose max-w-none">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {summary}
                </p>
              </div>
            </div>
          )}
        </div>

        {!generating && !error && summary && (
          <div className="flex justify-between items-center p-4 border-t bg-gray-50">
            <p className="text-sm text-gray-500">
              字数：{summary.replace(/\s/g, '').length} 字
            </p>
            <div className="flex gap-2">
              <button
                onClick={onRegenerate}
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded transition-colors"
              >
                🔄 重新生成
              </button>
              <button
                onClick={onCopy}
                className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
              >
                📋 复制
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
