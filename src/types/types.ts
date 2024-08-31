import { Database } from "./supabase";

export type GroupData = Database["public"]["Tables"]["groups"]["Row"]

export type EventData = Database["public"]["Tables"]["events"]["Row"]

export type UserData = Database["public"]["Tables"]["users"]["Row"];

export type InterestData = Database["public"]["Tables"]["interests"]["Row"];

export type GroupMembersData = Database["public"]["Tables"]["group-members"]["Row"];