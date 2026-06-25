import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCallback } from 'react';

export default function useLovedOnes() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['lovedOnes'],
    queryFn: async () => {
      const raw = await base44.entities.LovedOne.list();

      // Initialize sort_order for any items that don't have one
      const needsInit = raw.some((item) => item.sort_order == null);
      if (needsInit && raw.length > 0) {
        const ordered = raw.map((item, idx) => ({ ...item, sort_order: idx + 1 }));
        await Promise.all(
          ordered.map((item) =>
            base44.entities.LovedOne.update(item.id, { sort_order: item.sort_order })
          )
        );
        return ordered.sort((a, b) => a.sort_order - b.sort_order);
      }

      return [...raw].sort((a, b) => {
        const aOrder = a.sort_order ?? Infinity;
        const bOrder = b.sort_order ?? Infinity;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return new Date(a.created_date) - new Date(b.created_date);
      });
    },
    staleTime: 0,
  });

  const reorder = useCallback(
    async (sourceIndex, destinationIndex) => {
      const current = Array.from(query.data || []);
      if (current.length === 0 || sourceIndex === destinationIndex) return;

      const [moved] = current.splice(sourceIndex, 1);
      current.splice(destinationIndex, 0, moved);

      const ordered = current.map((item, idx) => ({ ...item, sort_order: idx + 1 }));

      queryClient.setQueryData(['lovedOnes'], ordered);

      await Promise.all(
        ordered.map((item) =>
          base44.entities.LovedOne.update(item.id, { sort_order: item.sort_order })
        )
      );
    },
    [query.data, queryClient]
  );

  return { ...query, reorder };
}