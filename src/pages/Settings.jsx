import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useLovedOnes from '../hooks/useLovedOnes';
import { Link } from 'react-router-dom';
import PageHeader from '../components/shared/PageHeader';
import KeepsakeCard from '../components/shared/KeepsakeCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Shield, Clock, BookOpen, Crown, LogOut, Search,
  ChevronRight, Lock, HelpCircle, Trash2,
  Users, Share2, Pencil, Check, X, Camera, UserRoundPlus,
  Heart, Download, NotebookPen
} from 'lucide-react';
import { motion } from 'framer-motion';
import SafeImage from '../components/shared/SafeImage';
import ThemePicker from '@/components/shared/ThemePicker';
import IntroDialog from '@/components/shared/IntroDialog';
import { getGlobalTheme, setGlobalTheme, applyTheme } from '@/lib/themes';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { exportUserDataPackage } from '../lib/exportUserData';
import TemplatePickerDialog from '../components/memorybooks/TemplatePickerDialog';
import { toast } from 'sonner';
import { validateImageUpload } from '@/lib/validateImageUpload';

const menuSections = [
  {
    title: 'Memories',
    items: [
      { icon: Clock, label: 'Future Deliveries', path: '/future-deliveries', desc: 'Scheduled memories' },
      { icon: NotebookPen, label: 'Private Notes', path: '/private-notes', desc: 'Words only you can see' },
      { icon: Shield, label: 'Legacy Settings', path: '/legacy', desc: 'Posthumous delivery' },
      { icon: BookOpen, label: 'Memory Books', path: '/memory-books', desc: 'Create printable books' },
      { icon: Search, label: 'Search Memories', path: '/search', desc: 'Find in your memories' },
    ],
  },
  {
    title: 'Sharing',
    items: [
      { icon: UserRoundPlus, label: 'Friends', path: '/friends', desc: 'Connect with family & friends' },
      { icon: Users, label: 'Circles', path: '/groups', desc: 'Manage sharing circles' },
      { icon: Share2, label: 'Shared With You', path: '/shared', desc: 'Memories others have shared' },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: Heart, label: 'Our Story', path: '/our-story', desc: 'Why we built ETERN8 & how to use it' },
      { icon: Crown, label: 'Subscription', path: '/subscription', desc: 'Compare plans' },
      { icon: Lock, label: 'Security & Privacy', path: '/privacy', desc: 'How we protect your data' },
      { icon: HelpCircle, label: 'Help & FAQ', path: '/help', desc: 'Get help and answers' },
    ],
  },
];

