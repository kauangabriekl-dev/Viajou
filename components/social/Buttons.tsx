"use client";

import { Bookmark, Heart, UserCheck, UserPlus } from "lucide-react";
import {
  toggleFollow,
  toggleItineraryLike,
  toggleItinerarySave,
  togglePostLike,
  togglePostSave,
} from "@/lib/actions/social";
import { ToggleButton } from "@/components/social/ToggleButton";

type Common = { signedIn: boolean; initialActive: boolean };

export function LikeButton({
  targetId,
  kind,
  count,
  ...rest
}: Common & { targetId: string; kind: "post" | "itinerary"; count: number }) {
  return (
    <ToggleButton
      {...rest}
      initialCount={count}
      action={() => (kind === "post" ? togglePostLike(targetId) : toggleItineraryLike(targetId))}
      labels={{ on: "Curtido", off: "Curtir" }}
      icon={(active) => (
        <Heart
          aria-hidden="true"
          className={`h-5 w-5 ${active ? "fill-red-500 text-red-500" : ""}`}
        />
      )}
    />
  );
}

export function SaveButton({
  targetId,
  kind,
  ...rest
}: Common & { targetId: string; kind: "post" | "itinerary" }) {
  return (
    <ToggleButton
      {...rest}
      action={() => (kind === "post" ? togglePostSave(targetId) : toggleItinerarySave(targetId))}
      labels={{ on: "Salvo", off: "Salvar" }}
      icon={(active) => (
        <Bookmark
          aria-hidden="true"
          className={`h-5 w-5 ${active ? "fill-petroleo text-petroleo" : ""}`}
        />
      )}
    />
  );
}

export function FollowButton({ profileId, ...rest }: Common & { profileId: string }) {
  return (
    <ToggleButton
      {...rest}
      variant="solid"
      action={() => toggleFollow(profileId)}
      labels={{ on: "Seguindo", off: "Seguir" }}
      icon={(active) =>
        active ? (
          <UserCheck aria-hidden="true" className="h-4 w-4" />
        ) : (
          <UserPlus aria-hidden="true" className="h-4 w-4" />
        )
      }
    />
  );
}
