import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useLovedOnes from '../hooks/useLovedOnes';
import PageHeader from '../components/shared/PageHeader';
import EmptyState from '../components/shared/EmptyState';
import KeepsakeCard from '../components/shared/KeepsakeCard';
import ProfileAvatar from '../components/shared/ProfileAvatar';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Heart, Trash2, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function formatRelationship(relationship) {
  if (!relationship) return '';
  if (relationship === 'other') return 'Someone special';
  return relationship.replace('_', ' ');
}

export default function LovedOnes() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: lovedOnes = [], isLoading, reorder } = useLovedOnes();

  const { data: memories = [] } = useQuery({
    queryKey: ['memories'],
    queryFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.Memory.filter({ created_by_id: me.id });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (personId) => base44.entities.LovedOne.delete(personId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lovedOnes'] });
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      toast.success('Person removed');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to remove'),
  });

  const getMemoryCount = (id) => memories.filter(m => m.loved_one_id === id).length;

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;
    await reorder(result.source.index, result.destination.index);
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Your People"
        subtitle="The ones who matter most"
        action={
          <Link to="/loved-ones/new">
            <Button size="sm" className="rounded-xl gap-1.5">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="md" />
        </div>
      ) : (
        <div className="page-sections">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="lovedOnes">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                  {lovedOnes.map((person, i) => (
                    <Draggable key={person.id} draggableId={person.id} index={i}>
                      {(provided, snapshot) => (
                        <motion.div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.3 }}
                        >
                          <KeepsakeCard
                            interactive
                            padding={false}
                            className={cn(
                              'flex items-center gap-2 p-3.5',
                              snapshot.isDragging && 'border-primary/30 shadow-xl scale-[1.01]',
                            )}
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="p-1 text-muted-foreground/35 hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing shrink-0"
                              aria-label="Drag to reorder"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>

                            <Link
                              to={`/profile/${person.id}`}
                              className="flex items-center gap-3.5 flex-1 min-w-0"
                            >
                              <ProfileAvatar
                                src={person.photo_url}
                                name={person.name}
                                size="lg"
                                glow
                              />
                              <div className="flex-1 min-w-0 text-left">
                                <h3 className="text-section-title truncate">{person.name}</h3>
                                <p className="text-caption capitalize mt-0.5">
                                  {formatRelationship(person.relationship)}
                                </p>
                              </div>
                              <div className="text-right shrink-0 pl-2">
                                <div className="flex items-center justify-end gap-1 text-primary">
                                  <Heart className="w-3.5 h-3.5" />
                                  <span className="text-stat text-base text-primary">
                                    {getMemoryCount(person.id)}
                                  </span>
                                </div>
                                <span className="text-caption">memories</span>
                              </div>
                            </Link>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget(person)}
                              className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
                              aria-label={`Remove ${person.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </KeepsakeCard>
                        </motion.div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {lovedOnes.length === 0 && (
            <EmptyState
              prompt="Who deserves a place in your story?"
              subtitle="Add someone special to start preserving memories for them."
              illustration={<Heart className="w-8 h-8 text-primary/50" />}
              action={
                <Link to="/loved-ones/new">
                  <Button className="rounded-xl gap-2">
                    <Plus className="w-4 h-4" /> Add your first person
                  </Button>
                </Link>
              }
            />
          )}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-section-title">
              Remove {deleteTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-body text-muted-foreground">
              This will permanently delete this person&apos;s profile and all their memories.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Keep them</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="rounded-xl bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Removing…' : 'Delete permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
