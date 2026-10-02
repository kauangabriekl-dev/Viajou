"use client";

import { useKeptActionState } from "@/components/forms/useKeptActionState";
import { Field, describedBy, inputClass } from "@/components/forms/Field";
import { FormMessage, errorsFor } from "@/components/forms/FormMessage";
import { ImageUploader } from "@/components/forms/ImageUploader";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Avatar } from "@/components/ui/Avatar";
import { updateProfile } from "@/lib/actions/profile";
import type { Profile } from "@/types/database";

export function ProfileForm({ profile }: { profile: Profile }) {
  const { state: state, formAction: action, onReset } = useKeptActionState(updateProfile);
  const e = (f: string) => errorsFor(state, f);
  return (
    <form action={action} onReset={onReset} className="space-y-6" noValidate>
      <div className="flex items-center gap-4">
        <Avatar name={profile.full_name} src={profile.avatar_url} size="lg" />
        <div className="flex-1">
          <ImageUploader name="avatar" label="Nova foto de perfil" max={1} errors={e("avatar")} />
        </div>
      </div>
      <Field id="fullName" label="Nome" errors={e("fullName")}>
        <input
          id="fullName"
          name="fullName"
          defaultValue={profile.full_name}
          required
          maxLength={80}
          className={inputClass}
          aria-describedby={describedBy("fullName", e("fullName"))}
        />
      </Field>
      <Field
        id="username"
        label="Username"
        hint="Letras minúsculas, números e _. Mudar o username muda o endereço do seu perfil."
        errors={e("username")}
      >
        <input
          id="username"
          name="username"
          defaultValue={profile.username}
          required
          pattern="[a-z0-9_]{3,30}"
          autoCapitalize="none"
          spellCheck={false}
          className={inputClass}
          aria-describedby={describedBy("username", e("username"), "hint")}
        />
      </Field>
      <Field id="bio" label="Bio" optional errors={e("bio")}>
        <textarea
          id="bio"
          name="bio"
          defaultValue={profile.bio ?? ""}
          maxLength={300}
          rows={3}
          className={inputClass}
          placeholder="Que tipo de viagem você curte?"
        />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Salvando…">Salvar alterações</SubmitButton>
    </form>
  );
}
