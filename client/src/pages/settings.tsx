import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { welcomeMessageSchema, type WelcomeMessage } from "@shared/schema";
import { Settings as SettingsIcon, MessageSquare, Upload, X } from "lucide-react";
import * as React from "react";

export default function Settings() {
  const { toast } = useToast();
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Welcome message form
  const welcomeForm = useForm<WelcomeMessage>({
    resolver: zodResolver(welcomeMessageSchema),
    defaultValues: {
      title: "Welcome to our Broadcast Bot!",
      description: "Get real-time notifications and important updates directly to your phone. Click START to begin your journey with us.",
      buttonText: "START",
      imageUrl: "",
    },
  });

  // Fetch current welcome message settings
  const { data: welcomeSettings } = useQuery({
    queryKey: ['/api/settings/welcome'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/settings/welcome');
        if (response.ok) {
          return await response.json();
        }
        return null;
      } catch (error) {
        return null;
      }
    },
  });

  // Update form when data is loaded
  React.useEffect(() => {
    if (welcomeSettings) {
      welcomeForm.reset(welcomeSettings);
    }
  }, [welcomeSettings, welcomeForm]);



  const welcomeMessageMutation = useMutation({
    mutationFn: async (data: WelcomeMessage) => {
      return await apiRequest("POST", "/api/settings/welcome", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Welcome message updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/welcome'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update welcome message",
        variant: "destructive",
      });
    },
  });

  const handleWelcomeMessageSave = (data: WelcomeMessage) => {
    welcomeMessageMutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Welcome Message Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <CardTitle>Bot Welcome Message</CardTitle>
            </div>
            <CardDescription>
              Customize the welcome message users see when they first start the bot
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[80vh] overflow-y-auto">
            <Form {...welcomeForm}>
              <form onSubmit={welcomeForm.handleSubmit(handleWelcomeMessageSave)} className="space-y-4 pb-20">
                <FormField
                  control={welcomeForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Welcome to our Broadcast Bot!"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={welcomeForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Get real-time notifications and important updates..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={welcomeForm.control}
                  name="buttonText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Button Text</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="START"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={welcomeForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <span>Welcome Image (Optional)</span>
                        {(field.value || selectedImageFile) && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Image Set
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* File Upload Section */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Upload Image File</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setSelectedImageFile(file);
                                      setUploadingImage(true);
                                      
                                      try {
                                        const formData = new FormData();
                                        formData.append('image', file);
                                        
                                        const response = await fetch('/api/upload/image', {
                                          method: 'POST',
                                          body: formData,
                                        });
                                        
                                        if (response.ok) {
                                          const { imageUrl } = await response.json();
                                          field.onChange(imageUrl);
                                          toast({
                                            title: "Image uploaded successfully",
                                            description: "Your welcome image has been uploaded and set.",
                                          });
                                        } else {
                                          throw new Error('Upload failed');
                                        }
                                      } catch (error) {
                                        toast({
                                          title: "Upload failed",
                                          description: "Failed to upload image. Please try again.",
                                          variant: "destructive",
                                        });
                                        setSelectedImageFile(null);
                                      } finally {
                                        setUploadingImage(false);
                                      }
                                    }
                                  }}
                                  className="file:mr-2 file:px-3 file:py-1 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                {selectedImageFile && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedImageFile(null);
                                      field.onChange("");
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              {uploadingImage && (
                                <div className="text-sm text-blue-600 flex items-center gap-2">
                                  <Upload className="h-3 w-3 animate-pulse" />
                                  Uploading image...
                                </div>
                              )}
                            </div>
                            
                            {/* URL Input Section */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Or Enter Image URL</Label>
                              <Input
                                placeholder="https://example.com/welcome-image.jpg"
                                value={field.value || ""}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  setSelectedImageFile(null);
                                }}
                              />
                            </div>
                          </div>
                          
                          {field.value && (
                            <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                              <div className="text-sm font-medium mb-2">Image Preview:</div>
                              <img 
                                src={field.value} 
                                alt="Welcome message preview" 
                                className="max-w-full h-48 object-cover rounded border"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (nextElement) {
                                    nextElement.style.display = 'block';
                                  }
                                }}
                              />
                              <div className="text-red-500 text-sm mt-2" style={{ display: 'none' }}>
                                ⚠️ Image failed to load. Please check the URL.
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• Upload your own image file (JPG, PNG, GIF) - recommended for best results</p>
                        <p>• Or paste an image URL from an image hosting service</p>
                        <p>• Recommended size: 600x400 pixels or larger</p>
                        <p>• Maximum file size: 5MB</p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Message Preview */}
                {(welcomeForm.watch("title") || welcomeForm.watch("description")) && (
                  <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-sm font-medium mb-3 text-blue-900 dark:text-blue-200">
                      📱 Telegram Preview:
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                      {welcomeForm.watch("imageUrl") && (
                        <div className="mb-3">
                          <img 
                            src={welcomeForm.watch("imageUrl")} 
                            alt="Preview" 
                            className="w-full max-w-xs h-32 object-cover rounded"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="font-medium text-lg">
                          {welcomeForm.watch("title") || "Welcome to our Broadcast Bot!"}
                        </div>
                        <div className="text-gray-600 dark:text-gray-300">
                          {welcomeForm.watch("description") || "Get real-time notifications and important updates..."}
                        </div>
                        <div className="mt-3">
                          <div className="inline-block bg-blue-500 text-white px-4 py-2 rounded text-sm">
                            {welcomeForm.watch("buttonText") || "START"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Image Hosting Tips */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="text-sm font-medium mb-2">🖼️ Quick Image Hosting Options:</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">imgur.com</a> - Free image hosting with direct links</p>
                    <p>• <a href="https://postimg.cc" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">postimg.cc</a> - Simple upload, get direct URL</p>
                    <p>• <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">imgbb.com</a> - Upload and share images easily</p>
                    <p>• Or use your website's media folder if you have one</p>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white dark:bg-gray-900 p-4 border-t mt-6 -mx-6 -mb-6">
                  <Button
                    type="submit"
                    disabled={welcomeMessageMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {welcomeMessageMutation.isPending ? "Saving..." : "Save Welcome Message"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>





      </div>
    </div>
  );
}