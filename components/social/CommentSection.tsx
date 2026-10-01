"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { FormMessage, errorsFor } from "@/components/forms/FormMessage";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { ConfirmAction } from "@/components/social/ConfirmAction";
import { ReportButton } from "@/components/social/ReportButton";
import { addComment, deleteComment } from "@/lib/actions/social";
import type { Comment } from "@/types/database";
import { formatRelativeDate } from "@/utils/format";

type CommentSectionProps = { postId: string; comments: Comment[]; viewerId: string | null };

export function CommentSection({ postId, comments, viewerId }: CommentSectionProps) {
  const [state, formAction] = useActionState(addComment, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  const bodyErrors = errorsFor(state, "body");

  return (
    <section aria-labelledby="comentarios-title" className="space-y-5">
      <h2 id="comentarios-title" className="text-xl font-extrabold">
        Comentários ({comments.length})
      </h2>

      {comments.length === 0 ? (
        <p className="text-tinta-soft">Nenhum comentário ainda. Comece a conversa.</p>
      ) : (
        <CommentList comments={comments} viewerId={viewerId} postId={postId} />
      )}

      {viewerId ? (
        <form ref={formRef} action={formAction} className="space-y-3">
          <input type="hidden" name="postId" value={postId} />
          <label htmlFor="comment-body" className="sr-only">
            Escreva um comentário
          </label>
          <textarea
            id="comment-body"
            name="body"
            required
            maxLength={1000}
            rows={3}
            placeholder="Escreva um comentário…"
            aria-invalid={bodyErrors ? true : undefined}
            className="w-full rounded-xl border border-linha bg-white p-3"
          />
          <FormMessage state={state} />
          <SubmitButton pendingLabel="Publicando…">Comentar</SubmitButton>
        </form>
      ) : (
        <p className="rounded-xl bg-white p-4 text-sm ring-1 ring-linha">
          <Link
            href={`/login?next=/viagens/${postId}`}
            className="font-semibold text-petroleo underline"
          >
            Entre na sua conta
          </Link>{" "}
          para comentar.
        </p>
      )}
    </section>
  );
}

export function CommentList({
  comments,
  viewerId,
  postId,
}: {
  comments: Comment[];
  viewerId: string | null;
  postId: string;
}) {
  return (
    <ul className="space-y-4">
      {comments.map((c) => (
        <li key={c.id} className="flex gap-3">
          <Avatar name={c.author.full_name} src={c.author.avatar_url} size="sm" />
          <div className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-3 ring-1 ring-linha">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <Link href={`/perfil/${c.author.username}`} className="font-bold hover:underline">
                {c.author.full_name}
              </Link>
              <span className="text-xs text-tinta-soft">@{c.author.username}</span>
              <time dateTime={c.created_at} className="text-xs text-tinta-soft">
                {formatRelativeDate(c.created_at)}
              </time>
            </div>
            <p className="mt-1 break-words whitespace-pre-line">{c.body}</p>
            <div className="mt-1 -ml-3 flex items-center">
              {viewerId === c.user_id ? (
                <ConfirmAction
                  action={() => deleteComment(c.id, postId)}
                  confirmMessage="Excluir este comentário?"
                  className="rounded-full px-3 py-1 text-xs font-semibold text-tinta-soft hover:text-red-700"
                >
                  Excluir
                </ConfirmAction>
              ) : (
                <ReportButton targetType="comment" targetId={c.id} signedIn={Boolean(viewerId)} />
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
