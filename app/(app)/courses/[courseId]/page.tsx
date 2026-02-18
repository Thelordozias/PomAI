// Individual course view — full implementation in Step 4.

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function CourseDetailPage({ params }: Props) {
  const { courseId } = await params;

  return (
    <div className="max-w-3xl space-y-4">
      <h2 className="text-sand-200 text-xl font-semibold">
        Course{" "}
        <span className="text-sand-500 font-normal text-base">{courseId}</span>
      </h2>
      <p className="text-sand-500 text-sm">
        Course detail, chapters, and concepts view coming in Step 4.
      </p>
    </div>
  );
}
