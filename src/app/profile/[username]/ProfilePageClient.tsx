"use client";

import { getProfileByUsername, getUserPosts, updateProfile } from "@/actions/profile.action";
import { toggleFollow } from "@/actions/user.action";
import PostCard from "@/components/PostCard";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SignInButton, useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import {
  CalendarIcon,
  EditIcon,
  FileTextIcon,
  HeartIcon,
  LinkIcon,
  MapPinIcon,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

type User = Awaited<ReturnType<typeof getProfileByUsername>>;
type Posts = Awaited<ReturnType<typeof getUserPosts>>;

interface ProfilePageClientProps {
  user: NonNullable<User>;
  posts: Posts;
  likedPosts: Posts;
  isFollowing: boolean;
}

function ProfilePageClient({
  isFollowing: initialIsFollowing,
  likedPosts,
  posts,
  user,
}: ProfilePageClientProps) {
  const { user: currentUser } = useUser();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);

  const [editForm, setEditForm] = useState({
    name: user.name || "",
    bio: user.bio || "",
    location: user.location || "",
    website: user.website || "",
  });

  const handleEditSubmit = async () => {
    const formData = new FormData();
    Object.entries(editForm).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const result = await updateProfile(formData);
    if (result.success) {
      setShowEditDialog(false);
      toast.success("Profile updated successfully");
    }
  };

  const handleFollow = async () => {
    if (!currentUser) return;

    try {
      setIsUpdatingFollow(true);
      await toggleFollow(user.id);
      setIsFollowing(!isFollowing);
    } catch (error) {
      toast.error("Failed to update follow status");
      console.error("Error toggling follow status:", error);

    } finally {
      setIsUpdatingFollow(false);
    }
  };

  const isOwnProfile =
    currentUser?.username === user.username ||
    currentUser?.emailAddresses[0].emailAddress.split("@")[0] === user.username;

  const formattedDate = format(new Date(user.createdAt), "MMMM yyyy");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div className="w-full max-w-lg mx-auto">
          <Card className="bg-card">
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
                  <AvatarImage src={user.image ?? "/avatar.png"} />
                </Avatar>
                <h1 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold">{user.name ?? user.username}</h1>
                <p className="text-muted-foreground text-sm sm:text-base">@{user.username}</p>
                <p className="mt-2 text-sm px-2">{user.bio}</p>

                {/* PROFILE STATS */}
                <div className="w-full mt-4 sm:mt-6">
                  <div className="flex justify-around sm:justify-between mb-4">
                    <div className="flex-1 text-center sm:text-left">
                      <div className="font-semibold text-sm sm:text-base">{user._count.following.toLocaleString()}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Following</div>
                    </div>
                    <Separator orientation="vertical" className="hidden sm:block" />
                    <div className="flex-1 text-center sm:text-left">
                      <div className="font-semibold text-sm sm:text-base">{user._count.followers.toLocaleString()}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Followers</div>
                    </div>
                    <Separator orientation="vertical" className="hidden sm:block" />
                    <div className="flex-1 text-center sm:text-left">
                      <div className="font-semibold text-sm sm:text-base">{user._count.posts.toLocaleString()}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Posts</div>
                    </div>
                  </div>
                </div>

                {/* "FOLLOW & EDIT PROFILE" BUTTONS */}
                {!currentUser ? (
                  <SignInButton mode="modal">
                    <Button className="w-full mt-4 h-10 sm:h-auto">Follow</Button>
                  </SignInButton>
                ) : isOwnProfile ? (
                  <Button className="w-full mt-4 h-10 sm:h-auto" onClick={() => setShowEditDialog(true)}>
                    <EditIcon className="size-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <Button
                    className="w-full mt-4 h-10 sm:h-auto"
                    onClick={handleFollow}
                    disabled={isUpdatingFollow}
                    variant={isFollowing ? "outline" : "default"}
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                )}

                {/* LOCATION & WEBSITE */}
                <div className="w-full mt-4 sm:mt-6 space-y-2 text-xs sm:text-sm px-2">
                  {user.location && (
                    <div className="flex items-center text-muted-foreground">
                      <MapPinIcon className="size-3 sm:size-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{user.location}</span>
                    </div>
                  )}
                  {user.website && (
                    <div className="flex items-center text-muted-foreground">
                      <LinkIcon className="size-3 sm:size-4 mr-2 flex-shrink-0" />
                      <a
                        href={
                          user.website.startsWith("http") ? user.website : `https://${user.website}`
                        }
                        className="hover:underline truncate"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {user.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center text-muted-foreground">
                    <CalendarIcon className="size-3 sm:size-4 mr-2 flex-shrink-0" />
                    <span>Joined {formattedDate}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger
              value="posts"
              className="flex items-center gap-1 sm:gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary
               data-[state=active]:bg-transparent px-3 sm:px-6 font-semibold text-sm sm:text-base min-h-[44px] touch-manipulation"
            >
              <FileTextIcon className="size-3 sm:size-4" />
              <span className="hidden xs:inline">Posts</span>
              <span className="xs:hidden">Posts</span>
            </TabsTrigger>
            <TabsTrigger
              value="likes"
              className="flex items-center gap-1 sm:gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary
               data-[state=active]:bg-transparent px-3 sm:px-6 font-semibold text-sm sm:text-base min-h-[44px] touch-manipulation"
            >
              <HeartIcon className="size-3 sm:size-4" />
              <span className="hidden xs:inline">Likes</span>
              <span className="xs:hidden">Likes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4 sm:mt-6">
            <div className="space-y-4 sm:space-y-6">
              {posts.length > 0 ? (
                posts.map((post) => <PostCard key={post.id} post={post} dbUserId={user.id} />)
              ) : (
                <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm sm:text-base">No posts yet</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="likes" className="mt-4 sm:mt-6">
            <div className="space-y-4 sm:space-y-6">
              {likedPosts.length > 0 ? (
                likedPosts.map((post) => <PostCard key={post.id} post={post} dbUserId={user.id} />)
              ) : (
                <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm sm:text-base">No liked posts to show</div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px] mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Name</Label>
                <Input
                  name="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Your name"
                  className="h-10 sm:h-auto"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Bio</Label>
                <Textarea
                  name="bio"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="min-h-[80px] sm:min-h-[100px]"
                  placeholder="Tell us about yourself"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Location</Label>
                <Input
                  name="location"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="Where are you based?"
                  className="h-10 sm:h-auto"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Website</Label>
                <Input
                  name="website"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  placeholder="Your personal website"
                  className="h-10 sm:h-auto"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <DialogClose asChild>
                <Button variant="outline" className="w-full sm:w-auto h-10 sm:h-auto">Cancel</Button>
              </DialogClose>
              <Button onClick={handleEditSubmit} className="w-full sm:w-auto h-10 sm:h-auto">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
export default ProfilePageClient;