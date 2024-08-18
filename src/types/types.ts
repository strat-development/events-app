import { Database } from "./supabase";

export type GroupData = Database["public"]["Tables"]["groups"]["Row"]