export default function Settings() {
  const [user, setUser] = useState(null);
  const [globalTheme, setGlobalThemeState] = useState(getGlobalTheme);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showIntro, setShowIntro] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameValue, setUsernameValue] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [exportError, setExportError] = useState('');
  const [showExportTemplatePicker, setShowExportTemplatePicker] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setNameValue(u?.display_name || '');
      setUsernameValue(u?.username || '');
    }).catch(() => {});
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageUpload(file);
    if (error) {
      toast.error(error);
      e.target.value = '';
      return;
    }

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const updated = await base44.auth.updateMe({ photo_url: file_url });
      setUser(updated);
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const updateNameMutation = useMutation({
    mutationFn: (display_name) => base44.auth.updateMe({ display_name }),
    onSuccess: (updated) => {
      setUser(updated);
      setEditingName(false);
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });

  const handleSaveName = () => {
    updateNameMutation.mutate(nameValue.trim() || null);
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await base44.functions.invoke('deleteAccount', {});
      await base44.auth.logout('/login');
    } catch (err) {
      setDeleteError(err?.message || 'Could not delete account. Please try again or contact support.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleThemeChange = (id) => {
    setGlobalTheme(id);
    setGlobalThemeState(id);
    applyTheme(id);
  };

  const handleExportData = async (templateId) => {
    setExportLoading(true);
    setExportError('');
    setExportStatus('Starting export…');
    setShowExportTemplatePicker(false);
    try {
      await exportUserDataPackage(base44, {
        templateId,
        onProgress: setExportStatus,
      });
      setExportStatus('Download started — check your downloads folder.');
    } catch (err) {
      console.error('Export failed:', err);
      setExportError(err?.message || 'Could not export your data. Please try again.');
      setExportStatus('');
    } finally {
      setExportLoading(false);
    }
  };

  const { data: memories = [] } = useQuery({
    queryKey: ['memories'],
    queryFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.Memory.filter({ created_by_id: me.id });
    },
  });

  const { data: lovedOnes = [] } = useLovedOnes();

  return (
    <div className="min-h-screen">
      <PageHeader title="Settings" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="page-sections"
      >
        <KeepsakeCard>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="relative cursor-pointer">
                <label className="cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden hover:border-primary/60 transition-colors">
                    <SafeImage src={user?.photo_url} alt="Profile" className="w-full h-full object-cover" fallback={<Camera className="w-6 h-6 text-primary/50" />} />
                  </div>
                  {user?.photo_url && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow">
                      <Camera className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                  />
                </label>
                {uploadingPhoto && (
                  <div className="absolute inset-0 rounded-full bg-background/80 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <span className="text-caption">
                {user?.photo_url ? 'Tap to change' : 'Add profile photo'}
              </span>
            </div>
            <div className="flex-1">
              {editingName ? (
                <div className="flex items-center gap-2 mb-1">
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    placeholder="Your display name"
                    className="h-9 rounded-xl text-sm max-w-[180px]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setEditingName(false);
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleSaveName}
                    disabled={updateNameMutation.isPending}
                  >
                    <Check className="w-4 h-4 text-primary" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => { setEditingName(false); setNameValue(user?.display_name || ''); }}
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => setEditingName(true)}>
                  <h3 className="text-section-title">{user?.display_name || user?.full_name || 'Welcome'}</h3>
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
              <p className="text-caption">{user?.email || ''}</p>
              {/* Username */}
              <div className="mt-2">
                {editingUsername ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={usernameValue}
                      onChange={(e) => setUsernameValue(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                      placeholder="username"
                      className="h-8 rounded-xl text-xs max-w-[160px]"
                      maxLength={30}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          base44.auth.updateMe({ username: usernameValue }).then(u => {
                            setUser(u);
                            setEditingUsername(false);
                          }).catch(() => {});
                        }
                        if (e.key === 'Escape') { setEditingUsername(false); setUsernameValue(user?.username || ''); }
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        base44.auth.updateMe({ username: usernameValue }).then(u => {
                          setUser(u);
                          setEditingUsername(false);
                        }).catch(() => {});
                      }}
                    >
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => { setEditingUsername(false); setUsernameValue(user?.username || ''); }}
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => setEditingUsername(true)}>
                    <span className="text-caption">
                      {user?.username ? `@${user.username}` : 'Set a username'}
                    </span>
                    <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-4 pt-4 border-t border-border/50">
            <div className="flex-1 text-center">
              <p className="text-stat text-primary">{memories.length}</p>
              <p className="text-caption">Memories</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-stat text-accent-foreground">{lovedOnes.length}</p>
              <p className="text-caption">People</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-stat text-primary/80">
                {memories.filter(m => m.is_legacy).length}
              </p>
              <p className="text-caption">Legacy</p>
            </div>
          </div>
        </KeepsakeCard>

        <KeepsakeCard>
          <h3 className="text-overline mb-3">App Theme</h3>
          <ThemePicker value={globalTheme} onChange={handleThemeChange} label="" />
        </KeepsakeCard>

        <KeepsakeCard>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-section-title">Export my data</h3>
              <p className="text-caption leading-relaxed mt-1">
                Download a ZIP with your full account data, printable memory stories (quoted messages),
                and a media guide for voice recordings and videos.
              </p>
            </div>
          </div>
          <Button
            className="w-full rounded-xl gap-2"
            onClick={() => setShowExportTemplatePicker(true)}
            disabled={exportLoading}
          >
            <Download className="w-4 h-4" />
            {exportLoading ? 'Preparing export…' : 'Download data export'}
          </Button>
          {exportStatus && !exportError && (
            <p className="text-caption text-muted-foreground mt-2">{exportStatus}</p>
          )}
          {exportError && (
            <p className="text-caption text-destructive mt-2">{exportError}</p>
          )}
        </KeepsakeCard>

        {menuSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-overline mb-2 px-1">
              {section.title}
            </h3>
            <KeepsakeCard padding={false} className="overflow-hidden divide-y divide-border/30">
              {section.items.map(item => {
                const Icon = item.icon;
                const isIntroAction = item.action === 'intro';
                const content = (
                  <div className="flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-menu-title">{item.label}</p>
                      <p className="text-menu-desc">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                );
                if (isIntroAction) {
                  return (
                    <button key="intro" onClick={() => setShowIntro(true)} className="w-full text-left">
                      {content}
                    </button>
                  );
                }
                return (
                  <Link key={item.path} to={item.path}>
                    {content}
                  </Link>
                );
              })}
            </KeepsakeCard>
          </div>
        ))}

        <Button
          variant="ghost"
          className="w-full text-destructive hover:bg-destructive/5 rounded-xl"
          onClick={() => base44.auth.logout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>

        <Button
          variant="ghost"
          className="w-full text-destructive/70 hover:bg-destructive/5 rounded-xl"
          onClick={() => { setDeleteError(''); setShowDeleteDialog(true); }}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Account
        </Button>
      </motion.div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-section-title">Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your data and memories immediately. This action cannot be undone.
            </AlertDialogDescription>
            {deleteError && (
              <p className="text-sm text-destructive mt-2">{deleteError}</p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <IntroDialog open={showIntro} onClose={() => setShowIntro(false)} />

      <TemplatePickerDialog
        open={showExportTemplatePicker}
        onOpenChange={setShowExportTemplatePicker}
        onGenerate={handleExportData}
        isGenerating={exportLoading}
      />
    </div>
  );
}