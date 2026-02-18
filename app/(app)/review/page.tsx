import { createClient } from "@/lib/supabase/server";
import { getCourses, getDecks, getFlashcardsByDeckIds } from "@/lib/db/queries";
import { ReviewClient } from "./_components/ReviewClient";
import type { Flashcard } from "@/types";

interface Props {
  searchParams: Promise<{ courseId?: string }>;
}

export default async function ReviewPage({ searchParams }: Props) {
  const { courseId } = await searchParams;
  const supabase = await createClient();

  const courses = await getCourses(supabase);
  const selectedCourseId = courseId ?? "";

  const decks = selectedCourseId
    ? await getDecks(supabase, selectedCourseId)
    : [];

  const deckIds = decks.map((d) => d.id);
  const allFlashcards = await getFlashcardsByDeckIds(supabase, deckIds);

  // Group flashcards by deck_id
  const flashcardsByDeck = allFlashcards.reduce<Record<string, Flashcard[]>>(
    (acc, card) => {
      if (!acc[card.deck_id]) acc[card.deck_id] = [];
      acc[card.deck_id].push(card);
      return acc;
    },
    {}
  );

  return (
    <div className="max-w-3xl">
      <ReviewClient
        courses={courses}
        selectedCourseId={selectedCourseId}
        decks={decks}
        flashcardsByDeck={flashcardsByDeck}
      />
    </div>
  );
}
