import { useState } from "react";
import { ComposeForm } from "@/components/broadcast/compose-form";
import { MessagePreview } from "@/components/broadcast/message-preview";
import { useQuery } from "@tanstack/react-query";

export default function Compose() {
  const [previewData, setPreviewData] = useState<{ title: string; message: string } | null>(null);

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Compose Message</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Create and send broadcast messages to your users</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <ComposeForm onPreview={(data) => setPreviewData(data)} />
        </div>
      </div>

      {/* Preview Modal */}
      {previewData && (
        <MessagePreview
          isOpen={!!previewData}
          onClose={() => setPreviewData(null)}
          title={previewData.title}
          message={previewData.message}
          recipientCount={(stats as any)?.totalUsers || 0}
        />
      )}
    </div>
  );
}
