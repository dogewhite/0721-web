import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResumePreviewProps {
  content: string;
  isLoading: boolean;
  className?: string;
}

const ResumePreview = ({ content, isLoading, className }: ResumePreviewProps) => {
  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="p-3">
        <h3 className="text-sm font-medium text-gray-700">简历内容预览</h3>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-0 p-3 pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <p className="ml-2">正在解析简历...</p>
          </div>
        ) : content ? (
          <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            {content}
          </pre>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">请先在左侧选择一个简历文件</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResumePreview; 