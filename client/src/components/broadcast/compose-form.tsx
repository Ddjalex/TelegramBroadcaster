import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Bold, Italic, Link, Smile, Eye, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertBroadcastSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import type { z } from "zod";

const composeSchema = insertBroadcastSchema.extend({
  title: insertBroadcastSchema.shape.title.min(1, "Title is required"),
  message: insertBroadcastSchema.shape.message.min(1, "Message is required").max(4096, "Message too long"),
});

type ComposeFormData = z.infer<typeof composeSchema>;

interface ComposeFormProps {
  onPreview?: (data: ComposeFormData) => void;
}

export function ComposeForm({ onPreview }: ComposeFormProps) {
  const [messageLength, setMessageLength] = useState(0);
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ComposeFormData>({
    resolver: zodResolver(composeSchema),
    defaultValues: {
      title: "",
      message: "",
      status: "draft",
    },
  });

  const createBroadcastMutation = useMutation({
    mutationFn: async (data: ComposeFormData) => {
      const response = await apiRequest("POST", "/api/broadcasts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broadcasts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Broadcast saved successfully", description: "Your message has been saved as a draft" });
      form.reset();
      setMessageLength(0);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save broadcast",
        variant: "destructive",
      });
    },
  });

  const sendBroadcastMutation = useMutation({
    mutationFn: async (broadcastId: number) => {
      const response = await apiRequest("POST", `/api/broadcasts/${broadcastId}/send`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/broadcasts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ 
        title: "Broadcast sent successfully!", 
        description: `Message delivered to ${data.recipientCount || 0} users`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send broadcast",
        variant: "destructive",
      });
    },
  });

  const handleSaveDraft = (data: ComposeFormData) => {
    createBroadcastMutation.mutate(data);
  };

  const handleSendNow = async (data: ComposeFormData) => {
    try {
      const broadcast = await createBroadcastMutation.mutateAsync(data);
      await sendBroadcastMutation.mutateAsync(broadcast.id);
    } catch (error) {
      // Error handling is done in the mutation callbacks
    }
  };

  const handlePreview = () => {
    const data = form.getValues();
    if (onPreview) {
      onPreview(data);
    }
  };

  // Text formatting functions
  const insertTextAtCursor = (startText: string, endText: string = '') => {
    if (!textareaRef) return;
    
    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const currentMessage = form.getValues("message");
    const selectedText = currentMessage.substring(start, end);
    
    let newText;
    if (selectedText) {
      // Wrap selected text
      newText = currentMessage.substring(0, start) + startText + selectedText + endText + currentMessage.substring(end);
    } else {
      // Insert at cursor position
      newText = currentMessage.substring(0, start) + startText + endText + currentMessage.substring(end);
    }
    
    form.setValue("message", newText);
    setMessageLength(newText.length);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      const newCursorPos = selectedText ? start + startText.length + selectedText.length + endText.length : start + startText.length;
      textareaRef.focus();
      textareaRef.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleBold = () => insertTextAtCursor('**', '**');
  const handleItalic = () => insertTextAtCursor('_', '_');
  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      const linkText = prompt('Enter link text (optional):') || url;
      insertTextAtCursor(`[${linkText}](${url})`);
    }
  };
  
  const handleEmoji = () => {
    const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    insertTextAtCursor(randomEmoji);
  };

  const watchMessage = form.watch("message");
  
  // Update message length when message changes
  React.useEffect(() => {
    setMessageLength(watchMessage?.length || 0);
  }, [watchMessage]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Broadcast</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter broadcast title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Type your broadcast message here..."
                      className="resize-none"
                      rows={4}
                      {...field}
                      ref={(el) => {
                        field.ref?.(el);
                        setTextareaRef(el);
                      }}
                      onChange={(e) => {
                        field.onChange(e);
                        setMessageLength(e.target.value.length);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={handleBold}
                  title="Bold (**text**)"
                >
                  <Bold size={16} />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={handleItalic}
                  title="Italic (_text_)"
                >
                  <Italic size={16} />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={handleLink}
                  title="Insert Link"
                >
                  <Link size={16} />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={handleEmoji}
                  title="Add Random Emoji"
                >
                  <Smile size={16} />
                </Button>
                <span className="text-sm text-gray-500">{messageLength}/4096</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreview}
                  disabled={!form.getValues("message")}
                >
                  <Eye size={16} className="mr-2" />
                  Preview
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={form.handleSubmit(handleSaveDraft)}
                  disabled={createBroadcastMutation.isPending}
                >
                  Save Draft
                </Button>
                <Button
                  type="button"
                  className="telegram-bg hover:telegram-bg-dark text-white"
                  onClick={form.handleSubmit(handleSendNow)}
                  disabled={createBroadcastMutation.isPending || sendBroadcastMutation.isPending}
                >
                  <Send size={16} className="mr-2" />
                  Send Now
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
