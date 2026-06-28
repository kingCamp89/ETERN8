const MEDIA_NOTE =
  'Original recording or file. URLs may expire; download promptly. Voice and video are listed here because they cannot be embedded in the printable story.';

function pushMedia(items, { id, type, title, date, url, lovedOneName, memoryId }) {
  if (!url) return;
  items.push({
    id,
    type,
    title: title || 'Untitled',
    date: date || null,
    loved_one_name: lovedOneName || null,
    memory_id: memoryId || null,
    url,
    note: MEDIA_NOTE,
  });
}

/**
 * Catalogues photos, voice, and video for sidecar download / future packaging.
 */
export function buildMediaManifest(data) {
  const items = [];

  pushMedia(items, {
    id: 'profile-photo',
    type: 'photo',
    title: 'Profile photo',
    url: data.user?.photo_url,
  });

  for (const person of data.lovedOnes || []) {
    pushMedia(items, {
      id: `loved-one-${person.id}`,
      type: 'photo',
      title: `${person.name || 'Loved one'} profile photo`,
      url: person.photo_url,
      lovedOneName: person.name,
    });
  }

  for (const memory of data.memories || []) {
    const date = memory.memory_date || memory.created_date;
    const base = {
      title: memory.title,
      date,
      lovedOneName: memory.loved_one_name,
      memoryId: memory.id,
    };

    if (memory.memory_type === 'photo' && memory.media_url) {
      pushMedia(items, { ...base, id: `memory-photo-${memory.id}`, type: 'photo', url: memory.media_url });
    }
    if (memory.memory_type === 'voice' && memory.media_url) {
      pushMedia(items, { ...base, id: `memory-voice-${memory.id}`, type: 'voice', url: memory.media_url });
    }
    if (memory.memory_type === 'video' && memory.media_url) {
      pushMedia(items, { ...base, id: `memory-video-${memory.id}`, type: 'video', url: memory.media_url });
    }
  }

  for (const book of data.memoryBooks || []) {
    pushMedia(items, {
      id: `book-cover-${book.id}`,
      type: 'photo',
      title: `${book.title || 'Memory book'} cover`,
      url: book.cover_photo_url,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    totalItems: items.length,
    voiceCount: items.filter((i) => i.type === 'voice').length,
    videoCount: items.filter((i) => i.type === 'video').length,
    photoCount: items.filter((i) => i.type === 'photo').length,
    items,
  };
}
