"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { authApi } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Mail, CheckCircle2, AlertCircle, Upload } from "lucide-react";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setProfileImage(user.profileImage || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { user: updatedUser, message } = await authApi.updateProfile({
        name: name || undefined,
        email: email !== user?.email ? email : undefined,
        profileImage: profileImage || undefined,
      });

      updateUser(updatedUser);
      setSuccess(message);

      if (email !== user?.email) {
        setTimeout(() => {
          alert("Please check your new email address to verify it.");
        }, 1000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProfileImage(base64String);
    };
    reader.readAsDataURL(file);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              Profile Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your profile information and preferences
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and profile picture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Profile Image */}
                <div className="space-y-2">
                  <Label>Profile Image</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={profileImage} alt="Profile" />
                      <AvatarFallback>
                        {name
                          ? name.charAt(0).toUpperCase()
                          : email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG or GIF. Max size 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                  {user?.emailVerified === false && (
                    <Alert className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                        Email not verified. Please check your inbox for
                        verification link.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Email Verification Status */}
                {user && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">
                              Email Verification Status
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {user.emailVerified ? (
                              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <CheckCircle2 className="w-4 h-4" />
                                Verified
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                <AlertCircle className="w-4 h-4" />
                                Not verified
                              </span>
                            )}
                          </p>
                        </div>
                        {!user.emailVerified && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await authApi.resendVerification();
                                alert(
                                  "Verification email sent! Please check your inbox."
                                );
                              } catch (err: any) {
                                alert(
                                  err.response?.data?.message ||
                                    "Failed to send verification email"
                                );
                              }
                            }}
                          >
                            Resend Verification
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Submit Button */}
                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
