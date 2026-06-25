import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  { value: 'niece', label: 'Niece' },
  { value: 'nephew', label: 'Nephew' },
  { value: 'friend', label: 'Friend' },
  { value: 'partner', label: 'Partner' },
  { value: 'other', label: 'Other' },
];

export default function AddLovedOne() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    name: '', relationship: '', date_of_birth: '', met_date: '', personal_notes: '', photo_url: '', email: '',
  });
  const [uploading, setUploading] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const name = searchParams.get('name');
    const photoUrl = searchParams.get('photo_url');
    if (name) setForm(prev => ({ ...prev, name }));
    if (photoUrl) setForm(prev => ({ ...prev, photo_url: photoUrl }));
  }, [searchParams]);

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
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, photo_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Add Someone Special" showBack />

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="page-sections pb-8"
      >
        <KeepsakeCard padding={false} className="p-6 text-center">
          <label className="cursor-pointer inline-block">
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            {form.photo_url ? (
              <ProfileAvatar src={form.photo_url} name={form.name} size="xl" className="mx-auto" glow />
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
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="rounded-xl h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Relationship</Label>
            {isMobile ? (
              <Drawer>
                <DrawerTrigger asChild>
                  <button type="button" className="w-full rounded-xl h-12 border border-input bg-transparent px-3 flex items-center justify-between text-body">
                    {form.relationship ? relationships.find(r => r.value === form.relationship)?.label : 'Select relationship'}
                  </button>
                </DrawerTrigger>
                <DrawerContent className="rounded-t-2xl">
                  <DrawerHeader>
                    <DrawerTitle className="text-section-title">Relationship</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 pb-8 space-y-1 max-h-64 overflow-y-auto">
                    {relationships.map(r => (
                      <DrawerClose key={r.value} asChild>
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, relationship: r.value }))}
                          className={`w-full text-left px-4 py-3 rounded-xl transition-colors text-body ${
                            form.relationship === r.value ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary'
                          }`}
                        >
                          {r.label}
                        </button>
                      </DrawerClose>
                    ))}
                  </div>
                </DrawerContent>
              </Drawer>
            ) : (
              <Select value={form.relationship} onValueChange={(v) => setForm(prev => ({ ...prev, relationship: v }))}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {relationships.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>When you first met</Label>
            <Input
              type="date"
              value={form.met_date}
              onChange={(e) => setForm(prev => ({ ...prev, met_date: e.target.value }))}
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
              value={form.email}
              onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
              className="rounded-xl h-12"
            />
            <p className="text-caption">Needed for scheduled deliveries. Use a guardian&apos;s email for children.</p>
          </div>

          <div className="space-y-2">
            <Label>Date of birth</Label>
            <Input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
              className="rounded-xl h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>Cover message</Label>
            <Textarea
              placeholder="What makes them special…"
              value={form.personal_notes}
              onChange={(e) => setForm(prev => ({ ...prev, personal_notes: e.target.value }))}
              className="rounded-xl min-h-[100px] resize-none text-body"
            />
            <p className="text-caption">Shown on their profile — a few heartfelt words</p>
          </div>
        </div>

        <Button
          type="submit"
          disabled={!form.name || !form.relationship || createMutation.isPending}
          className="w-full h-12 rounded-xl gap-2"
        >
          <Heart className="w-4 h-4" />
          {createMutation.isPending ? 'Saving…' : 'Add to your circle'}
        </Button>
      </motion.form>
    </div>
  );
}
