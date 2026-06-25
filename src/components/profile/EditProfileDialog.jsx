import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Loader2 } from 'lucide-react';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import ThemePicker from '@/components/shared/ThemePicker';
import { getGlobalTheme } from '@/lib/themes';
import { toast } from 'sonner';

const relationships = [
  { value: 'daughter', label: 'Daughter' },
  { value: 'son', label: 'Son' },
  { value: 'wife', label: 'Wife' },
  { value: 'husband', label: 'Husband' },
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'sister', label: 'Sister' },
  { value: 'brother', label: 'Brother' },
  { value: 'friend', label: 'Friend' },
  { value: 'partner', label: 'Partner' },
  { value: 'other', label: 'Other' },
];

const emptyForm = {
  name: '',
  relationship: '',
  date_of_birth: '',
  met_date: '',
  personal_notes: '',
  photo_url: '',
  email: '',
  profile_theme: '',
};

export default function EditProfileDialog({ open, onClose, person }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open || !person) return;
    setForm({
      name: person.name || '',
      relationship: person.relationship || '',
      date_of_birth: person.date_of_birth || '',
      met_date: person.met_date || '',
      personal_notes: person.personal_notes || '',
      photo_url: person.photo_url || '',
      email: person.email || '',
      profile_theme: person.profile_theme || person.color_theme || '',
    });
  }, [open, person]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.LovedOne.update(person.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lovedOne', person.id] });
      queryClient.invalidateQueries({ queryKey: ['lovedOnes'] });
      toast.success('Profile updated');
      onClose();
    },
    onError: () => toast.error('Failed to save changes'),
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ALLOWED_IMG = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!ALLOWED_IMG.includes(file.type)) {
      toast.error('Unsupported image type');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Photo too large. Maximum: 20MB');
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, photo_url: file_url }));
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form };
    if (!data.photo_url && !person.photo_url) {
      delete data.photo_url;
    }
    updateMutation.mutate(data);
  };

  if (!person) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-section-title">Edit profile</DialogTitle>
          <DialogDescription className="text-caption">
            Update details and memories for {person.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="flex justify-center">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              {form.photo_url ? (
                <ProfileAvatar src={form.photo_url} name={form.name} size="xl" glow />
              ) : (
                <div className="w-24 h-24 rounded-full bg-secondary border-2 border-dashed border-primary/30 flex flex-col items-center justify-center hover:border-primary/50 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-muted-foreground" />
                  )}
                  <span className="text-caption mt-1">
                    {uploading ? 'Uploading…' : 'Add photo'}
                  </span>
                </div>
              )}
            </label>
          </div>

          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="rounded-xl h-11"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Relationship</Label>
            <Select value={form.relationship} onValueChange={(v) => setForm(prev => ({ ...prev, relationship: v }))}>
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                {relationships.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>When you first met</Label>
            <Input
              type="date"
              value={form.met_date}
              onChange={(e) => setForm(prev => ({ ...prev, met_date: e.target.value }))}
              className="rounded-xl h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Email
              <span className="text-muted-foreground font-normal ml-1">— for future deliveries</span>
            </Label>
            <Input
              type="email"
              placeholder="Their email or a guardian's"
              value={form.email}
              onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
              className="rounded-xl h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>Date of birth</Label>
            <Input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
              className="rounded-xl h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Cover message
              <span className="text-muted-foreground font-normal ml-1">— a few words about them</span>
            </Label>
            <Textarea
              placeholder="Write something special about them…"
              value={form.personal_notes}
              onChange={(e) => setForm(prev => ({ ...prev, personal_notes: e.target.value }))}
              className="rounded-xl min-h-[100px] resize-none text-body"
            />
          </div>

          <ThemePicker
            label="Profile theme"
            value={form.profile_theme || getGlobalTheme()}
            onChange={(v) => setForm(prev => ({ ...prev, profile_theme: v }))}
          />

          <Button
            type="submit"
            disabled={!form.name || !form.relationship || updateMutation.isPending}
            className="w-full h-11 rounded-xl"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
