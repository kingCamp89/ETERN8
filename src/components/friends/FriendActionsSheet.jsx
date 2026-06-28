import { useNavigate } from 'react-router-dom';
import { Share2, Users, Heart, UserMinus } from 'lucide-react';
import SafeImage from '@/components/shared/SafeImage';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

export default function FriendActionsSheet({ friend, open, onOpenChange, onRemove }) {
  const navigate = useNavigate();

  if (!friend) return null;

  const go = (path, state) => {
    onOpenChange(false);
    navigate(path, state ? { state } : undefined);
  };

  const addToPeople = () => {
    const params = new URLSearchParams();
    params.set('fromFriend', 'true');
    params.set('name', friend.full_name || '');
    if (friend.photo_url) params.set('photo_url', friend.photo_url);
    onOpenChange(false);
    navigate(`/loved-ones/new?${params.toString()}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-14 h-14 rounded-full bg-secondary overflow-hidden shrink-0">
              <SafeImage
                src={friend.photo_url}
                alt={friend.full_name}
                className="w-full h-full object-cover"
                fallback={
                  <span className="text-lg font-bold flex items-center justify-center h-full text-primary">
                    {friend.full_name?.charAt(0).toUpperCase()}
                  </span>
                }
              />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-section-title truncate">{friend.full_name}</SheetTitle>
              <SheetDescription>@{friend.username}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="grid gap-2 mt-6">
          <Button
            type="button"
            className="w-full rounded-xl justify-start gap-3 h-11"
            onClick={() => {
              const params = new URLSearchParams();
              params.set('shareWith', friend.id);
              if (friend.full_name) params.set('shareWithName', friend.full_name);
              go(`/create?${params.toString()}`, { shareWithFriend: friend });
            }}
          >
            <Share2 className="w-4 h-4" />
            Share a memory
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full rounded-xl justify-start gap-3 h-11"
            onClick={() => go(`/groups?create=1&friend=${friend.id}`)}
          >
            <Users className="w-4 h-4" />
            Start a circle together
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl justify-start gap-3 h-11"
            onClick={addToPeople}
          >
            <Heart className="w-4 h-4" />
            Add to My People
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-xl justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              onOpenChange(false);
              onRemove?.(friend);
            }}
          >
            <UserMinus className="w-4 h-4" />
            Remove friend
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
