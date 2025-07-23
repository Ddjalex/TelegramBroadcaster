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
import { changePasswordSchema, welcomeMessageSchema, type ChangePassword, type WelcomeMessage } from "@shared/schema";
import { KeyRound, Shield, Settings as SettingsIcon, MessageSquare } from "lucide-react";
import * as React from "react";

export default function Settings() {
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const form = useForm<ChangePassword>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

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

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePassword) => {
      return await apiRequest("POST", "/api/auth/change-password", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

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

  const handlePasswordChange = (data: ChangePassword) => {
    changePasswordMutation.mutate(data);
  };

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
          <CardContent>
            <Form {...welcomeForm}>
              <form onSubmit={welcomeForm.handleSubmit(handleWelcomeMessageSave)} className="space-y-4">
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
                        {field.value && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Image Set
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <Input
                            placeholder="https://example.com/welcome-image.jpg"
                            {...field}
                          />
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
                        <p>• Upload your image to an image hosting service (like imgur.com, postimg.cc) and paste the URL here</p>
                        <p>• Recommended size: 600x400 pixels or larger</p>
                        <p>• Supported formats: JPG, PNG, GIF</p>
                        <p>• If no image is provided, only text will be sent</p>
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

                <Button
                  type="submit"
                  disabled={welcomeMessageMutation.isPending}
                  className="w-full"
                >
                  {welcomeMessageMutation.isPending ? "Saving..." : "Save Welcome Message"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>
              Manage your admin account security settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">Current Admin Username: admin</p>
                <p className="text-xs mt-1">
                  For security, change your password regularly and use a strong password
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              <CardTitle>Change Password</CardTitle>
            </div>
            <CardDescription>
              Update your admin password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handlePasswordChange)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? "text" : "password"}
                            placeholder="Enter your current password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? "Hide" : "Show"}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Enter your new password (min 6 characters)"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? "Hide" : "Show"}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm your new password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="w-full"
                >
                  {changePasswordMutation.isPending ? "Changing Password..." : "Change Password"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardHeader>
            <CardTitle className="text-amber-800 dark:text-amber-200">Security Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
              <li>• Use a strong password with at least 8 characters</li>
              <li>• Include uppercase, lowercase, numbers, and special characters</li>
              <li>• Don't reuse passwords from other accounts</li>
              <li>• Change your password regularly</li>
              <li>• Keep your login credentials confidential</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}