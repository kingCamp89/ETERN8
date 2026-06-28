import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PageHeader from '../components/shared/PageHeader';
import ProfileAvatar from '../components/shared/ProfileAvatar';
import KeepsakeCard from '../components/shared/KeepsakeCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Heart } from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';
import {
  Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger,
} from '@/components/ui/drawer';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { validateImageUpload } from '@/lib/validateImageUpload';
import { LOVED_ONE_RELATIONSHIPS } from '@/lib/schemas/relationships';
import { lovedOneFormDefaults, lovedOneFormSchema } from '@/lib/schemas/lovedOne';

export default function AddLovedOne() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [uploading, setUploading] = useState(false);
  const isMobile = useIsMobile();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(lovedOneFormSchema),
    defaultValues: lovedOneFormDefaults,
  });

  const photoUrl = watch('photo_url');
  const name = watch('name');
  const relationship = watch('relationship');

  useEffect(() => {
    const prefilledName = searchParams.get('name');
    const prefilledPhoto = searchParams.get('photo_url');
    if (prefilledName) setValue('name', prefilledName);
    if (prefilledPhoto) setValue('photo_url', prefilledPhoto);
  }, [searchParams, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const existing = await base44.entities.LovedOne.list();
      return base44.entities.LovedOne.create({ ...data, sort_order: existing.length + 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lovedOnes'] });
      navigate('/loved-ones');
    },
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
    createMutation.mutate(data);
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Add Someone Special" showBack />

      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="page-sections pb-8"
      >
        <KeepsakeCard padding={false} className="p-6 text-center">
          <label className="cursor-pointer inline-block">
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            {photoUrl ? (
              <ProfileAvatar src={photoUrl} name={name} size="xl" className="mx-auto" glow />
            ) : (
              <div className="w-24 h-24 rounded-full mx-auto bg-secondary border-2 border-dashed border-primary/30 flex flex-col items-center justify-center hover:border-primary/50 transition-colors">
                <Camera className="w-6 h-6 text-muted-foreground" />
                <span className="text-caption mt-1">
                  {uploading ? 'Uploading…' : 'Add photo'}
                </span>
              </div>
            )}
          </label>
          <p className="text-quote mt-4">
            Who are you preserving memories for?
          </p>
        </KeepsakeCard>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="Their name"
              {...register('name')}
              className="rounded-xl h-12"
            />
            {errors.name && (
              <p className="text-caption text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Relationship</Label>
            {isMobile ? (
              <Drawer>
                <DrawerTrigger asChild>
                  <button type="button" className="w-full rounded-xl h-12 border border-input bg-transparent px-3 flex items-center justify-between text-body">
                    {relationship
                      ? LOVED_ONE_RELATIONSHIPS.find((r) => r.value === relationship)?.label
                      : 'Select relationship'}
                  </button>
                </DrawerTrigger>
                <DrawerContent className="rounded-t-2xl">
                  <DrawerHeader>
                    <DrawerTitle className="text-section-title">Relationship</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 pb-8 space-y-1 max-h-64 overflow-y-auto">
                    <Controller
                      name="relationship"
                      control={control}
                      render={({ field }) => (
                        <>
                          {LOVED_ONE_RELATIONSHIPS.map((r) => (
                            <DrawerClose key={r.value} asChild>
                              <button
                                type="button"
                                onClick={() => field.onChange(r.value)}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-colors text-body ${
                                  relationship === r.value ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary'
                                }`}
                              >
                                {r.label}
                              </button>
                            </DrawerClose>
                          ))}
                        </>
                      )}
                    />
                  </div>
                </DrawerContent>
              </Drawer>
            ) : (
              <Controller
                name="relationship"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="rounded-xl h-12">
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
            )}
            {errors.relationship && (
              <p className="text-caption text-destructive">{errors.relationship.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>When you first met</Label>
            <Input
              type="date"
              {...register('met_date')}
              className="rounded-xl h-12"
            />
            <p className="text-caption">Even just the year is enough</p>
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
              className="rounded-xl h-12"
            />
            {errors.email && (
              <p className="text-caption text-destructive">{errors.email.message}</p>
            )}
            <p className="text-caption">Needed for scheduled deliveries. Use a guardian&apos;s email for children.</p>
          </div>

          <div className="space-y-2">
            <Label>Date of birth</Label>
            <Input
              type="date"
              {...register('date_of_birth')}
              className="rounded-xl h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>Cover message</Label>
            <Textarea
              placeholder="What makes them special…"
              {...register('personal_notes')}
              className="rounded-xl min-h-[100px] resize-none text-body"
            />
            <p className="text-caption">Shown on their profile — a few heartfelt words</p>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || createMutation.isPending}
          className="w-full h-12 rounded-xl gap-2"
        >
          <Heart className="w-4 h-4" />
          {createMutation.isPending ? 'Saving…' : 'Add to your circle'}
        </Button>
      </motion.form>
    </div>
  );
}
