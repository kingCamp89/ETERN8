import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { validateImageUpload } from '@/lib/validateImageUpload';
import { LOVED_ONE_RELATIONSHIPS } from '@/lib/schemas/relationships';
import { lovedOneEditFormDefaults, lovedOneEditFormSchema } from '@/lib/schemas/lovedOne';

export default function EditProfileDialog({ open, onClose, person }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(lovedOneEditFormSchema),
    defaultValues: lovedOneEditFormDefaults,
  });

  const photoUrl = watch('photo_url');
  const name = watch('name');
  const profileTheme = watch('profile_theme');

  useEffect(() => {
    if (!open || !person) return;
    reset({
      name: person.name || '',
      relationship: person.relationship || '',
      date_of_birth: person.date_of_birth || '',
      met_date: person.met_date || '',
      personal_notes: person.personal_notes || '',
      photo_url: person.photo_url || '',
      email: person.email || '',
      profile_theme: person.profile_theme || person.color_theme || '',
    });
  }, [open, person, reset]);

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

    const error = validateImageUpload(file);
    if (error) {
      toast.error(error);
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setValue('photo_url', file_url);
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const onSubmit = (data) => {
    const payload = { ...data };
    if (!payload.photo_url && !person.photo_url) {
      delete payload.photo_url;
    }
    updateMutation.mutate(payload);
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="flex justify-center">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              {photoUrl ? (
                <ProfileAvatar src={photoUrl} name={name} size="xl" glow />
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
              {...register('name')}
              className="rounded-xl h-11"
            />
            {errors.name && (
              <p className="text-caption text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Relationship</Label>
            <Controller
              name="relationship"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOVED_ONE_RELATIONSHIPS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.relationship && (
              <p className="text-caption text-destructive">{errors.relationship.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>When you first met</Label>
            <Input
              type="date"
              {...register('met_date')}
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
              {...register('email')}
              className="rounded-xl h-11"
            />
            {errors.email && (
              <p className="text-caption text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Date of birth</Label>
            <Input
              type="date"
              {...register('date_of_birth')}
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
              {...register('personal_notes')}
              className="rounded-xl min-h-[100px] resize-none text-body"
            />
          </div>

          <ThemePicker
            label="Profile theme"
            value={profileTheme || getGlobalTheme()}
            onChange={(v) => setValue('profile_theme', v)}
          />

          <Button
            type="submit"
            disabled={isSubmitting || updateMutation.isPending}
            className="w-full h-11 rounded-xl"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
