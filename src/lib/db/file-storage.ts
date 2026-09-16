import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating data directory:", error);
  }
}

export async function readJSON<T>(filename: string): Promise<T[]> {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as T[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
}

export async function writeJSON<T>(filename: string, data: T[]): Promise<void> {
  try {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    throw error;
  }
}

export async function appendJSON<T>(filename: string, item: T): Promise<void> {
  try {
    const data = await readJSON<T>(filename);
    data.push(item);
    await writeJSON(filename, data);
  } catch (error) {
    console.error(`Error appending to ${filename}:`, error);
    throw error;
  }
}
