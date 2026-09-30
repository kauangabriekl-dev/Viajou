"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { checkImage, IMAGE_ACCEPT } from "@/lib/images";

type ImageUploaderProps = {
  name: string;
  label: string;
  max: number;
  withAlt?: boolean;
  errors?: string[];
};

type Item = { file: File; url: string; alt: string };

/**
 * Seleção de imagens com pré-visualização e validação imediata.
 * O servidor valida de novo (tipo, tamanho, assinatura) — isto é só conforto.
 * Os arquivos vão no próprio <form> via DataTransfer, sem upload paralelo.
 */
export function ImageUploader({ name, label, max, withAlt, errors }: ImageUploaderProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dt = new DataTransfer();
    items.forEach((i) => dt.items.add(i.file));
    if (inputRef.current) inputRef.current.files = dt.files;
  }, [items]);

  useEffect(() => () => items.forEach((i) => URL.revokeObjectURL(i.url)), [items]);

  function add(list: FileList | null) {
    if (!list) return;
    setProblem(null);
    const next = [...items];
    for (const file of Array.from(list)) {
      if (next.length >= max) {
        setProblem(`Você pode enviar até ${max} ${max === 1 ? "imagem" : "imagens"}.`);
        break;
      }
      const check = checkImage(file);
      if (!check.ok) {
        setProblem(check.error);
        continue;
      }
      next.push({ file, url: URL.createObjectURL(file), alt: "" });
    }
    setItems(max === 1 ? next.slice(-1) : next);
  }

  const message = problem ?? errors?.[0];

  return (
    <div className="space-y-2">
      <span className="block text-sm font-semibold text-tinta">
        {label}{" "}
        <span className="font-normal text-tinta-soft">(opcional, JPG, PNG ou WebP, até 5 MB)</span>
      </span>
      <input
        ref={inputRef}
        type="file"
        name={name}
        multiple={max > 1}
        accept={IMAGE_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      <input
        id={`${name}-picker`}
        type="file"
        multiple={max > 1}
        accept={IMAGE_ACCEPT}
        className="peer sr-only"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
      <label
        htmlFor={`${name}-picker`}
        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-linha bg-white px-4 py-6 font-semibold text-atlantico peer-focus-visible:outline-3 peer-focus-visible:outline-maracuja hover:border-atlantico"
      >
        <ImagePlus aria-hidden="true" className="h-5 w-5" />
        {items.length ? "Adicionar mais" : "Escolher imagens"}
      </label>
      {message && (
        <p className="text-sm font-medium text-red-700" role="alert">
          {message}
        </p>
      )}
      {items.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item, index) => (
            <li key={item.url} className="space-y-1.5">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- pré-visualização local (blob:) */}
                <img
                  src={item.url}
                  alt={item.alt || `Imagem ${index + 1} selecionada`}
                  className="aspect-square w-full rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={() => setItems(items.filter((_, i) => i !== index))}
                  className="absolute top-1.5 right-1.5 rounded-full bg-white/90 p-1 text-tinta shadow"
                  aria-label={`Remover imagem ${index + 1}`}
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
              {withAlt && (
                <input
                  name="photoAlt"
                  value={item.alt}
                  maxLength={200}
                  onChange={(e) =>
                    setItems(
                      items.map((it, i) => (i === index ? { ...it, alt: e.target.value } : it)),
                    )
                  }
                  placeholder="Descreva a foto"
                  aria-label={`Descrição da imagem ${index + 1}`}
                  className="w-full rounded-lg border border-linha px-2 py-1.5 text-xs"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
