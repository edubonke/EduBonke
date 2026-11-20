const maxEvidenceBytes = 10 * 1024 * 1024;

export function readEvidenceFile(form: FormData): { file: File } | { error: string } {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a non-empty file" };
  if (file.size > maxEvidenceBytes) return { error: "File exceeds the 10MB limit" };
  return { file };
}
