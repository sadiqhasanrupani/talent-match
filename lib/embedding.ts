export async function getEmbedding(text: string): Promise<number[]> {
  return Array.from({ length: 384 }, () => Math.random() * 2 - 1);
}
