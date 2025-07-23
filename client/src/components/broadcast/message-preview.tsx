import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";

interface MessagePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  recipientCount?: number;
  onConfirmSend?: () => void;
}

export function MessagePreview({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  recipientCount = 0,
  onConfirmSend 
}: MessagePreviewProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 telegram-bg-light rounded-lg flex items-center justify-center">
              <Send className="telegram-text" size={20} />
            </div>
            <DialogTitle>Message Preview</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 telegram-bg rounded-full flex items-center justify-center">
                    <Send className="text-white" size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Broadcast Bot</p>
                    <p className="text-xs text-gray-500">now</p>
                  </div>
                </div>
                <div className="ml-10">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{title}</p>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{message}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {onConfirmSend && (
            <>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Are you sure you want to send this message to all{" "}
                <span className="font-semibold">{recipientCount.toLocaleString()}</span>{" "}
                registered users?
              </p>
              
              <div className="flex items-center justify-end space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  className="telegram-bg hover:telegram-bg-dark text-white"
                  onClick={onConfirmSend}
                >
                  <Send size={16} className="mr-2" />
                  Send Now
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
