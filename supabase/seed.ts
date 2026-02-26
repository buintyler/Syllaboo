import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env['SUPABASE_URL'] ?? '',
  process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
);

const seedStories = [
  {
    title: 'The Cat and the Mat',
    level: 1,
    word_count: 6,
    is_free: true,
    content: {
      paragraphs: [
        {
          paragraphIndex: 0,
          sentences: [
            {
              sentenceIndex: 0,
              text: 'The cat sat on the mat.',
              words: [
                { wordIndex: 0, text: 'The',   textNormalized: 'the',  charOffset: 0 },
                { wordIndex: 1, text: 'cat',   textNormalized: 'cat',  charOffset: 4 },
                { wordIndex: 2, text: 'sat',   textNormalized: 'sat',  charOffset: 8 },
                { wordIndex: 3, text: 'on',    textNormalized: 'on',   charOffset: 12 },
                { wordIndex: 4, text: 'the',   textNormalized: 'the',  charOffset: 15 },
                { wordIndex: 5, text: 'mat.',  textNormalized: 'mat',  charOffset: 19 },
              ],
            },
          ],
        },
      ],
    },
  },
];

async function seed() {
  console.warn('Seeding database...');

  const { error } = await supabase.from('stories').upsert(seedStories, { onConflict: 'title' });

  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }

  console.warn('Seed complete.');
}

seed();
