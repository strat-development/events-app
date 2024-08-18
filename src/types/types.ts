import { Database } from "./supabase";

export type GroupData = Database["public"]["Tables"]["groups"]["Row"]

export type EventData = Database["public"]["Tables"]["events"]["Row"]

export type UserData = Database["public"]["Tables"]["users"]["Row"];