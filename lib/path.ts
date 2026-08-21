export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function publicPath(path: string) {
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalised}`;
}
